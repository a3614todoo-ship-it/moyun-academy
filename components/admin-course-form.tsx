import Link from "next/link";
import { saveCourse } from "@/app/admin/courses/actions";
import { formatTaipeiDateTimeLocal } from "@/lib/taipei-time";

type CourseFormValue = {
  id?: string; slug?: string; title?: string; subtitle?: string | null; category?: string;
  excerpt?: string; description?: string; outline?: unknown; audiences?: unknown; lessonCount?: number;
  durationText?: string | null; courseStartAt?: Date | string | null; courseFormatText?: string | null;
  viewingPolicyText?: string | null; coverImageUrl?: string | null; previewVideoUrl?: string | null;
  accessType?: string; price?: number; publicRegistrationOpenAt?: Date | string | null;
  registrationCloseAt?: Date | string | null; isPublished?: boolean; isFeatured?: boolean; sortOrder?: number;
};

function listText(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("\n") : "";
}

export function AdminCourseForm({ course }: { course?: CourseFormValue }) {
  return (
    <form action={saveCourse} className="admin-course-form">
      {course?.id ? <input name="id" type="hidden" value={course.id} /> : null}
      <section className="admin-course-info-box">
        <div className="form-section-heading"><span>BASE</span><div><h2>課程基本資料</h2><p>課堂內容、直播與回看改由逐堂管理，儲存這裡不會重建既有課堂。</p></div></div>
        <div className="admin-course-grid">
          <label>課程名稱<input required defaultValue={course?.title || ""} name="title" /></label>
          <label>網址代稱<input required defaultValue={course?.slug || ""} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
          <label>課程分類<input required defaultValue={course?.category || ""} name="category" /></label>
          <label>副標題<input defaultValue={course?.subtitle || ""} name="subtitle" /></label>
          <label>單元數<input defaultValue={course?.lessonCount ?? 0} min="0" name="lessonCount" type="number" /></label>
          <label>排序<input defaultValue={course?.sortOrder ?? 0} name="sortOrder" type="number" /></label>
          <label>開課時間<input defaultValue={formatTaipeiDateTimeLocal(course?.courseStartAt)} name="courseStartAt" type="datetime-local" /></label>
          <label>課程時長<input defaultValue={course?.durationText || ""} name="durationText" placeholder="例如：20 小時" /></label>
          <label>上課方式<input defaultValue={course?.courseFormatText || ""} name="courseFormatText" /></label>
          <label>觀看權限<input defaultValue={course?.viewingPolicyText || ""} name="viewingPolicyText" /></label>
          <label>一般訪客報名開放<input defaultValue={formatTaipeiDateTimeLocal(course?.publicRegistrationOpenAt)} name="publicRegistrationOpenAt" type="datetime-local" /><small>有效會員會提前 7 天開放。</small></label>
          <label>報名截止<input defaultValue={formatTaipeiDateTimeLocal(course?.registrationCloseAt)} name="registrationCloseAt" type="datetime-local" /></label>
          <label>課程權限<select defaultValue={course?.accessType || "MEMBER_INCLUDED"} name="accessType"><option value="MEMBER_INCLUDED">有效會員專屬</option><option value="PAID">另外付費</option><option value="PUBLIC_FREE">公開免費</option></select></label>
          <label>價格<input defaultValue={course?.price ?? 0} min="0" name="price" type="number" /><small>會員課可填 0；付費課必須大於 0，之後仍可調整。</small></label>
          <label className="admin-course-span-2">封面圖片網址<input defaultValue={course?.coverImageUrl || ""} name="coverImageUrl" type="url" /></label>
          <label className="admin-course-span-2">YouTube 試看片網址<input defaultValue={course?.previewVideoUrl || ""} name="previewVideoUrl" type="url" /></label>
          <label className="admin-course-span-2">課程摘要<textarea required defaultValue={course?.excerpt || ""} name="excerpt" rows={3} /></label>
          <label className="admin-course-span-2">完整介紹<textarea required defaultValue={course?.description || ""} name="description" rows={7} /></label>
          <label>課程大綱（每行一項）<textarea defaultValue={listText(course?.outline)} name="outline" rows={7} /></label>
          <label>適合對象（每行一項）<textarea defaultValue={listText(course?.audiences)} name="audiences" rows={7} /></label>
        </div>
        <div className="admin-checkbox-row"><label><input defaultChecked={course?.isPublished} name="isPublished" type="checkbox" />前台上架</label><label><input defaultChecked={course?.isFeatured} name="isFeatured" type="checkbox" />首頁精選</label></div>
      </section>
      {course?.id ? <section className="admin-course-info-box"><div className="form-section-heading"><span>LESSONS</span><div><h2>逐堂內容與直播</h2><p>新增、排序每堂課，設定 FB／Vimeo 直播、回看期限、教材與問答。</p></div></div><Link className="admin-primary-link" href={`/admin/courses/${course.id}/lessons`}>管理課堂內容</Link></section> : <p className="admin-course-help">先建立課程，再進入逐堂內容管理。</p>}
      <div className="admin-course-submit"><button type="submit">儲存課程</button></div>
    </form>
  );
}
