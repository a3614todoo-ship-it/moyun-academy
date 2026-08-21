const TAIPEI_OFFSET_MINUTES = 8 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateTimeLocalParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function parseTaipeiDateTimeLocal(value: string) {
  const parts = parseDateTimeLocalParts(value.trim());
  if (!parts) return undefined;

  const utcTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  ) - TAIPEI_OFFSET_MINUTES * 60 * 1000;
  const date = new Date(utcTime);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatTaipeiDateTimeLocal(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const taipeiTime = new Date(date.getTime() + TAIPEI_OFFSET_MINUTES * 60 * 1000);
  return taipeiTime.toISOString().slice(0, 16);
}

/** 取得指定時間所在台灣日期的 UTC 起訖時間。 */
export function taipeiDayRange(value = new Date()) {
  const taipeiTime = new Date(value.getTime() + TAIPEI_OFFSET_MINUTES * 60 * 1000);
  const start = new Date(
    Date.UTC(
      taipeiTime.getUTCFullYear(),
      taipeiTime.getUTCMonth(),
      taipeiTime.getUTCDate(),
    ) - TAIPEI_OFFSET_MINUTES * 60 * 1000,
  );
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

export function shiftUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}
