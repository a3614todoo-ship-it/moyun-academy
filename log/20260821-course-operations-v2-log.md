# 2026-08-21 課程營運後台 2.0 修改紀錄

## 修改前

- Git 基準：`8125ae77d84e4d027c521793fee62af0778c417f`。
- 已建立 `backups/20260821-course-operations-v2-before/`。
- 備份未包含 `.env`、`.env.local`、資料庫連線字串、SMTP 密碼或任何 Token。
- 工作目錄原有三個圖片刪除、開發伺服器 log 與未追蹤安全報告不屬於本次範圍，後續不得納入提交。

## 規格共識

- 會員專屬課程在 Facebook 私密社團直播，網站只提供提醒與課後回看。
- 另外付費課程使用 Vimeo Live，經網站購買權限驗證後內嵌播放。
- FB 錄影與付費課程錄影都由 Vimeo 承載，網站不直接存放大型影片。
- 一併納入動態單元、單元直播／回看、私人講義、Q&A 管理、回看生命週期與回看開放通知。

## 研究依據

- Vimeo Live 網站內嵌需 Advanced、Premium，或含 Events 的 Enterprise。
- Vimeo 支援 Embed only、Specific domains、Live Chat 與 Q&A；網域限制不能取代網站購買權限。
- Supabase 私人 bucket 必須透過授權下載或限時 Signed URL。
- Supabase 建議超過 6 MB 使用 resumable upload；本階段講義採瀏覽器直傳，不經 Vercel Function body。
- Supabase 2026 年 breaking change 包含公開 schema 新表不再自動暴露 Data API；本專案不依賴前端直接存取新增業務表。

## 執行紀錄

- 建立 Prisma migration `202608210003_course_operations_v2`，新增逐堂直播、回看、教材與 Q&A 欄位及私人 Storage bucket。
- 正式 Supabase migration 套用成功；欄位、關聯與 `course-handouts` 私人 bucket 查核均為 true。
- Supabase Security Advisor：0 項；Performance Advisor 僅回報低流量環境尚未使用的索引資訊，未刪除營運必要索引。
- 課程基本設定不再刪除並重建課堂，改為獨立逐堂 CRUD；已發布課堂數會同步回課程單元數。
- 會員課限定 FB 私密社團直播；付費課限定 Vimeo Live 並在通過權限後內嵌。
- 回看依單堂 `SCHEDULED`、`PROCESSING`、`READY` 與開放區間判斷；支援開放與截止通知冪等鍵。
- 教材改用 Supabase Signed Upload，前台下載再次驗證課程資格後簽發 300 秒網址。
- 新增後台 Q&A 集中管理與稽核紀錄。
- 新增 5 項核心測試：回看狀態、Vimeo URL、直播時間窗、台北通知日期與 Email 浮水印。
- `npm test`：5/5 通過；Prisma validate/generate 通過；Next.js production build 通過。
- 瀏覽器驗證：首頁與課程總覽有內容、無錯誤覆蓋；未登入後台會導向管理員登入；無權限教材下載回傳 404。
- npm audit 初次發現 Next.js 舊版漏洞，已升級 Next.js 16.3.1 並以相容 override 修補間接依賴；最終 audit 為 0 vulnerabilities。
- Vercel Production／Preview 已新增 Supabase 公開 URL、publishable key 與 bucket 名稱；尚需以 Sensitive 變數設定 server-only `SUPABASE_SECRET_KEY`。
- 已建立完成後備份 `backups/20260821-course-operations-v2-after/`，同樣未包含任何 `.env` 或 Secret。
