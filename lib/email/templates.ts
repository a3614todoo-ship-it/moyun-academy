import { EmailType } from "@/generated/prisma/enums";
import { publicReferenceQuery } from "@/lib/security/public-reference";

type TemplateApplication = {
  applicationNo: string;
  name: string;
  email: string;
  phone: string;
  approvedAt: Date | null;
  planName: string;
  planPrice: number;
  planDurationDays: number;
  memberUser?: { id: string; passwordSetAt: Date | null } | null;
  plan: { name: string; price: number; durationDays: number };
  paymentReports: Array<{
    amount: number;
    bankLast5: string;
    payerName: string;
    paidAt: Date;
  }>;
};

type TemplateCoursePurchase = {
  purchaseNo: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  bankLast5: string | null;
  payerName: string | null;
  paidAt: Date | null;
  approvedAt: Date | null;
  memberUser?: { id: string; passwordSetAt: Date | null } | null;
  course: {
    title: string;
    slug: string;
    fullVideoUrl: string | null;
    liveSession?: { isEnabled: boolean } | null;
  };
};

type TemplateInput = {
  type: EmailType;
  application?: TemplateApplication | null;
  coursePurchase?: TemplateCoursePurchase | null;
  metadata?: unknown;
  siteUrl: string;
  facebookGroupUrl?: string;
  memberSetPasswordUrl?: string;
};

