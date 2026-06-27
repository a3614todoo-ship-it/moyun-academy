"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseAccessType, LivePlatform } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { isVimeoUrl } from "@/lib/live";
import { prisma } from "@/lib/prisma";
import { parseTaipeiDateTimeLocal } from "@/lib/taipei-time";
import { getYouTubeVideoId } from "@/lib/youtube";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function lines(formData: FormData, name: string) {
  return text(formData, name)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function optionalDate(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return null;
  return parseTaipeiDateTimeLocal(value);
}

function validHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function lessonDataFromForm(formData: FormData) {
  return Array.from({ length: 4 }, (_, index) => {
    const prefix = `lesson${index}`;
    const title = text(formData, `${prefix}Title`);
    const handoutUrl = text(formData, `${prefix}HandoutUrl`);
    const replayVideoUrl = text(formData, `${prefix}ReplayVideoUrl`);

    if (!title) return null;

    return {
      title,
      summary: text(formData, `${prefix}Summary`) || null,
      startsAt: optionalDate(formData, `${prefix}StartsAt`),
      durationText: text(formData, `${prefix}DurationText`) || null,
      originalText: text(formData, `${prefix}OriginalText`) || null,
      translation: text(formData, `${prefix}Translation`) || null,
      annotation: text(formData, `${prefix}Annotation`) || null,
      teacherNote: text(formData, `${prefix}TeacherNote`) || null,
      reflectionPrompt: text(formData, `${prefix}ReflectionPrompt`) || null,
      handoutUrl: handoutUrl || null,
      replayVideoUrl: replayVideoUrl || null,
      sortOrder: index,
      isPublished: formData.get(`${prefix}IsPublished`) !== "off",
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function saveCourse(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const slug = text(formData, "slug").toLowerCase();
  const title = text(formData, "title");
  const subtitle = text(formData, "subtitle");
  const category = text(formData, "category");
  const excerpt = text(formData, "excerpt");
  const description = text(formData, "description");
  const outline = lines(formData, "outline");
  const audiences = lines(formData, "audiences");
  const lessonCount = Number.parseInt(text(formData, "lessonCount"), 10);
  const durationText = text(formData, "durationText");
  const courseStartAt = optionalDate(formData, "courseStartAt");
  const courseFormatText = text(formData, "courseFormatText");
  const viewingPolicyText = text(formData, "viewingPolicyText");
  const coverImageUrl = text(formData, "coverImageUrl");
  const previewVideoUrl = text(formData, "previewVideoUrl");
  const fullVideoUrl = text(formData, "fullVideoUrl");
  const accessType = text(formData, "accessType") as CourseAccessType;
  const price = Number.parseInt(text(formData, "price"), 10);
  const sortOrder = Number.parseInt(text(formData, "sortOrder"), 10);
  const isPublished = formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const liveIsEnabled = formData.get("liveIsEnabled") === "on";
  const liveEnableQuestions = formData.get("liveEnableQuestions") === "on";
  const liveEnableYoutubeChat = formData.get("liveEnableYoutubeChat") === "on";
  const liveShowWatermark = formData.get("liveShowWatermark") === "on";
  const liveTitle = text(formData, "liveTitle");
  const livePlatform = text(formData, "livePlatform") as LivePlatform;
  const liveYoutubeVideoId = text(formData, "liveYoutubeVideoId");
  const liveYoutubeChatEmbedUrl = text(formData, "liveYoutubeChatEmbedUrl");
  const liveExternalUrl = text(formData, "liveExternalUrl");
  const liveStartsAt = optionalDate(formData, "liveStartsAt");
  const liveEndsAt = optionalDate(formData, "liveEndsAt");
  const livePlayerOpenAt = optionalDate(formData, "livePlayerOpenAt");
  const livePlayerCloseAt = optionalDate(formData, "livePlayerCloseAt");
  const lessonUnits = lessonDataFromForm(formData);
  const existingCourse = id
    ? await prisma.course.findUnique({
        where: { id },
        select: { slug: true, isPublished: true, publishedAt: true },
      })
    : null;

  if (id && !existingCourse) redirect("/admin/courses");

  if (
    !title ||
    !slug ||
    !category ||
    !excerpt ||
    !description ||
    !Number.isInteger(lessonCount) ||
    lessonCount < 0 ||
    !Object.values(CourseAccessType).includes(accessType) ||
    !Number.isInteger(price) ||
    price < 0 ||
    !Number.isInteger(sortOrder) ||
    !Object.values(LivePlatform).includes(livePlatform) ||
    courseStartAt === undefined ||
    liveStartsAt === undefined ||
    liveEndsAt === undefined ||
    livePlayerOpenAt === undefined ||
    livePlayerCloseAt === undefined ||
    lessonUnits.some((lesson) => lesson.startsAt === undefined)
  ) {
    redirect(`/admin/courses/${id || "new"}?error=required`);
  }

  if (accessType === CourseAccessType.PAID && price <= 0) {
    redirect(`/admin/courses/${id || "new"}?error=paid_price`);
  }

  if (!validSlug(slug)) {
    redirect(`/admin/courses/${id || "new"}?error=slug`);
  }

  if (previewVideoUrl && !getYouTubeVideoId(previewVideoUrl)) {
    redirect(`/admin/courses/${id || "new"}?error=youtube`);
  }

  if (coverImageUrl) {
    if (!validHttpUrl(coverImageUrl)) {
      redirect(`/admin/courses/${id || "new"}?error=cover`);
    }
  }

  if (fullVideoUrl) {
    if (!validHttpUrl(fullVideoUrl)) {
      redirect(`/admin/courses/${id || "new"}?error=full_video`);
    }
  }

  if (lessonUnits.some((lesson) => (lesson.handoutUrl && !validHttpUrl(lesson.handoutUrl)) || (lesson.replayVideoUrl && !validHttpUrl(lesson.replayVideoUrl)))) {
    redirect(`/admin/courses/${id || "new"}?error=lesson_url`);
  }

  if (liveIsEnabled) {
    const isExternalPlatform =
      livePlatform === LivePlatform.ZOOM_WEBINAR ||
      livePlatform === LivePlatform.ZOOM_MEETING ||
      livePlatform === LivePlatform.EXTERNAL_URL;

    if (!liveTitle) redirect(`/admin/courses/${id || "new"}?error=live_required`);
    if (livePlatform === LivePlatform.YOUTUBE_LIVE && !/^[a-zA-Z0-9_-]{6,}$/.test(liveYoutubeVideoId)) {
      redirect(`/admin/courses/${id || "new"}?error=live_youtube`);
    }
    if (livePlatform === LivePlatform.VIMEO_LIVE && !isVimeoUrl(liveExternalUrl)) {
      redirect(`/admin/courses/${id || "new"}?error=live_vimeo`);
    }
    if (isExternalPlatform && (!liveExternalUrl || !validHttpUrl(liveExternalUrl))) {
      redirect(`/admin/courses/${id || "new"}?error=live_external`);
    }
    if (
      liveEnableYoutubeChat &&
      (livePlatform !== LivePlatform.YOUTUBE_LIVE || !liveYoutubeChatEmbedUrl || !validHttpUrl(liveYoutubeChatEmbedUrl))
    ) {
      redirect(`/admin/courses/${id || "new"}?error=live_chat`);
    }
    if (liveExternalUrl && !validHttpUrl(liveExternalUrl)) {
      redirect(`/admin/courses/${id || "new"}?error=live_external`);
    }
    if (livePlayerOpenAt && livePlayerCloseAt && livePlayerOpenAt >= livePlayerCloseAt) {
      redirect(`/admin/courses/${id || "new"}?error=live_window`);
    }
  }

  const duplicate = await prisma.course.findFirst({
    where: { slug, id: id ? { not: id } : undefined },
    select: { id: true },
  });
  if (duplicate) {
    redirect(`/admin/courses/${id || "new"}?error=duplicate_slug`);
  }

  const data = {
    slug,
    title,
    subtitle: subtitle || null,
    category,
    excerpt,
    description,
    outline,
    audiences,
    lessonCount,
    durationText: durationText || null,
    courseStartAt,
    courseFormatText: courseFormatText || null,
    viewingPolicyText: viewingPolicyText || null,
    coverImageUrl: coverImageUrl || null,
    previewVideoUrl: previewVideoUrl || null,
    fullVideoUrl: fullVideoUrl || null,
    accessType,
    price,
    isPublished,
    isFeatured,
    sortOrder,
    publishedAt: isPublished
      ? existingCourse?.publishedAt || new Date()
      : null,
  };

  const course = id
    ? await prisma.course.update({ where: { id }, data })
    : await prisma.course.create({ data });

  const liveData = {
    title: liveTitle || title,
    platform: livePlatform,
    isEnabled: liveIsEnabled,
    startsAt: liveStartsAt,
    endsAt: liveEndsAt,
    playerOpenAt: livePlayerOpenAt,
    playerCloseAt: livePlayerCloseAt,
    youtubeVideoId: liveYoutubeVideoId || null,
    youtubeChatEmbedUrl: liveYoutubeChatEmbedUrl || null,
    enableYoutubeChat: liveEnableYoutubeChat,
    enableQuestions: liveEnableQuestions,
    showWatermark: liveShowWatermark,
    externalUrl: liveExternalUrl || null,
  };

  await prisma.liveSession.upsert({
    where: { courseId: course.id },
    create: { courseId: course.id, ...liveData },
    update: liveData,
  });

  await prisma.courseLesson.deleteMany({ where: { courseId: course.id } });
  if (lessonUnits.length) {
    await prisma.courseLesson.createMany({
      data: lessonUnits.map((lesson) => ({
        courseId: course.id,
        ...lesson,
        startsAt: lesson.startsAt ?? null,
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/courses");
  if (existingCourse?.slug && existingCourse.slug !== course.slug) {
    revalidatePath(`/courses/${existingCourse.slug}`);
  }
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath(`/courses/${course.slug}/live`);
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}?saved=1`);
}

export async function toggleCoursePublished(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const course = await prisma.course.findUnique({
    where: { id },
    select: { slug: true, isPublished: true },
  });
  if (!course) redirect("/admin/courses");

  await prisma.course.update({
    where: { id },
    data: {
      isPublished: !course.isPublished,
      publishedAt: course.isPublished ? null : new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/admin/courses");
  redirect("/admin/courses?updated=1");
}
