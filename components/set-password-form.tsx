"use client";

import { useActionState } from "react";
import { setMemberPassword, type SetPasswordState } from "@/app/set-password/actions";

export function SetPasswordForm({ token }: { token: string }) {
  const initialState: SetPasswordState = { message: "" };
  const [state, formAction, pending] = useActionState(setMemberPassword, initialState);

  return (
    <form action={formAction} className="member-auth-form">
      <input name="token" type="hidden" value={token} />
      <label>
        設定密碼
        <input autoComplete="new-password" minLength={12} name="password" required type="password" />
      </label>
      <label>
        再輸入一次密碼
        <input autoComplete="new-password" minLength={12} name="confirmPassword" required type="password" />
      </label>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <button className="button button-gold button-block" disabled={pending} type="submit">
        {pending ? "設定中..." : "設定密碼並登入"}
      </button>
      <small>密碼至少 12 個字元。完成後即可登入會員中心。</small>
    </form>
  );
}
