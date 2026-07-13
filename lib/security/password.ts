import { compare } from "bcryptjs";

// 固定假 hash 可避免不存在帳號明顯比存在帳號更快回應。
const DUMMY_BCRYPT_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5YCF9XdlGg.Kt2zXxW7Xx9Q8XwJpK9e";

export async function verifyPassword(password: string, passwordHash?: string | null) {
  if (!password || password.length > 128) return false;
  return compare(password, passwordHash || DUMMY_BCRYPT_HASH);
}

export function validateNewPassword(password: string) {
  if (password.length < 12) return "密碼至少需要 12 個字元。";
  if (password.length > 128) return "密碼不可超過 128 個字元。";
  if (!/[A-Za-z\p{L}]/u.test(password) || !/\d/.test(password)) {
    return "密碼至少需要包含文字與數字。";
  }
  if (/^(.)\1+$/.test(password)) return "請勿使用重複的單一字元作為密碼。";
  return null;
}
