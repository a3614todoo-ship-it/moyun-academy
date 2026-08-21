"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { COURSE_HANDOUT_BUCKET, supabaseStorageAdmin } from "@/lib/supabase/storage";

const MAX_HANDOUT_BYTES = 25 * 1024 * 1024;
function safePdfName(value: string) { return value.trim().replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120); }

export async function createHandoutUpload(input: { courseId: string; lessonId: string; fileName: string; fileSize: number; contentType: string }) {
  await requireAdmin();
  if (!input.fileName.toLowerCase().endsWith(".pdf") || input.contentType !== "application/pdf") throw new Error("教材僅接受 PDF 檔案。");
  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0 || input.fileSize > MAX_HANDOUT_BYTES) throw new Error("PDF 檔案必須小於 25 MB。");
  const lesson = await prisma.courseLesson.findFirst({ where: { id: input.lessonId, courseId: input.courseId }, select: { id: true } });
  if (!lesson) throw new Error("找不到這堂課。");
  const path = `${input.courseId}/${input.lessonId}/${randomUUID()}.pdf`;
  const { data, error } = await supabaseStorageAdmin().storage.from(COURSE_HANDOUT_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`無法建立教材上傳連結：${error.message}`);
  return { path, token: data.token, fileName: safePdfName(input.fileName), fileSize: input.fileSize, contentType: input.contentType };
}

export async function finalizeHandoutUpload(input: { courseId: string; lessonId: string; path: string; fileName: string; fileSize: number; contentType: string }) {
  const session = await requireAdmin();
  const prefix = `${input.courseId}/${input.lessonId}/`;
  if (!input.path.startsWith(prefix) || !input.path.endsWith(".pdf") || input.contentType !== "application/pdf" || input.fileSize > MAX_HANDOUT_BYTES) throw new Error("教材資料驗證失敗。");
  const previous = await prisma.courseLesson.findFirst({ where: { id: input.lessonId, courseId: input.courseId }, select: { handoutStoragePath: true } });
  if (!previous) throw new Error("找不到這堂課。");
  await prisma.courseLesson.update({ where: { id: input.lessonId }, data: { handoutStoragePath: input.path, handoutFileName: safePdfName(input.fileName), handoutContentType: input.contentType, handoutSizeBytes: input.fileSize, handoutUrl: null } });
  if (previous.handoutStoragePath && previous.handoutStoragePath !== input.path) await supabaseStorageAdmin().storage.from(COURSE_HANDOUT_BUCKET).remove([previous.handoutStoragePath]);
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "LESSON_HANDOUT_UPLOADED", targetType: "CourseLesson", targetId: input.lessonId, metadata: { fileName: safePdfName(input.fileName), fileSize: input.fileSize } });
  revalidatePath(`/admin/courses/${input.courseId}/lessons/${input.lessonId}`);
  return { ok: true };
}

export async function removeHandout(input: { courseId: string; lessonId: string }) {
  const session = await requireAdmin();
  const lesson = await prisma.courseLesson.findFirst({ where: { id: input.lessonId, courseId: input.courseId }, select: { handoutStoragePath: true } });
  if (!lesson?.handoutStoragePath) return { ok: true };
  const { error } = await supabaseStorageAdmin().storage.from(COURSE_HANDOUT_BUCKET).remove([lesson.handoutStoragePath]);
  if (error) throw new Error(`教材刪除失敗：${error.message}`);
  await prisma.courseLesson.update({ where: { id: input.lessonId }, data: { handoutStoragePath: null, handoutFileName: null, handoutContentType: null, handoutSizeBytes: null } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "LESSON_HANDOUT_REMOVED", targetType: "CourseLesson", targetId: input.lessonId });
  revalidatePath(`/admin/courses/${input.courseId}/lessons/${input.lessonId}`);
  return { ok: true };
}
