export function safeErrorSummary(error: unknown) {
  const raw = error instanceof Error ? error.message : "未知錯誤";
  return raw
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[REDACTED]@")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL_REDACTED]")
    .replace(/(password|token|secret|authorization)=?[^\s,;]*/gi, "$1=[REDACTED]")
    .slice(0, 500);
}
