import { deleteLesson, saveLesson } from "@/app/admin/courses/[id]/lessons/actions";
import { formatTaipeiDateTimeLocal } from "@/lib/taipei-time";
import { AdminHandoutUploader } from "@/components/admin-handout-uploader";

type LessonValue = {
  id: string; title: string; summary: string | null; startsAt: Date | null; durationText: string | null;
  originalText: string | null; translation: string | null; annotation: string | null; teacherNote: string | null;
  reflectionPrompt: string | null; replayVideoUrl: string | null; replayAudioUrl: string | null;
  replayEnabled: boolean; replayOpenAt: Date | null; replayCloseAt: Date | null; replayProductionStatus: string;
  sortOrder: number; isPublished: boolean; handoutFileName: string | null; handoutSizeBytes: number | null;
  handoutStoragePath: string | null;
  liveSession: null | { title: string; platform: string; isEnabled: boolean; startsAt: Date | null; endsAt: Date | null; playerOpenAt: Date | null; playerCloseAt: Date | null; externalUrl: string | null; enableQuestions: boolean; showWatermark: boolean };
};

export function AdminLessonForm({ course, lesson, nextSortOrder }: { course: { id: string; title: string; accessType: string }; lesson?: LessonValue | null; nextSortOrder: number }) {
  const requiredPlatform = course.accessType === "MEMBER_INCLUDED" ? "FACEBOOK_GROUP" : "VIMEO_LIVE";
  const live = lesson?.liveSession;
  return (
    <div className="admin-lesson-editor">
      <form action={saveLesson} className="admin-course-form">
        <input name="courseId" type="hidden" value={course.id} />{lesson ? <input name="lessonId" type="hidden" value={lesson.id} /> : null}
        <section className="admin-course-info-box">
          <div className="form-section-heading"><span>LESSON</span><div><h2>課堂內容</h2><p>每堂課可獨立發布、安排直播、回看期限與教材。</p></div></div>
          <div className="admin-course-grid">
            <label>課堂名稱<input required name="title" defaultValue={lesson?.title || ""} /></label>
            <label>排序<input required name="sortOrder" type="number" defaultValue={lesson?.sortOrder ?? nextSortOrder} /></label>
            <label>上課時間<input name="startsAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(lesson?.startsAt)} /></label>
            <label>時長<input name="durationText" defaultValue={lesson?.durationText || ""} placeholder="例如：2 小時" /></label>
            <label className="admin-course-span-2">課堂摘要<textarea name="summary" rows={3} defaultValue={lesson?.summary || ""} /></label>
            <label>原文<textarea name="originalText" rows={8} defaultValue={lesson?.originalText || ""} /></label>
            <label>翻譯<textarea name="translation" rows={8} defaultValue={lesson?.translation || ""} /></label>
            <label>註解<textarea name="annotation" rows={7} defaultValue={lesson?.annotation || ""} /></label>
            <label>老師筆記<textarea name="teacherNote" rows={7} defaultValue={lesson?.teacherNote || ""} /></label>
            <label className="admin-course-span-2">課後思考<textarea name="reflectionPrompt" rows={4} defaultValue={lesson?.reflectionPrompt || ""} /></label>
          </div>
          <div className="admin-checkbox-row"><label><input name="isPublished" type="checkbox" defaultChecked={lesson?.isPublished ?? true} />發布這堂課</label></div>
        </section>
        <section className="admin-course-info-box">
          <div className="form-section-heading"><span>LIVE</span><div><h2>直播設定</h2><p>{requiredPlatform === "FACEBOOK_GROUP" ? "會員課程在 FB 私密社團直播，網站顯示前往社團按鈕。" : "付費課程使用 Vimeo Live，通過購買驗證後直接嵌入網站。"}</p></div></div>
          <div className="admin-course-grid">
            <label>直播標題<input name="liveTitle" defaultValue={live?.title || lesson?.title || ""} /></label>
            <label>平台<select name="platform" defaultValue={live?.platform || requiredPlatform}><option value="FACEBOOK_GROUP">Facebook 私密社團</option><option value="VIMEO_LIVE">Vimeo Live</option>{course.accessType === "PUBLIC_FREE" ? <><option value="YOUTUBE_LIVE">YouTube Live</option><option value="EXTERNAL_URL">其他外部平台</option></> : null}</select></label>
            <label>直播開始<input name="liveStartsAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(live?.startsAt)} /></label>
            <label>直播結束<input name="liveEndsAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(live?.endsAt)} /></label>
            <label>網站開放<input name="playerOpenAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(live?.playerOpenAt)} /></label>
            <label>網站關閉<input name="playerCloseAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(live?.playerCloseAt)} /></label>
            <label className="admin-course-span-2">直播／社團連結<input name="externalUrl" type="url" defaultValue={live?.externalUrl || ""} placeholder={requiredPlatform === "VIMEO_LIVE" ? "https://vimeo.com/event/..." : "https://www.facebook.com/groups/..."} /></label>
          </div>
          <div className="admin-checkbox-row"><label><input name="liveEnabled" type="checkbox" defaultChecked={live?.isEnabled} />啟用直播入口</label><label><input name="enableQuestions" type="checkbox" defaultChecked={live?.enableQuestions ?? true} />啟用網站問答</label><label><input name="showWatermark" type="checkbox" defaultChecked={live?.showWatermark ?? true} />播放器顯示購買者浮水印</label></div>
        </section>
        <section className="admin-course-info-box">
          <div className="form-section-heading"><span>REPLAY</span><div><h2>回看設定</h2><p>直播結束後更新製作狀態；「已就緒」且在開放期限內才可觀看。</p></div></div>
          <div className="admin-course-grid">
            <label>製作狀態<select name="replayProductionStatus" defaultValue={lesson?.replayProductionStatus || "SCHEDULED"}><option value="SCHEDULED">尚未直播</option><option value="PROCESSING">整理中</option><option value="READY">已就緒</option></select></label>
            <label>回看影片（Vimeo）<input name="replayVideoUrl" type="url" defaultValue={lesson?.replayVideoUrl || ""} /></label>
            <label>回看開放<input name="replayOpenAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(lesson?.replayOpenAt)} /></label>
            <label>回看截止<input name="replayCloseAt" type="datetime-local" defaultValue={formatTaipeiDateTimeLocal(lesson?.replayCloseAt)} /></label>
            <label className="admin-course-span-2">聲音回看網址<input name="replayAudioUrl" type="url" defaultValue={lesson?.replayAudioUrl || ""} /></label>
          </div>
          <div className="admin-checkbox-row"><label><input name="replayEnabled" type="checkbox" defaultChecked={lesson?.replayEnabled} />開放網站回看</label></div>
        </section>
        <div className="admin-course-submit"><button type="submit">儲存課堂</button></div>
      </form>
      {lesson ? <AdminHandoutUploader courseId={course.id} lessonId={lesson.id} fileName={lesson.handoutFileName} fileSize={lesson.handoutSizeBytes} hasFile={Boolean(lesson.handoutStoragePath)} /> : <section className="admin-course-info-box"><h2>課堂教材</h2><p>請先儲存課堂，再上傳 PDF 教材。</p></section>}
      {lesson ? <section className="admin-danger-zone"><h2>刪除課堂</h2><p>有問答紀錄或已上傳教材時，系統會阻止刪除。請輸入完整課堂名稱確認。</p><form action={deleteLesson}><input name="courseId" type="hidden" value={course.id} /><input name="lessonId" type="hidden" value={lesson.id} /><input name="confirmTitle" placeholder={lesson.title} /><button type="submit">刪除課堂</button></form></section> : null}
    </div>
  );
}
