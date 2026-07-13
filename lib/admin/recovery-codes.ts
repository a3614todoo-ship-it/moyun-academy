import { createHmac, randomInt } from "node:crypto";

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 20;
const RECOVERY_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function recoveryCodeSecret() {
  const value = process.env.AUDIT_LOG_SECRET || process.env.MEMBER_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("缺少至少 32 字元的 AUDIT_LOG_SECRET 或 MEMBER_AUTH_SECRET。");
  }
  return value;
}

export function normalizeRecoveryCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashRecoveryCode(code: string) {
  return createHmac("sha256", recoveryCodeSecret())
    .update(`admin-recovery-code:${normalizeRecoveryCode(code)}`)
    .digest("hex");
}

function generateRecoveryCode() {
  let value = "";
  for (let index = 0; index < RECOVERY_CODE_LENGTH; index += 1) {
    value += RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)];
  }
  return value.match(/.{1,5}/g)?.join("-") || value;
}

export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
}

