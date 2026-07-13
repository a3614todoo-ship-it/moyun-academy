import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { CourseAccessType, CoursePurchaseStatus, LiveQuestionStatus, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const COURSE_ACCESS_COOKIE = "wobei_course_access";
const COURSE_ACCESS_HOURS = 6;

function courseAccessSecret() {
  const value = process.env.COURSE_ACCESS_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 COURSE_ACCESS_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", courseAccessSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secureCookie() {
  return process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true;
}

export async function createCourseAccessSession(slug: string, purchaseId: string) {
  const expiresAt = Date.now() + COURSE_ACCESS_HOURS * 60 * 60 * 1000;
  const payload = `${purchaseId}.${slug}.${expiresAt}`;
  const value = `${purchaseId}.${expiresAt}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(COURSE_ACCESS_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: `/courses/${slug}`,
    maxAge: COURSE_ACCESS_HOURS * 60 * 60,
  });
}

async function readSessionPurchaseId(slug: string) {
  const value = (await cookies()).get(COURSE_ACCESS_COOKIE)?.value;
  if (!value) return null;

  const [purchaseId, expiresAtText, signature] = value.split(".");
  const expiresAt = Number.parseInt(expiresAtText || "", 10);
  if (!purchaseId || !signature || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  const expected = sign(`${purchaseId}.${slug}.${expiresAt}`);
  return safeEqual(expected, signature) ? purchaseId : null;
}

export async function getAuthorizedCoursePurchase(slug: string) {
  const purchaseId = await readSessionPurchaseId(slug);
  if (!purchaseId) return null;

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      id: purchaseId,
      status: CoursePurchaseStatus.APPROVED,
      course: { slug, isPublished: true },
    },
    include: {
      course: {
        include: {
          lessonUnits: {
            where: { isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          liveSession: {
            include: {
              questions: {
                where: { status: { not: LiveQuestionStatus.HIDDEN } },
                orderBy: [{ upvoteCount: "desc" }, { createdAt: "desc" }],
                take: 50,
              },
            },
          },
        },
      },
    },
  });

  if (!purchase) return null;
  if (purchase.course.accessType !== CourseAccessType.MEMBER_INCLUDED) return purchase;
  if (!purchase.memberUserId) return null;

  const activeSubscription = await prisma.membershipSubscription.findFirst({
    where: {
      memberUserId: purchase.memberUserId,
      status: MembershipSubscriptionStatus.ACTIVE,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
    select: { id: true },
  });

  return activeSubscription ? purchase : null;
}
