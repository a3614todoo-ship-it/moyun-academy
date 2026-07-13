import { createHmac, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowSeconds: number;
  identifiers?: string[];
};

export type RateLimitResult = {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
};

function rateLimitSecret() {
  const value = process.env.RATE_LIMIT_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 RATE_LIMIT_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

async function requestAddress() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || requestHeaders.get("x-real-ip") || "unknown").slice(0, 100);
}

function bucketId(scope: string, windowStartedAt: number, identifiers: string[]) {
  const normalized = identifiers.map((value) => value.trim().toLowerCase().slice(0, 200));
  const digest = createHmac("sha256", rateLimitSecret())
    .update([scope, windowStartedAt, ...normalized].join("|"))
    .digest("hex");
  return `${scope}:${windowStartedAt}:${digest}`;
}

export async function checkRateLimit({
  scope,
  limit,
  windowSeconds,
  identifiers = [],
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartedAt = Math.floor(now / windowMs) * windowMs;
  const expiresAt = new Date(windowStartedAt + windowMs);
  const address = await requestAddress();
  const id = bucketId(scope, windowStartedAt, [address, ...identifiers]);

  const bucket = await prisma.securityRateLimitBucket.upsert({
    where: { id },
    create: { id, count: 1, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  // 約百分之一的請求順便清除過期 bucket，避免資料表無限成長。
  if (randomInt(100) === 0) {
    void prisma.securityRateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date(now - windowMs) } },
    });
  }

  return {
    allowed: bucket.count <= limit,
    currentCount: bucket.count,
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
}
