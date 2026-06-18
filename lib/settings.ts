import { prisma } from "@/lib/prisma";

export const FACEBOOK_GROUP_URL_KEY = "facebook_group_url";
export const BANK_SETTING_KEYS = {
  bankName: "bank_name",
  bankBranch: "bank_branch",
  bankAccountName: "bank_account_name",
  bankAccountNumber: "bank_account_number",
} as const;

export async function getFacebookGroupUrl() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: FACEBOOK_GROUP_URL_KEY },
    select: { value: true },
  });

  return setting?.value.trim() || process.env.FACEBOOK_GROUP_URL?.trim() || "";
}

export function isValidFacebookGroupUrl(value: string) {
  try {
    const url = new URL(value);
    const isFacebookHost =
      url.hostname === "facebook.com" || url.hostname.endsWith(".facebook.com");
    const isGroupPath = url.pathname.startsWith("/groups/");

    return url.protocol === "https:" && isFacebookHost && isGroupPath;
  } catch {
    return false;
  }
}

export async function getBankTransferSettings() {
  const keys = Object.values(BANK_SETTING_KEYS);
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const values = new Map(settings.map((setting) => [setting.key, setting.value.trim()]));

  return {
    bankName:
      values.get(BANK_SETTING_KEYS.bankName) || process.env.BANK_NAME?.trim() || "",
    bankBranch:
      values.get(BANK_SETTING_KEYS.bankBranch) ||
      process.env.BANK_BRANCH?.trim() ||
      "",
    bankAccountName:
      values.get(BANK_SETTING_KEYS.bankAccountName) ||
      process.env.BANK_ACCOUNT_NAME?.trim() ||
      "",
    bankAccountNumber:
      values.get(BANK_SETTING_KEYS.bankAccountNumber) ||
      process.env.BANK_ACCOUNT_NUMBER?.trim() ||
      "",
  };
}
