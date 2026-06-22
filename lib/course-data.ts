import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const accents = ["mist", "bamboo", "plum", "mountain", "river", "scroll"];

export type CourseView = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  excerpt: string;
  description: string;
  lessons: number;
  duration: string;
  courseStartAt: Date | null;
  courseFormatText: string;
  viewingPolicyText: string;
  accent: string;
  featured: boolean;
  outline: string[];
  audiences: string[];
  coverImageUrl: string;
  previewVideoUrl: string;
  fullVideoUrl: string;
  accessType: string;
  price: number;
  isPaid: boolean;
  accessLabel: string;
};

function stringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function accentForCourse(slug: string, sortOrder: number) {
  const total = [...slug].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return accents[Math.abs(total + sortOrder) % accents.length];
}

function accessLabel(accessType: string, price: number) {
  if (accessType === "PUBLIC_FREE") return "免費課程";
  if (accessType === "PAID") return `付費課程 NT$ ${price.toLocaleString("zh-TW")}`;
  return "會員免費";
}

export function toCourseView(course: {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  excerpt: string;
  description: string;
  outline: Prisma.JsonValue | null;
  audiences: Prisma.JsonValue | null;
  lessonCount: number;
  durationText: string | null;
  courseStartAt: Date | null;
  courseFormatText: string | null;
  viewingPolicyText: string | null;
  coverImageUrl: string | null;
  previewVideoUrl: string | null;
  fullVideoUrl: string | null;
  accessType: string;
  price: number;
  isFeatured: boolean;
  sortOrder: number;
}): CourseView {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle || "",
    category: course.category,
    excerpt: course.excerpt,
    description: course.description,
    lessons: course.lessonCount,
    duration: course.durationText || "",
    courseStartAt: course.courseStartAt,
    courseFormatText: course.courseFormatText || "",
    viewingPolicyText: course.viewingPolicyText || "",
    accent: accentForCourse(course.slug, course.sortOrder),
    featured: course.isFeatured,
    outline: stringArray(course.outline),
    audiences: stringArray(course.audiences),
    coverImageUrl: course.coverImageUrl || "",
    previewVideoUrl: course.previewVideoUrl || "",
    fullVideoUrl: course.fullVideoUrl || "",
    accessType: course.accessType,
    price: course.price,
    isPaid: course.accessType === "PAID",
    accessLabel: accessLabel(course.accessType, course.price),
  };
}

export async function getPublishedCourses() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return courses.map(toCourseView);
}

export async function getFeaturedCourses() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return courses.map(toCourseView);
}

export async function getPublishedCourse(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, isPublished: true },
  });
  return course ? toCourseView(course) : null;
}
