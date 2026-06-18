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
  return (
    <form action={saveCourse} className="admin-course-form">
      {course?.id ? <input name="id" type="hidden" value={course.id} /> : null}

      <div className="admin-course-grid">
        <label>
          課程名稱
          <input defaultValue={course?.title || ""} name="title" required />
        </label>
        <label>
          網址代稱（英文）
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
            <option value="古典詩詞" />
            <option value="古文選讀" />
            <option value="文學史" />
            <option value="寫作與賞析" />
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
          課程時數
          <input
            defaultValue={course?.durationText || ""}
            name="durationText"
            placeholder="24 小時"
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
        完整介紹
        <textarea
          defaultValue={course?.description || ""}
          name="description"
          required
          rows={7}
        />
      </label>
      <div className="admin-course-grid">
        <label>
          課程大綱（每行一項）
          <textarea
            defaultValue={listText(course?.outline)}
            name="outline"
            rows={7}
          />
        </label>
        <label>
          適合對象（每行一項）
          <textarea
            defaultValue={listText(course?.audiences)}
            name="audiences"
            rows={7}
          />
        </label>
      </div>
      <label>
        YouTube 試看片網址
        <input
          defaultValue={course?.previewVideoUrl || ""}
          name="previewVideoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
        />
        <small>支援 YouTube 一般影片、短網址、Shorts 與直播網址。</small>
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
          首頁精選
        </label>
      </div>
      <button className="admin-course-save" type="submit">
        儲存課程
      </button>
    </form>
  );
}