function money(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function metadataText(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function metadataNumber(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataDate(metadata: unknown, key: string) {
  const value = metadataText(metadata, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function membershipPeriod(application: TemplateApplication) {
  const startedAt = application.approvedAt || new Date();
  const endedAt = addDays(startedAt, application.planDurationDays);
  return `${formatDate(startedAt)}－${formatDate(endedAt)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailShell(title: string, content: string) {
  return `<!doctype html>
<html lang="zh-Hant">
  <body style="margin:0;background:#f4eee3;color:#202b27;font-family:Arial,'Microsoft JhengHei',sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="padding:28px;border-top:5px solid #153f35;background:#fff;">
        <div style="margin-bottom:22px;color:#153f35;font-size:22px;font-weight:700;">我輩學堂</div>
        <h1 style="margin:0 0 20px;color:#0c2d27;font-size:26px;">${escapeHtml(title)}</h1>
        ${content}
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #ded6c8;color:#69726d;font-size:13px;">
          這封信由我輩學堂系統寄出。如有疑問，請直接回覆此信與我們聯繫。
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function detailRows(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 12px;color:#69726d;border-bottom:1px solid #eee7da;">${escapeHtml(label)}</td><td style="padding:9px 12px;color:#153f35;font-weight:700;border-bottom:1px solid #eee7da;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

function button(url: string, label: string, color = "#153f35") {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;color:#fff;background:${color};text-decoration:none;">${escapeHtml(label)}</a></p>`;
}

function requireApplication(application?: TemplateApplication | null) {
  if (!application) throw new Error("這封信缺少會員申請資料。");
  return application;
}

function requireCoursePurchase(coursePurchase?: TemplateCoursePurchase | null) {
  if (!coursePurchase) throw new Error("這封信缺少課程購買資料。");
  return coursePurchase;
}

export function buildEmailTemplate({
  type,
  application,
  coursePurchase,
  metadata,
  siteUrl,
  facebookGroupUrl = "",
  memberSetPasswordUrl = "",
}: TemplateInput) {
  if (type === EmailType.APPLICATION_CREATED) {
    const item = requireApplication(application);
    const subject = "您的我輩學堂會員申請已建立";
    const successUrl = `${siteUrl}/apply/success?${publicReferenceQuery("application", item.applicationNo)}`;
    const paymentUrl = `${siteUrl}/payment-report?application_no=${item.applicationNo}`;
    return {
      subject,
      text: `${item.name} 您好：

您的會員申請已建立。
報名編號：${item.applicationNo}
會員方案：${item.planName}
應匯款金額：${money(item.planPrice)}

查看匯款資訊：
${successUrl}

匯款完成後請回報資料：
${paymentUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的會員申請已建立。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["會員方案", item.planName],
          ["應匯款金額", money(item.planPrice)],
        ])}</table>
        ${button(successUrl, "查看匯款資訊", "#aa751d")}
        <p>匯款完成後，請至網站回報匯款資料。</p>
        ${button(paymentUrl, "回報匯款資料")}`,
      ),
    };
  }

  if (type === EmailType.PAYMENT_REPORTED_USER) {
    const item = requireApplication(application);
    const report = item.paymentReports[0];
    const subject = "已收到您的會員匯款回報";
    return {
      subject,
      text: `${item.name} 您好：

我們已收到您的會員匯款回報。
報名編號：${item.applicationNo}
回報金額：${report ? money(report.amount) : money(item.planPrice)}

管理員會核對匯款資料，審核通過後再寄出通知。`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，我們已收到您的會員匯款回報。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["回報金額", report ? money(report.amount) : money(item.planPrice)],
          ["目前狀態", "待管理員審核"],
        ])}</table>`,
      ),
    };
  }

  if (type === EmailType.PAYMENT_REPORTED_ADMIN) {
    const item = requireApplication(application);
    const report = item.paymentReports[0];
    const subject = "新的會員匯款待審核";
    return {
      subject,
      text: `新的會員匯款回報：

報名編號：${item.applicationNo}
姓名：${item.name}
電話：${item.phone}
Email：${item.email}
會員方案：${item.planName}
回報金額：${report ? money(report.amount) : "未取得"}
帳號後五碼：${report?.bankLast5 || "未取得"}
匯款日期：${report ? formatDate(report.paidAt) : "未取得"}
匯款人：${report?.payerName || "未取得"}`,
      html: emailShell(
        subject,
        `<table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["姓名", item.name],
          ["電話", item.phone],
          ["Email", item.email],
          ["會員方案", item.planName],
          ["回報金額", report ? money(report.amount) : "未取得"],
          ["帳號後五碼", report?.bankLast5 || "未取得"],
          ["匯款日期", report ? formatDate(report.paidAt) : "未取得"],
          ["匯款人", report?.payerName || "未取得"],
        ])}</table>`,
      ),
    };
  }

  if (type === EmailType.APPLICATION_APPROVED) {
    const item = requireApplication(application);
    const subject = "您的會員申請已審核通過";
    const period = membershipPeriod(item);
    const loginUrl = `${siteUrl}/login`;
    const accountText = memberSetPasswordUrl
      ? `\n設定網站密碼：${memberSetPasswordUrl}`
      : `\n會員登入：${loginUrl}`;
    const accountHtml = memberSetPasswordUrl
      ? `${button(memberSetPasswordUrl, "設定網站密碼", "#aa751d")}
        <p style="margin:12px 0 0;color:#69726d;font-size:14px;line-height:1.8;">設定密碼後，你就可以用 Email 登入會員中心，查看會員資格與會員免費課程。</p>`
      : `${button(loginUrl, "登入會員中心", "#aa751d")}
        <p style="margin:12px 0 0;color:#69726d;font-size:14px;line-height:1.8;">你的網站帳號已可登入，可在會員中心查看會員資格與課程。</p>`;
    return {
      subject,
      text: `${item.name} 您好：

您的我輩學堂會員申請已審核通過。
報名編號：${item.applicationNo}
會員方案：${item.planName}
會員期間：${period}
會員效期：${item.planDurationDays} 天
${accountText}
${facebookGroupUrl ? `Facebook 私密社團：${facebookGroupUrl}` : "Facebook 私密社團網址將由管理員另行通知。"}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的會員申請已審核通過。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["會員方案", item.planName],
          ["會員期間", period],
          ["會員效期", `${item.planDurationDays} 天`],
        ])}</table>
        <p style="margin:18px 0 0;color:#69726d;font-size:14px;line-height:1.8;">會員期間自審核通過日起算，期間內可依學堂安排觀看會員課程與參與會員社群。</p>
        ${accountHtml}
        ${facebookGroupUrl ? button(facebookGroupUrl, "加入 Facebook 私密社團") : "<p>Facebook 私密社團網址將由管理員另行通知。</p>"}`,
      ),
    };
  }

  if (type === EmailType.COURSE_PURCHASE_CREATED) {
    const item = requireCoursePurchase(coursePurchase);
    const subject = `您的課程購買申請已建立：${item.course.title}`;
    const successUrl = `${siteUrl}/course-purchase/success?${publicReferenceQuery("purchase", item.purchaseNo)}`;
    const reportUrl = `${siteUrl}/course-payment-report?purchase_no=${item.purchaseNo}`;
    return {
      subject,
      text: `${item.name} 您好：

您的課程購買申請已建立。
購買編號：${item.purchaseNo}
課程名稱：${item.course.title}
應匯款金額：${money(item.amount)}

查看匯款資訊：
${successUrl}

