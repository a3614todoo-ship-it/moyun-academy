import { AdminRecoveryCodeManager } from "@/components/admin-recovery-code-manager";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { formatTaipeiDateTime } from "@/lib/admin/labels";
import { prisma } from "@/lib/prisma";

const auditLabels: Record<string, string> = {
  ADMIN_LOGIN_PASSWORD_VERIFIED: "密碼驗證成功",
  ADMIN_LOGIN_PASSWORD_FAILED: "密碼驗證失敗",
  ADMIN_LOGIN_PASSWORD_RATE_LIMITED: "密碼登入已限速",
  ADMIN_LOGIN_RECOVERY_CODE_FAILED: "救援碼驗證失敗",
  ADMIN_LOGIN_RECOVERY_CODE_RATE_LIMITED: "救援碼驗證已限速",
  ADMIN_LOGIN_RECOVERY_CODES_UNAVAILABLE: "沒有可用救援碼",
  ADMIN_LOGIN_SUCCEEDED: "管理員登入成功",
  ADMIN_RECOVERY_CODES_REGENERATED: "救援碼已重新產生",
  ADMIN_RECOVERY_CODES_REGENERATION_RATE_LIMITED: "救援碼重建已限速",
};

export default async function AdminSecurityPage() {
  const session = await requireAdmin();
  const actions = Object.keys(auditLabels);
  const [remainingCount, auditLogs] = await Promise.all([
    prisma.adminRecoveryCode.count({
      where: { adminUserId: session.adminUser.id, usedAt: null },
    }),
    prisma.adminAuditLog.findMany({
      where: { adminUserId: session.adminUser.id, action: { in: actions } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div><span>帳號保護</span><h1>安全設定與稽核</h1></div>
      </div>
      <AdminRecoveryCodeManager remainingCount={remainingCount} />
      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>最近 50 筆登入安全紀錄</h2></div>
        {auditLogs.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>時間</th><th>事件</th></tr></thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTaipeiDateTime(log.createdAt)}</td>
                    <td>{auditLabels[log.action] || log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-empty">目前沒有登入安全紀錄。</p>}
      </section>
    </AdminShell>
  );
}

