"use server";

import { redirect } from "next/navigation";
import {
  clearAdminMfaChallenge,
  createAdminSession,
  getAdminMfaChallenge,
} from "@/lib/admin/auth";
import { hashRecoveryCode, normalizeRecoveryCode } from "@/lib/admin/recovery-codes";
import { hashAdminEmailOtp, normalizeAdminEmailOtp } from "@/lib/admin/email-otp";
import { issueAdminEmailOtp } from "@/lib/admin/email-otp-service";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type RecoveryCodeLoginState = { message: string };
export type EmailCodeLoginState = { message: string };
export type ResendEmailCodeState = { message: string; success: boolean };

async function completeAdminLogin(adminUserId: string, secondFactor: "email_code" | "recovery_code") {
  await prisma.$transaction([
    prisma.adminSession.deleteMany({
      where: { adminUserId, expiresAt: { lte: new Date() } },
    }),
    prisma.adminUser.update({
      where: { id: adminUserId },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  await createAdminSession(adminUserId);
  await clearAdminMfaChallenge();
  await recordAdminAudit({
    adminUserId,
    action: "ADMIN_LOGIN_SUCCEEDED",
    metadata: { secondFactor },
  });
}

export async function verifyAdminEmailCode(
  _previousState: EmailCodeLoginState,
  formData: FormData,
): Promise<EmailCodeLoginState> {
  const challenge = await getAdminMfaChallenge();
  if (!challenge) return { message: "驗證已逾時，請返回登入頁重新輸入帳號密碼。" };

  const rawCode = String(formData.get("emailCode") || "").trim();
  if (!/^\d{6}$/.test(rawCode)) return { message: "請輸入信件中的 6 位數驗證碼。" };
  const code = normalizeAdminEmailOtp(rawCode);

  const rateLimit = await checkRateLimit({
    scope: "admin-login-email-code-verify",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [challenge.adminUserId],
  });
  if (!rateLimit.allowed) {
    if (rateLimit.currentCount === 6) {
      await recordAdminAudit({
        adminUserId: challenge.adminUserId,
        action: "ADMIN_LOGIN_EMAIL_CODE_RATE_LIMITED",
        metadata: { reason: "rate_limited" },
      });
    }
    return { message: "驗證碼嘗試次數過多，請稍後重新登入。" };
  }

  const now = new Date();
  const otp = await prisma.adminEmailOtp.findFirst({
    where: {
      adminUserId: challenge.adminUserId,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, attempts: true },
  });
  if (!otp || otp.attempts >= 5) {
    await recordAdminAudit({
      adminUserId: challenge.adminUserId,
      action: "ADMIN_LOGIN_EMAIL_CODE_FAILED",
      metadata: { reason: otp ? "attempts_exhausted" : "expired_or_unavailable" },
    });
    return { message: "驗證碼已失效，請重新寄送或改用救援碼。" };
  }

  const consumed = await prisma.adminEmailOtp.updateMany({
    where: {
      id: otp.id,
      codeHash: hashAdminEmailOtp(code),
      consumedAt: null,
      expiresAt: { gt: now },
      attempts: { lt: 5 },
    },
    data: { consumedAt: now },
  });
  if (consumed.count !== 1) {
    await prisma.adminEmailOtp.updateMany({
      where: { id: otp.id, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } },
    });
    await recordAdminAudit({
      adminUserId: challenge.adminUserId,
      action: "ADMIN_LOGIN_EMAIL_CODE_FAILED",
      metadata: { reason: "invalid_code" },
    });
    return { message: "Email 驗證碼錯誤。" };
  }

  await completeAdminLogin(challenge.adminUserId, "email_code");
  redirect("/admin");
}

export async function resendAdminEmailCode(
  _previousState: ResendEmailCodeState,
  _formData: FormData,
): Promise<ResendEmailCodeState> {
  const challenge = await getAdminMfaChallenge();
  if (!challenge) return { message: "驗證已逾時，請重新登入。", success: false };

  const cooldown = await checkRateLimit({
    scope: "admin-login-email-code-resend-cooldown",
    limit: 1,
    windowSeconds: 60,
    identifiers: [challenge.adminUserId],
  });
  if (!cooldown.allowed) {
    return { message: `請等待約 ${cooldown.retryAfterSeconds} 秒後再重新寄送。`, success: false };
  }

  const totalLimit = await checkRateLimit({
    scope: "admin-login-email-code-send",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [challenge.adminUserId],
  });
  if (!totalLimit.allowed) {
    if (totalLimit.currentCount === 6) {
      await recordAdminAudit({
        adminUserId: challenge.adminUserId,
        action: "ADMIN_LOGIN_EMAIL_CODE_SEND_RATE_LIMITED",
        metadata: { reason: "rate_limited" },
      });
    }
    return { message: "寄送次數過多，請稍後再試或改用救援碼。", success: false };
  }

  const admin = await prisma.adminUser.findFirst({
    where: { id: challenge.adminUserId, isActive: true },
    select: { id: true, email: true },
  });
  if (!admin) return { message: "管理員帳號無法使用。", success: false };

  try {
    await issueAdminEmailOtp(admin.id, admin.email);
    await recordAdminAudit({ adminUserId: admin.id, action: "ADMIN_LOGIN_EMAIL_CODE_RESENT" });
    return { message: "新的驗證碼已寄出，上一組驗證碼已失效。", success: true };
  } catch (error) {
    await recordAdminAudit({
      adminUserId: admin.id,
      action: "ADMIN_LOGIN_EMAIL_CODE_SEND_FAILED",
      metadata: { reason: "mail_delivery_failed" },
    });
    console.error("管理員登入驗證碼重新寄送失敗", error);
    return { message: "驗證碼寄送失敗，請稍後再試或改用救援碼。", success: false };
  }
}

export async function verifyAdminRecoveryCode(
  _previousState: RecoveryCodeLoginState,
  formData: FormData,
): Promise<RecoveryCodeLoginState> {
  const challenge = await getAdminMfaChallenge();
  if (!challenge) {
    return { message: "驗證已逾時，請返回登入頁重新輸入帳號密碼。" };
  }

  const code = normalizeRecoveryCode(String(formData.get("recoveryCode") || ""));
  if (!code) return { message: "請輸入救援碼。" };

  const rateLimit = await checkRateLimit({
    scope: "admin-login-recovery-code",
    limit: 5,
    windowSeconds: 15 * 60,
    identifiers: [challenge.adminUserId],
  });
  if (!rateLimit.allowed) {
    if (rateLimit.currentCount === 6) {
      await recordAdminAudit({
        adminUserId: challenge.adminUserId,
        action: "ADMIN_LOGIN_RECOVERY_CODE_RATE_LIMITED",
        metadata: { reason: "rate_limited" },
      });
    }
    return { message: "救援碼嘗試次數過多，請稍後再試。" };
  }

  const codeHash = hashRecoveryCode(code);
  const consumed = await prisma.adminRecoveryCode.updateMany({
    where: {
      adminUserId: challenge.adminUserId,
      codeHash,
      usedAt: null,
      adminUser: { isActive: true },
    },
    data: { usedAt: new Date() },
  });

  if (consumed.count !== 1) {
    await recordAdminAudit({
      adminUserId: challenge.adminUserId,
      action: "ADMIN_LOGIN_RECOVERY_CODE_FAILED",
      metadata: { reason: "invalid_or_used_code" },
    });
    return { message: "救援碼錯誤或已使用。" };
  }

  await completeAdminLogin(challenge.adminUserId, "recovery_code");
  redirect("/admin");
}

