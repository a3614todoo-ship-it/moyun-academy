"use client";

import { useActionState } from "react";
import {
  createCoursePaymentReport,
  type CoursePaymentReportActionState,
} from "@/app/course-payment-report/actions";

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function CoursePaymentReportForm({
  defaultPurchaseNo,
}: {
  defaultPurchaseNo?: string;
}) {
  const initialState: CoursePaymentReportActionState = { message: "" };
  const [state, formAction, pending] = useActionState(
    createCoursePaymentReport,
    initialState,
  );

  return (
    <form action={formAction} className="application-form payment-report-form">
      <div className="form-section-heading">
        <span>01</span>
        <div>
          <h2>購買資料</h2>
          <p>請填寫課程購買編號與購買人資料，讓我們核對匯款。</p>
        </div>
      </div>
      <label className="form-field">
        <span>課程購買編號 *</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.purchaseNo)}
          defaultValue={defaultPurchaseNo}
          name="purchaseNo"
          placeholder="CP202606180001"
          required
        />
        <ErrorText errors={state.fieldErrors?.purchaseNo} />
      </label>
      <div className="form-two-columns">
        <label className="form-field">
          <span>購買人姓名 *</span>
          <input name="name" required />
          <ErrorText errors={state.fieldErrors?.name} />
        </label>
        <label className="form-field">
          <span>手機 *</span>
          <input inputMode="tel" name="phone" required />
          <ErrorText errors={state.fieldErrors?.phone} />
        </label>
      </div>

      <div className="form-section-heading form-section-divider">
        <span>02</span>
        <div>
          <h2>匯款資料</h2>
          <p>請填入實際匯款資訊，送出後會進入後台審核。</p>
        </div>
      </div>
      <div className="form-two-columns">
        <label className="form-field">
          <span>匯款帳號後五碼 *</span>
          <input inputMode="numeric" maxLength={5} name="bankLast5" required />
          <ErrorText errors={state.fieldErrors?.bankLast5} />
        </label>
        <label className="form-field">
          <span>匯款金額 *</span>
          <input inputMode="numeric" min="1" name="amount" required type="number" />
          <ErrorText errors={state.fieldErrors?.amount} />
        </label>
      </div>
      <div className="form-two-columns">
        <label className="form-field">
          <span>匯款日期 *</span>
          <input name="paidAt" required type="date" />
          <ErrorText errors={state.fieldErrors?.paidAt} />
        </label>
        <label className="form-field">
          <span>匯款人姓名 *</span>
          <input name="payerName" required />
          <ErrorText errors={state.fieldErrors?.payerName} />
        </label>
      </div>
      <label className="form-field">
        <span>備註</span>
        <textarea name="note" placeholder="若有特殊匯款狀況，可在此補充。" rows={4} />
        <ErrorText errors={state.fieldErrors?.note} />
      </label>

      {state.message ? (
        <div className="form-message" role="alert">{state.message}</div>
      ) : null}
      <button
        className="button button-gold button-block form-submit"
        disabled={pending}
        type="submit"
      >
        {pending ? "正在送出匯款回報..." : "送出匯款回報"}
      </button>
    </form>
  );
}
