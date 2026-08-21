type HeaderReader = Pick<Headers, "get">;

function firstAddress(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

/**
 * Vercel 會產生並保護 x-vercel-forwarded-for；正式環境優先使用它。
 * 本機開發沒有 Vercel 標頭時，只接受 x-real-ip，避免信任任意代理鏈。
 */
export function trustedRequestAddress(
  requestHeaders: HeaderReader,
  isVercel = process.env.VERCEL === "1",
) {
  const vercelAddress = firstAddress(requestHeaders.get("x-vercel-forwarded-for"));
  if (vercelAddress) return vercelAddress.slice(0, 100);

  if (isVercel) {
    const forwardedAddress = firstAddress(requestHeaders.get("x-forwarded-for"));
    if (forwardedAddress) return forwardedAddress.slice(0, 100);
  }

  return firstAddress(requestHeaders.get("x-real-ip")).slice(0, 100) || "unknown";
}
