import Link from "next/link";
import { notFound } from "next/navigation";
import {
  resendCoursePurchaseEmail,
  updateCoursePurchaseStatus,
} from "@/app/admin/course-purchases/actions";
import { AdminShell } from "@/components/admin-shell";
import { CoursePurchaseStatus } from "@/generated/prisma/enums";
import {
  coursePurchaseStatusLabels,
  emailStatusLabels,
  emailTypeLabels,
  formatTaipeiDateTime,
  statusClass,
} from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
};

export default async function AdminCoursePurchaseDetailPage({ params, searchParams }: Props) {
  const session = await requireAdmin();
  const { id } = await params;
  const updated = (await searchParams).updated === "1";
  const purchase = await prisma.coursePurchase.findUnique({
    where: { id },
    include: {
      course: true,
      reviewedBy: { select: { name: true } },
      emailLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!purchase) notFound();

  const actionStatuses = [
    CoursePurchaseStatus.APPROVED,
    CoursePurchaseStatus.REJECTED,
    CoursePurchaseStatus.CANCELLED,
  ];

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <Link className="admin-breadcrumb" href="/admin/course-purchases">
            返回課程購買審核
          </Link>
          <h1>{purchase.name}</h1>
          <span>{purchase.purchaseNo}</span>
        </div>
        <span className={statusClass(purchase.status)}>
          {coursePurchaseStatusLabels[purchase.status]}
        </span>
      </div>
      {updated ? <div className="admin-success-message">狀態已更新，相關信件已處理。</div> : null}
      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>購買人資料</h2></div>
            <dl className="admin-detail-list">
              <div><dt>姓名</dt><dd>{purchase.name}</dd></div>
              <div><dt>手機</dt><dd>{purchase.phone}</dd></div>
              <div><dt>Email</dt><dd>{purchase.email}</dd></div>
              <div><dt>建立時間</dt><dd>{formatTaipeiDateTime(purchase.createdAt)}</dd></div>
            </dl>
          </section>
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>課程資料</h2></div>
            <dl className="admin-detail-list">
              <div><dt>課程</dt><dd>{purchase.course.title}</dd></div>
              <div><dt>價格</dt><dd>NT$ {purchase.amount.toLocaleString("zh-TW")}</dd></div>
              <div>
                <dt>前台頁面</dt>
                <dd><Link href={`/courses/${purchase.course.slug}`} target="_blank">查看課程頁</Link></dd>
              </div>
            </dl>
          </section>
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>匯款資料</h2></div>
            {purchase.bankLast5 ? (
              <dl className="admin-detail-list">
                <div><dt>匯款金額</dt><dd>NT$ {purchase.amount.toLocaleString("zh-TW")}</dd></div>
                <div><dt>帳號後五碼</dt><dd>{purchase.bankLast5}</dd></div>
                <div><dt>匯款人</dt><dd>{purchase.payerName}</dd></div>
                <div><dt>匯款日期</dt><dd>{purchase.paidAt ? formatTaipeiDateTime(purchase.paidAt) : "未填寫"}</dd></div>
                <div><dt>備註</dt><dd>{purchase.note || "無"}</dd></div>
              </dl>
            ) : (
              <p className="admin-empty">尚未收到課程匯款回報。</p>
            )}
          </section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Email 紀錄</h2></div>
            <div className="admin-timeline">
              {purchase.emailLogs.map((log) => (
                <article key={log.id}>
                  <div>
                    <strong>{emailTypeLabels[log.type]}</strong>
                    <span>{formatTaipeiDateTime(log.createdAt)}</span>
                  </div>
                  <p>{log.subject} · {emailStatusLabels[log.status]}</p>
                  {log.errorMessage ? <small>{log.errorMessage}</small> : null}
                  {log.status === "FAILED" ? (
                    <form action={resendCoursePurchaseEmail}>
                      <input name="emailLogId" type="hidden" value={log.id} />
                      <input name="purchaseId" type="hidden" value={purchase.id} />
                      <button type="submit">重新寄送</button>
                    </form>
                  ) : null}
                </article>
              ))}
              {!purchase.emailLogs.length ? <p className="admin-empty">目前沒有 Email 紀錄。</p> : null}
            </div>
          </section>
        </div>
        <aside className="admin-action-card">
          <h2>審核操作</h2>
          <p>核准後會寄出正式課程觀看連結。請確認匯款資料無誤後再審核通過。</p>
          {actionStatuses.map((status) => (
            <form action={updateCoursePurchaseStatus} key={status}>
              <input name="purchaseId" type="hidden" value={purchase.id} />
              <input name="status" type="hidden" value={status} />
              <button
                className={`admin-action-${status.toLowerCase()}`}
                disabled={
                  purchase.status === status ||
                  (status === CoursePurchaseStatus.APPROVED && !purchase.bankLast5)
                }
                type="submit"
              >
                {coursePurchaseStatusLabels[status]}
              </button>
            </form>
          ))}
        </aside>
      </div>
    </AdminShell>
  );
}
