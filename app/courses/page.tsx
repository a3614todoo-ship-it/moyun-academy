import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { getPublishedCourses } from "@/lib/course-data";

export const metadata: Metadata = {
  title: "古典文學課程",
  description: "瀏覽我輩學堂的古典詩詞、古文選讀、文學史與寫作賞析課程。",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();
  const categories = ["全部", ...new Set(courses.map((course) => course.category))];

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">從一堂課，走進一個時代</span>
          <h1>古典文學課程</h1>
          <p>選擇感興趣的主題，先觀看 30 秒課程介紹，再決定你的學習方向。</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="filter-row" aria-label="課程分類">
            {categories.map((category, index) => (
              <button className={index === 0 ? "active" : ""} key={category} type="button">{category}</button>
            ))}
          </div>
          <div className="course-grid course-grid-three">
            {courses.map((course) => <CourseCard course={course} key={course.slug} />)}
          </div>
          {!courses.length ? <p className="admin-empty">目前尚無已上架課程。</p> : null}
        </div>
      </section>
    </main>
  );
}
