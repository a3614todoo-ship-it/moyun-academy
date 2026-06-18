"use server";

import { redirect } from "next/navigation";
import { ApplicationStatus, EmailStatus, EmailType } from "@/generated/prisma/enums";
import { generateApplicationNumber } from "@/lib/application-number";
import { applicationSchema } from "@/lib/application-validation";
import { sendEmailLogs } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";

export type ApplicationActionState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createApplication(
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const parsed = applicationSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    facebookName: formData.get("facebookName"),
    facebookProfileUrl: formData.get("facebookProfileUrl"),
    planCode: formData.get("planCode"),
    agreedToTerms: formData.get("agreedToTerms"),
  });

  if (!parsed.success) {
    return {
      message: "請確認標示的欄位後再送出。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;
  const plan = await prisma.membershipPlan.findFirst({
    where: { code: values.planCode, isActive: true },
  });

  if (!plan) {
    return { message: "目前無法使用此會員方案，請重新整理後再試。" };
  }

  const recentApplication = await prisma.application.findFirst({
    where: {
      email: values.email,
      phone: values.phone,
      planId: plan.id,
      status: ApplicationStatus.PENDING_PAYMENT,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { applicationNo: true },
  });

  if (recentApplication) {
    redirect(`/apply/success?application_no=${recentApplication.applicationNo}`);
  }

  let applicationNo: string;
  let emailLogId: string;

  try {
    applicationNo = await generateApplicationNumber();
    emailLogId = await prisma.$transaction(async (transaction) => {
      const application = await transaction.application.create({
        data: {
          applicationNo,
          name: values.name,
          phone: values.phone,
          email: values.email,
          address: values.address,
          facebookName: values.facebookName,
          facebookProfileUrl: values.facebookProfileUrl,
          planId: plan.id,
          agreedToTermsAt: new Date(),
        },
      });

      await transaction.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          toStatus: ApplicationStatus.PENDING_PAYMENT,
          note: "訪客完成會員報名",
        },
      });

      const emailLog = await transaction.emailLog.create({
        data: {
          applicationId: application.id,
          type: EmailType.APPLICATION_CREATED,
          recipient: application.email,
          subject: "您已完成會員報名，請依說明完成匯款",
          status: EmailStatus.PENDING,
        },
      });

      return emailLog.id;
    });
  } catch (error) {
    console.error("建立會員報名失敗", error);
    return { message: "系統暫時無法送出報名，請稍後再試。" };
  }

  await sendEmailLogs([emailLogId]);
  redirect(`/apply/success?application_no=${applicationNo}`);
}
