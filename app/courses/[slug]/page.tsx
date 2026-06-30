import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { enterMemberIncludedCourse } from "@/app/account/actions";
import { CourseAccessLookupForm } from "@/components/course-access-lookup-form";
import { MemberCourseAccessLookupForm } from "@/components/member-course-access-lookup-form";
import { MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { getPublishedCourse } from "@/lib/course-data";
import { getMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getPublishedCourse((await params).slug);
  return course ? { title: course.title, description: course.excerpt } : {};
}

function money(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

function accessTitle(accessType: string) {
  if (accessType === "PUBLIC_FREE") return "免費課程";
  if (accessType === "PAID") return "付費課程";
  return "會員免費";
}

function formatDateTime(value: Date | null) {
  if (!value) return "時間待公告";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getPublishedCourse((await params).slug);
  if (!course) notFound();
  const memberSession = await getMemberSession();

  const [lessonUnits, activeSubscription] = await Promise.all([
    prisma.courseLesson.findMany({
      where: { courseId: course.id, isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    memberSession
      ? prisma.membershipSubscription.findFirst({
          where: {
            memberUserId: memberSession.memberUser.id,
            status: MembershipSubscriptionStatus.ACTIVE,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
          select: { id: true },
        })
      : null,
  ]);

  const previewEmbedUrl = getYouTubeEmbedUrl(course.previewVideoUrl);
  const fullVideoEmbedUrl =
    course.accessType === "PUBLIC_FREE"
      ? getYouTubeEmbedUrl(course.fullVideoUrl)
      : "";
  const canShowPublicFullVideo =
    course.accessType === "PUBLIC_FREE" && Boolean(course.fullVideoUrl);

  const courseInfoItems = [
    {
      icon: "日",
      label: "開課時間",
      value: formatDateTime(course.courseStartAt),
    },
    {
      icon: "時",
      label: "課程時長",
      value: course.duration || `${course.lessons} 單元`,
    },
    {
      icon: "式",
      label: "上課方式",
      value: course.courseFormatText || "直播、回放與站內學習教室",
    },
    {
      icon: "權",
      label: "觀看權限",
      value:
        course.viewingPolicyText ||
        (course.accessType === "PAID"
          ? "購買審核通過後可進入學習教室"
          : "依課程權限開放觀看"),
    },
  ];

  return (
    <main>
      <section className="course-detail-hero">
        <div className="container detail-grid">
          <div>
            <Link className="back-link" href="/courses">回到課程列表</Link>
            <span className="eyebrow">{course.category}</span>
            <h1>{course.title}</h1>
            {course.subtitle ? <p className="lead">{course.subtitle}</p> : null}
            <div className="detail-meta">
              <span>{course.lessons} 單元</span>
              {course.duration ? <span>{course.duration}</span> : null}
              <span>{course.accessLabel}</span>
            </div>
          </div>
          {previewEmbedUrl ? (
            <div className="youtube-preview">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                src={previewEmbedUrl}
                title={`${course.title} 試看片`}
              />
            </div>
          ) : (
            <div className={`preview-player cover-${course.accent}`}>
              <span className="preview-placeholder-play">讀</span>
              <strong>課程試看</strong>
              <small>可在後台設定 YouTube 試看片</small>
            </div>
          )}
        </div>
      </section>

      <section className="section course-info-section">
        <div className="container course-info-card">
          <h2>課程資訊</h2>
          <div className="course-info-grid">
            {courseInfoItems.map((item) => (
              <article className="course-info-item" key={item.label}>
                <span>{item.icon}</span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <span className="eyebrow">課程介紹</span>
            <h2>從文字走進生活，也從生活回望經典</h2>
            <p>{course.description}</p>

            {canShowPublicFullVideo ? (
              <div className="course-access-panel">
                <span className="eyebrow">完整課程</span>
                <h2>這堂課目前開放免費觀看</h2>
                {fullVideoEmbedUrl ? (
                  <div className="youtube-preview">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      src={fullVideoEmbedUrl}
                      title={`${course.title} 完整課程`}
                    />
                  </div>
                ) : (
                  <p>
                    <a className="button button-gold" href={course.fullVideoUrl} rel="noreferrer" target="_blank">
                      開啟完整課程
                    </a>
                  </p>
                )}
              </div>
            ) : null}

            {lessonUnits.length ? (
              <>
                <h2>課程單元</h2>
                <div className="lesson-preview-list">
                  {lessonUnits.map((lesson, index) => (
                    <article className="lesson-preview-card" key={lesson.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{lesson.title}</h3>
                        {lesson.summary ? <p>{lesson.summary}</p> : null}
                        <dl>
                          <div>
                            <dt>時間</dt>
                            <dd>{formatDateTime(lesson.startsAt)}</dd>
                          </div>
                          {lesson.durationText ? (
                            <div>
                              <dt>時長</dt>
                              <dd>{lesson.durationText}</dd>
                            </div>
                          ) : null}
                          {lesson.reflectionPrompt ? (
                            <div>
                              <dt>提問卡</dt>
                              <dd>{lesson.reflectionPrompt}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            <h2>課程大綱</h2>
            <ol className="outline-list">
              {course.outline.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
            <h2>適合對象</h2>
            <ul className="check-list">
              {course.audiences.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <aside className="join-card">
            <span className="eyebrow">{accessTitle(course.accessType)}</span>
            <h3>{course.title}</h3>
            {course.accessType === "PUBLIC_FREE" ? (
              <>
                <p>這堂課目前開放免費觀看，你可以先從這裡開始，慢慢熟悉我輩學堂的閱讀方式。</p>
                <Link className="button button-gold button-block" href="/courses">
                  繼續探索課程
                </Link>
              </>
            ) : null}
            {course.accessType === "MEMBER_INCLUDED" ? (
              <>
                <p>這堂課包含在會員權益中。加入學堂後，即可依會員期間進入課程內容。</p>
                {activeSubscription ? (
                  <form action={enterMemberIncludedCourse}>
                    <input name="courseId" type="hidden" value={course.id} />
                    <button className="button button-gold button-block" type="submit">
                      以會員帳號進入
                    </button>
                  </form>
                ) : (
                  <Link className="button button-gold button-block" href="/membership">
                    加入會員
                  </Link>
                )}
                <MemberCourseAccessLookupForm slug={course.slug} />
              </>
            ) : null}
            {course.accessType === "PAID" ? (
              <>
                <p>這是需要另外購買的課程。完成報名與匯款審核後，系統會寄出學習教室連結。</p>
                <ul>
                  <li>課程價格：{money(course.price)}</li>
                  <li>付款方式：銀行匯款、人工對帳</li>
                  <li>可依後台設定進入直播、回放、講義與 Q&A</li>
                </ul>
                <Link className="button button-gold button-block" href={`/courses/${course.slug}/purchase`}>
                  報名這堂課
                </Link>
                <CourseAccessLookupForm slug={course.slug} />
              </>
            ) : null}
            <small>付費內容、講義下載與回放連結，只會在審核通過後的學習教室中顯示。</small>
          </aside>
        </div>
      </section>
    </main>
  );
}
