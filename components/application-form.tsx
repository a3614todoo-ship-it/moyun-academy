"use client";

import { useActionState } from "react";
import {
  createApplication,
  type ApplicationActionState,
} from "@/app/apply/actions";

type Props = {
  plan: {
    code: string;
    name: string;
    price: number;
    durationDays: number;
  };
};

function FieldError({
  errors,
}: {
  errors?: string[];
}) {
  if (!errors?.length) return null;
  return <span className="field-error">{errors[0]}</span>;
}

export function ApplicationForm({ plan }: Props) {
  const initialApplicationState: ApplicationActionState = { message: "" };
  const [state, formAction, pending] = useActionState(
    createApplication,
    initialApplicationState,
  );

  return (
    <form action={formAction} className="application-form">
      <input name="planCode" type="hidden" value={plan.code} />

      <div className="form-section-heading">
        <span>01</span>
        <div>
          <h2>基本資料</h2>
          <p>請填寫可供工作人員核對與聯絡的真實資料。</p>
        </div>
      </div>

      <div className="form-two-columns">
        <label className="form-field">
          <span>姓名 *</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.name)}
            autoComplete="name"
            name="name"
            placeholder="請輸入真實姓名"
            required
          />
          <FieldError errors={state.fieldErrors?.name} />
        </label>
        <label className="form-field">
          <span>手機 *</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            autoComplete="tel"
            inputMode="tel"
            name="phone"
            placeholder="0912345678"
            required
          />
          <FieldError errors={state.fieldErrors?.phone} />
        </label>
      </div>

      <label className="form-field">
        <span>Email *</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </label>

      <label className="form-field">
        <span>通訊地址 *</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.address)}
          autoComplete="street-address"
          name="address"
          placeholder="請輸入郵遞區號與完整地址"
          required
        />
        <FieldError errors={state.fieldErrors?.address} />
      </label>

      <div className="form-section-heading form-section-divider">
        <span>02</span>
        <div>
          <h2>Facebook 資料</h2>
          <p>審核加入私密社團時，工作人員將使用以下資料辨識身分。</p>
        </div>
      </div>

      <div className="form-two-columns">
        <label className="form-field">
          <span>Facebook 帳號名稱 *</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.facebookName)}
            name="facebookName"
            placeholder="例如：林小文"
            required
          />
          <FieldError errors={state.fieldErrors?.facebookName} />
        </label>
        <label className="form-field">
          <span>Facebook 個人頁連結 *</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.facebookProfileUrl)}
            inputMode="url"
            name="facebookProfileUrl"
            placeholder="https://www.facebook.com/..."
            required
            type="url"
          />
          <FieldError errors={state.fieldErrors?.facebookProfileUrl} />
        </label>
      </div>

      <label className="terms-check">
        <input name="agreedToTerms" required type="checkbox" />
        <span>
          我已閱讀並同意會員規範、個人資料使用說明，以及人工匯款審核流程。
        </span>
      </label>
      <FieldError errors={state.fieldErrors?.agreedToTerms} />

      {state.message ? (
        <div className="form-message" role="alert">
          {state.message}
        </div>
      ) : null}

      <button
        className="button button-gold button-block form-submit"
        disabled={pending}
        type="submit"
      >
        {pending ? "正在建立報名資料…" : `確認報名並取得匯款資訊`}
      </button>
      <small className="form-footnote">
        送出後會建立待付款紀錄；本站不會在此頁要求信用卡資訊。
      </small>
    </form>
  );
}
