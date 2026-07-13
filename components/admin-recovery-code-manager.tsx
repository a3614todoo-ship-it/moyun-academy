"use client";

import { useActionState } from "react";
import {
  regenerateAdminRecoveryCodes,
  type RegenerateRecoveryCodesState,
} from "@/app/admin/security/actions";

type Props = { remainingCount: number };

export function AdminRecoveryCodeManager({ remainingCount }: Props) {
  const initialState: RegenerateRecoveryCodesState = { message: "", codes: [] };
  const [state, formAction, pending] = useActionState(
    regenerateAdminRecoveryCodes,
    initialState,
  );

  return (
    <section className="admin-panel admin-security-card">
      <div className="admin-panel-heading"><h2>一次性救援碼</h2></div>
      <div className="admin-security-content">
        <p>目前剩餘 <strong>{state.codes.length || remainingCount}</strong> 組可用救援碼。</p>
        <p className="admin-security-note">
          重新產生後，舊救援碼與其他管理員工作階段會立即失效。新的明文救援碼只會顯示這一次。
        </p>
        <form action={formAction}>
          <button className="button button-gold" disabled={pending} type="submit">
            {pending ? "產生中…" : remainingCount ? "重新產生 10 組救援碼" : "產生 10 組救援碼"}
          </button>
        </form>
        {state.message ? <div className={state.codes.length ? "admin-success-message" : "admin-form-error"} role="status">{state.message}</div> : null}
        {state.codes.length ? (
          <div className="admin-recovery-code-result">
            <h3>請立即離線保存</h3>
            <ol>
              {state.codes.map((code) => <li key={code}><code>{code}</code></li>)}
            </ol>
            <p>離開或重新整理此頁後，系統無法再次顯示這批明文救援碼。</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

