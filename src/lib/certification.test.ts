import { afterEach, describe, expect, it } from "vitest";

import {
  pickCertification,
  readCertificationChoice,
  selectableCertifications,
  writeCertificationChoice,
} from "./certification";
import type { CertificationSummary } from "@/types/content";

function cert(id: string, status: string): CertificationSummary {
  return {
    id,
    acronym: id.toUpperCase(),
    syllabusVersion: "1.0",
    status,
    path: id,
    languages: ["tr", "en"],
    questionCount: 0,
    coverage: { objectivesTotal: 0, objectivesCovered: 0, minPerObjective: 0 },
  };
}

const CTFL = cert("ctfl", "active");
const CTAI = cert("ctai", "active");
const DRAFT = cert("draft", "draft");

afterEach(() => {
  localStorage.clear();
});

describe("pickCertification", () => {
  it("shows the first selectable certification when nothing has been picked", () => {
    expect(pickCertification([DRAFT, CTFL, CTAI], null)?.id).toBe("ctfl");
  });

  it("shows the one that was picked", () => {
    expect(pickCertification([CTFL, CTAI], "ctai")?.id).toBe("ctai");
  });

  it("never shows a draft, even when it is the stored choice", () => {
    expect(pickCertification([CTFL, DRAFT], "draft")?.id).toBe("ctfl");
  });

  it("falls back quietly when the picked one is no longer listed", () => {
    expect(pickCertification([CTFL], "gone")?.id).toBe("ctfl");
  });

  it("falls back to the first listed when none can be picked", () => {
    expect(pickCertification([DRAFT], null)?.id).toBe("draft");
  });
});

describe("the stored choice", () => {
  it("is read back after it is written", () => {
    expect(readCertificationChoice()).toBeNull();
    writeCertificationChoice("ctai");
    expect(readCertificationChoice()).toBe("ctai");
  });

  it("offers only active certifications", () => {
    expect(selectableCertifications([CTFL, DRAFT, CTAI]).map((item) => item.id)).toEqual([
      "ctfl",
      "ctai",
    ]);
  });
});
