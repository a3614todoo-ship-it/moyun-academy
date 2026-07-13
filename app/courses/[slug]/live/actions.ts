"use server";

import { revalidatePath } from "next/cache";
import { LiveQuestionStatus } from "@/generated/prisma/enums";
import { getAuthorizedCoursePurchase } from "@/lib/course-access-session";
import { maskEmail } from "@/lib/live";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type LiveQuestionActionState = {
  message: string;
  ok?: boolean;
};

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function createLiveQuestion(
  _previousState: LiveQuestionActionState,
  formData: FormData,
): Promise<LiveQuestionActionState> {
  const slug = text(formData, "slug");
  const body = text(formData, "body");

  if (!slug) return { message: "缺少課程資料。" };
  if (body.length < 2) return { message: "問題至少需要 2 個字。" };
  if (body.length > 500) return { message: "問題不可超過 500 個字。" };

  const rateLimit = await checkRateLimit({
    scope: "live-question",
    limit: 20,
    windowSeconds: 60,
    identifiers: [slug],
  });
  if (!rateLimit.allowed) return { message: "送出問題過於頻繁，請稍後再試。" };

  const purchase = await getAuthorizedCoursePurchase(slug);
  const liveSession = purchase?.course.liveSession;
  if (!purchase || !liveSession?.isEnabled || !liveSession.enableQuestions) {
    return { message: "目前無法使用課程問答。" };
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
  return { message: "問題已送出。", ok: true };
}

export async function upvoteLiveQuestion(formData: FormData) {
  const slug = text(formData, "slug");
  const questionId = text(formData, "questionId");
  if (!slug || !questionId) return;

  const rateLimit = await checkRateLimit({
    scope: "live-question-upvote",
    limit: 60,
    windowSeconds: 60,
    identifiers: [slug],
  });
  if (!rateLimit.allowed) return;

  const purchase = await getAuthorizedCoursePurchase(slug);
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
