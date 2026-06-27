import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const COURSE_ACCESS_COOKIE = "wobei_course_access";
const COURSE_ACCESS_HOURS = 6;

type CourseAccessPurchase = {
  id: string;
  email: string;
  accessToken: string;
};

function accessSignature(purchase: CourseAccessPurchase) {
  return createHash("sha256")
    .update(`${purchase.id}:${purchase.email.toLowerCase()}:${purchase.accessToken}`)
    .digest("hex");
}

function secureCookie() {
  return (
    process.env.VERCEL === "1" ||
    process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true
  );
}

export async function createCourseAccessSession(slug: string, purchase: CourseAccessPurchase) {
  const cookieStore = await cookies();
  cookieStore.set(COURSE_ACCESS_COOKIE, accessSignature(purchase), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: `/courses/${slug}`,
    maxAge: COURSE_ACCESS_HOURS * 60 * 60,
  });
}

export async function hasCourseAccessSession(purchase: CourseAccessPurchase) {
  const cookieValue = (await cookies()).get(COURSE_ACCESS_COOKIE)?.value;
  return Boolean(cookieValue && cookieValue === accessSignature(purchase));
}
