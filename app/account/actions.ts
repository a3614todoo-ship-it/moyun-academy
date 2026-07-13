"use server";

import { redirect } from "next/navigation";
import { CourseAccessType, CoursePurchaseStatus, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { createCourseAccessSession } from "@/lib/course-access-session";
import { generateCoursePurchaseNumber } from "@/lib/course-purchase-number";
import { destroyMemberSession, requireMember } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function logoutMember() {
  await destroyMemberSession();
  redirect("/login");
}

export async function enterOwnedCourse(formData: FormData) {
  const session = await requireMember();
  const purchaseId = text(formData, "purchaseId");

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      id: purchaseId,
      memberUserId: session.memberUser.id,
      status: CoursePurchaseStatus.APPROVED,
    },
    include: { course: { select: { slug: true } } },
  });

  if (!purchase) redirect("/account?error=course_access");

  await createCourseAccessSession(purchase.course.slug, purchase.id);
  redirect(`/courses/${purchase.course.slug}/live`);
}

export async function enterMemberIncludedCourse(formData: FormData) {
  const session = await requireMember();
  const courseId = text(formData, "courseId");
  const now = new Date();

  const [course, subscription] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, isPublished: true, accessType: CourseAccessType.MEMBER_INCLUDED },
      select: { id: true, slug: true, title: true },
    }),
    prisma.membershipSubscription.findFirst({
      where: {
        memberUserId: session.memberUser.id,
        status: MembershipSubscriptionStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: "desc" },
      include: { application: true },
    }),
  ]);

  if (!course || !subscription) redirect("/account?error=membership_required");

  const existingAccess = await prisma.coursePurchase.findFirst({
    where: {
      courseId: course.id,
      memberUserId: session.memberUser.id,
      status: CoursePurchaseStatus.APPROVED,
      amount: 0,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingAccess) {
    await createCourseAccessSession(course.slug, existingAccess.id);
    redirect(`/courses/${course.slug}/live`);
  }

  const purchaseNo = await generateCoursePurchaseNumber();
  const access = await prisma.coursePurchase.create({
    data: {
      purchaseNo,
      courseId: course.id,
      memberUserId: session.memberUser.id,
      name: session.memberUser.name,
      phone: session.memberUser.phone || subscription.application.phone,
      email: session.memberUser.email,
      amount: 0,
      status: CoursePurchaseStatus.APPROVED,
      approvedAt: now,
      reviewedAt: now,
      note: `會員中心進入會員免費課程；會員申請編號：${subscription.application.applicationNo}`,
    },
  });

  await createCourseAccessSession(course.slug, access.id);
  redirect(`/courses/${course.slug}/live`);
}
