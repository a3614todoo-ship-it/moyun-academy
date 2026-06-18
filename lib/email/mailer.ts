import nodemailer from "nodemailer";
import { EmailStatus } from "@/generated/prisma/enums";
import { getEmailConfig } from "@/lib/email/config";
import { buildEmailTemplate } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { getFacebookGroupUrl } from "@/lib/settings";

let transporter: nodemailer.Transporter | undefined;

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

export async function sendEmailLog(emailLogId: string) {
  const config = getEmailConfig();
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
    include: {
      application: {
        include: {
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
    },
  });

  if (!emailLog?.application) {
    throw new Error(`EmailLog ${emailLogId} 缺少報名資料。`);
  }

  const facebookGroupUrl = await getFacebookGroupUrl();
  const template = buildEmailTemplate({
    type: emailLog.type,
    application: emailLog.application,
    siteUrl: config.siteUrl,
    facebookGroupUrl,
  });

  try {
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
