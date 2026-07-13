import { createHash, randomInt } from "node:crypto";

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 20;
const RECOVERY_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeRecoveryCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashRecoveryCode(code: string) {
  // 每組碼具有約 100-bit 隨機熵，使用用途隔離雜湊可避免跨環境秘密不同步。
  return createHash("sha256")
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
