"use client";

import { useActionState } from "react";
import { createEventPaymentReport, type EventPaymentReportActionState } from "@/app/event-payment-report/actions";

function ErrorText({ errors }: { errors?: string[] }) { return errors?.length ? <span className="field-error">{errors[0]}</span> : null; }

export function EventPaymentReportForm({ defaultRegistrationNo }: { defaultRegistrationNo?: string }) {
  const [state, action, pending] = useActionState(createEventPaymentReport, { message: "" } as EventPaymentReportActionState);
  return <form action={action} className="application-form payment-report-form">
    <div className="form-section-heading"><span>01</span><div><h2>活動報名資料</h2><p>請填寫報名編號與參加人資料。</p></div></div>
    <label className="form-field"><span>活動報名編號 *</span><input required name="registrationNo" defaultValue={defaultRegistrationNo} placeholder="EV20260821000001" /><ErrorText errors={state.fieldErrors?.registrationNo} /></label>
    <div className="form-two-columns"><label className="form-field"><span>參加人姓名 *</span><input required name="name" /><ErrorText errors={state.fieldErrors?.name} /></label><label className="form-field"><span>手機 *</span><input required inputMode="tel" name="phone" /><ErrorText errors={state.fieldErrors?.phone} /></label></div>
    <div className="form-section-heading form-section-divider"><span>02</span><div><h2>匯款資料</h2><p>資料送出後會交由管理員核對。</p></div></div>
    <div className="form-two-columns"><label className="form-field"><span>帳號後五碼 *</span><input required inputMode="numeric" maxLength={5} name="bankLast5" /><ErrorText errors={state.fieldErrors?.bankLast5} /></label><label className="form-field"><span>匯款金額 *</span><input required min="1" type="number" name="amount" /><ErrorText errors={state.fieldErrors?.amount} /></label></div>
    <div className="form-two-columns"><label className="form-field"><span>匯款日期 *</span><input required type="date" name="paidAt" /><ErrorText errors={state.fieldErrors?.paidAt} /></label><label className="form-field"><span>匯款人姓名 *</span><input required name="payerName" /><ErrorText errors={state.fieldErrors?.payerName} /></label></div>
    <label className="form-field"><span>備註</span><textarea name="note" rows={4} /></label>
    {state.message ? <div className="form-message" role="alert">{state.message}</div> : null}
    <button className="button button-gold button-block form-submit" disabled={pending} type="submit">{pending ? "正在送出…" : "送出活動匯款回報"}</button>
  </form>;
}
