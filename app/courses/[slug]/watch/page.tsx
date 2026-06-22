import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoursePurchaseStatus } from "@/generated/prisma/enums";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "觀看正式課程",
};

export default async function CourseWatchPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const token = query.token?.trim();

  if (!token) notFound();

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      accessToken: token,
      status: CoursePurchaseStatus.APPROVED,
      course: { slug, isPublished: true },
    },
    include: {
      course: {
        select: {
          slug: true,
          title: true,
          subtitle: true,
          fullVideoUrl: true,
        },
      },
    },
  });

  if (!purchase) notFound();

  const fullVideoUrl = purchase.course.fullVideoUrl || "";
  const embedUrl = getYouTubeEmbedUrl(fullVideoUrl);

  return (
    <main>
      <section className="section">
        <div className="container">
          <Link className="back-link" href={`/courses/${purchase.course.slug}`}>
            返回課程頁
          </Link>
          <span className="eyebrow">正式課程</span>
          <h1>{purchase.course.title}</h1>
          {purchase.course.subtitle ? <p className="lead">{purchase.course.subtitle}</p> : null}

          {fullVideoUrl ? (
            embedUrl ? (
              <div className="youtube-preview">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  src={embedUrl}
                  title={`${purchase.course.title} 正式課程`}
                />
              </div>
            ) : (
              <section className="result-card success-card">
                <span className="eyebrow">外部影片連結</span>
                <h2>前往觀看正式課程</h2>
                <p>這門課的正式影片目前使用外部平台，請點擊下方按鈕開啟。</p>
                <a className="button button-gold" href={fullVideoUrl} rel="noreferrer" target="_blank">
                  開啟正式課程影片
                </a>
              </section>
            )
          ) : (
            <section className="result-card">
              <span className="result-mark">!</span>
              <h2>正式影片尚未設定</h2>
              <p>您的購買已審核通過，但這門課後台尚未填入正式影片網址。請聯絡學堂管理員。</p>
            </section>
          )}

          <p className="result-notice">
            此觀看連結僅供本次購買使用，請勿任意轉傳。
          </p>
        </div>
      </section>
    </main>
  );
}
