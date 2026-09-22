/**
 * TypeScript counterparts of the static JSON under data/.
 * The shape comes from schemas/*.json and docs/04-data-model.md.
 */

export type Lang = "tr" | "en";
export type KLevel = "K1" | "K2" | "K3";
export type QuestionType = "single" | "multi";
export type QuestionStatus = "draft" | "review" | "published" | "retired";

export interface Manifest {
  dataVersion: string;
  generatedAt: string;
  certifications: CertificationSummary[];
}

export interface CertificationSummary {
  id: string;
  acronym: string;
  syllabusVersion: string;
  status: string;
  path: string;
  languages: Lang[];
  questionCount: number;
  coverage: {
    objectivesTotal: number;
    objectivesCovered: number;
    minPerObjective: number;
  };
}

/** One published sample exam, linked rather than reproduced. */
export interface OfficialSampleExam {
  /** The publisher's own label for the set — "A", "B", … or "A-D" for a listing page. */
  set: string;
  lang: Lang;
  url: string;
  publisher: string;
  documentVersion?: string;
}

export interface CertMeta {
  id: string;
  name: Record<Lang, string>;
  acronym: string;
  stream: string;
  level: string;
  syllabusVersion: string;
  syllabusReleaseDate: string;
  exam: {
    questionCount: number;
    totalPoints: number;
    passPoints: number;
    passPercent: number;
    /**
     * The paper's own length. ISTQB grants +25% to a candidate sitting in a
     * non-native language; that is a property of the sitting, not of the exam,
     * and this product simulates the exam (D-06). `data/certifications.json`
     * still records the extension for every certification — that file is the
     * reference catalogue, this one is the exam we run.
     */
    durationMinutes: number;
    pointsPerQuestion: number;
    /** Absent from every official document — writing `false` would be a claim of its own. */
    negativeMarking: boolean | null;
    questionKLevelDistribution: Record<KLevel, number>;
  };
  sources: Record<string, string>;
  /**
   * Where the official sample exams live on the member board's own site.
   *
   * Links, never content. Their copyright notice permits attributed excerpts
   * for non-commercial use and prohibits *"any other use […] without first
   * obtaining the approval in writing of the ISTQB®"*, so a candidate who
   * wants the official questions is sent to the publisher to answer them
   * there (docs/08 K-1, ADR-0004, D-07).
   */
  officialSampleExams?: OfficialSampleExam[];
}

export interface Chapter {
  number: number;
  title: Record<Lang, string>;
  trainingMinutes: number;
  objectiveCount: number;
  objectiveKDistribution: Record<KLevel, number>;
  examQuestions: number;
  examPoints: number;
  examKDistribution: Record<KLevel, number>;
}

export interface Syllabus {
  syllabusVersion: string;
  source: string;
  chapters: Chapter[];
  totals: {
    trainingMinutes: number;
    objectives: number;
    objectiveKDistribution: Record<KLevel, number>;
    examQuestions: number;
    examPoints: number;
    examKDistribution: Record<KLevel, number>;
  };
}

export interface Objective {
  code: string;
  chapter: number;
  section: string;
  kLevel: KLevel;
  text: Record<Lang, string>;
}

/**
 * The official exam's question distribution. A group carries one or more
 * learning objectives and the number of questions that group must supply.
 */
export interface BlueprintGroup {
  id: string;
  chapter: number;
  kLevel: KLevel;
  questions: number;
  objectives: string[];
}

export interface ExamBlueprint {
  syllabusVersion: string;
  source: string;
  rule: string;
  totals: {
    questions: number;
    byChapter: Record<string, number>;
    byKLevel: Record<KLevel, number>;
  };
  groups: BlueprintGroup[];
}

/** Index entry — no question text, only the fields selection needs. */
export interface QuestionIndexEntry {
  id: string;
  chunk: string;
  chapter: number;
  section?: string;
  objectives: string[];
  kLevel: KLevel;
  type: QuestionType;
  selectCount: number;
  difficulty?: number;
  hasMedia?: boolean;
  tags?: string[];
  languages: Lang[];
  syllabusVersion: string;
  status: QuestionStatus;
}

