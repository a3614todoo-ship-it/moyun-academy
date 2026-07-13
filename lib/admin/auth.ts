import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "wobei_admin_session";
const MFA_CHALLENGE_COOKIE = "wobei_admin_mfa_challenge";
const SESSION_DAYS = 7;
const MFA_CHALLENGE_MINUTES = 10;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function authSecret() {
  const value = process.env.AUDIT_LOG_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 AUDIT_LOG_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

function secureCookie() {
  return process.env.VERCEL === "1"
    || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true;
}

function signMfaChallenge(payload: string) {
  return createHmac("sha256", authSecret())
    .update(`admin-mfa-challenge:${payload}`)
    .digest("base64url");
}

export async function createAdminMfaChallenge(adminUserId: string) {
  const expiresAt = Date.now() + MFA_CHALLENGE_MINUTES * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({
    adminUserId,
    expiresAt,
    nonce: randomBytes(16).toString("base64url"),
  })).toString("base64url");
  const token = `${payload}.${signMfaChallenge(payload)}`;

  (await cookies()).set(MFA_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie(),
    path: "/admin",
    expires: new Date(expiresAt),
  });
}

export async function getAdminMfaChallenge() {
  const token = (await cookies()).get(MFA_CHALLENGE_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(signMfaChallenge(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      adminUserId?: string;
      expiresAt?: number;
    };
    if (!parsed.adminUserId || !parsed.expiresAt || parsed.expiresAt <= Date.now()) return null;
    return { adminUserId: parsed.adminUserId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export async function clearAdminMfaChallenge() {
  (await cookies()).set(MFA_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie(),
    path: "/admin",
    expires: new Date(0),
  });
}

export async function createAdminSession(adminUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return prisma.adminSession.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
      adminUser: { isActive: true },
    },
    include: {
      adminUser: {
        select: { id: true, email: true, name: true, isActive: true },
      },
    },
  });
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.set(MFA_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookie(),
    path: "/admin",
    expires: new Date(0),
  });
}
