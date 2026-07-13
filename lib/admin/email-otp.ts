import { createHmac, randomInt } from "node:crypto";

export const ADMIN_EMAIL_OTP_TTL_MINUTES = 10;

function otpSecret() {
  const value = process.env.AUDIT_LOG_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 AUDIT_LOG_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

export function generateAdminEmailOtp() {
  return randomInt(100_000, 1_000_000).toString();
}

export function normalizeAdminEmailOtp(code: string) {
  return code.replace(/\D/g, "").slice(0, 6);
}

export function hashAdminEmailOtp(code: string) {
  return createHmac("sha256", otpSecret())
    .update(`admin-email-otp:${normalizeAdminEmailOtp(code)}`)
    .digest("hex");
}

export function maskAdminEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