匯款完成後請回報資料：
${reportUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的課程購買申請已建立。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["購買編號", item.purchaseNo],
          ["課程名稱", item.course.title],
          ["應匯款金額", money(item.amount)],
        ])}</table>
        ${button(successUrl, "查看匯款資訊", "#aa751d")}
        ${button(reportUrl, "回報課程匯款")}`,
      ),
    };
  }

  if (type === EmailType.COURSE_PAYMENT_REPORTED_USER) {
    const item = requireCoursePurchase(coursePurchase);
    const subject = `已收到您的課程匯款回報：${item.course.title}`;
    return {
      subject,
      text: `${item.name} 您好：

我們已收到您的課程匯款回報。
購買編號：${item.purchaseNo}
課程名稱：${item.course.title}
回報金額：${money(item.amount)}

管理員會核對匯款資料，審核通過後寄出正式課程觀看連結。`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，我們已收到您的課程匯款回報。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["購買編號", item.purchaseNo],
          ["課程名稱", item.course.title],
          ["回報金額", money(item.amount)],
          ["目前狀態", "待管理員審核"],
        ])}</table>`,
      ),
    };
  }

  if (type === EmailType.COURSE_PAYMENT_REPORTED_ADMIN) {
    const item = requireCoursePurchase(coursePurchase);
    const subject = `新的課程匯款待審核：${item.course.title}`;
    const adminUrl = `${siteUrl}/admin/course-purchases`;
    return {
      subject,
      text: `新的課程匯款回報：

購買編號：${item.purchaseNo}
課程名稱：${item.course.title}
姓名：${item.name}
電話：${item.phone}
Email：${item.email}
回報金額：${money(item.amount)}
帳號後五碼：${item.bankLast5 || "未取得"}
匯款日期：${item.paidAt ? formatDate(item.paidAt) : "未取得"}
匯款人：${item.payerName || "未取得"}

請至後台審核：
${adminUrl}`,
      html: emailShell(
        subject,
        `<table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["購買編號", item.purchaseNo],
          ["課程名稱", item.course.title],
          ["姓名", item.name],
          ["電話", item.phone],
          ["Email", item.email],
          ["回報金額", money(item.amount)],
          ["帳號後五碼", item.bankLast5 || "未取得"],
          ["匯款日期", item.paidAt ? formatDate(item.paidAt) : "未取得"],
          ["匯款人", item.payerName || "未取得"],
        ])}</table>
        ${button(adminUrl, "前往後台審核")}`,
      ),
    };
  }

  if (type === EmailType.COURSE_PURCHASE_APPROVED) {
    const item = requireCoursePurchase(coursePurchase);
    const subject = `您的課程已審核通過：${item.course.title}`;
    const courseUrl = `${siteUrl}/courses/${item.course.slug}`;
    const loginUrl = `${siteUrl}/login`;
    const hasLive = Boolean(item.course.liveSession?.isEnabled);
    const accountText = memberSetPasswordUrl
      ? `\n設定網站密碼：${memberSetPasswordUrl}`
      : `\n會員登入：${loginUrl}`;
    const accountHtml = memberSetPasswordUrl
      ? `${button(memberSetPasswordUrl, "設定網站密碼", "#aa751d")}
        <p style="margin:12px 0 0;color:#69726d;font-size:14px;line-height:1.8;">設定密碼後，你就可以登入會員中心查看已購買課程。</p>`
      : `${button(loginUrl, "登入會員中心", "#aa751d")}`;
    return {
      subject,
      text: `${item.name} 您好：

您的課程購買已審核通過。
購買編號：${item.purchaseNo}
課程名稱：${item.course.title}
審核日期：${item.approvedAt ? formatDate(item.approvedAt) : formatDate(new Date())}

請由以下課程頁輸入購買編號與 Email 後進入學習教室：
${courseUrl}
${accountText}
${hasLive ? "\n課程若有直播，也會在學習教室中顯示。" : ""}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的課程購買已審核通過。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["購買編號", item.purchaseNo],
          ["課程名稱", item.course.title],
          ["審核日期", item.approvedAt ? formatDate(item.approvedAt) : formatDate(new Date())],
        ])}</table>
        ${button(courseUrl, "前往課程頁驗證")}
        ${accountHtml}
        <p style="margin:18px 0 0;color:#69726d;font-size:14px;line-height:1.8;">為了保護付費內容，請在課程頁輸入購買編號與報名 Email 後進入學習教室。請勿任意轉傳學習教室網址。</p>`,
      ),
    };
  }

  if (type === EmailType.MEMBERSHIP_EXPIRING) {
    const item = requireApplication(application);
    const daysRemaining = metadataNumber(metadata, "daysRemaining") || 0;
    const endsAt = metadataDate(metadata, "endsAt");
    const subject = `您的我輩學堂會員資格將於 ${daysRemaining} 天後到期`;
    const accountUrl = `${siteUrl}/account`;
    return {
      subject,
      text: `${item.name} 您好：\n\n您的會員資格將於 ${daysRemaining} 天後到期。\n到期日：${endsAt ? formatDate(endsAt) : "請至會員中心查看"}\n\n查看會員中心：\n${accountUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，提醒您目前的會員資格即將到期。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["剩餘天數", `${daysRemaining} 天`],
          ["到期日", endsAt ? formatDate(endsAt) : "請至會員中心查看"],
        ])}</table>
        ${button(accountUrl, "查看會員中心")}`,
      ),
    };
  }

  if (type === EmailType.MEMBER_PRIORITY_OPEN) {
    const item = requireApplication(application);
    const courseTitle = metadataText(metadata, "courseTitle") || "專項課程";
    const courseSlug = metadataText(metadata, "courseSlug");
    const publicOpenAt = metadataDate(metadata, "publicOpenAt");
    const courseUrl = `${siteUrl}/courses/${encodeURIComponent(courseSlug)}`;
    const subject = `會員優先報名已開放：${courseTitle}`;
    return {
      subject,
      text: `${item.name} 您好：\n\n「${courseTitle}」已開放年度會員優先報名。\n一般訪客開放時間：${publicOpenAt ? formatDateTime(publicOpenAt) : "請至課程頁查看"}\n\n前往課程頁：\n${courseUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，「${escapeHtml(courseTitle)}」已開放年度會員優先報名。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["一般訪客開放", publicOpenAt ? formatDateTime(publicOpenAt) : "請至課程頁查看"],
          ["會員優先期間", "一般訪客開放前 7 天"],
        ])}</table>
        ${button(courseUrl, "前往課程頁")}`,
      ),
    };
  }

  if (type === EmailType.LIVE_REMINDER) {
    const recipientName = application?.name || coursePurchase?.name || "學員";
    const courseTitle = metadataText(metadata, "courseTitle") || coursePurchase?.course.title || "課程";
    const courseSlug = metadataText(metadata, "courseSlug") || coursePurchase?.course.slug || "";
    const startsAt = metadataDate(metadata, "startsAt");
    const liveUrl = `${siteUrl}/courses/${encodeURIComponent(courseSlug)}/live`;
    const subject = `明日直播提醒：${courseTitle}`;
    return {
      subject,
      text: `${recipientName} 您好：\n\n「${courseTitle}」直播將於明日舉行。\n直播時間：${startsAt ? formatDateTime(startsAt) : "請至學習教室查看"}\n\n進入學習教室：\n${liveUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(recipientName)} 您好，提醒您「${escapeHtml(courseTitle)}」直播將於明日舉行。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["直播時間", startsAt ? formatDateTime(startsAt) : "請至學習教室查看"],
        ])}</table>
        ${button(liveUrl, "進入學習教室")}`,
      ),
    };
  }

  if (type === EmailType.REPLAY_CLOSING) {
    const recipientName = application?.name || coursePurchase?.name || "學員";
    const courseTitle = metadataText(metadata, "courseTitle") || coursePurchase?.course.title || "課程";
    const courseSlug = metadataText(metadata, "courseSlug") || coursePurchase?.course.slug || "";
    const closesAt = metadataDate(metadata, "closesAt");
    const watchUrl = `${siteUrl}/courses/${encodeURIComponent(courseSlug)}/watch`;
    const subject = `回看即將截止：${courseTitle}`;
    return {
      subject,
      text: `${recipientName} 您好：\n\n「${courseTitle}」的網站回看將於明日截止。\n截止時間：${closesAt ? formatDateTime(closesAt) : "請至課程頁查看"}\n\n前往回看：\n${watchUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(recipientName)} 您好，「${escapeHtml(courseTitle)}」的網站回看即將截止。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["回看截止", closesAt ? formatDateTime(closesAt) : "請至課程頁查看"],
        ])}</table>
        ${button(watchUrl, "前往課程回看")}`,
      ),
    };
  }

  const item = requireApplication(application);
  const subject = "您的會員已加入社團紀錄完成";
  return {
    subject,
    text: `${item.name} 您好：
您的我輩學堂會員社群加入紀錄已完成。`,
    html: emailShell(
      subject,
      `<p>${escapeHtml(item.name)} 您好，您的會員社群加入紀錄已完成。</p>`,
    ),
  };
}
