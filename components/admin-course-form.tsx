import { saveCourse } from "@/app/admin/courses/actions";
import { formatTaipeiDateTimeLocal } from "@/lib/taipei-time";

type LiveSessionValue = {
  title?: string;
  platform?: string;
  isEnabled?: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  playerOpenAt?: Date | string | null;
  playerCloseAt?: Date | string | null;
  youtubeVideoId?: string | null;
  youtubeChatEmbedUrl?: string | null;
  enableYoutubeChat?: boolean;
  enableQuestions?: boolean;
  showWatermark?: boolean;
  externalUrl?: string | null;
};

type CourseLessonValue = {
  title?: string;
  summary?: string | null;
  startsAt?: Date | string | null;
  durationText?: string | null;
  originalText?: string | null;
  translation?: string | null;
  annotation?: string | null;
  teacherNote?: string | null;
  reflectionPrompt?: string | null;
  handoutUrl?: string | null;
  replayVideoUrl?: string | null;
  isPublished?: boolean;
};

type CourseFormValue = {
  id?: string;
  slug?: string;
  title?: string;
  subtitle?: string | null;
  category?: string;
  excerpt?: string;
  description?: string;
  outline?: unknown;
  audiences?: unknown;
  lessonCount?: number;
  durationText?: string | null;
  courseStartAt?: Date | string | null;
  courseFormatText?: string | null;
  viewingPolicyText?: string | null;
  coverImageUrl?: string | null;
  previewVideoUrl?: string | null;
  fullVideoUrl?: string | null;
  accessType?: string;
  price?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  liveSession?: LiveSessionValue | null;
  lessonUnits?: CourseLessonValue[];
};

function listText(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("\n")
    : "";
}

