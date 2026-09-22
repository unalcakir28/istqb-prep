import { describe, expect, it } from "vitest";

import type { Attempt } from "@/lib/db/db";

import { redirectPathFor, routeForAttempt } from "./routeForAttempt";

describe("routeForAttempt", () => {
  it("sends an exam attempt to the exam session", () => {
    expect(routeForAttempt({ id: "a1", mode: "exam", scope: { kind: "blueprint" } })).toBe(
      "/sinav/a1",
    );
  });

  it("sends a practice attempt to the practice session", () => {
    expect(
      routeForAttempt({
        id: "a2",
        mode: "practice",
        scope: { kind: "chapter", chapters: [1], count: 10 },
      }),
    ).toBe("/alistirma/a2");
  });

  it("sends a study attempt back to its own objective", () => {
    expect(
      routeForAttempt({
        id: "a3",
        mode: "study",
        scope: { kind: "objective", objectives: ["FL-1.1.1"], count: 3 },
      }),
    ).toBe("/calisma/lo/FL-1.1.1/a3");
  });

  it("falls back to practice when a study attempt has no objective in scope", () => {
    expect(routeForAttempt({ id: "a4", mode: "study", scope: { kind: "blueprint" } })).toBe(
      "/alistirma/a4",
    );
  });
});

describe("redirectPathFor", () => {
  const exam: Pick<Attempt, "id" | "mode" | "scope"> = {
    id: "a1",
    mode: "exam",
    scope: { kind: "blueprint" },
  };
  const practice: Pick<Attempt, "id" | "mode" | "scope"> = {
    id: "a2",
    mode: "practice",
    scope: { kind: "chapter", chapters: [1], count: 10 },
  };

  it("stays put while no attempt is loaded", () => {
    expect(redirectPathFor(null, "a1", "/sinav/a1")).toBeNull();
  });

  it("stays put when the attempt is already on its own route", () => {
    expect(redirectPathFor(exam, "a1", "/sinav/a1")).toBeNull();
  });

  it("redirects an attempt opened from the wrong mode's URL", () => {
    expect(redirectPathFor(practice, "a2", "/sinav/a2")).toBe("/alistirma/a2");
  });

  // The regression: resumeAttempt leaves the previous attempt in the singleton
  // store, so the new route's first render sees an attempt whose id is not the
  // one the URL asked for. Redirecting on it sent the user back to the session
  // they had just left.
  it("ignores a stale attempt left behind by the previous session", () => {
    expect(redirectPathFor(exam, "a2", "/alistirma/a2")).toBeNull();
  });

  it("ignores a stale attempt even when the modes agree", () => {
    expect(redirectPathFor(exam, "a9", "/sinav/a9")).toBeNull();
  });
});
