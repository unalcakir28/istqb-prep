/**
 * The interval printed above each grade button ("Good · 4 days").
 *
 * Formatted by `Intl.NumberFormat` in the interface language, so the unit
 * names need no dictionary keys and are correct in both languages ("10 min" /
 * "10 dk."). The short unit style, not the narrow one: narrow English writes
 * both minutes and months as "m".
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Unit = "minute" | "hour" | "day" | "month" | "year";

function pick(ms: number): { value: number; unit: Unit } {
  if (ms < HOUR) return { value: Math.max(1, Math.round(ms / MINUTE)), unit: "minute" };
  if (ms < DAY) return { value: Math.round(ms / HOUR), unit: "hour" };
  if (ms < 30 * DAY) return { value: Math.round(ms / DAY), unit: "day" };
  if (ms < 365 * DAY) return { value: Math.round(ms / (30 * DAY)), unit: "month" };
  return { value: Math.round(ms / (365 * DAY)), unit: "year" };
}

/** `ms` from now, as the largest unit that keeps it a whole number of at least one. */
export function formatInterval(ms: number, locale: string): string {
  const { value, unit } = pick(ms);
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 0,
  }).format(value);
}
