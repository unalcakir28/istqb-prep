import { describe, expect, it } from "vitest";

import { formatInterval } from "./interval";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatInterval", () => {
  it("uses the largest unit that keeps the number whole", () => {
    expect(formatInterval(MINUTE, "en")).toBe("1 min");
    expect(formatInterval(10 * MINUTE, "en")).toBe("10 min");
    expect(formatInterval(3 * HOUR, "en")).toBe("3 hr");
    expect(formatInterval(4 * DAY, "en")).toBe("4 days");
    expect(formatInterval(60 * DAY, "en")).toBe("2 mths");
    expect(formatInterval(730 * DAY, "en")).toBe("2 yrs");
  });

  it("never prints zero for a card due within the minute", () => {
    expect(formatInterval(0, "en")).toBe("1 min");
    expect(formatInterval(20_000, "en")).toBe("1 min");
  });

  it("names the unit in the interface language", () => {
    expect(formatInterval(10 * MINUTE, "tr")).toBe("10 dk.");
    expect(formatInterval(4 * DAY, "tr")).toBe("4 gün");
  });
});
