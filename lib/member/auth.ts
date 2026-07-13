import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MemberUserStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const MEMBER_SESSION_COOKIE = "wobei_member_session";
const SESSION_DAYS = 14;
const SET_PASSWORD_EXPIRES_HOURS = 24;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function secret() {
  const value = process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("MEMBER_AUTH_SECRET 至少需要 32 個字元。");
  }
  return value;
}

function signPayload(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function buildSetPasswordToken(memberUserId: string, passwordSetAt: Date | null) {
  const expiresAt = Date.now() + SET_PASSWORD_EXPIRES_HOURS * 60 * 60 * 1000;
  const passwordVersion = passwordSetAt ? passwordSetAt.getTime() : 0;
  const payload = `${memberUserId}.${expiresAt}.${passwordVersion}`;
  return `${payload}.${signPayload(payload)}`;
}

export async function verifySetPasswordToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [memberUserId, expiresAtText, passwordVersionText, signature] = parts;
  const expiresAt = Number.parseInt(expiresAtText, 10);
  const passwordVersion = Number.parseInt(passwordVersionText, 10);
  if (!memberUserId || !Number.isFinite(expiresAt) || !Number.isFinite(passwordVersion) || Date.now() > expiresAt) {
    return null;
  }

  const payload = `${memberUserId}.${expiresAt}.${passwordVersion}`;
  if (!safeEqual(signPayload(payload), signature)) return null;

  const member = await prisma.memberUser.findUnique({
    where: { id: memberUserId },
    select: { id: true, email: true, name: true, status: true, passwordSetAt: true },
  });

  if (!member || member.status === MemberUserStatus.DISABLED) return null;
  const currentVersion = member.passwordSetAt ? member.passwordSetAt.getTime() : 0;
  return currentVersion === passwordVersion ? member : null;
}

export async function createMemberSession(memberUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.memberSession.create({
    data: { memberUserId, tokenHash: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true,
    path: "/",
    expires: expiresAt,
  });
}

export async function getMemberSession() {
  const token = (await cookies()).get(MEMBER_SESSION_COOKIE)?.value;
  if (!token) return null;

  return prisma.memberSession.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
      memberUser: { status: MemberUserStatus.ACTIVE },
    },
    include: {
      memberUser: {
        select: { id: true, email: true, name: true, phone: true, status: true },
      },
    },
  });
}

export async function requireMember() {
  const session = await getMemberSession();
  if (!session) redirect("/login");
  return session;
}

export async function destroyMemberSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.memberSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(MEMBER_SESSION_COOKIE);
}

export async function destroyAllMemberSessions(memberUserId: string) {
  await prisma.memberSession.deleteMany({ where: { memberUserId } });
}

export function membershipEndsAt(startedAt: Date, durationDays: number) {
  return new Date(startedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
