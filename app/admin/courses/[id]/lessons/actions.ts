"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseAccessType, LivePlatform, ReplayProductionStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { queueReplayOpenedNotificationsForLesson } from "@/lib/email/scheduled-notifications";
import { isVimeoUrl } from "@/lib/live";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { parseTaipeiDateTimeLocal } from "@/lib/taipei-time";

function text(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
function optionalDate(formData: FormData, name: string) { const value = text(formData, name); return value ? parseTaipeiDateTimeLocal(value) : null; }
function validHttps(value: string) { if (!value) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }

export async function saveLesson(formData: FormData) {
  const session = await requireAdmin();
  const courseId = text(formData, "courseId");
  const lessonId = text(formData, "lessonId");
  const title = text(formData, "title");
  const startsAt = optionalDate(formData, "startsAt");
  const replayOpenAt = optionalDate(formData, "replayOpenAt");
  const replayCloseAt = optionalDate(formData, "replayCloseAt");
  const liveStartsAt = optionalDate(formData, "liveStartsAt");
  const liveEndsAt = optionalDate(formData, "liveEndsAt");
  const playerOpenAt = optionalDate(formData, "playerOpenAt");
  const playerCloseAt = optionalDate(formData, "playerCloseAt");
  const sortOrder = Number.parseInt(text(formData, "sortOrder"), 10);
  const replayProductionStatus = text(formData, "replayProductionStatus") as ReplayProductionStatus;
  const replayVideoUrl = text(formData, "replayVideoUrl");
  const replayAudioUrl = text(formData, "replayAudioUrl");
  const liveEnabled = formData.get("liveEnabled") === "on";
  const platform = text(formData, "platform") as LivePlatform;
  const externalUrl = text(formData, "externalUrl");
  const [course, previousLesson] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, slug: true, title: true, accessType: true } }),
    lessonId ? prisma.courseLesson.findFirst({ where: { id: lessonId, courseId }, select: { id: true, replayEnabled: true, replayOpenAt: true, replayCloseAt: true, replayProductionStatus: true } }) : Promise.resolve(null),
  ]);
  if (!course || (lessonId && !previousLesson)) redirect("/admin/courses");
  const fail = (code: string) => redirect(`/admin/courses/${courseId}/lessons/${lessonId || "new"}?error=${code}`);
  if (!title || !Number.isInteger(sortOrder) || !Object.values(ReplayProductionStatus).includes(replayProductionStatus) || !Object.values(LivePlatform).includes(platform) || [startsAt, replayOpenAt, replayCloseAt, liveStartsAt, liveEndsAt, playerOpenAt, playerCloseAt].some((value) => value === undefined)) fail("required");
  if (replayOpenAt && replayCloseAt && replayOpenAt >= replayCloseAt) fail("replay_window");
  if ((replayVideoUrl && !isVimeoUrl(replayVideoUrl)) || (replayAudioUrl && !validHttps(replayAudioUrl))) fail("replay_url");
  if (liveEnabled) {
    const requiredPlatform = course.accessType === CourseAccessType.MEMBER_INCLUDED ? LivePlatform.FACEBOOK_GROUP : LivePlatform.VIMEO_LIVE;
    if (course.accessType !== CourseAccessType.PUBLIC_FREE && platform !== requiredPlatform) fail("platform");
    if (!externalUrl || !validHttps(externalUrl)) fail("live_url");
    if (platform === LivePlatform.VIMEO_LIVE && !isVimeoUrl(externalUrl)) fail("vimeo");
    if (liveStartsAt && liveEndsAt && liveStartsAt >= liveEndsAt) fail("live_window");
    if (playerOpenAt && playerCloseAt && playerOpenAt >= playerCloseAt) fail("player_window");
  }

  const lessonData = {
    title, summary: text(formData, "summary") || null, startsAt,
    durationText: text(formData, "durationText") || null,
    originalText: text(formData, "originalText") || null,
    translation: text(formData, "translation") || null,
    annotation: text(formData, "annotation") || null,
    teacherNote: text(formData, "teacherNote") || null,
    reflectionPrompt: text(formData, "reflectionPrompt") || null,
    replayVideoUrl: replayVideoUrl || null, replayAudioUrl: replayAudioUrl || null,
    replayEnabled: formData.get("replayEnabled") === "on", replayOpenAt, replayCloseAt,
    replayProductionStatus, sortOrder, isPublished: formData.get("isPublished") === "on",
  };
  const lesson = lessonId
    ? await prisma.courseLesson.update({ where: { id: lessonId }, data: lessonData })
    : await prisma.courseLesson.create({ data: { courseId, ...lessonData } });
  const liveData = {
    courseId, title: text(formData, "liveTitle") || title, platform,
    isEnabled: liveEnabled, startsAt: liveStartsAt, endsAt: liveEndsAt,
    playerOpenAt, playerCloseAt, externalUrl: externalUrl || null,
    youtubeVideoId: null, youtubeChatEmbedUrl: null, enableYoutubeChat: false,
    enableQuestions: formData.get("enableQuestions") === "on",
    showWatermark: formData.get("showWatermark") === "on",
  };
  await prisma.liveSession.upsert({ where: { lessonId: lesson.id }, create: { lessonId: lesson.id, ...liveData }, update: liveData });
  const publishedCount = await prisma.courseLesson.count({ where: { courseId, isPublished: true } });
  await prisma.course.update({ where: { id: courseId }, data: { lessonCount: publishedCount } });
  const wasReplayOpen = Boolean(previousLesson?.replayEnabled && previousLesson.replayProductionStatus === "READY" && (!previousLesson.replayOpenAt || previousLesson.replayOpenAt <= new Date()) && (!previousLesson.replayCloseAt || previousLesson.replayCloseAt > new Date()));
  if (!wasReplayOpen) await queueReplayOpenedNotificationsForLesson(lesson.id);
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: lessonId ? "LESSON_UPDATED" : "LESSON_CREATED", targetType: "CourseLesson", targetId: lesson.id, metadata: { courseId, courseSlug: course.slug, platform, liveEnabled, replayEnabled: lessonData.replayEnabled } });
  revalidatePath(`/admin/courses/${courseId}/lessons`); revalidatePath(`/courses/${course.slug}/live`); revalidatePath(`/courses/${course.slug}/watch`);
  redirect(`/admin/courses/${courseId}/lessons/${lesson.id}?saved=1`);
}

