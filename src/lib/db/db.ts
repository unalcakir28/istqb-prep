/**
 * F1-03 — Istemci tarafi kalicilik (IndexedDB / Dexie).
 *
 * Backend yok, hesap yok: kullanicinin tum ilerlemesi yalnizca kendi
 * tarayicisindadir ve hicbir yere gonderilmez (CLAUDE.md kural 7).
 *
 * Bunun bedeli, tarayici verisi temizlenirse ilerlemenin gitmesidir; bu
 * yuzden disa/ice aktarma (F3-08) planlanmistir ve gizlilik sayfasinda
 * acikca yazar.
 *
 * Tablolar Faz 1'de tamami kullanilmaz (srsCards, bookmarks Faz 2-3), ama
 * semanin bastan tanimlanmasi ileride surum atlamadan migrasyon yapmayi
 * saglar.
 */

import Dexie, { type Table } from "dexie";

import type { Lang } from "@/types/content";

export type AttemptStatus = "in-progress" | "submitted" | "abandoned";

export interface Attempt {
  id: string;
  certId: string;
  seed: number;
  questionIds: string[];
  status: AttemptStatus;
  /** Denemenin kuruldugu andaki sure — meta'dan gelir, koda gomulmez. */
  durationMinutes: number;
  contentLang: Lang;
  startedAt: number;
  /** Sayac `Date.now()` tabanlidir: sekme arka planda kalirsa kaymaz. */
  deadlineAt: number;
  submittedAt?: number;
  /** Sure dolarak mi teslim edildi — sonuc ekraninda ayrica gosterilir. */
  autoSubmitted?: boolean;
  points?: number;
  totalPoints?: number;
  passed?: boolean;
  syllabusVersion: string;
  dataVersion: string;
}

export interface Response {
  /** `${attemptId}:${questionId}` — ayni soruya ikinci kayit olusmaz. */
  key: string;
  attemptId: string;
  questionId: string;
  selected: string[];
  flagged: boolean;
  updatedAt: number;
}

export interface SrsCard {
  questionId: string;
  certId: string;
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: string;
  lastReviewedAt?: number;
}

export interface Bookmark {
  questionId: string;
  certId: string;
  createdAt: number;
  note?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  responses!: Table<Response, string>;
  srsCards!: Table<SrsCard, string>;
  bookmarks!: Table<Bookmark, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("istqb-prep");

    this.version(1).stores({
      attempts: "id, certId, status, startedAt",
      responses: "key, attemptId, questionId",
      srsCards: "questionId, certId, due",
      bookmarks: "questionId, certId, createdAt",
      settings: "key",
    });

    // v2: yarim kalan denemeyi bulmak her acilista `{certId, status}` ile
    // sorgulaniyor; bilesik indeks olmadan Dexie tabloyu tariyor ve konsola
    // uyari basiyor. Tablolarin geri kalani degismedi, veri donusumu gerekmez.
    this.version(2).stores({
      attempts: "id, certId, status, startedAt, [certId+status]",
    });
  }
}

export const db = new AppDatabase();

export function responseKey(attemptId: string, questionId: string): string {
  return `${attemptId}:${questionId}`;
}

/**
 * Yarim kalan deneme (F1-10). Birden fazlaysa en yenisi dondurulur —
 * eskiler ana sayfada gosterilmez ama silinmez de.
 */
export async function findResumableAttempt(certId: string): Promise<Attempt | undefined> {
  const open = await db.attempts.where({ certId, status: "in-progress" }).toArray();
  if (open.length === 0) return undefined;

  return open.sort((a, b) => b.startedAt - a.startedAt)[0];
}

export async function getResponses(attemptId: string): Promise<Response[]> {
  return db.responses.where("attemptId").equals(attemptId).toArray();
}

export async function saveResponse(
  attemptId: string,
  questionId: string,
  patch: Partial<Pick<Response, "selected" | "flagged">>,
): Promise<void> {
  const key = responseKey(attemptId, questionId);
  const existing = await db.responses.get(key);

  await db.responses.put({
    key,
    attemptId,
    questionId,
    selected: patch.selected ?? existing?.selected ?? [],
    flagged: patch.flagged ?? existing?.flagged ?? false,
    updatedAt: Date.now(),
  });
}

export async function discardAttempt(attemptId: string): Promise<void> {
  await db.transaction("rw", db.attempts, db.responses, async () => {
    await db.responses.where("attemptId").equals(attemptId).delete();
    await db.attempts.delete(attemptId);
  });
}

/**
 * IndexedDB her ortamda calismaz (gizli sekme, depolama kapali, eski
 * tarayici). Uygulama bunu sessizce yutmamali: kullaniciya ilerlemesinin
 * kaydedilmeyecegi soylenir (F3-12).
 */
export async function isPersistenceAvailable(): Promise<boolean> {
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}
