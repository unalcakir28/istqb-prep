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
    durationMinutes: number;
    extendedDurationMinutes: number;
    pointsPerQuestion: number;
    /** Absent from every official document — writing `false` would be a claim of its own. */
    negativeMarking: boolean | null;
    questionKLevelDistribution: Record<KLevel, number>;
  };
  sources: Record<string, string>;
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
  media: unknown | null;
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
