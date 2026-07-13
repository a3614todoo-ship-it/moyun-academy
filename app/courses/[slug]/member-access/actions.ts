"use server";

import { redirect } from "next/navigation";
import { ApplicationStatus, CourseAccessType, CoursePurchaseStatus, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { createCourseAccessSession } from "@/lib/course-access-session";
import { generateCoursePurchaseNumber } from "@/lib/course-purchase-number";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type MemberCourseAccessLookupState = {
  message: string;
  fieldErrors?: {
    applicationNo?: string[];
    email?: string[];
  };
};

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function lookupMemberCourseAccess(
  _previousState: MemberCourseAccessLookupState,
  formData: FormData,
): Promise<MemberCourseAccessLookupState> {
  const slug = text(formData, "slug");
  const applicationNo = text(formData, "applicationNo").toUpperCase();
  const email = text(formData, "email").toLowerCase();
  const fieldErrors: MemberCourseAccessLookupState["fieldErrors"] = {};

  if (!/^CL\d{12}$/.test(applicationNo)) {
    fieldErrors.applicationNo = ["請填寫正確的會員申請編號，例如 CL202606240001。"];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["請填寫會員申請時使用的 Email。"];
  }
  if (!slug) return { message: "缺少課程資料，請重新整理頁面後再試。" };
  if (fieldErrors.applicationNo || fieldErrors.email) {
    return { message: "請確認欄位是否正確。", fieldErrors };
  }

  const rateLimit = await checkRateLimit({
    scope: "member-course-access-lookup",
    limit: 5,
    windowSeconds: 10 * 60,
    identifiers: [applicationNo, email],
  });
  if (!rateLimit.allowed) return { message: "查詢次數過多，請稍後再試。" };

  const [course, application] = await Promise.all([
    prisma.course.findFirst({
      where: { slug, isPublished: true, accessType: CourseAccessType.MEMBER_INCLUDED },
      select: { id: true },
    }),
    prisma.application.findUnique({
      where: { applicationNo },
      include: { membershipSubscription: true },
    }),
  ]);

  if (!course) return { message: "這堂課目前不是會員免費課程，請確認課程頁面。" };
  if (!application || application.email.toLowerCase() !== email) {
    return { message: "找不到符合的會員資料，請確認會員申請編號與 Email 是否正確。" };
  }

  const validStatuses: ApplicationStatus[] = [
    ApplicationStatus.APPROVED,
    ApplicationStatus.JOINED_FACEBOOK_GROUP,
  ];
  if (!validStatuses.includes(application.status)) {
    return { message: "這筆會員申請尚未審核通過。審核通過後即可進入會員免費課程。" };
  }
  if (!application.approvedAt || !application.memberUserId) {
    return { message: "這筆會員資料尚未建立核准時間，請聯繫客服協助確認。" };
  }

  const subscription = application.membershipSubscription;
  const now = new Date();
  if (
    !subscription ||
    subscription.status !== MembershipSubscriptionStatus.ACTIVE ||
    subscription.startsAt > now ||
    subscription.endsAt < now
  ) {
    return { message: "這筆會員資格已超過有效期間。請重新加入會員後再觀看會員免費課程。" };
  }

  const existingAccess = await prisma.coursePurchase.findFirst({
    where: {
      courseId: course.id,
      memberUserId: application.memberUserId,
      status: CoursePurchaseStatus.APPROVED,
      amount: 0,
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (existingAccess) {
    if (application.memberUserId) {
      await prisma.coursePurchase.update({
        where: { id: existingAccess.id },
        data: { memberUserId: application.memberUserId },
      });
    }
    await createCourseAccessSession(slug, existingAccess.id);
    redirect(`/courses/${slug}/live`);
  }

  const purchaseNo = await generateCoursePurchaseNumber();
  const access = await prisma.coursePurchase.create({
    data: {
      purchaseNo,
      courseId: course.id,
      memberUserId: application.memberUserId,
      name: application.name,
      phone: application.phone,
      email: application.email,
      amount: 0,
      status: CoursePurchaseStatus.APPROVED,
      approvedAt: new Date(),
      reviewedAt: new Date(),
      note: `會員免費課程入口；會員申請編號：${application.applicationNo}`,
    },
    select: { id: true },
  });

  await createCourseAccessSession(slug, access.id);
  redirect(`/courses/${slug}/live`);
}
