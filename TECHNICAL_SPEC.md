# 我輩學堂技術規格書

更新日期：2026-06-24  
專案路徑：`D:\AI\courses\online-academy-preview`  
專案名稱：我輩學堂  
定位：張曼娟的古典文學線上學堂

## 1. 專案概述

我輩學堂是一個以張曼娟作家品牌為核心的線上文學學堂，不以一般課程商城為主要定位，而是結合會員制、付費課程、直播教室、回放、講義、文本共讀與站內 Q&A 的文學學習平台。

目前系統採用人工匯款與人工對帳模式。會員與課程購買都先建立申請資料，匯款後由管理員審核，審核通過後才開放會員權益或課程內容。

## 2. 技術架構

### 2.1 前端與後端

- 框架：Next.js 16.2.9 App Router
- UI：React 19
- 語言：TypeScript
- 樣式：全域 CSS，主要檔案為 `app/globals.css`
- Server Actions：用於表單送出、狀態更新、付款回報、課程存取查詢與 Q&A

### 2.2 資料庫

- 資料庫：PostgreSQL
- 雲端資料庫：Supabase
- ORM：Prisma 7.8
- Prisma schema：`prisma/schema.prisma`
- Prisma Client 輸出：`generated/prisma`

### 2.3 Email

- Email 套件：Nodemailer
- Email Log：所有待寄信件會先建立 `EmailLog`，再由 mailer 寄出並更新狀態
- 目前主要通知：
  - 會員申請建立
  - 會員匯款回報
  - 會員審核通過
  - FB 社團加入狀態
  - 課程購買建立
  - 課程匯款回報
  - 課程購買審核通過

## 3. 主要頁面與路由

### 3.1 前台

- `/`：首頁
  - 主視覺
  - 作家介紹摘要
  - 學堂理念
  - 課程入口
  - 會員方案入口

- `/author`：認識作家
  - 張曼娟介紹
  - 作家、古典文學研究者、閱讀推廣人三個身分
  - 閱讀方法
  - 課程與會員導流

- `/courses`：課程列表
  - 顯示已發布課程
  - 使用 `CourseCard`

- `/courses/[slug]`：課程詳細頁
  - 課程介紹
  - 課程資訊
  - 課程單元預告
  - 課程大綱
  - 適合對象
  - 免費 / 會員免費 / 付費三種權限顯示
  - 付費課程可輸入課程購買編號與 Email 進入學習教室
  - 會員免費課程可輸入會員申請編號與 Email 進入學習教室

- `/courses/[slug]/purchase`：付費課程購買頁
  - 只允許付費課程使用
  - 建立課程購買申請

- `/course-purchase/success`：課程購買成功頁
  - 顯示課程購買編號
  - 顯示匯款資訊
  - 導向課程匯款回報

- `/course-payment-report`：課程匯款回報
  - 依購買編號、姓名、手機核對課程購買資料
  - 回報匯款末五碼、付款人、匯款時間與備註

- `/course-payment-report/success`：課程匯款回報完成頁

- `/courses/[slug]/live`：學習教室
  - 需帶入 `token`
  - 付費課程：由課程購買審核通過產生 access token
  - 會員免費課程：由會員資格查詢後建立或重用金額 0 的課程存取紀錄
  - 顯示直播播放器、外部直播連結、單元教材、講義、回放、文學提問卡、站內 Q&A、YouTube Chat

- `/courses/[slug]/watch`：課程回放
  - 需帶入 `token`
  - 支援完整課程回放與單元回放

- `/membership`：會員方案

- `/apply`：會員申請
  - 建立會員申請編號
  - 填寫姓名、手機、Email、地址、Facebook 帳號與個人頁連結

- `/apply/success`：會員申請成功頁
  - 顯示會員申請編號
  - 顯示匯款資訊

- `/payment-report`：會員匯款回報

- `/payment-report/success`：會員匯款回報完成頁

### 3.2 管理後台

- `/admin/login`：管理員登入
- `/admin`：後台總覽
  - 會員申請統計
  - 付款待審核統計
  - 課程購買統計
  - 最近會員申請與課程購買

