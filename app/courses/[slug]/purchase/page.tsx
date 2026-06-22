import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoursePurchaseForm } from "@/components/course-purchase-form";
import { CourseAccessType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "購買付費課程",
};

export default async function CoursePurchasePage({ params }: Props) {
  const { slug } = await params;
  const course = await prisma.course.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      excerpt: true,
      price: true,
      accessType: true,
    },
  });

  if (!course) notFound();

  if (course.accessType !== CourseAccessType.PAID) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <span className="eyebrow">這門課不需要單獨購買</span>
          <h1>{course.title}</h1>
          <p>這門課目前不是單獨付費課程，請回到課程頁查看觀看方式。</p>
          <Link className="button button-forest" href={`/courses/${course.slug}`}>
            返回課程頁
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <Link className="back-link" href={`/courses/${course.slug}`}>
              返回課程頁
            </Link>
            <span className="eyebrow">付費課程購買</span>
            <h1>{course.title}</h1>
            {course.subtitle ? <p className="lead">{course.subtitle}</p> : null}
            <p>{course.excerpt}</p>
            <div className="payment-summary">
              <h2>課程售價</h2>
              <dl>
                <div>
                  <dt>應匯款金額</dt>
                  <dd>NT$ {course.price.toLocaleString("zh-TW")}</dd>
                </div>
              </dl>
            </div>
          </article>
          <aside className="join-card">
            <span className="eyebrow">流程說明</span>
            <h3>購買後如何開通？</h3>
            <ul>
              <li>送出購買申請</li>
              <li>依成功頁提供的銀行資料匯款</li>
              <li>回填匯款資料</li>
              <li>管理員審核通過後寄出觀看連結</li>
            </ul>
            <small>正式影片網址不會在審核通過前公開顯示。</small>
          </aside>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container form-layout">
          <CoursePurchaseForm course={course} />
        </div>
      </section>
    </main>
  );
}
