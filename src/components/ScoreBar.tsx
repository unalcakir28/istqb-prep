/**
 * Puan cubugu (F1-12).
 *
 * Tasarim karari (docs/06 §3.4): baraj cizgisi HER ZAMAN cizilir — gecildiginde
 * de kalindiginda da. Skor yumusatilmaz, yuvarlanmaz; cubuk gercek puani
 * gosterir ve esik cubugun uzerinde acik bir isaret olarak durur.
 *
 * Renk tek basina anlam tasimaz (WCAG 1.4.1): cubuk her zaman sayisal bir
 * etiketle birlikte kullanilir ve `aria-label` skoru metin olarak soyler.
 * Grafik icin kutuphane yok — saf CSS.
 */

export type ScoreBarTone = "accent" | "correct" | "incorrect";

export interface ScoreBarProps {
  value: number;
  max: number;
  /** Baraj gibi acikca isaretlenen esik. Verilmezse cizgi cizilmez. */
  markAt?: number;
  /** Cubugun altinda esigin adi — orn. "Baraj 26". */
  markLabel?: string;
  /**
   * Gercekte sorulan soru sayisi. `max` resmi hedef oldugunda, sorulmayan
   * bolge taranarak gosterilir: eksik havuz gorsel olarak da gizlenmez.
   */
  reach?: number;
  tone?: ScoreBarTone;
  size?: "sm" | "lg";
  /** Ekran okuyucu icin tam cumle — cubuk tek basina bilgi tasimaz. */
  ariaLabel: string;
  startLabel?: string;
  endLabel?: string;
}

const FILL_TONE: Record<ScoreBarTone, string> = {
  accent: "bg-accent",
  correct: "bg-correct",
  incorrect: "bg-incorrect",
};

export function ScoreBar({
  value,
  max,
  markAt,
  markLabel,
  reach,
  tone = "accent",
  size = "lg",
  ariaLabel,
  startLabel,
  endLabel,
}: ScoreBarProps) {
  // Bolme hatasi ve tasma, cizim yapilmadan once elenir.
  const span = max > 0 ? max : 0;
  const ratio = (n: number) => (span === 0 ? 0 : Math.min(100, Math.max(0, (n / span) * 100)));

  const trackHeight = size === "lg" ? "h-6" : "h-3";
  const showMark = markAt !== undefined && span > 0 && markAt > 0 && markAt <= span;
  const showGhost = reach !== undefined && span > 0 && reach < span;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative py-1" role="img" aria-label={ariaLabel}>
        <div
          className={`relative ${trackHeight} w-full overflow-hidden rounded-[var(--radius-badge)] border border-border bg-surface-2`}
        >
          {showGhost ? (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0"
              style={{
                left: `${ratio(reach)}%`,
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--border) 0 3px, transparent 3px 7px)",
              }}
            />
          ) : null}

          <div
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 ${FILL_TONE[tone]}`}
            style={{ width: `${ratio(value)}%` }}
          />
        </div>

        {showMark ? (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 rounded-full bg-fg"
            // Esik uclardayken de tam gorunur kalsin diye cubugun icine
            // kenetlenir; baraj cizgisi hicbir durumda kirpilmaz.
            style={{ left: `clamp(0px, calc(${ratio(markAt)}% - 1px), calc(100% - 2px))` }}
          />
        ) : null}
      </div>

      {startLabel || markLabel || endLabel ? (
        <div className="flex items-baseline justify-between gap-2 text-xs text-fg-muted">
          <span>{startLabel ?? ""}</span>
          {markLabel ? (
            <span className="font-medium text-fg">
              <span aria-hidden="true">│ </span>
              {markLabel}
            </span>
          ) : null}
          <span>{endLabel ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}
