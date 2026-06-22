"use client";

import { useActionState } from "react";
import {
  createCoursePurchase,
  type CoursePurchaseActionState,
} from "@/app/course-purchase/actions";

type Props = {
  course: {
    id: string;
    title: string;
    price: number;
  };
};

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function CoursePurchaseForm({ course }: Props) {
  const initialState: CoursePurchaseActionState = { message: "" };
  const [state, formAction, pending] = useActionState(
    createCoursePurchase,
    initialState,
  );

  return (
    <form action={formAction} className="application-form">
      <input name="courseId" type="hidden" value={course.id} />

      <div className="form-section-heading">
        <span>01</span>
        <div>
          <h2>購買人資料</h2>
          <p>請填寫用來核對匯款與寄送觀看連結的資料。</p>
        </div>
      </div>

      <div className="form-two-columns">
        <label className="form-field">
          <span>姓名 *</span>
          <input
            aria-invalid={Boolean(state.fieldErrors?.name)}
            autoComplete="name"
            name="name"
            placeholder="請填寫真實姓名"
            required
          />
          <ErrorText errors={state.fieldErrors?.name} />
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
          <ErrorText errors={state.fieldErrors?.phone} />
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
        <ErrorText errors={state.fieldErrors?.email} />
      </label>

      <div className="payment-summary">
        <h2>購買課程</h2>
        <dl>
          <div><dt>課程名稱</dt><dd>{course.title}</dd></div>
          <div><dt>課程售價</dt><dd>NT$ {course.price.toLocaleString("zh-TW")}</dd></div>
        </dl>
      </div>

      <label className="terms-check">
        <input name="agreedToTerms" required type="checkbox" />
        <span>
          我了解送出後需依照頁面提供的銀行資訊匯款，並回填匯款資料，待管理員審核通過後才會開放正式課程影片。
        </span>
      </label>
      <ErrorText errors={state.fieldErrors?.agreedToTerms} />

      {state.message ? (
        <div className="form-message" role="alert">{state.message}</div>
      ) : null}

      <button
        className="button button-gold button-block form-submit"
        disabled={pending}
        type="submit"
      >
        {pending ? "正在建立購買申請..." : "送出購買申請"}
      </button>
    </form>
  );
}
