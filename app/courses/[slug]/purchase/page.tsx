import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoursePurchaseForm } from "@/components/course-purchase-form";
import { CourseAccessType, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import {
  canCreateCoursePurchase,
  memberRegistrationOpenAt,
  registrationState,
} from "@/lib/course-registration";
import { getMemberSession } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "購買付費課程" };

function formatDateTime(value: Date | null) {
  if (!value) return "未設定";
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

export default async function CoursePurchasePage({ params }: Props) {
  const { slug } = await params;
  const [course, memberSession] = await Promise.all([
    prisma.course.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        excerpt: true,
        price: true,
        accessType: true,
        publicRegistrationOpenAt: true,
        registrationCloseAt: true,
      },
    }),
    getMemberSession(),
  ]);

  if (!course) notFound();

  if (course.accessType !== CourseAccessType.PAID) {
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <span className="eyebrow">這門課不需要單獨購買</span>
          <h1>{course.title}</h1>
          <p>這門課目前不是單獨付費課程，請回到課程頁查看觀看方式。</p>
          <Link className="button button-forest" href={`/courses/${course.slug}`}>返回課程頁</Link>
        </section>
      </main>
    );
  }

  const activeSubscription = memberSession
    ? await prisma.membershipSubscription.findFirst({
        where: {
          memberUserId: memberSession.memberUser.id,
          status: MembershipSubscriptionStatus.ACTIVE,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
        select: { id: true },
      })
    : null;
  const windowState = registrationState(course, Boolean(activeSubscription));
  const memberOpenAt = memberRegistrationOpenAt(course.publicRegistrationOpenAt);

  if (!canCreateCoursePurchase(windowState)) {
    const title = windowState === "CLOSED"
      ? "報名已截止"
      : windowState === "MEMBER_PRIORITY"
        ? "目前為會員優先報名"
        : "報名尚未開放";
    return (
      <main className="result-page">
        <section className="container result-card">
          <span className="result-mark">!</span>
          <span className="eyebrow">付費課程報名</span>
          <h1>{title}</h1>
          <p>{course.title}</p>
          {windowState === "MEMBER_PRIORITY" ? (
            <p>有效會員可比一般訪客提前 7 天報名。請先登入會員帳號，系統會立即重新確認資格。</p>
          ) : null}
          {memberOpenAt ? <p>會員開放：{formatDateTime(memberOpenAt)}</p> : null}
          {course.publicRegistrationOpenAt ? <p>一般訪客開放：{formatDateTime(course.publicRegistrationOpenAt)}</p> : null}
          {course.registrationCloseAt ? <p>報名截止：{formatDateTime(course.registrationCloseAt)}</p> : null}
          <div className="button-row">
            {windowState === "MEMBER_PRIORITY" ? <Link className="button button-gold" href="/login">會員登入</Link> : null}
            <Link className="button button-forest" href={`/courses/${course.slug}`}>返回課程頁</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container detail-content">
          <article className="prose">
            <Link className="back-link" href={`/courses/${course.slug}`}>返回課程頁</Link>
            <span className="eyebrow">{windowState === "OPEN_MEMBER" ? "會員優先報名" : "付費課程購買"}</span>
            <h1>{course.title}</h1>
            {course.subtitle ? <p className="lead">{course.subtitle}</p> : null}
            <p>{course.excerpt}</p>
            {windowState === "OPEN_MEMBER" && course.publicRegistrationOpenAt ? (
              <p>你正在使用有效會員資格提前報名；一般訪客將於 {formatDateTime(course.publicRegistrationOpenAt)} 開放。</p>
            ) : null}
            <div className="payment-summary">
              <h2>課程售價</h2>
              <dl><div><dt>應匯款金額</dt><dd>NT$ {course.price.toLocaleString("zh-TW")}</dd></div></dl>
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
            <small>正式影片與聲音回看只會在審核通過且管理員開放回看後顯示。</small>
          </aside>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container form-layout">
          <CoursePurchaseForm
            course={course}
            memberDefaults={activeSubscription && memberSession ? {
              name: memberSession.memberUser.name,
              email: memberSession.memberUser.email,
            } : undefined}
          />
        </div>
      </section>
    </main>
  );
}