export interface QuestionIndex {
  dataVersion: string;
  count: number;
  chunks: string[];
  questions: QuestionIndexEntry[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

/** A short bilingual string inside a figure — a caption, a text alternative. */
export type BilingualText = Record<Lang, string>;

/** One row of a table, in both languages. Both must have the same length. */
export type BilingualRow = Record<Lang, string[]>;

/**
 * A figure a question needs in order to be answerable (F1-14, F2-09).
 *
 * Every kind renders as text. There is no diagram-only figure and no kind
 * whose meaning lives in a picture: a decision table is a `<table>`, a state
 * machine is a transition table plus a written alternative, a control-flow
 * fragment is the code itself plus a written alternative. A candidate using a
 * screen reader sits the same exam as everyone else, so an equivalent is not
 * an accommodation bolted on afterwards — it is part of the content, and the
 * schema requires it.
 */
export type QuestionMedia =
  | {
      kind: "decision-table" | "table";
      caption: BilingualText;
      headers: BilingualRow;
      rows: BilingualRow[];
    }
  | {
      kind: "state-transition";
      caption: BilingualText;
      states: string[];
      transitions: { from: string; event: string; to: string }[];
      alt: BilingualText;
    }
  | {
      kind: "control-flow";
      caption: BilingualText;
      language: string;
      content: string;
      alt: BilingualText;
    }
  | { kind: "code"; caption: BilingualText; language: string; content: string }
  | { kind: "image"; caption: BilingualText; src: string; alt: BilingualText };

export interface QuestionContent {
  stem: string;
  options: QuestionOption[];
  rationale: {
    summary: string;
    /** A separate rationale per option — the product's main differentiator, mandatory. */
    byOption: Record<string, string>;
  };
  hints?: string[];
}

export interface Question {
  id: string;
  revision: number;
  syllabusVersion: string;
  chapter: number;
  section: string;
  syllabusRef: string;
  objectives: string[];
  kLevel: KLevel;
  type: QuestionType;
  selectCount: number;
  points: number;
  difficulty: number;
  tags: string[];
  origin: "original";
  status: QuestionStatus;
  correct: string[];
  media: QuestionMedia | null;
  i18n: Record<Lang, QuestionContent>;
  meta: {
    author: string;
    reviewedBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface QuestionChunk {
  chunk: string;
  chapter: number;
  dataVersion: string;
  questions: Question[];
}

export interface Term {
  en: string;
  tr: string;
  chapters: number[];
  trVariants?: string[];
  trForbidden?: string[];
}

export interface Terms {
  syllabusVersion: string;
  trSource: string;
  termCount: number;
  terms: Term[];
  /**
   * Where the mapping came from, in each language, plus how it was produced.
   * The glossary screen shows it: a bilingual term list is only worth
   * anything if the reader can see it was measured rather than translated.
   */
  source: {
    en: string;
    tr: string;
    method: string;
  };
  /** Editorial note on `trForbidden`, in Turkish. Not rendered. */
  note?: string;
}

export interface LessonContent {
  title: string;
  paragraphs: string[];
  keyPoints: string[];
  commonMistakes: string[];
}

/**
 * A short explanatory card for one learning objective, shown in study mode.
 *
 * Written from scratch against the syllabus, like every question: the official
 * text is never reproduced. `paragraphs` is plain text, not Markdown — the
 * project has no Markdown renderer and this feature does not justify adding one.
 */
export interface Lesson {
  objective: string;
  syllabusVersion: string;
  syllabusRef: string;
  revision: number;
  status: QuestionStatus;
  origin: "original";
  i18n: Record<Lang, LessonContent>;
  meta: {
    author: string;
    reviewedBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface LessonChunk {
  chunk: string;
  chapter: number;
  dataVersion: string;
  lessons: Lesson[];
}

export interface LessonIndexEntry {
  objective: string;
  chunk: string;
  chapter: number;
  languages: Lang[];
  syllabusVersion: string;
  status: QuestionStatus;
}

export interface LessonIndex {
  dataVersion: string;
  count: number;
  chunks: string[];
  lessons: LessonIndexEntry[];
}