- `/admin/applications`：會員申請列表
- `/admin/applications/[id]`：會員申請詳細頁
  - 更新會員申請狀態
  - 重寄相關 Email
  - 狀態歷史
- `/admin/applications/export`：會員申請匯出

- `/admin/course-purchases`：課程購買列表
- `/admin/course-purchases/[id]`：課程購買詳細頁
  - 更新課程購買狀態
  - 審核通過後寄出課程觀看 / 學習教室連結
  - 重寄課程通知 Email

- `/admin/courses`：課程管理列表
- `/admin/courses/new`：新增課程
- `/admin/courses/[id]`：編輯課程
  - 基本資料
  - 課程權限
  - 試看片
  - 課程單元
  - 文本、講義、提問卡、回放
  - 直播設定

- `/admin/settings`：系統設定
  - FB 私密社團網址
  - 匯款銀行資訊

## 4. 權限與角色

### 4.1 管理員

資料表：`AdminUser`

功能：
- 登入後台
- 管理會員申請
- 管理課程購買
- 管理課程
- 設定銀行資訊與 FB 社團網址
- 審核付款
- 寄送 / 重寄系統 Email

登入使用 `AdminSession` 儲存 session token hash 與過期時間。

### 4.2 會員

目前尚未實作完整帳號密碼登入。會員權限目前依照：

- `Application.applicationNo`
- `Application.email`
- `Application.status`
- `Application.approvedAt`
- `MembershipPlan.durationDays`

會員免費課程入口流程：

1. 學員在會員免費課程頁輸入會員申請編號與 Email。
2. 系統確認申請狀態為 `APPROVED` 或 `JOINED_FACEBOOK_GROUP`。
3. 系統確認會員期間尚未過期。
4. 系統建立或重用一筆金額 0、狀態 `APPROVED` 的 `CoursePurchase`。
5. 導向 `/courses/[slug]/live?token=...`。

### 4.3 付費課程學員

付費課程權限依照：

- `CoursePurchase.purchaseNo`
- `CoursePurchase.email`
- `CoursePurchase.status`
- `CoursePurchase.accessToken`

付費課程入口流程：

1. 學員購買課程取得購買編號。
2. 匯款並填寫課程匯款回報。
3. 管理員審核通過。
4. 系統寄出課程頁連結。
5. 學員在課程頁輸入購買編號與 Email。
6. 驗證通過後，系統建立短效瀏覽器通行 cookie 並導向學習教室。

## 5. 課程權限類型

資料表欄位：`Course.accessType`

### 5.1 免費課程 `PUBLIC_FREE`

- 可直接在課程頁觀看完整影片或外部影片連結。
- 不需要會員或購買審核。

### 5.2 會員免費 `MEMBER_INCLUDED`

- 需具備有效會員資格。
- 使用會員申請編號與 Email 查詢。
- 查詢通過後產生課程 access token。

### 5.3 付費課程 `PAID`

- 需單獨購買。
- 需匯款回報與後台人工審核。
- 審核通過後才可進入學習教室。

## 6. 會員流程

### 6.0 會員方案

資料表：`MembershipPlan`

會員方案由後台管理，可新增一個月、一季、半年度、整年度或其他活動方案。

主要欄位：
- `code`：方案代碼，供前台報名網址與系統辨識使用。
- `name`：方案名稱。
- `price`：方案費用。
- `durationDays`：會員有效天數。
- `description`：方案說明。
- `benefits`：權益說明，JSON array。
- `isActive`：是否在前台顯示與開放申請。
- `sortOrder`：前台排序。

前台 `/membership` 只顯示啟用中的方案。學員選擇方案後會前往 `/apply?plan=方案代碼`，申請流程依該方案的費用與效期建立會員申請。

### 6.1 會員申請

資料表：`Application`

建立欄位：
- 會員申請編號 `applicationNo`
- 姓名
- 手機
- Email
- 地址
- Facebook 名稱
- Facebook 個人頁連結
- 會員方案
- 同意條款時間

### 6.2 會員狀態

