import { EmailType } from "@/generated/prisma/enums";

type TemplateApplication = {
  applicationNo: string;
  name: string;
  email: string;
  phone: string;
  approvedAt: Date | null;
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
  accessToken: string;
  approvedAt: Date | null;
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
  siteUrl: string;
  facebookGroupUrl?: string;
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

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function membershipPeriod(application: TemplateApplication) {
  const startedAt = application.approvedAt || new Date();
  const endedAt = addDays(startedAt, application.plan.durationDays);
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
  siteUrl,
  facebookGroupUrl = "",
}: TemplateInput) {
  if (type === EmailType.APPLICATION_CREATED) {
    const item = requireApplication(application);
    const subject = "您的我輩學堂會員申請已建立";
    const successUrl = `${siteUrl}/apply/success?application_no=${item.applicationNo}`;
    const paymentUrl = `${siteUrl}/payment-report?application_no=${item.applicationNo}`;
    return {
      subject,
      text: `${item.name} 您好：

您的會員申請已建立。
報名編號：${item.applicationNo}
會員方案：${item.plan.name}
應匯款金額：${money(item.plan.price)}

查看匯款資訊：
${successUrl}

匯款完成後請回報資料：
${paymentUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的會員申請已建立。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["會員方案", item.plan.name],
          ["應匯款金額", money(item.plan.price)],
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
回報金額：${report ? money(report.amount) : money(item.plan.price)}

管理員會核對匯款資料，審核通過後再寄出通知。`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，我們已收到您的會員匯款回報。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["回報金額", report ? money(report.amount) : money(item.plan.price)],
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
會員方案：${item.plan.name}
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
          ["會員方案", item.plan.name],
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
    return {
      subject,
      text: `${item.name} 您好：

您的我輩學堂會員申請已審核通過。
報名編號：${item.applicationNo}
會員方案：${item.plan.name}
會員期間：${period}
會員效期：${item.plan.durationDays} 天
${facebookGroupUrl ? `Facebook 私密社團：${facebookGroupUrl}` : "Facebook 私密社團網址將由管理員另行通知。"}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的會員申請已審核通過。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", item.applicationNo],
          ["會員方案", item.plan.name],
          ["會員期間", period],
          ["會員效期", `${item.plan.durationDays} 天`],
        ])}</table>
        <p style="margin:18px 0 0;color:#69726d;font-size:14px;line-height:1.8;">會員期間自審核通過日起算，期間內可依學堂安排觀看會員課程與參與會員社群。</p>
        ${facebookGroupUrl ? button(facebookGroupUrl, "加入 Facebook 私密社團") : "<p>Facebook 私密社團網址將由管理員另行通知。</p>"}`,
      ),
    };
  }

  if (type === EmailType.COURSE_PURCHASE_CREATED) {
    const item = requireCoursePurchase(coursePurchase);
    const subject = `您的課程購買申請已建立：${item.course.title}`;
    const successUrl = `${siteUrl}/course-purchase/success?purchase_no=${item.purchaseNo}`;
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
    const watchUrl = `${siteUrl}/courses/${item.course.slug}/watch?token=${item.accessToken}`;
    const liveUrl = `${siteUrl}/courses/${item.course.slug}/live?token=${item.accessToken}`;
    const hasLive = Boolean(item.course.liveSession?.isEnabled);
    return {
      subject,
      text: `${item.name} 您好：

您的課程購買已審核通過。
購買編號：${item.purchaseNo}
課程名稱：${item.course.title}
審核日期：${item.approvedAt ? formatDate(item.approvedAt) : formatDate(new Date())}

請由以下連結觀看正式課程：
${watchUrl}
${hasLive ? `\n直播教室連結：\n${liveUrl}` : ""}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(item.name)} 您好，您的課程購買已審核通過。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["購買編號", item.purchaseNo],
          ["課程名稱", item.course.title],
          ["審核日期", item.approvedAt ? formatDate(item.approvedAt) : formatDate(new Date())],
        ])}</table>
        ${button(watchUrl, "觀看正式課程")}
        ${hasLive ? button(liveUrl, "進入直播教室", "#aa751d") : ""}
        <p style="margin:18px 0 0;color:#69726d;font-size:14px;line-height:1.8;">請勿任意轉傳觀看連結；若系統日後啟用學員登入，觀看權限會改由帳號控管。</p>`,
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
