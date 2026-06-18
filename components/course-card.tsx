import Link from "next/link";
import type { CourseView } from "@/lib/course-data";

export function CourseCard({ course }: { course: CourseView }) {
  const coverStyle = course.coverImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(12,45,39,.2), rgba(12,45,39,.55)), url("${course.coverImageUrl}")`,
      }
    : undefined;

  return (
    <article className="course-card">
      <Link
        className={`course-cover cover-${course.accent}`}
        href={`/courses/${course.slug}`}
        style={coverStyle}
      >
        <span>{course.category}</span>
        <strong>{course.title.slice(0, 4)}</strong>
      </Link>
      <div className="course-card-body">
        <div className="eyebrow">{course.category}</div>
        <h3>
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        </h3>
        <p>{course.excerpt}</p>
        <div className="course-meta">
          <span>{course.lessons} 單元</span>
          {course.duration ? <span>{course.duration}</span> : null}
          <span className="member-label">{course.accessLabel}</span>
        </div>
      </div>
    </article>
  );
}
