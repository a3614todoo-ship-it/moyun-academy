# 我輩學堂課程營運後台 2.0 規格

## 目標

將目前固定四個單元、單一課程直播與公開講義網址的 MVP，升級為可實際營運會員月課與另外付費課程的內容管理系統。

## 已確認的直播模式

### 會員專屬課程

- 直播在 Facebook 私密社團進行，互動也留在 Facebook。
- 網站只顯示直播日期、課程狀態與提醒資訊，不內嵌 Facebook 直播。
- 直播結束後，由工作人員將錄影整理並上傳 Vimeo，再於網站開放會員回看。
- 回看期間仍需具備有效會員資格。

### 另外付費課程

- 直播使用 Vimeo Live。
- 購買審核通過的學員登入網站後，在課程教室內觀看 Vimeo Live，不直接提供 Vimeo 活動頁連結。
- Vimeo 建議設定為 Embed only，並限制只能由我輩學堂正式網域內嵌。
- 直播互動可使用 Vimeo Chat／Q&A；課後長期提問使用網站 Q&A。
- 直播結束後沿用 Vimeo 錄影，由管理員決定回看開放與截止時間。

## 功能範圍

### 1. 動態單元

- 單元不再限制四筆。
- 每個單元獨立新增、編輯、發布、隱藏、排序與刪除。
- 刪除前檢查既有直播、問題與講義，避免誤刪內容。
- 課程顯示的單元數由實際已發布單元計算，保留既有 `lessonCount` 作為相容欄位。

### 2. 單元直播

- 一門課可有多個直播場次，每個單元可綁定一場直播。
- `MEMBER_INCLUDED` 預設 Facebook 私密社團。
- `PAID` 預設 Vimeo Live，並在網站內嵌播放器。
- 每場直播可設定開始、結束、播放器開放／關閉、平台網址、站內 Q&A 與浮水印。
- 既有課程層級直播資料保留並可轉為未綁單元的相容場次。

### 3. 回看生命週期

- 製作狀態：預定直播、處理中、已可上架。
- 顯示狀態由直播時間、製作狀態、回看開關與回看期限共同推導：未開始、直播中、處理中、待開放、回看開放、回看截止。
- 每個單元可設定 Vimeo 回看、聲音回看、開放時間與截止時間。
- 課程層級回看欄位保留作為舊資料相容；新單元優先採單元設定。

### 4. 受保護講義

- 講義存放在 Supabase Storage 私人 bucket `course-handouts`。
- 後台先取得限時上傳憑證，再由瀏覽器直接上傳，避免檔案經過 Vercel Function 的 request body。
- 允許 PDF，預設上限 25 MB；檔案採不可重複的新路徑，不覆寫舊物件。
- 前台下載前重新檢查會員資格或付費購買資格，通過後產生 5 分鐘下載網址。
- Supabase secret/service role key 只存於 Vercel server-only 環境變數，不傳到瀏覽器、不寫入 Git 或 log。

### 5. 網站 Q&A 管理

- 新增後台 Q&A 總覽，可依課程、單元、狀態與關鍵字篩選。
- 管理員可回覆、置頂、隱藏、重新開放與標記已回答。
- 前台排序為置頂優先，其次依按讚數與建立時間。
- 所有管理動作寫入 `AdminAuditLog`，不記錄敏感連線資訊。

### 6. 回看開放通知

- 新增 `REPLAY_OPENED` Email 類型。
- 手動立即開放時寄送通知；設定未來開放時間時，由每日排程在開放日寄送。
- 會員課程只通知當時有效會員；付費課程只通知已核准購買者。
- 每個單元、收件人與開放時間使用唯一 `dedupeKey`，避免重複寄信。

## 資料結構

### `CourseLesson`

- 新增 `replayEnabled`、`replayOpenAt`、`replayCloseAt`。
- 新增 `replayProductionStatus`。
- 新增講義 Storage 路徑、顯示檔名、Content-Type 與檔案大小。
- 新增一對一 `liveSession` 關聯。

### `LiveSession`

- `courseId` 取消唯一限制，改為一般外鍵索引。
- 新增可空且唯一的 `lessonId`。
- 舊的課程層級場次可維持 `lessonId = null`。

### `LiveQuestion`

- 新增 `isPinned`。
- 保留 `OPEN`、`ANSWERED`、`HIDDEN` 狀態。

### `EmailType`

- 新增 `REPLAY_OPENED`。

## 權限規則

- 免費課程：只顯示已發布的公開內容，不自動取得私人講義。
- 會員課程：每次開啟直播、回看、講義與 Q&A 都確認有效會員期間。
- 付費課程：每次開啟直播、回看、講義與 Q&A 都確認已核准購買紀錄。
- Vimeo 網域限制是第二層保護，不能取代網站本身的身分驗證。
- 講義 Signed URL 會在期限後失效，但下載後的檔案無法由網站回收。

## 後台資訊架構

- 課程基本設定：名稱、權限、價格、報名與課程層級設定。
- 課程內容：單元列表、新增單元、排序、發布狀態。
- 單元編輯：文本、直播、Vimeo 回看、講義與回看期限。
- Q&A 管理：跨課程篩選與回覆。
- Email 寄送：沿用既有總覽，增加回看開放通知類型。

## 驗收標準

- 一門課可建立超過四個單元，排序與發布狀態正確。
- 會員課程不渲染 Facebook 直播播放器；付費課程只對購買者渲染 Vimeo Live。
- 到期會員不能觀看會員回看或下載講義。
- 未購買者不能觀看付費直播、回看或下載講義。
- 回看生命週期在各時間邊界顯示正確。
- 私人講義沒有公開 URL，下載網址有效期不超過五分鐘。
- Q&A 回覆、置頂、隱藏與稽核可正常運作。
- 回看開放通知具備冪等性。
- Prisma validate、production build、資料庫 advisor 與正式瀏覽器驗收通過。

## Vimeo 帳號前置條件

- 付費課程使用 Vimeo Live，依 2026-08-21 官方文件需 Advanced、Premium，或含 Events 的 Enterprise。
- Vimeo Live／回看設定為 Embed only，並加入正式網站允許網域。
- Vimeo 網域設定與帳號方案由 Vimeo 後台管理，本專案不保存 Vimeo 密碼。

## 不在本階段

- 線上刷卡與自動退款。
- Vimeo Enterprise API 自動建立活動；本階段由管理員貼入 Vimeo event／embed 網址。
- DRM 或阻止螢幕錄影。
- 學習進度、文學筆記與金句收藏。

## 實作完成狀態（2026-08-21）

- 已完成動態課堂 CRUD、上下排序、發布狀態與安全刪除檢查。
- 已完成會員課 FB 私密社團入口、付費課 Vimeo Live 網站內嵌與逐堂網站開放期限。
- 已完成逐堂 Vimeo／聲音回看、製作狀態、開放期限與開放／截止 Email 通知。
- 已完成 Supabase 私人教材 bucket、瀏覽器直傳、5 分鐘授權下載與後台刪除。
- 已完成跨課程 Q&A 篩選、回覆、置頂、隱藏、恢復與管理稽核。
- 已套用正式資料庫 migration；Supabase 安全 advisor 無警告。
- 已新增核心單元測試並通過 production build。
- Vercel 已設定 Supabase URL、publishable key、bucket 名稱與 server-only `SUPABASE_SECRET_KEY`；Secret 由管理者直接存入 Vercel Sensitive 環境變數，內容未寫入規格、log 或 Git。
- 正式資料庫、GitHub `main` 與 Vercel Production 已發布；公開頁面、管理權限攔截與未授權教材下載已通過正式環境驗證。
