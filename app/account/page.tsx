import type { Metadata } from "next";
import { enterMemberIncludedCourse, enterOwnedCourse, logoutMember } from "@/app/account/actions";
import { CourseAccessType, CoursePurchaseStatus, MembershipSubscriptionStatus } from "@/generated/prisma/enums";
import { requireMember } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "會員中心" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ password_set?: string; error?: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function daysLeft(endsAt: Date) {
  return Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default async function AccountPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([requireMember(), searchParams]);
  const now = new Date();
  const [subscriptions, ownedPurchases, memberCourses] = await Promise.all([
    prisma.membershipSubscription.findMany({
      where: { memberUserId: session.memberUser.id },
      include: { application: { select: { applicationNo: true } } },
      orderBy: { endsAt: "desc" },
    }),
    prisma.coursePurchase.findMany({
      where: {
        memberUserId: session.memberUser.id,
        status: CoursePurchaseStatus.APPROVED,
        amount: { gt: 0 },
      },
      include: { course: { select: { title: true, slug: true, accessType: true } } },
      orderBy: { approvedAt: "desc" },
    }),
    prisma.course.findMany({
      where: { isPublished: true, accessType: CourseAccessType.MEMBER_INCLUDED },
      select: { id: true, title: true, excerpt: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const activeSubscription = subscriptions.find(
    (item) => item.status === MembershipSubscriptionStatus.ACTIVE && item.startsAt <= now && item.endsAt >= now,
  );
  const latestSubscription = subscriptions[0];
  const remainDays = activeSubscription ? daysLeft(activeSubscription.endsAt) : null;

  return (
    <main>
      <section className="page-hero compact-page-hero">
        <div className="container account-hero">
          <div>
            <span className="eyebrow">會員中心</span>
            <h1>{session.memberUser.name}，歡迎回來</h1>
            <p>{session.memberUser.email}</p>
          </div>
          <form action={logoutMember}>
            <button className="button button-outline" type="submit">登出</button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container account-layout">
          {params.password_set === "1" ? <div className="form-message">密碼已設定完成，會員帳號已啟用。</div> : null}
          {params.error ? <div className="form-message">無法進入課程，請確認會員資格或課程權限。</div> : null}

          <section className="account-panel">
            <div className="section-heading">
              <span className="eyebrow">Membership</span>
              <h2>會員資格</h2>
            </div>
            {activeSubscription ? (
              <div className={`account-status-card ${remainDays !== null && remainDays <= 30 ? "is-expiring" : ""}`}>
                <strong>{remainDays !== null && remainDays <= 30 ? "即將到期" : "有效中"}</strong>
                <p>{activeSubscription.planName}</p>
                <dl>
                  <div><dt>會員期間</dt><dd>{formatDate(activeSubscription.startsAt)} - {formatDate(activeSubscription.endsAt)}</dd></div>
                  <div><dt>剩餘天數</dt><dd>{remainDays} 天</dd></div>
                  <div><dt>申請編號</dt><dd>{activeSubscription.application.applicationNo}</dd></div>
                </dl>
                {remainDays !== null && remainDays <= 30 ? (
                  <p className="account-reminder">你的會員資格即將到期，之後會開放續約流程與續約提醒信。</p>
                ) : null}
              </div>
            ) : (
              <div className="account-status-card is-expired">
                <strong>{latestSubscription ? "已過期" : "尚無有效會員資格"}</strong>
                {latestSubscription ? (
                  <p>最近一期會員期間：{formatDate(latestSubscription.startsAt)} - {formatDate(latestSubscription.endsAt)}</p>
                ) : (
                  <p>加入會員後，這裡會顯示你的會員方案與到期日。</p>
                )}
              </div>
            )}
          </section>

          <section className="account-panel">
            <div className="section-heading">
              <span className="eyebrow">Member Courses</span>
              <h2>會員免費課程</h2>
            </div>
            <div className="account-course-list">
              {memberCourses.map((course) => (
                <article className="account-course-card" key={course.id}>
                  <div>
                    <h3>{course.title}</h3>
                    <p>{course.excerpt}</p>
                  </div>
                  <form action={enterMemberIncludedCourse}>
                    <input name="courseId" type="hidden" value={course.id} />
                    <button className="button button-gold" disabled={!activeSubscription} type="submit">
                      {activeSubscription ? "進入學習教室" : "需要有效會員"}
                    </button>
                  </form>
                </article>
              ))}
              {!memberCourses.length ? <p className="admin-empty">目前尚未開放會員免費課程。</p> : null}
            </div>
          </section>

          <section className="account-panel">
            <div className="section-heading">
              <span className="eyebrow">Purchased Courses</span>
              <h2>已購買課程</h2>
            </div>
            <div className="account-course-list">
              {ownedPurchases.map((purchase) => (
                <article className="account-course-card" key={purchase.id}>
                  <div>
                    <h3>{purchase.course.title}</h3>
                    <p>購買編號：{purchase.purchaseNo}</p>
                  </div>
                  <form action={enterOwnedCourse}>
                    <input name="purchaseId" type="hidden" value={purchase.id} />
                    <button className="button button-outline" type="submit">進入學習教室</button>
                  </form>
                </article>
              ))}
              {!ownedPurchases.length ? <p className="admin-empty">目前沒有已購買的付費課程。</p> : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
