const TAIPEI_OFFSET_MINUTES = 8 * 60;

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
