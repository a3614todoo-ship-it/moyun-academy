import { saveCourse } from "@/app/admin/courses/actions";

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
  coverImageUrl?: string | null;
  previewVideoUrl?: string | null;
  fullVideoUrl?: string | null;
  accessType?: string;
  price?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
};

function listText(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("\n")
    : "";
}

export function AdminCourseForm({ course }: { course?: CourseFormValue }) {
  const accessType = course?.accessType || "MEMBER_INCLUDED";

  return (
    <form action={saveCourse} className="admin-course-form">
      {course?.id ? <input name="id" type="hidden" value={course.id} /> : null}

      <div className="admin-course-grid">
        <label>
          課程名稱
          <input defaultValue={course?.title || ""} name="title" required />
        </label>
        <label>
          網址代稱
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
            <option value="現代文學" />
            <option value="閱讀寫作" />
            <option value="生活美學" />
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
          課程時長
          <input
            defaultValue={course?.durationText || ""}
            name="durationText"
            placeholder="約 12 小時"
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
      </div>

      <label>
        課程摘要
        <textarea
          defaultValue={course?.excerpt || ""}
          name="excerpt"
          required
          rows={3}
        />
      </label>
      <label>
        詳細介紹
        <textarea
          defaultValue={course?.description || ""}
          name="description"
          required
          rows={7}
        />
      </label>
      <div className="admin-course-grid">
        <label>
          課程大綱，每行一項
          <textarea
            defaultValue={listText(course?.outline)}
            name="outline"
            rows={7}
          />
        </label>
        <label>
          適合對象，每行一項
          <textarea
            defaultValue={listText(course?.audiences)}
            name="audiences"
            rows={7}
          />
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
        <small>試看片目前支援 YouTube 一般影片、短網址與 Shorts 網址。</small>
      </label>

      <div className="admin-course-grid">
        <label>
          課程觀看權限
          <select defaultValue={accessType} name="accessType">
            <option value="PUBLIC_FREE">免費公開觀看</option>
            <option value="MEMBER_INCLUDED">會員免費觀看</option>
            <option value="PAID">需單獨付費購買</option>
          </select>
        </label>
        <label>
          課程售價
          <input
            defaultValue={course?.price ?? 0}
            min="0"
            name="price"
            required
            type="number"
          />
          <small>免費課程可填 0；付費課程請填實際匯款金額。</small>
        </label>
      </div>

      <label>
        正式課程影片網址（預留）
        <input
          defaultValue={course?.fullVideoUrl || ""}
          name="fullVideoUrl"
          placeholder="可放 YouTube、Vimeo 或其他影片網址"
          type="url"
        />
        <small>正式影片不會直接公開在課程介紹頁；之後可依審核權限顯示。</small>
      </label>

      <label>
        課程封面圖片網址
        <input
          defaultValue={course?.coverImageUrl || ""}
          name="coverImageUrl"
          placeholder="https://..."
          type="url"
        />
      </label>
      <div className="admin-course-checks">
        <label>
          <input
            defaultChecked={course?.isPublished}
            name="isPublished"
            type="checkbox"
          />
          上架課程
        </label>
        <label>
          <input
            defaultChecked={course?.isFeatured}
            name="isFeatured"
            type="checkbox"
          />
          首頁顯示
        </label>
      </div>
      <button className="admin-course-save" type="submit">
        儲存課程
      </button>
    </form>
  );
}
