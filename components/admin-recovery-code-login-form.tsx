"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  verifyAdminRecoveryCode,
  type RecoveryCodeLoginState,
} from "@/app/admin/login/verify/actions";

export function AdminRecoveryCodeLoginForm() {
  const initialState: RecoveryCodeLoginState = { message: "" };
  const [state, formAction, pending] = useActionState(
    verifyAdminRecoveryCode,
    initialState,
  );

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        <span>一次性救援碼</span>
        <input
          autoCapitalize="characters"
          autoComplete="one-time-code"
          inputMode="text"
          name="recoveryCode"
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
          required
          spellCheck={false}
          type="text"
        />
      </label>
      {state.message ? <div className="admin-form-error" role="alert">{state.message}</div> : null}
      <button className="button button-gold button-block" disabled={pending} type="submit">
        {pending ? "驗證中…" : "驗證並登入"}
      </button>
      <Link className="admin-login-back" href="/admin/login">返回帳號密碼登入</Link>
    </form>
  );
}
