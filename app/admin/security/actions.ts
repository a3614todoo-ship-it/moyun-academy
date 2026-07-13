"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/admin/recovery-codes";
import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "@/lib/security/admin-audit";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type RegenerateRecoveryCodesState = {
  message: string;
  codes: string[];
};

export async function regenerateAdminRecoveryCodes(
  _previousState: RegenerateRecoveryCodesState,
): Promise<RegenerateRecoveryCodesState> {
  const session = await requireAdmin();
  const rateLimit = await checkRateLimit({
    scope: "admin-recovery-code-regenerate",
    limit: 3,
    windowSeconds: 60 * 60,
    identifiers: [session.adminUser.id],
  });

  if (!rateLimit.allowed) {
    if (rateLimit.currentCount === 4) {
      await recordAdminAudit({
        adminUserId: session.adminUser.id,
        action: "ADMIN_RECOVERY_CODES_REGENERATION_RATE_LIMITED",
        metadata: { reason: "rate_limited" },
      });
    }
    return { message: "重新產生次數過多，請稍後再試。", codes: [] };
  }

  const codes = generateRecoveryCodes();
  await prisma.$transaction([
    prisma.adminRecoveryCode.deleteMany({
      where: { adminUserId: session.adminUser.id },
    }),
    prisma.adminRecoveryCode.createMany({
      data: codes.map((code) => ({
        adminUserId: session.adminUser.id,
        codeHash: hashRecoveryCode(code),
      })),
    }),
    prisma.adminSession.deleteMany({
      where: {
        adminUserId: session.adminUser.id,
        id: { not: session.id },
      },
    }),
  ]);

  await recordAdminAudit({
    adminUserId: session.adminUser.id,
    action: "ADMIN_RECOVERY_CODES_REGENERATED",
    metadata: { codeCount: codes.length, otherSessionsRevoked: true },
  });
  revalidatePath("/admin/security");

  return {
    message: "新的救援碼已產生。舊碼與其他管理員工作階段已失效。",
    codes,
  };
}

