"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginActionState } from "@/app/admin/actions";

export function AdminLoginForm() {
  const initialState: LoginActionState = { message: "" };
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        <span>管理員 Email</span>
        <input autoComplete="username" name="email" required type="email" />
      </label>
      <label>
        <span>密碼</span>
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.message ? <div className="admin-form-error" role="alert">{state.message}</div> : null}
      <button className="button button-gold button-block" disabled={pending} type="submit">
        {pending ? "登入中…" : "登入管理後台"}
      </button>
    </form>
  );
}