export async function moveLesson(formData: FormData) {
  const session = await requireAdmin(); const courseId = text(formData, "courseId"); const lessonId = text(formData, "lessonId"); const direction = text(formData, "direction");
  const lessons = await prisma.courseLesson.findMany({ where: { courseId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = lessons.findIndex((item) => item.id === lessonId); const target = direction === "up" ? index - 1 : index + 1;
  if (index >= 0 && target >= 0 && target < lessons.length) {
    await prisma.$transaction([prisma.courseLesson.update({ where: { id: lessons[index].id }, data: { sortOrder: lessons[target].sortOrder } }), prisma.courseLesson.update({ where: { id: lessons[target].id }, data: { sortOrder: lessons[index].sortOrder } })]);
    await recordAdminAudit({ adminUserId: session.adminUser.id, action: "LESSON_REORDERED", targetType: "CourseLesson", targetId: lessonId, metadata: { direction } });
  }
  revalidatePath(`/admin/courses/${courseId}/lessons`); redirect(`/admin/courses/${courseId}/lessons`);
}

export async function deleteLesson(formData: FormData) {
  const session = await requireAdmin(); const courseId = text(formData, "courseId"); const lessonId = text(formData, "lessonId"); const confirmTitle = text(formData, "confirmTitle");
  const lesson = await prisma.courseLesson.findFirst({ where: { id: lessonId, courseId }, include: { liveSession: { select: { _count: { select: { questions: true } } } } } });
  if (!lesson) redirect(`/admin/courses/${courseId}/lessons`);
  if (confirmTitle !== lesson.title) redirect(`/admin/courses/${courseId}/lessons/${lessonId}?error=delete_confirm`);
  if ((lesson.liveSession?._count.questions || 0) > 0 || lesson.handoutStoragePath) redirect(`/admin/courses/${courseId}/lessons/${lessonId}?error=delete_blocked`);
  await prisma.courseLesson.delete({ where: { id: lessonId } });
  const publishedCount = await prisma.courseLesson.count({ where: { courseId, isPublished: true } });
  await prisma.course.update({ where: { id: courseId }, data: { lessonCount: publishedCount } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: "LESSON_DELETED", targetType: "CourseLesson", targetId: lessonId, metadata: { courseId, title: lesson.title } });
  revalidatePath(`/admin/courses/${courseId}/lessons`); redirect(`/admin/courses/${courseId}/lessons?deleted=1`);
}
