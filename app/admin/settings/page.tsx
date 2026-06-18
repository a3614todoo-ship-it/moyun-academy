import {
  saveBankTransferSettings,
  saveFacebookGroupSetting,
} from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getBankTransferSettings,
  getFacebookGroupUrl,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  const [session, facebookGroupUrl, bankSettings, params] = await Promise.all([
    requireAdmin(),
    getFacebookGroupUrl(),
    getBankTransferSettings(),
    searchParams,
  ]);

  return (
    <AdminShell adminName={session.adminUser.name}>
      <div className="admin-page-heading">
        <div>
          <span>通知與社群連結</span>
          <h1>系統設定</h1>
        </div>
      </div>

      {params.saved === "1" ? (
        <div className="admin-success-message">
          Facebook 私密社團網址已儲存，後續審核通過信將自動附上此網址。
        </div>
      ) : null}

      {params.saved === "bank" ? (
        <div className="admin-success-message">
          銀行匯款資訊已儲存，報名完成頁將立即使用最新資料。
        </div>
      ) : null}

      {params.error === "invalid_url" ? (
        <div className="admin-form-error admin-settings-message">
          請輸入以 https:// 開頭的有效 Facebook 社團網址（網址需包含 /groups/）。
        </div>
      ) : null}

      {params.error === "bank_required" ? (
        <div className="admin-form-error admin-settings-message">
          銀行名稱、分行、匯款戶名與匯款帳號皆為必填。
        </div>
      ) : null}

      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <h2>Facebook 私密社團</h2>
        </div>
        <form action={saveFacebookGroupSetting} className="admin-settings-form">
          <label htmlFor="facebookGroupUrl">私密社團網址</label>
          <input
            defaultValue={facebookGroupUrl}
            id="facebookGroupUrl"
            name="facebookGroupUrl"
            placeholder="https://www.facebook.com/groups/..."
            required
            type="url"
          />
          <p>
            管理員將報名狀態改為「審核通過」時，系統會在通知信中放入此連結與加入社團按鈕。
          </p>
          <button type="submit">儲存設定</button>
        </form>
      </section>

      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <h2>銀行匯款資訊</h2>
        </div>
        <form action={saveBankTransferSettings} className="admin-settings-form">
          <div className="admin-settings-grid">
            <label>
              銀行名稱
              <input
                defaultValue={bankSettings.bankName}
                name="bankName"
                required
                type="text"
              />
            </label>
            <label>
              分行
              <input
                defaultValue={bankSettings.bankBranch}
                name="bankBranch"
                required
                type="text"
              />
            </label>
            <label>
              匯款戶名
              <input
                defaultValue={bankSettings.bankAccountName}
                name="bankAccountName"
                required
                type="text"
              />
            </label>
            <label>
              匯款帳號
              <input
                autoComplete="off"
                defaultValue={bankSettings.bankAccountNumber}
                name="bankAccountNumber"
                required
                type="text"
              />
            </label>
          </div>
          <p>
            這些資料會顯示在會員報名完成頁。日後請直接在此修改，不需要再編輯主機的環境變數。
          </p>
          <button type="submit">儲存銀行資訊</button>
        </form>
      </section>
    </AdminShell>
  );
}
