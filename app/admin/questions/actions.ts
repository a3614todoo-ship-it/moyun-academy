"use server";
import { revalidatePath } from "next/cache";
import { LiveQuestionStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
function text(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
export async function updateQuestion(formData: FormData) {
  const session = await requireAdmin(); const id = text(formData, "id"); const intent = text(formData, "intent"); const answer = text(formData, "answer");
  const question = await prisma.liveQuestion.findUnique({ where: { id }, select: { id: true, liveSession: { select: { course: { select: { slug: true } } } } } });
  if (!question) return;
  const data = intent === "hide" ? { status: LiveQuestionStatus.HIDDEN }
    : intent === "reopen" ? { status: LiveQuestionStatus.OPEN, answeredAt: null, answer: null }
    : intent === "pin" ? { isPinned: true }
    : intent === "unpin" ? { isPinned: false }
    : { answer: answer || null, status: answer ? LiveQuestionStatus.ANSWERED : LiveQuestionStatus.OPEN, answeredAt: answer ? new Date() : null };
  await prisma.liveQuestion.update({ where: { id }, data });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: `LIVE_QUESTION_${intent.toUpperCase()}`, targetType: "LiveQuestion", targetId: id, metadata: { hasAnswer: Boolean(answer) } });
  revalidatePath("/admin/questions"); revalidatePath(`/courses/${question.liveSession.course.slug}/live`);
}
