"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseAccessType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { parseTaipeiDateTimeLocal } from "@/lib/taipei-time";
import { getYouTubeVideoId } from "@/lib/youtube";

function text(formData: FormData, name: string) { return String(formData.get(name) || "").trim(); }
function lines(formData: FormData, name: string) { return text(formData, name).split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
function optionalDate(formData: FormData, name: string) { const value = text(formData, name); return value ? parseTaipeiDateTimeLocal(value) : null; }
function validHttpUrl(value: string) { if (!value) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }

export async function saveCourse(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const slug = text(formData, "slug").toLowerCase();
  const title = text(formData, "title");
  const category = text(formData, "category");
  const excerpt = text(formData, "excerpt");
  const description = text(formData, "description");
  const accessType = text(formData, "accessType") as CourseAccessType;
  const lessonCount = Number.parseInt(text(formData, "lessonCount"), 10);
  const price = Number.parseInt(text(formData, "price"), 10);
  const sortOrder = Number.parseInt(text(formData, "sortOrder"), 10);
  const courseStartAt = optionalDate(formData, "courseStartAt");
  const publicRegistrationOpenAt = optionalDate(formData, "publicRegistrationOpenAt");
  const registrationCloseAt = optionalDate(formData, "registrationCloseAt");
  const coverImageUrl = text(formData, "coverImageUrl");
  const previewVideoUrl = text(formData, "previewVideoUrl");
  const isPublished = formData.get("isPublished") === "on";
  const existing = id ? await prisma.course.findUnique({ where: { id }, select: { slug: true, price: true, publishedAt: true } }) : null;

  if (id && !existing) redirect("/admin/courses");
  if (!title || !slug || !category || !excerpt || !description || !Number.isInteger(lessonCount) || lessonCount < 0 || !Number.isInteger(price) || price < 0 || !Number.isInteger(sortOrder) || !Object.values(CourseAccessType).includes(accessType)) redirect(`/admin/courses/${id || "new"}?error=required`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect(`/admin/courses/${id || "new"}?error=slug`);
  if (accessType === CourseAccessType.PAID && price <= 0) redirect(`/admin/courses/${id || "new"}?error=paid_price`);
  if (coverImageUrl && !validHttpUrl(coverImageUrl)) redirect(`/admin/courses/${id || "new"}?error=cover`);
  if (previewVideoUrl && !getYouTubeVideoId(previewVideoUrl)) redirect(`/admin/courses/${id || "new"}?error=youtube`);
  if (publicRegistrationOpenAt && registrationCloseAt && publicRegistrationOpenAt >= registrationCloseAt) redirect(`/admin/courses/${id || "new"}?error=registration_window`);
  const duplicate = await prisma.course.findFirst({ where: { slug, id: id ? { not: id } : undefined }, select: { id: true } });
  if (duplicate) redirect(`/admin/courses/${id || "new"}?error=duplicate_slug`);

  const data = {
    slug, title, subtitle: text(formData, "subtitle") || null, category, excerpt, description,
    outline: lines(formData, "outline"), audiences: lines(formData, "audiences"), lessonCount,
    durationText: text(formData, "durationText") || null, courseStartAt,
    courseFormatText: text(formData, "courseFormatText") || null,
    viewingPolicyText: text(formData, "viewingPolicyText") || null,
    coverImageUrl: coverImageUrl || null, previewVideoUrl: previewVideoUrl || null,
    accessType, price, publicRegistrationOpenAt, registrationCloseAt,
    isPublished, isFeatured: formData.get("isFeatured") === "on", sortOrder,
    publishedAt: isPublished ? existing?.publishedAt || new Date() : null,
  };
  const course = id ? await prisma.course.update({ where: { id }, data }) : await prisma.course.create({ data });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: existing && existing.price !== price ? "COURSE_PRICE_CHANGED" : id ? "COURSE_UPDATED" : "COURSE_CREATED", targetType: "Course", targetId: course.id, metadata: { slug, oldPrice: existing?.price ?? null, newPrice: price, accessType } });
  revalidatePath("/"); revalidatePath("/courses"); revalidatePath(`/courses/${slug}`); revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}?saved=1`);
}

export async function toggleCoursePublished(formData: FormData) {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const course = await prisma.course.findUnique({ where: { id }, select: { slug: true, isPublished: true } });
  if (!course) redirect("/admin/courses");
  await prisma.course.update({ where: { id }, data: { isPublished: !course.isPublished, publishedAt: course.isPublished ? null : new Date() } });
  await recordAdminAudit({ adminUserId: session.adminUser.id, action: course.isPublished ? "COURSE_UNPUBLISHED" : "COURSE_PUBLISHED", targetType: "Course", targetId: id });
  revalidatePath("/"); revalidatePath("/courses"); revalidatePath(`/courses/${course.slug}`); revalidatePath("/admin/courses");
  redirect("/admin/courses?updated=1");
}
