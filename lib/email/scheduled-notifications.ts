import { createHash } from "node:crypto";
import {
  CourseAccessType,
  CoursePurchaseStatus,
  EmailStatus,
  EmailType,
  MembershipSubscriptionStatus,
  MemberUserStatus,
} from "@/generated/prisma/enums";
import { sendEmailLogs } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { shiftUtcDays, taipeiDayRange } from "@/lib/taipei-time";

const EXPIRY_REMINDER_DAYS = [30, 14, 7] as const;

type Recipient = {
  key: string;
  name: string;
  email: string;
  applicationId?: string;
  coursePurchaseId?: string;
};

type QueueInput = {
  dedupeKey: string;
  type: EmailType;
  recipient: Recipient;
  subject: string;
  metadata: Record<string, string | number>;
};

function anonymousRecipientKey(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

function uniqueRecipients(recipients: Recipient[]) {
  const result = new Map<string, Recipient>();
  for (const recipient of recipients) {
    const normalizedEmail = recipient.email.trim().toLowerCase();
    if (!normalizedEmail || result.has(normalizedEmail)) continue;
    result.set(normalizedEmail, { ...recipient, email: normalizedEmail });
  }
  return [...result.values()];
}

export function scheduledNotificationRanges(now = new Date()) {
  const today = taipeiDayRange(now);
  const tomorrow = {
    start: shiftUtcDays(today.start, 1),
    end: shiftUtcDays(today.end, 1),
  };
  const memberPriorityPublicWindow = {
    start: shiftUtcDays(today.start, 7),
    end: shiftUtcDays(today.end, 7),
  };
  return { today, tomorrow, memberPriorityPublicWindow };
}

async function activeMemberRecipients(now: Date): Promise<Recipient[]> {
  const subscriptions = await prisma.membershipSubscription.findMany({
    where: {
      status: MembershipSubscriptionStatus.ACTIVE,
      startsAt: { lte: now },
      endsAt: { gt: now },
      memberUser: { status: MemberUserStatus.ACTIVE },
    },
    orderBy: { endsAt: "desc" },
    select: {
      applicationId: true,
      memberUser: { select: { id: true, name: true, email: true } },
    },
  });

  return uniqueRecipients(
    subscriptions.map((item) => ({
      key: `member:${item.memberUser.id}`,
      name: item.memberUser.name,
      email: item.memberUser.email,
      applicationId: item.applicationId,
    })),
  );
}

async function courseRecipients(
  courseId: string,
  accessType: CourseAccessType,
  now: Date,
): Promise<Recipient[]> {
  if (accessType === CourseAccessType.MEMBER_INCLUDED) {
    return activeMemberRecipients(now);
  }

  if (accessType !== CourseAccessType.PAID) return [];

  const purchases = await prisma.coursePurchase.findMany({
    where: { courseId, status: CoursePurchaseStatus.APPROVED },
    orderBy: { approvedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      memberUserId: true,
    },
  });

  return uniqueRecipients(
    purchases.map((item) => ({
      key: item.memberUserId
        ? `member:${item.memberUserId}`
        : `purchase:${item.id}:${anonymousRecipientKey(item.email)}`,
      name: item.name,
      email: item.email,
      coursePurchaseId: item.id,
    })),
  );
}

async function queueScheduledEmail(input: QueueInput) {
  return prisma.emailLog.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {},
    create: {
      applicationId: input.recipient.applicationId,
      coursePurchaseId: input.recipient.coursePurchaseId,
      type: input.type,
      recipient: input.recipient.email,
      subject: input.subject,
      dedupeKey: input.dedupeKey,
      metadata: {
        ...input.metadata,
        recipientName: input.recipient.name,
      },
      status: EmailStatus.PENDING,
    },
    select: { id: true, status: true },
  });
}

async function sendPendingLogs(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const results = [];
  for (let index = 0; index < uniqueIds.length; index += 10) {
    results.push(...await sendEmailLogs(uniqueIds.slice(index, index + 10)));
  }
  return results;
}

