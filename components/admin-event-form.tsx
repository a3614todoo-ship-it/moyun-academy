import { saveEvent } from "@/app/admin/events/actions";
import { formatTaipeiDateTimeLocal } from "@/lib/taipei-time";

type Value = {
  id?: string; slug?: string; title?: string; subtitle?: string | null; category?: string;
  excerpt?: string; description?: string; coverImageUrl?: string | null; venueName?: string;
  venueAddress?: string; mapUrl?: string | null; startsAt?: Date | string; endsAt?: Date | string;
  registrationOpenAt?: Date | string; publicRegistrationOpenAt?: Date | string | null;
  registrationCloseAt?: Date | string; capacity?: number; waitlistEnabled?: boolean;
  waitlistPaymentHours?: number; pricingMode?: string; publicPrice?: number; memberPrice?: number;
  audience?: string; status?: string; isFeatured?: boolean; sortOrder?: number;
};

export function AdminEventForm({ event }: { event?: Value }) {
  const cancelled = event?.status === "CANCELLED";
  return (
    <form action={saveEvent} className="admin-course-form">
      {event?.id ? <input name="id" type="hidden" value={event.id} /> : null}
      <section className="admin-course-info-box">
        <div className="form-section-heading"><span>EVENT</span><div><h2>實體活動資料</h2><p>活動上架、名額、會員規則與收費都在此設定。</p></div></div>
        <div className="admin-course-grid">
          <label>活動名稱<input required name="title" defaultValue={event?.title || ""} /></label>
          <label>網址代稱<input required name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={event?.slug || ""} /></label>
          <label>分類<input required name="category" defaultValue={event?.category || "學員聚會"} /></label>
          <label>副標題<input name="subtitle" defaultValue={event?.subtitle || ""} /></label>
          <label>開始時間<input required name="startsAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(event?.startsAt)} /></label>
          <label>結束時間<input required name="endsAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(event?.endsAt)} /></label>
          <label>場地名稱<input required name="venueName" defaultValue={event?.venueName || ""} /></label>
          <label>場地地址<input required name="venueAddress" defaultValue={event?.venueAddress || ""} /></label>
          <label className="admin-course-span-2">地圖網址<input name="mapUrl" type="url" defaultValue={event?.mapUrl || ""} /></label>
          <label>會員報名開放<input required name="registrationOpenAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(event?.registrationOpenAt)} /></label>
          <label>一般訪客開放<input name="publicRegistrationOpenAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(event?.publicRegistrationOpenAt)} /><small>會員優先活動才需要；建議晚 7 天。</small></label>
          <label>報名截止<input required name="registrationCloseAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(event?.registrationCloseAt)} /></label>
          <label>名額上限<input required min="1" name="capacity" type="number" defaultValue={event?.capacity ?? 20} /></label>
          <label>報名對象<select name="audience" defaultValue={event?.audience || "PUBLIC"}><option value="PUBLIC">公開報名</option><option value="MEMBERS_ONLY">僅限有效會員</option><option value="MEMBER_PRIORITY">會員優先、之後公開</option></select></label>
          <label>收費方式<select name="pricingMode" defaultValue={event?.pricingMode || "FREE"}><option value="FREE">全員免費</option><option value="PAID">全員付費</option><option value="MEMBER_FREE_PUBLIC_PAID">會員免費、一般訪客付費</option></select></label>
          <label>一般訪客費用<input min="0" name="publicPrice" type="number" defaultValue={event?.publicPrice ?? 0} /></label>
          <label>會員費用<input min="0" name="memberPrice" type="number" defaultValue={event?.memberPrice ?? 0} /><small>會員免費模式請填 0。</small></label>
          <label>候補付款期限（小時）<input min="1" max="720" name="waitlistPaymentHours" type="number" defaultValue={event?.waitlistPaymentHours ?? 48} /></label>
          <label>排序<input name="sortOrder" type="number" defaultValue={event?.sortOrder ?? 0} /></label>
          <label className="admin-course-span-2">封面圖片網址<input name="coverImageUrl" type="url" defaultValue={event?.coverImageUrl || ""} /></label>
          <label className="admin-course-span-2">活動摘要<textarea required name="excerpt" rows={3} defaultValue={event?.excerpt || ""} /></label>
          <label className="admin-course-span-2">完整介紹與注意事項<textarea required name="description" rows={8} defaultValue={event?.description || ""} /></label>
        </div>
        <div className="admin-checkbox-row">
          <label><input name="waitlistEnabled" type="checkbox" defaultChecked={event?.waitlistEnabled ?? true} />額滿開放候補</label>
          <label><input name="isPublished" type="checkbox" disabled={cancelled} defaultChecked={event?.status === "PUBLISHED"} />前台上架</label>
          <label><input name="isFeatured" type="checkbox" defaultChecked={event?.isFeatured} />精選活動</label>
        </div>
        {cancelled ? <p className="admin-notice error">活動已取消，不能重新上架；如需重辦請建立新活動。</p> : null}
      </section>
      <div className="admin-course-submit"><button type="submit">儲存活動</button></div>
    </form>
  );
}
