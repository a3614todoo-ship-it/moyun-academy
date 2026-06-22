import { saveCourse } from "@/app/admin/courses/actions";

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
};

function listText(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("\n")
    : "";
}

function datetimeValue(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function AdminCourseForm({ course }: { course?: CourseFormValue }) {
  const accessType = course?.accessType || "MEMBER_INCLUDED";
  const live = course?.liveSession;

  return (
    <form action={saveCourse} className="admin-course-form">
      {course?.id ? <input name="id" type="hidden" value={course.id} /> : null}

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
          <input
            defaultValue={course?.category || ""}
            list="course-category-options"
            name="category"
            required
          />
          <datalist id="course-category-options">
            <option value="古典文學" />
            <option value="詩詞賞析" />
            <option value="閱讀寫作" />
            <option value="直播課程" />
          </datalist>
        </label>
        <label>
          副標題
          <input defaultValue={course?.subtitle || ""} name="subtitle" />
        </label>
        <label>
          單元數
          <input
            defaultValue={course?.lessonCount ?? 0}
            min="0"
            name="lessonCount"
            required
            type="number"
          />
        </label>
        <label>
          排序
          <input
            defaultValue={course?.sortOrder ?? 0}
            name="sortOrder"
            required
            type="number"
          />
        </label>
        <label>
          開課時間
          <input defaultValue={datetimeValue(course?.courseStartAt)} name="courseStartAt" type="datetime-local" />
          <small>會顯示在前台課程資訊卡；若留空，可只使用直播時間。</small>
        </label>
      </div>

      <section className="admin-course-info-box">
        <div className="form-section-heading">
          <span>INFO</span>
          <div>
            <h2>前台課程資訊</h2>
            <p>這裡會顯示成課程頁上的資訊卡，方便學員快速了解開課日期、時長、上課方式與觀看權限。</p>
          </div>
        </div>
        <div className="admin-course-grid">
          <label>
            課程時長
            <input
              defaultValue={course?.durationText || ""}
              name="durationText"
              placeholder="預計 2 小時 30 分以上"
            />
          </label>
          <label>
            上課方式
            <input
              defaultValue={course?.courseFormatText || ""}
              name="courseFormatText"
              placeholder="直播・提供錄影後有字幕・可提供完課證明"
            />
          </label>
          <label>
            觀看權限
            <input
              defaultValue={course?.viewingPolicyText || ""}
              name="viewingPolicyText"
              placeholder="直播後將提供錄影／無期限・無限次・隨時觀看"
            />
          </label>
        </div>
      </section>

      <label>
        課程摘要
        <textarea defaultValue={course?.excerpt || ""} name="excerpt" required rows={3} />
      </label>
      <label>
        課程介紹
        <textarea defaultValue={course?.description || ""} name="description" required rows={7} />
      </label>
      <div className="admin-course-grid">
        <label>
          課程章節（一行一個）
          <textarea defaultValue={listText(course?.outline)} name="outline" rows={7} />
        </label>
        <label>
          適合對象（一行一個）
          <textarea defaultValue={listText(course?.audiences)} name="audiences" rows={7} />
        </label>
      </div>

      <label>
        試看片網址（YouTube）
        <input
          defaultValue={course?.previewVideoUrl || ""}
          name="previewVideoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
        />
        <small>目前支援 YouTube 一般影片網址、分享網址與 Shorts 網址。</small>
      </label>

      <div className="admin-course-grid">
        <label>
          課程權限
          <select defaultValue={accessType} name="accessType">
            <option value="PUBLIC_FREE">免費公開課程</option>
            <option value="MEMBER_INCLUDED">會員免費課程</option>
            <option value="PAID">單獨付費課程</option>
          </select>
        </label>
        <label>
          課程售價
          <input defaultValue={course?.price ?? 0} min="0" name="price" required type="number" />
          <small>免費課程請填 0；付費課程需大於 0。</small>
        </label>
      </div>

      <label>
        正式課程影片網址
        <input
          defaultValue={course?.fullVideoUrl || ""}
          name="fullVideoUrl"
          placeholder="可填 YouTube、Vimeo 或其他影片網址"
          type="url"
        />
        <small>付費課程會透過審核通過後的專屬連結進入觀看。</small>
      </label>

      <section className="admin-course-live-box">
        <div className="form-section-heading">
          <span>LIVE</span>
          <div>
            <h2>直播設定</h2>
            <p>學員需完成購買審核，才能進入直播教室。不同平台會使用不同播放方式，但站內 Q&A 都可保留測試。</p>
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
              <option value="ZOOM_WEBINAR">Zoom Webinar</option>
              <option value="ZOOM_MEETING">Zoom Meeting</option>
              <option value="EXTERNAL_URL">外部直播連結</option>
            </select>
          </label>
          <label>
            YouTube Live Video ID
            <input defaultValue={live?.youtubeVideoId || ""} name="liveYoutubeVideoId" placeholder="YouTube 模式才需要，只填 Video ID" />
            <small>例如網址是 youtube.com/watch?v=abc123，這裡只填 abc123。</small>
          </label>
          <label>
            YouTube Chat Embed URL
            <input
              defaultValue={live?.youtubeChatEmbedUrl || ""}
              name="liveYoutubeChatEmbedUrl"
              placeholder="https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=..."
              type="url"
            />
            <small>只有 YouTube Live 需要。若要測站內 Q&A，可不勾 YouTube Chat。</small>
          </label>
        </div>

        <label>
          Vimeo / Zoom / 外部直播網址
          <input
            defaultValue={live?.externalUrl || ""}
            name="liveExternalUrl"
            placeholder="Vimeo 影片或 event 網址、Zoom 會議網址，或其他直播平台網址"
            type="url"
          />
          <small>
            Vimeo 會嘗試嵌入播放；Zoom Webinar、Zoom Meeting、外部連結會在直播頁顯示「進入直播」按鈕。
          </small>
        </label>

        <div className="admin-course-grid">
          <label>
            直播開始時間
            <input defaultValue={datetimeValue(live?.startsAt)} name="liveStartsAt" type="datetime-local" />
          </label>
          <label>
            直播結束時間
            <input defaultValue={datetimeValue(live?.endsAt)} name="liveEndsAt" type="datetime-local" />
          </label>
          <label>
            播放器開放時間
            <input defaultValue={datetimeValue(live?.playerOpenAt)} name="livePlayerOpenAt" type="datetime-local" />
          </label>
          <label>
            播放器關閉時間
            <input defaultValue={datetimeValue(live?.playerCloseAt)} name="livePlayerCloseAt" type="datetime-local" />
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
          上架課程
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
