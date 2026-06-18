export function normalizeTaiwanMobile(value: string) {
  const compact = value.trim().replace(/[-\s]/g, "");
  return compact.replace(/^(?:\+?886)0?/, "0");
}