enum：`ApplicationStatus`

- `PENDING_PAYMENT`：待付款
- `PAYMENT_REPORTED`：已回報付款
- `APPROVED`：審核通過
- `JOINED_FACEBOOK_GROUP`：已加入 FB 社團
- `REJECTED`：拒絕
- `CANCELLED`：取消

### 6.3 付款回報

資料表：`PaymentReport`

欄位：
- 金額
- 匯款末五碼
- 付款人
- 匯款時間
- 截圖網址
- 備註
- 審核人與審核時間

### 6.4 狀態歷史

資料表：`ApplicationStatusHistory`

用途：
- 記錄會員申請狀態異動
- 記錄管理員與備註

## 7. 課程購買流程

### 7.1 課程購買

資料表：`CoursePurchase`

建立欄位：
- 課程購買編號 `purchaseNo`
- 課程
- 姓名
- 手機
- Email
- 金額
- 狀態
- access token

### 7.2 課程購買狀態

enum：`CoursePurchaseStatus`

- `PENDING_PAYMENT`：待付款
- `PAYMENT_REPORTED`：已回報付款
- `APPROVED`：審核通過
- `REJECTED`：拒絕
- `CANCELLED`：取消

### 7.3 課程匯款回報

學員需提供：
- 課程購買編號
- 姓名
- 手機
- 匯款末五碼
- 匯款金額
- 匯款時間
- 付款人
- 備註

系統會檢查：
- 購買編號、姓名與手機是否符合
- 匯款金額是否等於課程金額

## 8. 課程管理

資料表：`Course`

後台課程編輯表單採三個頁籤呈現：
- `基本設定`：課程基本資料、短介、介紹、大綱、適合對象、權限、價格、影片網址、封面與發布狀態。
- `單元管理`：最多 4 個單元的文本、講義、提問卡與回放。
- `直播設定`：直播平台、外部直播網址、YouTube Chat、站內 Q&A、浮水印與播放器開放時間。

三個頁籤仍屬於同一張課程表單，儲存時會一起送出，後端維持同一個 `saveCourse` 驗證與儲存流程。

主要欄位：
- `slug`：課程網址識別
- `title`：課程名稱
- `subtitle`：副標題
- `category`：分類
- `excerpt`：短介
- `description`：介紹
- `outline`：課程大綱，JSON array
- `audiences`：適合對象，JSON array
- `lessonCount`：單元數
- `durationText`：課程時長
- `courseStartAt`：開課時間
- `courseFormatText`：上課方式
- `viewingPolicyText`：觀看權限文字
- `coverImageUrl`：封面圖
- `previewVideoUrl`：試看片
- `fullVideoUrl`：完整影片
- `accessType`：課程權限
- `price`：價格
- `isPublished`：是否發布
- `isFeatured`：首頁顯示
- `sortOrder`：排序

## 9. 課程單元與文本共讀

資料表：`CourseLesson`

目前後台 MVP 提供最多 4 個單元欄位。未來可升級為動態新增、排序與刪除。

主要欄位：
- `title`：單元標題
- `summary`：摘要
- `startsAt`：單元時間
- `durationText`：單元時長
- `originalText`：原文
- `translation`：白話翻譯
- `annotation`：字詞註解
- `teacherNote`：老師導讀
- `reflectionPrompt`：文學提問卡
- `handoutUrl`：講義下載網址
- `replayVideoUrl`：回放影片網址
- `sortOrder`：排序
- `isPublished`：是否顯示

前台顯示：
- 課程頁只顯示公開的單元摘要與提問卡預告。
- 學習教室顯示完整文本、講義、回放與提問卡。

## 10. 直播與學習教室

資料表：`LiveSession`

目前直播設定仍綁定 `Course`，尚未拆到單一 `CourseLesson`。

欄位：
- `title`：直播標題
- `platform`：直播平台
- `isEnabled`：是否啟用
- `startsAt` / `endsAt`：直播開始與結束
- `playerOpenAt` / `playerCloseAt`：播放器開放期間
- `youtubeVideoId`
- `youtubeChatEmbedUrl`
- `enableYoutubeChat`
- `enableQuestions`
- `showWatermark`
- `externalUrl`

