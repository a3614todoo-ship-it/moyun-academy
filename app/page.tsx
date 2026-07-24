import { cookies } from "next/headers";
import { HomeDesignSwitcher, type HomeDesign } from "@/components/home-design-switcher";
import { HomeOriginalDesign } from "@/components/home-original-design";
import { HomeWindowDesign } from "@/components/home-window-design";
import { getFeaturedCourses } from "@/lib/course-data";

export const dynamic = "force-dynamic";

function isHomeDesign(value: string | undefined): value is HomeDesign {
  return value === "original" || value === "window";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string | string[] }>;
}) {
  // 資料庫暫時不可用時，首頁仍保留可前往課程總覽的入口。
  const [courses, cookieStore, query] = await Promise.all([
    getFeaturedCourses().catch(() => []),
    cookies(),
    searchParams,
  ]);
  const requestedDesign = Array.isArray(query.design) ? query.design[0] : query.design;
  const storedDesign = cookieStore.get("home-design")?.value;
  const initialDesign = isHomeDesign(requestedDesign)
    ? requestedDesign
    : isHomeDesign(storedDesign) ? storedDesign : "original";

  return (
    <HomeDesignSwitcher
      initialDesign={initialDesign}
      original={<HomeOriginalDesign courses={courses} />}
      windowDesign={<HomeWindowDesign courses={courses} />}
    />
  );
}
