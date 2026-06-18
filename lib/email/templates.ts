import { EmailType } from "@/generated/prisma/enums";

type TemplateApplication = {
  applicationNo: string;
  name: string;
  email: string;
  phone: string;
  plan: { name: string; price: number };
  paymentReports: Array<{
    amount: number;
    bankLast5: string;
    payerName: string;
    paidAt: Date;
  }>;
};

type TemplateInput = {
  type: EmailType;
  application: TemplateApplication;
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
        <h1 style="margin:0 0 20px;color:#0c2d27;font-size:26px;">${title}</h1>
        ${content}
        <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #ded6c8;color:#69726d;font-size:13px;">
          此信由我輩學堂系統自動寄出，如有疑問請直接回覆本信。
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

export function buildEmailTemplate({
  type,
  application,
  siteUrl,
  facebookGroupUrl = "",
}: TemplateInput) {
  const report = application.paymentReports[0];
  const successUrl = `${siteUrl}/apply/success?application_no=${application.applicationNo}`;
  const paymentUrl = `${siteUrl}/payment-report?application_no=${application.applicationNo}`;

  if (type === EmailType.APPLICATION_CREATED) {
    const subject = "您已完成會員報名，請依說明完成匯款";
    return {
      subject,
      text: `${application.name} 您好：

您的會員報名資料已建立。
報名編號：${application.applicationNo}
會員方案：${application.plan.name}
應繳金額：${money(application.plan.price)}

匯款資訊與回報入口：
${successUrl}

完成匯款後，請填寫匯款回報：
${paymentUrl}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(application.name)} 您好，您的會員報名資料已建立。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", application.applicationNo],
          ["會員方案", application.plan.name],
          ["應繳金額", money(application.plan.price)],
        ])}</table>
        <p style="margin:24px 0;"><a href="${successUrl}" style="display:inline-block;padding:12px 20px;color:#fff;background:#aa751d;text-decoration:none;">查看匯款資訊</a></p>
        <p>完成匯款後，請使用報名編號填寫匯款回報。</p>`,
      ),
    };
  }

  if (type === EmailType.PAYMENT_REPORTED_USER) {
    const subject = "我們已收到您的匯款回報";
    return {
      subject,
      text: `${application.name} 您好：

我們已收到您的匯款回報。
報名編號：${application.applicationNo}
回報金額：${report ? money(report.amount) : money(application.plan.price)}

工作人員將進行人工對帳，審核完成後會再寄出通知。`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(application.name)} 您好，我們已收到您的匯款資料。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", application.applicationNo],
          ["回報金額", report ? money(report.amount) : money(application.plan.price)],
          ["目前狀態", "已回報匯款，待人工審核"],
        ])}</table>
        <p style="margin-top:22px;">工作人員完成對帳後，會再寄出會員申請結果。</p>`,
      ),
    };
  }

  if (type === EmailType.PAYMENT_REPORTED_ADMIN) {
    const subject = "有新的會員匯款回報待審核";
    return {
      subject,
      text: `有新的匯款回報：

報名編號：${application.applicationNo}
姓名：${application.name}
手機：${application.phone}
Email：${application.email}
方案：${application.plan.name}
回報金額：${report ? money(report.amount) : "未取得"}
帳號後五碼：${report?.bankLast5 || "未取得"}
匯款日期：${report ? formatDate(report.paidAt) : "未取得"}
匯款人姓名：${report?.payerName || "未取得"}`,
      html: emailShell(
        subject,
        `<table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", application.applicationNo],
          ["姓名", application.name],
          ["手機", application.phone],
          ["Email", application.email],
          ["會員方案", application.plan.name],
          ["回報金額", report ? money(report.amount) : "未取得"],
          ["帳號後五碼", report?.bankLast5 || "未取得"],
          ["匯款日期", report ? formatDate(report.paidAt) : "未取得"],
          ["匯款人姓名", report?.payerName || "未取得"],
        ])}</table>`,
      ),
    };
  }

  if (type === EmailType.APPLICATION_APPROVED) {
    const subject = "您的會員申請已審核通過";
    const groupUrl = facebookGroupUrl;
    return {
      subject,
      text: `${application.name} 您好：

您的我輩學堂會員申請已審核通過。
報名編號：${application.applicationNo}
${groupUrl ? `Facebook 私密社團：${groupUrl}` : "Facebook 私密社團連結將由工作人員另行提供。"}`,
      html: emailShell(
        subject,
        `<p>${escapeHtml(application.name)} 您好，您的會員資格已成立。</p>
        <table style="width:100%;border-collapse:collapse;background:#fbf8f1;">${detailRows([
          ["報名編號", application.applicationNo],
          ["會員方案", application.plan.name],
        ])}</table>
        ${groupUrl ? `<p style="margin:24px 0;"><a href="${groupUrl}" style="display:inline-block;padding:12px 20px;color:#fff;background:#153f35;text-decoration:none;">申請加入 Facebook 私密社團</a></p>` : "<p>Facebook 私密社團連結將由工作人員另行提供。</p>"}`,
      ),
    };
  }

  const subject = "您已完成會員加入流程";
  return {
    subject,
    text: `${application.name} 您好：

您已完成我輩學堂會員加入流程。
課程影片將於 Facebook 私密社團內觀看，請留意社團公告與課程索引。`,
    html: emailShell(
      subject,
      `<p>${escapeHtml(application.name)} 您好，您已完成我輩學堂會員加入流程。</p>
      <p>課程影片將於 Facebook 私密社團內觀看，請留意社團公告與課程索引。</p>`,
    ),
  };
}