支援平台 enum：`LivePlatform`

- `YOUTUBE_LIVE`
- `VIMEO_LIVE`
- `GOOGLE_MEET`
- `ZOOM_WEBINAR`
- `ZOOM_MEETING`
- `EXTERNAL_URL`

播放邏輯：
- YouTube Live 使用 video ID 產生 iframe。
- Vimeo Live 支援 Vimeo event、Vimeo video 或 player embed URL。
- Google Meet / Zoom / 外部平台顯示外部連結按鈕，學員仍需先通過課程權限驗證與播放器開放時間檢查，才會看到進入教室的連結。
- 播放器只在開放時間內顯示。
- 若啟用浮水印，播放器上顯示購買者姓名與遮罩 Email。

## 11. Q&A 與互動

### 11.1 站內 Q&A

資料表：`LiveQuestion`

欄位：
- 所屬直播
- 所屬課程購買
- 顯示名稱
- 遮罩 Email
- 問題內容
- 狀態
- 按讚數
- 老師回覆

狀態 enum：`LiveQuestionStatus`

- `OPEN`
- `ANSWERED`
- `PINNED`
- `HIDDEN`

### 11.2 Q&A 按讚

資料表：`LiveQuestionUpvote`

規則：
- 同一個 `CoursePurchase` 對同一個 `LiveQuestion` 只能按讚一次。
- Q&A 列表優先依 `upvoteCount` 排序，再依建立時間排序。

### 11.3 YouTube Chat

若後台啟用：
- 顯示 YouTube Chat iframe
- 站內 Q&A 仍保留在本網站

## 12. 系統設定

資料表：`SystemSetting`

目前用途：
- FB 私密社團網址
- 銀行名稱
- 分行
- 戶名
- 帳號

設定頁：`/admin/settings`

FB 私密社團網址會用於會員審核通過後的 Email。

## 13. Email 模板與寄送

核心檔案：
- `lib/email/templates.ts`
- `lib/email/mailer.ts`
- `lib/email/config.ts`

寄送流程：

1. 系統建立 `EmailLog`，狀態為 `PENDING`。
2. 呼叫 `sendEmailLogs`。
3. 寄送成功更新為 `SENT`。
4. 寄送失敗更新為 `FAILED` 並記錄錯誤訊息。

課程審核通過信包含：
- 課程名稱
- 購買編號
- 學習教室連結
- 回放連結

會員審核通過信包含：
- 會員期間資訊
- FB 私密社團網址

## 14. 後台功能

### 14.1 管理員登入

- 使用 Email 與密碼登入。
- 密碼以 bcrypt hash 儲存。
- session token 只儲存 hash。

### 14.2 會員申請審核

- 檢視會員申請資料。
- 更新狀態。
- 紀錄狀態歷史。
- 重寄 Email。

### 14.2.1 會員方案管理

- 新增會員方案。
- 編輯方案名稱、代碼、費用、會員天數、說明、權益與排序。
- 啟用 / 停用方案。
- 停用方案後前台不再顯示，但既有會員申請仍保留原方案資料。

### 14.3 課程購買審核

- 檢視購買資料。
- 檢視匯款回報。
- 審核通過後寄出學習教室連結。
- 支援拒絕、取消。

### 14.4 課程管理

- 新增課程
- 編輯課程
- 發布 / 取消發布
- 設定免費、會員免費、付費
- 設定試看片、完整影片
- 設定最多 4 個單元
- 設定文本共讀、講義、提問卡與回放
- 設定直播教室與平台
- 課程編輯表單分成基本設定、單元管理、直播設定三個頁籤

## 15. 部署與環境變數

### 15.1 本機

常用指令：

```powershell
npm install
npm run dev
npm run build
npm run db:generate
npm run db:validate
npx.cmd prisma migrate deploy
```

### 15.2 Vercel

正式部署使用 Vercel。  
環境變數需在 Vercel Project Settings 設定，不應上傳 `.env`。

