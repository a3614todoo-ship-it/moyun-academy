"use client";

import { useActionState } from "react";
import {
  createPaymentReport,
  type PaymentReportActionState,
} from "@/app/payment-report/actions";

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <span className="field-error">{errors[0]}</span> : null;
}

export function PaymentReportForm({
  defaultApplicationNo,
}: {
  defaultApplicationNo?: string;
}) {
  const initialState: PaymentReportActionState = { message: "" };
  const [state, formAction, pending] = useActionState(createPaymentReport, initialState);

  return (
    <form action={formAction} className="application-form payment-report-form">
      <div className="form-section-heading">
        <span>01</span>
        <div>
          <h2>核對報名資料</h2>
          <p>以下三項資料必須與報名時填寫的內容一致。</p>
        </div>
      </div>
      <label className="form-field">
        <span>報名編號 *</span>
        <input
          aria-invalid={Boolean(state.fieldErrors?.applicationNo)}
          defaultValue={defaultApplicationNo}
          name="applicationNo"
          placeholder="CL202606150001"
          required
        />
        <ErrorText errors={state.fieldErrors?.applicationNo} />
      </label>
      <div className="form-two-columns">
        <label className="form-field">
          <span>報名姓名 *</span>
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
          <p>請依銀行交易紀錄如實填寫，工作人員將人工對帳。</p>
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
        <textarea name="note" placeholder="如有特殊情況，可在此補充說明。" rows={4} />
        <ErrorText errors={state.fieldErrors?.note} />
      </label>

      <div className="upload-note">
        匯款截圖上傳將在雲端檔案儲存功能完成後開放，目前不影響回報與人工對帳。
      </div>
      {state.message ? <div className="form-message" role="alert">{state.message}</div> : null}
      <button className="button button-gold button-block form-submit" disabled={pending} type="submit">
        {pending ? "正在送出匯款回報…" : "送出匯款回報"}
      </button>
    </form>
  );
}
