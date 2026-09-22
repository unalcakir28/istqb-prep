import { describe, expect, it } from "vitest";

import { isMastered, progressKey } from "./objectiveProgress";

describe("progressKey", () => {
  it("scopes the key by certification so two certifications never collide", () => {
    expect(progressKey("ctfl-v4.0.1", "FL-1.1.1")).toBe("ctfl-v4.0.1:FL-1.1.1");
  });
});

describe("isMastered", () => {
  it("requires both enough answers and a high enough last score", () => {
    expect(isMastered(3, 80)).toBe(true);
  });

  it("is not reached on a high score alone", () => {
    expect(isMastered(2, 100)).toBe(false);
  });

  it("is not reached on volume alone", () => {
    expect(isMastered(20, 79)).toBe(false);
  });

  it("can be lost again when the latest score drops", () => {
    expect(isMastered(10, 50)).toBe(false);
  });
});
