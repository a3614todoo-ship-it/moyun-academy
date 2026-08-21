import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { trustedRequestAddress } from "@/lib/security/request-origin";

type AuditInput = {
  adminUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

async function requestIpHash() {
  const secret = process.env.AUDIT_LOG_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  const requestHeaders = await headers();
  const address = trustedRequestAddress(requestHeaders);
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function recordAdminAudit(input: AuditInput) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: input.adminUserId || null,
      action: input.action,
      targetType: input.targetType || null,
      targetId: input.targetId || null,
      metadata: input.metadata,
      ipHash: await requestIpHash(),
    },
  });
}
