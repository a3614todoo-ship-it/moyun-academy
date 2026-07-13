"use server";

import { redirect } from "next/navigation";
import {
  clearAdminMfaChallenge,
  createAdminSession,
  getAdminMfaChallenge,
} from "@/lib/admin/auth";
import { hashRecoveryCode, normalizeRecoveryCode } from "@/lib/admin/recovery-codes";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type RecoveryCodeLoginState = { message: string };

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

  await prisma.$transaction([
    prisma.adminSession.deleteMany({
      where: { adminUserId: challenge.adminUserId, expiresAt: { lte: new Date() } },
    }),
    prisma.adminUser.update({
      where: { id: challenge.adminUserId },
      data: { lastLoginAt: new Date() },
    }),
  ]);
  await createAdminSession(challenge.adminUserId);
  await clearAdminMfaChallenge();
  await recordAdminAudit({
    adminUserId: challenge.adminUserId,
    action: "ADMIN_LOGIN_SUCCEEDED",
    metadata: { secondFactor: "recovery_code" },
  });
  redirect("/admin");
}

