"use server";

import { redirect } from "next/navigation";
import { CoursePurchaseStatus } from "@/generated/prisma/enums";
import { createCourseAccessSession } from "@/lib/course-access-session";
import { prisma } from "@/lib/prisma";

export type CourseAccessLookupState = {
  message: string;
  fieldErrors?: {
    purchaseNo?: string[];
    email?: string[];
  };
};

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function statusMessage(status: CoursePurchaseStatus) {
  switch (status) {
    case CoursePurchaseStatus.PENDING_PAYMENT:
      return "這筆購買申請尚未完成匯款回報。請先依購買成功頁面的銀行資訊匯款，並填寫匯款回報。";
    case CoursePurchaseStatus.PAYMENT_REPORTED:
      return "這筆購買已收到匯款回報，目前仍在人工審核中。審核通過後即可進入學習教室。";
    case CoursePurchaseStatus.REJECTED:
      return "這筆購買申請未通過審核。如需協助，請聯繫客服。";
    case CoursePurchaseStatus.CANCELLED:
      return "這筆購買申請已取消。如需重新購買，請重新送出報名。";
    case CoursePurchaseStatus.APPROVED:
    default:
      return "";
  }
}

export async function lookupCourseAccess(
  _previousState: CourseAccessLookupState,
  formData: FormData,
): Promise<CourseAccessLookupState> {
  const slug = text(formData, "slug");
  const purchaseNo = text(formData, "purchaseNo").toUpperCase();
  const email = text(formData, "email").toLowerCase();
  const fieldErrors: CourseAccessLookupState["fieldErrors"] = {};

  if (!/^CP\d{12}$/.test(purchaseNo)) {
    fieldErrors.purchaseNo = ["請填寫正確的課程購買編號，例如 CP202606240001。"];
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = ["請填寫購買時使用的 Email。"];
  }
  if (!slug) {
    return { message: "缺少課程資料，請重新整理頁面後再試。" };
  }
  if (fieldErrors.purchaseNo || fieldErrors.email) {
    return { message: "請確認欄位是否正確。", fieldErrors };
  }

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      purchaseNo,
      course: { slug, isPublished: true },
    },
    select: {
      id: true,
      email: true,
      status: true,
      accessToken: true,
    },
  });

  if (!purchase || purchase.email.toLowerCase() !== email) {
    return { message: "找不到符合的購買資料，請確認購買編號與報名 Email 是否正確。" };
  }

  if (purchase.status !== CoursePurchaseStatus.APPROVED) {
    return { message: statusMessage(purchase.status) };
  }

  await createCourseAccessSession(slug, purchase);
  redirect(`/courses/${slug}/live?token=${purchase.accessToken}`);
}
