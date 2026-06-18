"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseAccessType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
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
  const coverImageUrl = text(formData, "coverImageUrl");
  const previewVideoUrl = text(formData, "previewVideoUrl");
  const fullVideoUrl = text(formData, "fullVideoUrl");
  const accessType = text(formData, "accessType") as CourseAccessType;
  const price = Number.parseInt(text(formData, "price"), 10);
  const sortOrder = Number.parseInt(text(formData, "sortOrder"), 10);
  const isPublished = formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
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
    !Number.isInteger(sortOrder)
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
    try {
      const coverUrl = new URL(coverImageUrl);
      if (!["http:", "https:"].includes(coverUrl.protocol)) throw new Error();
    } catch {
      redirect(`/admin/courses/${id || "new"}?error=cover`);
    }
  }

  if (fullVideoUrl) {
    try {
      const fullUrl = new URL(fullVideoUrl);
      if (!["http:", "https:"].includes(fullUrl.protocol)) throw new Error();
    } catch {
      redirect(`/admin/courses/${id || "new"}?error=full_video`);
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

  revalidatePath("/");
  revalidatePath("/courses");
  if (existingCourse?.slug && existingCourse.slug !== course.slug) {
    revalidatePath(`/courses/${existingCourse.slug}`);
  }
  revalidatePath(`/courses/${course.slug}`);
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
