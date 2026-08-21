import Link from "next/link";
import { retryEmailDelivery } from "@/app/admin/emails/actions";
import { AdminShell } from "@/components/admin-shell";
import { EmailStatus, EmailType } from "@/generated/prisma/enums";
import { emailStatusLabels, emailTypeLabels, formatTaipeiDateTime } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
};

export default async function AdminEmailsPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([requireAdmin(), searchParams]);
  const q = params.q?.trim() || "";
  const status = Object.values(EmailStatus).includes(params.status as EmailStatus)
    ? params.status as EmailStatus
    : undefined;
  const type = Object.values(EmailType).includes(params.type as EmailType)
    ? params.type as EmailType
    : undefined;

  const [logs, counts] = await Promise.all([
    prisma.emailLog.findMany({
      where: {
        status,
        type,
        OR: q
          ? [
              { recipient: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((item) => [item.status, item._count._all]));

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div><span>通知、排程與寄送狀態</span><h1>Email 寄送總覽</h1></div>
      </div>

      <section className="admin-kpi-grid">
        {Object.values(EmailStatus).map((value) => (
          <article className="admin-kpi-card" key={value}>
            <span>{emailStatusLabels[value]}</span>
            <strong>{countMap.get(value) || 0}</strong>
          </article>
        ))}
      </section>

      <form className="admin-filters admin-email-filters">
        <input defaultValue={q} name="q" placeholder="搜尋收件人或主旨" />
        <select defaultValue={status || ""} name="status">
          <option value="">全部寄送狀態</option>
          {Object.values(EmailStatus).map((value) => <option key={value} value={value}>{emailStatusLabels[value]}</option>)}
        </select>
        <select defaultValue={type || ""} name="type">
          <option value="">全部通知類型</option>
          {Object.values(EmailType).map((value) => <option key={value} value={value}>{emailTypeLabels[value]}</option>)}
        </select>
        <button type="submit">套用篩選</button>
        <Link href="/admin/emails">清除</Link>
      </form>

      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>最近 {logs.length} 筆紀錄</h2></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>建立時間</th><th>類型</th><th>收件人</th><th>主旨</th><th>狀態</th><th>錯誤摘要</th><th>操作</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatTaipeiDateTime(log.createdAt)}</td>
                  <td>{emailTypeLabels[log.type]}</td>
                  <td>{log.recipient}</td>
                  <td>{log.subject}</td>
                  <td><span className={`admin-status status-${log.status.toLowerCase()}`}>{emailStatusLabels[log.status]}</span></td>
                  <td>{log.errorMessage ? log.errorMessage.slice(0, 160) : "—"}</td>
                  <td>
                    {log.status !== EmailStatus.SENT ? (
                      <form action={retryEmailDelivery}>
                        <input name="emailLogId" type="hidden" value={log.id} />
                        <button className="admin-table-button" type="submit">重新寄送</button>
                      </form>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!logs.length ? <tr><td colSpan={7}>沒有符合條件的 Email 紀錄。</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
