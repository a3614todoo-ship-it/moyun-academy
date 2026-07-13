"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resendAdminEmailCode,
  verifyAdminEmailCode,
  type EmailCodeLoginState,
  type ResendEmailCodeState,
} from "@/app/admin/login/verify/actions";

type Props = { maskedEmail: string };

export function AdminEmailCodeLoginForm({ maskedEmail }: Props) {
  const [verifyState, verifyAction, verifying] = useActionState<EmailCodeLoginState, FormData>(
    verifyAdminEmailCode,
    { message: "" },
  );
  const [resendState, resendAction, resending] = useActionState<ResendEmailCodeState, FormData>(
    resendAdminEmailCode,
    { message: "", success: false },
  );

  return (
    <div className="admin-email-code-box">
      <p className="admin-masked-email">驗證碼已寄至 <strong>{maskedEmail}</strong></p>
      <form action={verifyAction} className="admin-login-form">
        <label>
          <span>6 位數 Email 驗證碼</span>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            name="emailCode"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
            type="text"
          />
        </label>
        {verifyState.message ? <div className="admin-form-error" role="alert">{verifyState.message}</div> : null}
        <button className="button button-gold button-block" disabled={verifying} type="submit">
          {verifying ? "驗證中…" : "驗證並登入"}
        </button>
      </form>
      <div className="admin-login-secondary-actions">
        <form action={resendAction}>
          <button disabled={resending} type="submit">{resending ? "寄送中…" : "重新寄送驗證碼"}</button>
        </form>
        <Link href="/admin/login/verify/recovery">改用救援碼</Link>
      </div>
      {resendState.message ? (
        <div className={resendState.success ? "admin-success-message" : "admin-form-error"} role="status">
          {resendState.message}
        </div>
      ) : null}
    </div>
  );
}

