/**
 * F3-04 — the cards that come due over the next few days, one row per day.
 *
 * Each row says its day and its count in words; the bar beside it is
 * `aria-hidden`, because it repeats the number and a screen reader would read
 * an empty element for nothing. The bars are scaled to the busiest day, so the
 * shape shows where the work piles up; the rows share one grid (subgrid), so
 * every bar is drawn against a track of the same length.
 *
 * Day names come from `Intl`: "today" and "tomorrow" from RelativeTimeFormat,
 * the rest as a weekday and date, both in the interface language.
 */

import { useTranslation } from "react-i18next";

import type { ForecastDay } from "@/features/srs/queue";

interface Props {
  days: ForecastDay[];
}

function dayLabel(day: ForecastDay, offset: number, locale: string): string {
  if (offset < 2) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(offset, "day");
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(day.start);
}

export function DueForecast({ days }: Props) {
  const { t, i18n } = useTranslation();
  const busiest = Math.max(...days.map((day) => day.count));

  if (busiest === 0) return null;

  return (
    <figure aria-labelledby="due-forecast-title" className="flex w-full flex-col gap-3">
      <figcaption className="flex flex-col gap-1">
        <h3 id="due-forecast-title" className="text-[15px] font-semibold">
          {t("repetition.forecastTitle")}
        </h3>
        <p className="text-[13px] text-fg-muted">
          {t("repetition.forecastCaption", { count: days.length })}
        </p>
      </figcaption>

      <ol className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
        {days.map((day, offset) => (
          <li key={day.start} className="col-span-3 grid grid-cols-subgrid items-center">
            <span className="text-[13px] first-letter:uppercase">
              {dayLabel(day, offset, i18n.language)}
            </span>
            <span aria-hidden="true" className="h-2.5 rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${(day.count / busiest) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-[13px] tabular-nums">
              {t("repetition.forecastCount", { count: day.count })}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