export async function runScheduledNotifications(now = new Date()) {
  const ranges = scheduledNotificationRanges(now);
  const pendingIds: string[] = [];
  const queued = {
    membershipExpiring: 0,
    memberPriorityOpen: 0,
    liveReminder: 0,
    replayClosing: 0,
  };

  for (const daysRemaining of EXPIRY_REMINDER_DAYS) {
    const start = shiftUtcDays(ranges.today.start, daysRemaining);
    const end = shiftUtcDays(ranges.today.end, daysRemaining);
    const subscriptions = await prisma.membershipSubscription.findMany({
      where: {
        status: MembershipSubscriptionStatus.ACTIVE,
        endsAt: { gte: start, lt: end },
        memberUser: { status: MemberUserStatus.ACTIVE },
      },
      orderBy: { endsAt: "desc" },
      select: {
        id: true,
        applicationId: true,
        endsAt: true,
        memberUser: { select: { id: true, name: true, email: true } },
      },
    });

    const recipients = uniqueRecipients(
      subscriptions.map((item) => ({
        key: `member:${item.memberUser.id}`,
        name: item.memberUser.name,
        email: item.memberUser.email,
        applicationId: item.applicationId,
      })),
    );

    for (const recipient of recipients) {
      const subscription = subscriptions.find(
        (item) => item.memberUser.email.trim().toLowerCase() === recipient.email,
      );
      if (!subscription) continue;
      const log = await queueScheduledEmail({
        dedupeKey: `membership-expiring:${recipient.key}:${daysRemaining}:${start.toISOString().slice(0, 10)}`,
        type: EmailType.MEMBERSHIP_EXPIRING,
        recipient,
        subject: `您的會員資格將於 ${daysRemaining} 天後到期`,
        metadata: {
          daysRemaining,
          endsAt: subscription.endsAt.toISOString(),
        },
      });
      if (log.status === EmailStatus.PENDING) pendingIds.push(log.id);
      queued.membershipExpiring += 1;
    }
  }

  const priorityCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      accessType: CourseAccessType.PAID,
      publicRegistrationOpenAt: {
        gte: ranges.memberPriorityPublicWindow.start,
        lt: ranges.memberPriorityPublicWindow.end,
      },
    },
    select: { id: true, title: true, slug: true, publicRegistrationOpenAt: true },
  });
  const priorityRecipients = priorityCourses.length ? await activeMemberRecipients(now) : [];
  for (const course of priorityCourses) {
    for (const recipient of priorityRecipients) {
      const log = await queueScheduledEmail({
        dedupeKey: `member-priority-open:${course.id}:${recipient.key}`,
        type: EmailType.MEMBER_PRIORITY_OPEN,
        recipient,
        subject: `會員優先報名已開放：${course.title}`,
        metadata: {
          courseTitle: course.title,
          courseSlug: course.slug,
          publicOpenAt: course.publicRegistrationOpenAt?.toISOString() || "",
        },
      });
      if (log.status === EmailStatus.PENDING) pendingIds.push(log.id);
      queued.memberPriorityOpen += 1;
    }
  }

  const liveSessions = await prisma.liveSession.findMany({
    where: {
      isEnabled: true,
      startsAt: { gte: ranges.tomorrow.start, lt: ranges.tomorrow.end },
      course: { isPublished: true },
    },
    select: {
      id: true,
      startsAt: true,
      course: { select: { id: true, title: true, slug: true, accessType: true } },
    },
  });
  for (const live of liveSessions) {
    const recipients = await courseRecipients(live.course.id, live.course.accessType, now);
    for (const recipient of recipients) {
      const log = await queueScheduledEmail({
        dedupeKey: `live-reminder:${live.id}:${recipient.key}`,
        type: EmailType.LIVE_REMINDER,
        recipient,
        subject: `明日直播提醒：${live.course.title}`,
        metadata: {
          courseTitle: live.course.title,
          courseSlug: live.course.slug,
          startsAt: live.startsAt?.toISOString() || "",
        },
      });
      if (log.status === EmailStatus.PENDING) pendingIds.push(log.id);
      queued.liveReminder += 1;
    }
  }

  const replayCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      replayEnabled: true,
      replayCloseAt: { gte: ranges.tomorrow.start, lt: ranges.tomorrow.end },
    },
    select: { id: true, title: true, slug: true, accessType: true, replayCloseAt: true },
  });
  for (const course of replayCourses) {
    const recipients = await courseRecipients(course.id, course.accessType, now);
    for (const recipient of recipients) {
      const log = await queueScheduledEmail({
        dedupeKey: `replay-closing:${course.id}:${recipient.key}:${course.replayCloseAt?.toISOString() || ""}`,
        type: EmailType.REPLAY_CLOSING,
        recipient,
        subject: `回看即將截止：${course.title}`,
        metadata: {
          courseTitle: course.title,
          courseSlug: course.slug,
          closesAt: course.replayCloseAt?.toISOString() || "",
        },
      });
      if (log.status === EmailStatus.PENDING) pendingIds.push(log.id);
      queued.replayClosing += 1;
    }
  }

  const deliveryResults = await sendPendingLogs(pendingIds);
  return {
    queued,
    attempted: pendingIds.length,
    sent: deliveryResults.filter((item) => item.success).length,
    failed: deliveryResults.filter((item) => !item.success).length,
  };
}