### 15.3 Supabase

Supabase 作為 PostgreSQL 資料庫。  
新增 migration 後需執行：

```powershell
npx.cmd prisma migrate deploy
```

目前最後一次資料庫功能包含：
- 課程單元 `CourseLesson`
- Q&A 按讚 `LiveQuestionUpvote`

## 16. 安全設計

- `.env` 不進 Git。
- 學習教室不公開，需 access token 與同瀏覽器短效通行 cookie 同時成立。
- 付費課程找回入口需購買編號 + Email。
- 會員免費課程入口需會員申請編號 + Email，且需會員仍有效。
- 單純轉傳 `/courses/[slug]/live?token=...` 或 `/watch?token=...` 網址，不會直接開放播放器與教材。
- 課程通行 cookie 為 HttpOnly、SameSite=Lax，路徑限制在對應課程路徑，效期為 6 小時。
- 直播播放器依開放時間顯示。
- 直播播放器可顯示購買者浮水印。
- YouTube video ID 不直接寫死在公開靜態頁，需經學習教室權限入口。
- 後台操作需管理員 session。

## 17. 時區處理

系統以台灣時間作為後台管理與前台顯示的業務時間。

- 後台 `datetime-local` 欄位輸入值一律視為 Asia/Taipei 時間。
- 儲存至 PostgreSQL 前會轉為 UTC `Date`。
- 前台顯示時間時使用 `Asia/Taipei` 格式化。
- 後台編輯頁回填時間時，會把資料庫 UTC 時間轉回台灣時間後顯示。

相關工具：

- `lib/taipei-time.ts`

此設計用於避免 Vercel / Node.js 執行環境採 UTC 時，將後台輸入時間誤判為 UTC，造成前台多顯示 8 小時。

## 18. 已知限制與後續建議

### 18.1 尚未完成完整會員登入

目前以會員申請編號與 Email 查詢會員資格。  
未來建議建立真正的會員帳號系統：

- 使用者登入
- 會員中心
- 我的課程
- 我的文學筆記
- 我的收藏

### 18.2 課程單元仍是 MVP

目前後台固定最多 4 個單元。  
未來建議改為：

- 單元列表頁
- 動態新增 / 刪除
- 拖曳排序
- 單元獨立直播設定

### 18.3 直播仍綁課程，不是綁單元

目前 `LiveSession` 為一門課一個直播設定。  
未來若一門課有多場直播，建議改為：

- `LiveSession` 關聯 `CourseLesson`
- 每堂單元可設定不同直播與回放

### 18.4 講義目前使用 URL

目前講義以外部 URL 儲存。  
未來可加入：

- Supabase Storage
- 檔案上傳
- 權限保護下載

### 18.5 Q&A 管理尚可加強

目前有提問、按讚、狀態與回答欄位。  
未來後台可加入：

- Q&A 管理頁
- 老師回覆表單
- 置頂問題
- 隱藏問題
- 匯出問題

## 19. 目前完成狀態摘要

已完成：

- 首頁與整體視覺風格
- 認識作家頁
- 會員方案與會員申請
- 會員匯款回報與審核
- FB 私密社團網址設定
- 銀行匯款資訊設定
- 課程管理
- 免費 / 會員免費 / 付費三種課程權限
- 付費課程購買、匯款回報、審核
- 課程購買編號 + Email 找回學習教室入口
- 會員申請編號 + Email 進入會員免費課程
- 直播教室
- YouTube Live / Vimeo Live / Google Meet / Zoom / 外部連結預留與實作
- YouTube Chat 顯示
- 站內 Q&A
- Q&A 按讚
- 課程單元
- 文本共讀
- 講義下載網址
- 回放網址
- 文學提問卡
- Email 通知基礎
- 管理者後台

未完成但建議下一階段：

- 完整會員登入與會員中心
- 我的課程
- 我的文學筆記 / 金句收藏
- 講義檔案上傳與權限下載
- 單元獨立直播
- Q&A 後台管理與老師回覆介面
- Email 排程提醒
- 文章 / 短講 / 音頻內容庫
