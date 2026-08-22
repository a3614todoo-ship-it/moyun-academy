"use server";

import { redirect } from "next/navigation";
import { CourseAccessType, CoursePurchaseStatus, EmailStatus, EmailType, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { generateCoursePurchaseNumber } from "@/lib/course-purchase-number";
import { canCreateCoursePurchase, registrationState } from "@/lib/course-registration";
import { coursePurchaseSchema } from "@/lib/course-purchase-validation";
import { sendEmailLogs } from "@/lib/email/mailer";
import { getMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { publicReferenceQuery } from "@/lib/security/public-reference";

export type CoursePurchaseActionState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createCoursePurchase(
  _previousState: CoursePurchaseActionState,
  formData: FormData,
): Promise<CoursePurchaseActionState> {
  const parsed = coursePurchaseSchema.safeParse({
    courseId: formData.get("courseId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    agreedToTerms: formData.get("agreedToTerms"),
  });

  if (!parsed.success) {
    return {
      message: "請確認表單欄位是否完整。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;
  const rateLimit = await checkRateLimit({
    scope: "course-purchase",
    limit: 5,
    windowSeconds: 10 * 60,
    identifiers: [values.email, values.phone],
  });
  if (!rateLimit.allowed) return { message: "送出次數過多，請稍後再試。" };
  const course = await prisma.course.findFirst({
    where: {
      id: values.courseId,
      isPublished: true,
      accessType: CourseAccessType.PAID,
    },
    select: {
      id: true,
      title: true,
      price: true,
      publicRegistrationOpenAt: true,
      registrationCloseAt: true,
    },
  });

  if (!course) {
    return { message: "找不到可購買的付費課程，請回到課程頁重新確認。" };
  }

  if (course.price <= 0) {
    return { message: "這門課尚未設定有效售價，請先聯絡管理員。" };
  }

  const memberSession = await getMemberSession();
  const activeSubscription = memberSession
    ? await prisma.membershipSubscription.findFirst({
        where: {
          memberUserId: memberSession.memberUser.id,
          status: MembershipSubscriptionStatus.ACTIVE,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        select: { id: true },
      })
    : null;
  const windowState = registrationState(course, Boolean(activeSubscription));

  if (!canCreateCoursePurchase(windowState)) {
    if (windowState === "MEMBER_PRIORITY") {
      return { message: "目前是會員優先報名期間，請先登入有效會員帳號。" };
    }
    if (windowState === "CLOSED") return { message: "這門課的報名已截止。" };
    return { message: "這門課尚未開放報名，請留意課程頁公告。" };
  }

  if (
    windowState === "OPEN_MEMBER"
    && memberSession
    && values.email.toLowerCase() !== memberSession.memberUser.email.toLowerCase()
  ) {
    return { message: "會員優先報名期間請使用會員帳號的 Email 報名。" };
  }

  const recentPurchase = await prisma.coursePurchase.findFirst({
    where: {
      courseId: course.id,
      email: values.email,
      phone: values.phone,
      status: CoursePurchaseStatus.PENDING_PAYMENT,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { purchaseNo: true },
  });

  if (recentPurchase) {
    redirect(`/course-purchase/success?${publicReferenceQuery("purchase", recentPurchase.purchaseNo)}`);
  }

  let purchaseNo: string;
  let emailLogId: string;

  try {
    purchaseNo = await generateCoursePurchaseNumber();
    emailLogId = await prisma.$transaction(async (transaction) => {
      const purchase = await transaction.coursePurchase.create({
        data: {
          purchaseNo,
          courseId: course.id,
          name: values.name,
          phone: values.phone,
          email: values.email,
          amount: course.price,
          memberUserId:
            activeSubscription
            && memberSession
            && values.email.toLowerCase() === memberSession.memberUser.email.toLowerCase()
              ? memberSession.memberUser.id
              : null,
        },
      });

      const emailLog = await transaction.emailLog.create({
        data: {
          coursePurchaseId: purchase.id,
          type: EmailType.COURSE_PURCHASE_CREATED,
          recipient: purchase.email,
          subject: `張曼娟大學堂課程購買申請：${course.title}`,
          status: EmailStatus.PENDING,
        },
      });

      return emailLog.id;
    });
  } catch (error) {
    console.error("建立課程購買申請失敗", error);
    return { message: "系統暫時無法建立課程購買申請，請稍後再試。" };
  }

  await sendEmailLogs([emailLogId]);
  redirect(`/course-purchase/success?${publicReferenceQuery("purchase", purchaseNo)}`);
}
