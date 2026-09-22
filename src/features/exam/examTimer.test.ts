import { describe, expect, it } from "vitest";

import {
  CRITICAL_MS,
  WARNING_MS,
  announcementMinute,
  formatRemaining,
  remainingMs,
  remainingSeconds,
  timerUrgency,
} from "./examTimer";

describe("remainingMs", () => {
  it("measures against the absolute deadline, not a stored counter", () => {
    const deadline = 1_000_000;

    expect(remainingMs(deadline, deadline - 90_000)).toBe(90_000);
    // A tab that slept for ten minutes must not gain ten minutes of exam time.
    expect(remainingMs(deadline, deadline - 90_000 + 600_000)).toBe(0);
  });

  it("clamps at zero instead of going negative", () => {
    expect(remainingMs(500, 5_000)).toBe(0);
    expect(remainingMs(500, 500)).toBe(0);
  });
});

describe("remainingSeconds", () => {
  it("rounds up so the clock only reads zero when time is really up", () => {
    expect(remainingSeconds(1)).toBe(1);
    expect(remainingSeconds(4_200)).toBe(5);
    expect(remainingSeconds(5_000)).toBe(5);
    expect(remainingSeconds(0)).toBe(0);
  });
});

describe("formatRemaining", () => {
  it("pads to mm:ss", () => {
    expect(formatRemaining(45 * 60_000 + 12_000)).toBe("45:12");
    expect(formatRemaining(9_000)).toBe("00:09");
    expect(formatRemaining(0)).toBe("00:00");
  });

  // The exam's full 60 minutes is the boundary where an hours-aware formatter
  // would roll over to "01:00:00" or, worse, to "00:00".
  it("covers the full 60 minute duration without overflowing", () => {
    expect(formatRemaining(60 * 60_000)).toBe("60:00");
  });
});

describe("timerUrgency", () => {
  it("turns amber at ten minutes and red at one", () => {
    expect(timerUrgency(WARNING_MS + 1)).toBe("normal");
    expect(timerUrgency(WARNING_MS)).toBe("warning");
    expect(timerUrgency(CRITICAL_MS + 1)).toBe("warning");
    expect(timerUrgency(CRITICAL_MS)).toBe("critical");
    expect(timerUrgency(1)).toBe("critical");
    expect(timerUrgency(0)).toBe("expired");
  });
});

describe("announcementMinute", () => {
  it("stays silent outside the last ten minutes", () => {
    expect(announcementMinute(WARNING_MS + 1)).toBeNull();
    expect(announcementMinute(30 * 60_000)).toBeNull();
  });

  it("emits one distinct value per remaining minute", () => {
    expect(announcementMinute(WARNING_MS)).toBe(10);
    expect(announcementMinute(9 * 60_000 + 1)).toBe(10);
    expect(announcementMinute(9 * 60_000)).toBe(9);
    expect(announcementMinute(CRITICAL_MS)).toBe(1);
    expect(announcementMinute(1)).toBe(1);
    expect(announcementMinute(0)).toBe(0);
  });

  it("does not change value within the same minute, so it cannot chatter", () => {
    const seen = new Set<number | null>();
    for (let ms = 5 * 60_000; ms > 4 * 60_000; ms -= 1_000) seen.add(announcementMinute(ms));

    expect([...seen]).toEqual([5]);
  });
});
