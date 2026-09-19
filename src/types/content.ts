/**
 * data/ altindaki statik JSON'un tip karsiliklari.
 * Sekil kaynagi schemas/*.json ve docs/04-veri-modeli.md.
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
    /** Hicbir resmi dokumanda gecmiyor — `false` demek de bir iddia olurdu. */
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
 * Resmi sinavin soru dagilimi. Bir grup, bir veya daha fazla LO'yu ve o
 * gruptan gelmesi gereken soru sayisini tasir.
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

/** Indeks girdisi — soru metni yok, sadece secim icin gereken alanlar. */
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
    /** Her sik icin ayri gerekce — urunun ana farklilastiricisi, zorunlu. */
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
