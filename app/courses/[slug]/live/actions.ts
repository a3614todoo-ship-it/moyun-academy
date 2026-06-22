"use server";

import { revalidatePath } from "next/cache";
import { CoursePurchaseStatus } from "@/generated/prisma/enums";
import { maskEmail } from "@/lib/live";
import { prisma } from "@/lib/prisma";

export type LiveQuestionActionState = {
  message: string;
  ok?: boolean;
};

export async function createLiveQuestion(
  _previousState: LiveQuestionActionState,
  formData: FormData,
): Promise<LiveQuestionActionState> {
  const slug = String(formData.get("slug") || "").trim();
  const token = String(formData.get("token") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!slug || !token) return { message: "缺少直播課程資訊。" };
  if (body.length < 2) return { message: "請至少輸入 2 個字。" };
  if (body.length > 500) return { message: "提問請控制在 500 字以內。" };

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      accessToken: token,
      status: CoursePurchaseStatus.APPROVED,
      course: { slug, isPublished: true },
    },
    include: {
      course: {
        include: { liveSession: true },
      },
    },
  });

  const liveSession = purchase?.course.liveSession;
  if (!purchase || !liveSession?.isEnabled || !liveSession.enableQuestions) {
    return { message: "目前無法送出直播提問。" };
  }

  await prisma.liveQuestion.create({
    data: {
      liveSessionId: liveSession.id,
      coursePurchaseId: purchase.id,
      displayName: purchase.name,
      emailMasked: maskEmail(purchase.email),
      body,
    },
  });

  revalidatePath(`/courses/${slug}/live`);
  return { message: "提問已送出。", ok: true };
}