export function AdminCourseForm({ course }: { course?: CourseFormValue }) {
  const accessType = course?.accessType || "MEMBER_INCLUDED";
  const live = course?.liveSession;
  const lessons = Array.from({ length: 4 }, (_, index) => course?.lessonUnits?.[index] || null);

  return (
    <form action={saveCourse} className="admin-course-form">
      {course?.id ? <input name="id" type="hidden" value={course.id} /> : null}

      <section className="admin-course-info-box">
        <div className="form-section-heading">
          <span>BASE</span>
          <div>
            <h2>課程基本資料</h2>
            <p>設定前台課程頁會看到的標題、分類、介紹與權限。</p>
          </div>
        </div>

        <div className="admin-course-grid">
          <label>
            課程名稱
            <input defaultValue={course?.title || ""} name="title" required />
          </label>
          <label>
            課程網址代稱
            <input
              defaultValue={course?.slug || ""}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="tang-poetry-intro"
              required
            />
          </label>
          <label>
            課程分類
            <input defaultValue={course?.category || ""} list="course-category-options" name="category" required />
            <datalist id="course-category-options">
              <option value="古典文學" />
              <option value="唐詩人生" />
              <option value="親子共讀" />
              <option value="寫作表達" />
            </datalist>
          </label>
          <label>
            副標題
            <input defaultValue={course?.subtitle || ""} name="subtitle" />
          </label>
          <label>
            單元數
            <input defaultValue={course?.lessonCount ?? 0} min="0" name="lessonCount" required type="number" />
          </label>
          <label>
            排序
            <input defaultValue={course?.sortOrder ?? 0} name="sortOrder" required type="number" />
          </label>
          <label>
            開課時間
            <input defaultValue={formatTaipeiDateTimeLocal(course?.courseStartAt)} name="courseStartAt" type="datetime-local" />
            <small>顯示在前台課程資訊卡；若每堂課時間不同，請在下方單元資料填寫。</small>
          </label>
          <label>
            課程時長
            <input defaultValue={course?.durationText || ""} name="durationText" placeholder="例如：20 小時" />
          </label>
          <label>
            上課方式
            <input
              defaultValue={course?.courseFormatText || ""}
              name="courseFormatText"
              placeholder="例如：直播，提供錄影後字幕，可提供完課證明"
            />
          </label>
          <label>
            觀看權限
            <input
              defaultValue={course?.viewingPolicyText || ""}
              name="viewingPolicyText"
              placeholder="例如：直播後提供錄影，無期限、無限次觀看"
            />
          </label>
        </div>
      </section>

      <label>
        課程短介
        <textarea defaultValue={course?.excerpt || ""} name="excerpt" required rows={3} />
      </label>
      <label>
        課程介紹
        <textarea defaultValue={course?.description || ""} name="description" required rows={7} />
      </label>
      <div className="admin-course-grid">
        <label>
          課程大綱（一行一項）
          <textarea defaultValue={listText(course?.outline)} name="outline" rows={7} />
        </label>
        <label>
          適合對象（一行一項）
          <textarea defaultValue={listText(course?.audiences)} name="audiences" rows={7} />
        </label>
      </div>

      <section className="admin-course-info-box">
        <div className="form-section-heading">
          <span>LESSON</span>
          <div>
            <h2>課程單元、文本與講義</h2>
            <p>先提供最多 4 個單元的 MVP 管理。每個單元可設定文本共讀、提問卡、講義與回放連結。</p>
          </div>
        </div>

        <div className="admin-lesson-editor">
          {lessons.map((lesson, index) => {
            const prefix = `lesson${index}`;
            return (
              <section className="admin-lesson-card" key={prefix}>
                <div className="admin-lesson-card-heading">
                  <h3>單元 {index + 1}</h3>
                  <label>
                    <input defaultChecked={lesson?.isPublished ?? true} name={`${prefix}IsPublished`} type="checkbox" />
                    顯示此單元
                  </label>
                </div>
                <div className="admin-course-grid">
                  <label>
                    單元標題
                    <input defaultValue={lesson?.title || ""} name={`${prefix}Title`} placeholder="例如：唐詩與人生的第一道光" />
                  </label>
                  <label>
                    單元時間
                    <input defaultValue={formatTaipeiDateTimeLocal(lesson?.startsAt)} name={`${prefix}StartsAt`} type="datetime-local" />
                  </label>
                  <label>
                    單元時長
                    <input defaultValue={lesson?.durationText || ""} name={`${prefix}DurationText`} placeholder="例如：2 小時 30 分" />
                  </label>
                  <label>
                    講義下載網址
                    <input defaultValue={lesson?.handoutUrl || ""} name={`${prefix}HandoutUrl`} placeholder="https://..." type="url" />
                  </label>
                </div>
                <label>
                  單元摘要
                  <textarea defaultValue={lesson?.summary || ""} name={`${prefix}Summary`} rows={2} />
                </label>
                <div className="admin-course-grid">
                  <label>
                    原文
                    <textarea defaultValue={lesson?.originalText || ""} name={`${prefix}OriginalText`} rows={5} />
                  </label>
                  <label>
                    白話翻譯
                    <textarea defaultValue={lesson?.translation || ""} name={`${prefix}Translation`} rows={5} />
                  </label>
                  <label>
                    字詞註解
                    <textarea defaultValue={lesson?.annotation || ""} name={`${prefix}Annotation`} rows={5} />
                  </label>
                  <label>
                    老師導讀
                    <textarea defaultValue={lesson?.teacherNote || ""} name={`${prefix}TeacherNote`} rows={5} />
                  </label>
                </div>
                <label>
                  文學提問卡
                  <textarea
                    defaultValue={lesson?.reflectionPrompt || ""}
                    name={`${prefix}ReflectionPrompt`}
                    placeholder="例如：這首詩讓你想起人生中哪一次告別？"
                    rows={3}
                  />
                </label>
                <label>
                  回放影片網址
                  <input defaultValue={lesson?.replayVideoUrl || ""} name={`${prefix}ReplayVideoUrl`} placeholder="YouTube / Vimeo 回放網址" type="url" />
                </label>
              </section>
            );
          })}
        </div>
      </section>

      <section className="admin-course-info-box">
        <div className="form-section-heading">
          <span>ACCESS</span>
          <div>
            <h2>權限與影片</h2>
            <p>設定免費、會員免費或付費課程，以及試看片與完整影片網址。</p>
          </div>
        </div>
        <label>
          試看片網址（YouTube）
          <input
            defaultValue={course?.previewVideoUrl || ""}
            name="previewVideoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
          />
        </label>

        <div className="admin-course-grid">
          <label>
            課程權限
            <select defaultValue={accessType} name="accessType">
              <option value="PUBLIC_FREE">免費課程</option>
              <option value="MEMBER_INCLUDED">會員免費</option>
              <option value="PAID">付費課程</option>
            </select>
          </label>
          <label>
            課程價格
            <input defaultValue={course?.price ?? 0} min="0" name="price" required type="number" />
            <small>免費與會員免費課程可填 0；付費課程需大於 0。</small>
          </label>
        </div>

        <label>
          完整課程影片網址
          <input
            defaultValue={course?.fullVideoUrl || ""}
            name="fullVideoUrl"
            placeholder="YouTube 或 Vimeo 影片網址"
            type="url"
          />
          <small>若是直播系列，回放也可以填在上方各單元的回放影片網址。</small>
        </label>
      </section>

      <section className="admin-course-live-box">
        <div className="form-section-heading">
          <span>LIVE</span>
          <div>
            <h2>直播設定</h2>
            <p>用於付費直播課。學員完成購買審核後，才能進入直播教室與提問區。</p>
          </div>
        </div>

        <div className="admin-course-checks">
          <label>
            <input defaultChecked={live?.isEnabled} name="liveIsEnabled" type="checkbox" />
            啟用直播教室
          </label>
          <label>
            <input defaultChecked={live?.enableQuestions ?? true} name="liveEnableQuestions" type="checkbox" />
            啟用站內 Q&A
          </label>
          <label>
            <input defaultChecked={live?.enableYoutubeChat} name="liveEnableYoutubeChat" type="checkbox" />
            顯示 YouTube Chat
          </label>
          <label>
            <input defaultChecked={live?.showWatermark ?? true} name="liveShowWatermark" type="checkbox" />
            顯示購買者浮水印
          </label>
        </div>

        <div className="admin-course-grid">
          <label>
            直播標題
            <input defaultValue={live?.title || ""} name="liveTitle" placeholder="例如：唐詩與人生直播課" />
          </label>
          <label>
            直播平台
            <select defaultValue={live?.platform || "YOUTUBE_LIVE"} name="livePlatform">
              <option value="YOUTUBE_LIVE">YouTube Live</option>
              <option value="VIMEO_LIVE">Vimeo Live</option>
              <option value="GOOGLE_MEET">Google Meet</option>
              <option value="ZOOM_WEBINAR">Zoom Webinar</option>
              <option value="ZOOM_MEETING">Zoom Meeting</option>
              <option value="EXTERNAL_URL">外部直播連結</option>
            </select>
          </label>
          <label>
            YouTube Live Video ID
            <input defaultValue={live?.youtubeVideoId || ""} name="liveYoutubeVideoId" placeholder="只填 Video ID，不要貼完整 iframe" />
          </label>
          <label>
            YouTube Chat Embed URL
            <input
              defaultValue={live?.youtubeChatEmbedUrl || ""}
              name="liveYoutubeChatEmbedUrl"
              placeholder="https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=..."
              type="url"
            />
          </label>
        </div>

        <label>
          Vimeo / Google Meet / Zoom / 外部直播連結
          <input
            defaultValue={live?.externalUrl || ""}
            name="liveExternalUrl"
            placeholder="Vimeo event、Google Meet、Zoom 會議連結，或其他直播平台網址"
            type="url"
          />
        </label>

        <div className="admin-course-grid">
          <label>
            直播開始時間
            <input defaultValue={formatTaipeiDateTimeLocal(live?.startsAt)} name="liveStartsAt" type="datetime-local" />
          </label>
          <label>
            直播結束時間
            <input defaultValue={formatTaipeiDateTimeLocal(live?.endsAt)} name="liveEndsAt" type="datetime-local" />
          </label>
          <label>
            播放器開放時間
            <input defaultValue={formatTaipeiDateTimeLocal(live?.playerOpenAt)} name="livePlayerOpenAt" type="datetime-local" />
          </label>
          <label>
            播放器關閉時間
            <input defaultValue={formatTaipeiDateTimeLocal(live?.playerCloseAt)} name="livePlayerCloseAt" type="datetime-local" />
          </label>
        </div>
      </section>

      <label>
        課程封面圖片網址
        <input defaultValue={course?.coverImageUrl || ""} name="coverImageUrl" placeholder="https://..." type="url" />
      </label>
      <div className="admin-course-checks">
        <label>
          <input defaultChecked={course?.isPublished} name="isPublished" type="checkbox" />
          發布課程
        </label>
        <label>
          <input defaultChecked={course?.isFeatured} name="isFeatured" type="checkbox" />
          首頁顯示
        </label>
      </div>
      <button className="admin-course-save" type="submit">
        儲存課程
      </button>
    </form>
  );
}
