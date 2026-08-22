import nodemailer from "nodemailer";
import { EmailStatus } from "@/generated/prisma/enums";
import { getEmailConfig } from "@/lib/email/config";
import { buildEmailTemplate } from "@/lib/email/templates";
import { buildSetPasswordToken } from "@/lib/member/auth";
import { prisma } from "@/lib/prisma";
import { getFacebookGroupUrl } from "@/lib/settings";

let transporter: nodemailer.Transporter | undefined;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTransporter() {
  const config = getEmailConfig();

  transporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return transporter;
}

export async function verifyEmailConnection() {
  await getTransporter().verify();
}

export async function sendAdminLoginCode(recipient: string, code: string) {
  const config = getEmailConfig();
  const subject = "張曼娟大學堂管理員登入驗證碼";
  const result = await getTransporter().sendMail({
    from: config.from,
    to: recipient,
    subject,
    text: `您的管理員登入驗證碼是：${code}\n\n此驗證碼將於 10 分鐘後失效，且只能使用一次。若不是您本人操作，請勿提供此驗證碼給任何人。`,
    html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f4eee3;color:#202b27;font-family:Arial,'Microsoft JhengHei',sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px 18px;"><div style="padding:28px;border-top:5px solid #153f35;background:#fff;"><div style="margin-bottom:20px;color:#153f35;font-size:22px;font-weight:700;">張曼娟大學堂</div><h1 style="margin:0 0 16px;color:#0c2d27;font-size:24px;">管理員登入驗證碼</h1><p>請在登入頁輸入以下 6 位數驗證碼：</p><p style="margin:24px 0;padding:18px;text-align:center;color:#153f35;background:#f6f0e4;font-size:34px;font-weight:800;letter-spacing:10px;">${code}</p><p style="color:#69726d;font-size:14px;">此驗證碼將於 10 分鐘後失效，且只能使用一次。若不是您本人操作，請勿提供此驗證碼給任何人。</p></div></div></body></html>`,
  });
  return { messageId: result.messageId };
}

export async function sendAdminInvitation(recipient: string, name: string, invitationUrl: string, roleLabel: string) {
  const config = getEmailConfig();
  const subject = "張曼娟大學堂後台帳號邀請";
  const result = await getTransporter().sendMail({
    from: config.from, to: recipient, subject,
    text: `${name} 您好：\n\n您受邀成為張曼娟大學堂的${roleLabel}。請於 48 小時內開啟以下網址設定密碼：\n${invitationUrl}\n\n若您未預期收到此信，請忽略。`,
    html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f4eee3;color:#202b27;font-family:Arial,'Microsoft JhengHei',sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px 18px;"><div style="padding:28px;border-top:5px solid #153f35;background:#fff;"><h1 style="color:#153f35;">張曼娟大學堂後台帳號邀請</h1><p>${escapeHtml(name)} 您好，您受邀成為張曼娟大學堂的${escapeHtml(roleLabel)}。</p><p><a href="${escapeHtml(invitationUrl)}" style="display:inline-block;padding:12px 20px;color:#fff;background:#153f35;text-decoration:none;">設定後台密碼</a></p><p style="color:#69726d;font-size:14px;">連結於 48 小時後失效。若您未預期收到此信，請忽略。</p></div></div></body></html>`,
  });
  return { messageId: result.messageId };
}

export async function sendEmailLog(emailLogId: string) {
  const claimed = await prisma.emailLog.updateMany({
    where: { id: emailLogId, status: EmailStatus.PENDING },
    data: { status: EmailStatus.PROCESSING, errorMessage: null },
  });

  if (!claimed.count) {
    const existing = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
      select: { status: true, providerId: true },
    });
    if (!existing) throw new Error(`找不到 EmailLog：${emailLogId}`);
    return {
      success: existing.status === EmailStatus.SENT,
      skipped: true as const,
      messageId: existing.providerId || undefined,
    };
  }

  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
    include: {
      application: {
        include: {
          memberUser: { select: { id: true, passwordSetAt: true } },
          plan: { select: { name: true, price: true, durationDays: true } },
          paymentReports: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              amount: true,
              bankLast5: true,
              payerName: true,
              paidAt: true,
            },
          },
        },
      },
      coursePurchase: {
        include: {
          memberUser: { select: { id: true, passwordSetAt: true } },
          course: {
            select: {
              title: true,
              slug: true,
              fullVideoUrl: true,
              liveSessions: {
                select: {
                  isEnabled: true,
                },
              },
            },
          },
        },
      },
      eventRegistration: {
        include: {
          event: { select: { title: true, slug: true, startsAt: true, venueName: true, venueAddress: true } },
        },
      },
    },
  });

  if (!emailLog) {
    throw new Error(`找不到 EmailLog：${emailLogId}`);
  }

  try {
    const config = getEmailConfig();
    if (!emailLog.application && !emailLog.coursePurchase && !emailLog.eventRegistration) {
      throw new Error(`EmailLog ${emailLogId} 缺少關聯資料。`);
    }

    const facebookGroupUrl = emailLog.application ? await getFacebookGroupUrl() : "";
    const memberSetPasswordUrl =
      emailLog.type === "APPLICATION_APPROVED" && emailLog.application?.memberUser && !emailLog.application.memberUser.passwordSetAt
        ? `${config.siteUrl}/set-password?token=${encodeURIComponent(
            buildSetPasswordToken(emailLog.application.memberUser.id, emailLog.application.memberUser.passwordSetAt),
          )}`
        : emailLog.type === "COURSE_PURCHASE_APPROVED" && emailLog.coursePurchase?.memberUser && !emailLog.coursePurchase.memberUser.passwordSetAt
          ? `${config.siteUrl}/set-password?token=${encodeURIComponent(
              buildSetPasswordToken(emailLog.coursePurchase.memberUser.id, emailLog.coursePurchase.memberUser.passwordSetAt),
            )}`
          : "";
    const template = buildEmailTemplate({
      type: emailLog.type,
      application: emailLog.application,
      coursePurchase: emailLog.coursePurchase,
      eventRegistration: emailLog.eventRegistration,
      metadata: emailLog.metadata,
      siteUrl: config.siteUrl,
      facebookGroupUrl,
      memberSetPasswordUrl,
    });

    const result = await getTransporter().sendMail({
      from: config.from,
      to: emailLog.recipient,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        subject: template.subject,
        status: EmailStatus.SENT,
        providerId: result.messageId,
        errorMessage: null,
        sentAt: new Date(),
      },
    });

    return { success: true as const, messageId: result.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知寄信錯誤";

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: message.slice(0, 2000),
      },
    });

    console.error(`EmailLog ${emailLog.id} 寄送失敗`, error);
    return { success: false as const, error: message };
  }
}

export async function sendEmailLogs(emailLogIds: string[]) {
  return Promise.all(emailLogIds.map((id) => sendEmailLog(id)));
}
