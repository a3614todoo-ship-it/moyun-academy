"use server";

import { revalidatePath } from "next/cache";
import { CoursePurchaseStatus, LiveQuestionStatus } from "@/generated/prisma/enums";
import { maskEmail } from "@/lib/live";
import { prisma } from "@/lib/prisma";

export type LiveQuestionActionState = {
  message: string;
  ok?: boolean;
};

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

async function findApprovedPurchase(slug: string, token: string) {
  return prisma.coursePurchase.findFirst({
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
}

export async function createLiveQuestion(
  _previousState: LiveQuestionActionState,
  formData: FormData,
): Promise<LiveQuestionActionState> {
  const slug = text(formData, "slug");
  const token = text(formData, "token");
  const body = text(formData, "body");

  if (!slug || !token) return { message: "缺少課程或權限資料。" };
  if (body.length < 2) return { message: "提問內容至少需要 2 個字。" };
  if (body.length > 500) return { message: "提問內容請控制在 500 字以內。" };

  const purchase = await findApprovedPurchase(slug, token);
  const liveSession = purchase?.course.liveSession;
  if (!purchase || !liveSession?.isEnabled || !liveSession.enableQuestions) {
    return { message: "這堂課目前尚未開放站內 Q&A。" };
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

export async function upvoteLiveQuestion(formData: FormData) {
  const slug = text(formData, "slug");
  const token = text(formData, "token");
  const questionId = text(formData, "questionId");

  if (!slug || !token || !questionId) return;

  const purchase = await findApprovedPurchase(slug, token);
  const liveSession = purchase?.course.liveSession;
  if (!purchase || !liveSession?.isEnabled) return;

  const question = await prisma.liveQuestion.findFirst({
    where: {
      id: questionId,
      liveSessionId: liveSession.id,
      status: { not: LiveQuestionStatus.HIDDEN },
    },
    select: { id: true },
  });
  if (!question) return;

  const existing = await prisma.liveQuestionUpvote.findUnique({
    where: {
      liveQuestionId_coursePurchaseId: {
        liveQuestionId: question.id,
        coursePurchaseId: purchase.id,
      },
    },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.liveQuestionUpvote.create({
      data: {
        liveQuestionId: question.id,
        coursePurchaseId: purchase.id,
      },
    }),
    prisma.liveQuestion.update({
      where: { id: question.id },
      data: { upvoteCount: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/courses/${slug}/live`);
}
