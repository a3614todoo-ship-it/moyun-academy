"use client";

import { useActionState } from "react";
import { createEventRegistration, type EventRegistrationActionState } from "@/app/event-registration/actions";

type Props = { event: { id: string; title: string; price: number; seatsRemaining: number; waitlistEnabled: boolean }; memberDefaults?: { name: string; email: string; phone?: string | null } };

function ErrorText({ errors }: { errors?: string[] }) { return errors?.length ? <span className="field-error">{errors[0]}</span> : null; }

export function EventRegistrationForm({ event, memberDefaults }: Props) {
  const [state, action, pending] = useActionState(createEventRegistration, { message: "" } as EventRegistrationActionState);
  const isWaitlist = event.seatsRemaining <= 0;
  return <form action={action} className="application-form event-registration-form">
    <input name="eventId" type="hidden" value={event.id} />
    <div className="form-section-heading"><span>01</span><div><h2>參加人資料</h2><p>每筆報名對應一位參加者，現場將依這份資料核對。</p></div></div>
    <div className="form-two-columns">
      <label className="form-field"><span>姓名 *</span><input required autoComplete="name" name="name" defaultValue={memberDefaults?.name || ""} /><ErrorText errors={state.fieldErrors?.name} /></label>
      <label className="form-field"><span>手機 *</span><input required autoComplete="tel" inputMode="tel" name="phone" placeholder="0912345678" defaultValue={memberDefaults?.phone || ""} /><ErrorText errors={state.fieldErrors?.phone} /></label>
    </div>
    <label className="form-field"><span>Email *</span><input required autoComplete="email" name="email" type="email" defaultValue={memberDefaults?.email || ""} /><ErrorText errors={state.fieldErrors?.email} /></label>
    <div className="payment-summary"><h2>{isWaitlist ? "候補登記" : "本次報名"}</h2><dl><div><dt>活動</dt><dd>{event.title}</dd></div><div><dt>費用</dt><dd>{event.price > 0 ? `NT$ ${event.price.toLocaleString("zh-TW")}` : "免費"}</dd></div><div><dt>名額狀態</dt><dd>{isWaitlist ? event.waitlistEnabled ? "目前額滿，將列入候補" : "目前額滿" : `尚有 ${event.seatsRemaining} 名`}</dd></div></dl></div>
    <label className="terms-check"><input required name="agreedToPrivacy" type="checkbox" /><span>我已閱讀並同意活動報名個資告知：資料僅用於本次活動聯繫、付款、票券、報到與必要通知；可聯絡學堂申請查詢、更正或刪除。</span></label>
    <ErrorText errors={state.fieldErrors?.agreedToPrivacy} />
    {state.message ? <div className="form-message" role="alert">{state.message}</div> : null}
    <button className="button button-gold button-block form-submit" disabled={pending || (isWaitlist && !event.waitlistEnabled)} type="submit">{pending ? "正在送出…" : isWaitlist ? "加入候補" : event.price > 0 ? "送出報名並取得匯款資訊" : "完成免費報名"}</button>
  </form>;
}
