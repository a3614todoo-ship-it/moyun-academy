"use client";

import { useActionState } from "react";
import { loginMember, type MemberLoginState } from "@/app/login/actions";

export function MemberLoginForm() {
  const initialState: MemberLoginState = { message: "" };
  const [state, formAction, pending] = useActionState(loginMember, initialState);

  return (
    <form action={formAction} className="member-auth-form">
      <label>
        Email
        <input autoComplete="email" name="email" placeholder="name@example.com" required type="email" />
      </label>
      <label>
        密碼
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <button className="button button-gold button-block" disabled={pending} type="submit">
        {pending ? "登入中..." : "登入會員中心"}
      </button>
    </form>
  );
}
