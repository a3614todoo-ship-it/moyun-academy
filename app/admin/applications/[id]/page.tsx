import Link from "next/link";
import { notFound } from "next/navigation";
import { resendEmail, updateApplicationStatus } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { ApplicationStatus } from "@/generated/prisma/enums";
import {
  applicationStatusLabels, emailStatusLabels, emailTypeLabels,
  formatTaipeiDateTime, statusClass,
} from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> };

export default async function AdminApplicationDetailPage({ params, searchParams }: Props) {
  const session = await requireAdmin();
  const { id } = await params;
  const updated = (await searchParams).updated === "1";
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      plan: true,
      paymentReports: { orderBy: { createdAt: "desc" }, include: { reviewedBy: { select: { name: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
      emailLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();

  const payment = application.paymentReports[0];
  const actionStatuses = [
    ApplicationStatus.APPROVED,
    ApplicationStatus.JOINED_FACEBOOK_GROUP,
    ApplicationStatus.REJECTED,
    ApplicationStatus.CANCELLED,
  ];

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div><Link className="admin-breadcrumb" href="/admin/applications">← 返回報名名單</Link><h1>{application.name}</h1><span>{application.applicationNo}</span></div>
        <span className={statusClass(application.status)}>{applicationStatusLabels[application.status]}</span>
      </div>
      {updated ? <div className="admin-success-message">狀態已更新，相關通知已依設定處理。</div> : null}
      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>基本資料</h2></div>
            <dl className="admin-detail-list">
              <div><dt>姓名</dt><dd>{application.name}</dd></div><div><dt>手機</dt><dd>{application.phone}</dd></div>
              <div><dt>Email</dt><dd>{application.email}</dd></div><div><dt>通訊地址</dt><dd>{application.address}</dd></div>
              <div><dt>Facebook 名稱</dt><dd>{application.facebookName}</dd></div>
              <div><dt>Facebook 連結</dt><dd><a href={application.facebookProfileUrl} rel="noreferrer" target="_blank">開啟個人頁 ↗</a></dd></div>
              <div><dt>申請時間</dt><dd>{formatTaipeiDateTime(application.createdAt)}</dd></div>
            </dl>
          </section>
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>會員方案</h2></div>
            <dl className="admin-detail-list">
              <div><dt>方案</dt><dd>{application.plan.name}</dd></div>
              <div><dt>金額</dt><dd>NT$ {application.plan.price.toLocaleString("zh-TW")}</dd></div>
              <div><dt>效期</dt><dd>{application.plan.durationDays} 天</dd></div>
            </dl>
          </section>
          <section className="admin-panel admin-info-panel">
            <div className="admin-panel-heading"><h2>匯款回報</h2></div>
            {payment ? (
              <dl className="admin-detail-list">
                <div><dt>回報金額</dt><dd>NT$ {payment.amount.toLocaleString("zh-TW")}</dd></div>
                <div><dt>帳號後五碼</dt><dd>{payment.bankLast5}</dd></div>
                <div><dt>匯款人</dt><dd>{payment.payerName}</dd></div>
                <div><dt>匯款日期</dt><dd>{formatTaipeiDateTime(payment.paidAt)}</dd></div>
                <div><dt>備註</dt><dd>{payment.note || "無"}</dd></div>
              </dl>
            ) : <p className="admin-empty">尚未收到匯款回報。</p>}
          </section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>Email 紀錄</h2></div>
            <div className="admin-timeline">
              {application.emailLogs.map((log) => (
                <article key={log.id}>
                  <div><strong>{emailTypeLabels[log.type]}</strong><span>{formatTaipeiDateTime(log.createdAt)}</span></div>
                  <p>{log.subject} · {emailStatusLabels[log.status]}</p>
                  {log.errorMessage ? <small>{log.errorMessage}</small> : null}
                  {log.status === "FAILED" ? (
                    <form action={resendEmail}>
                      <input name="emailLogId" type="hidden" value={log.id} />
                      <input name="applicationId" type="hidden" value={application.id} />
                      <button type="submit">重新寄送</button>
                    </form>
                  ) : null}
                </article>
              ))}
              {!application.emailLogs.length ? <p className="admin-empty">尚無 Email 紀錄。</p> : null}
            </div>
          </section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><h2>狀態歷程</h2></div>
            <div className="admin-timeline">
              {application.statusHistory.map((history) => (
                <article key={history.id}>
                  <div><strong>{applicationStatusLabels[history.toStatus]}</strong><span>{formatTaipeiDateTime(history.createdAt)}</span></div>
                  <p>{history.note || "狀態更新"}{history.changedBy ? ` · ${history.changedBy.name}` : ""}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="admin-action-card">
          <h2>審核操作</h2>
          <p>每次變更都會寫入狀態歷程。審核通過與加入社團會自動寄信。</p>
          {actionStatuses.map((status) => (
            <form action={updateApplicationStatus} key={status}>
              <input name="applicationId" type="hidden" value={application.id} />
              <input name="status" type="hidden" value={status} />
              <textarea name="note" placeholder="操作備註（選填）" rows={2} />
              <button className={`admin-action-${status.toLowerCase()}`} disabled={application.status === status} type="submit">
                {applicationStatusLabels[status]}
              </button>
            </form>
          ))}
        </aside>
      </div>
    </AdminShell>
  );
}
