/**
 * F1-05 — Resmi blueprint'e gore deneme sinavi uretimi.
 *
 * Deneme, soru havuzundan rastgele 40 soru cekerek uretilmez. Resmi sinav,
 * `exam-blueprint.json`'daki LO gruplarina gore kurulur ve o dosyanin kurali
 * aynen uygulanir:
 *
 *   "Bir grupta LO sayisindan cok soru varsa, her LO'dan EN AZ bir soru gelir.
 *    Sorudan cok LO varsa, her soru FARKLI bir LO'yu kapsar."
 *
 * Sinav sabitleri (40 soru, 8/6/4/11/9/2, K 8/24/8) buraya SABIT YAZILMAZ —
 * hepsi blueprint'ten okunur. Blueprint degisirse motor kendiliginden uyar.
 *
 * Havuz yetersizse deneme sessizce eksik uretilmez (F1-05c): eksik kalan her
 * grup `shortfalls` icinde raporlanir ve cagiran taraf kullaniciya soyler.
 */

import type { ExamBlueprint, BlueprintGroup, QuestionIndexEntry } from "@/types/content";
import { createRng, shuffle } from "./rng";

export interface GenerateExamOptions {
  blueprint: ExamBlueprint;
  /** Indeks girdileri. Yayinlanmamis sorular cagirmadan once elenmelidir. */
  pool: QuestionIndexEntry[];
  seed: number;
  /**
   * Daha once gorulmus soru ID'leri. Onceliklidir ama zorunlu degildir:
   * havuz yetmezse tekrar kullanilir, cunku eksik deneme uretmek daha kotudur.
   */
  exclude?: ReadonlySet<string>;
}

export interface GroupShortfall {
  groupId: string;
  chapter: number;
  kLevel: string;
  objectives: string[];
  required: number;
  available: number;
}

export interface GeneratedExam {
  seed: number;
  questionIds: string[];
  /** Bos degilse deneme eksiktir; kullaniciya acikca bildirilmelidir. */
  shortfalls: GroupShortfall[];
}

/** Bir grubun sorusu olmaya uygun havuz girdileri. */
function candidatesForGroup(group: BlueprintGroup, pool: QuestionIndexEntry[]) {
  const objectives = new Set(group.objectives);

  return pool.filter(
    (entry) =>
      entry.chapter === group.chapter &&
      entry.kLevel === group.kLevel &&
      entry.objectives.some((code) => objectives.has(code)),
  );
}

/** Gorulmemis sorular basa alinir; siralama grup icinde tohuma baglidir. */
function preferUnseen(
  entries: QuestionIndexEntry[],
  exclude: ReadonlySet<string>,
  rng: () => number,
): QuestionIndexEntry[] {
  const shuffled = shuffle(entries, rng);
  const unseen = shuffled.filter((entry) => !exclude.has(entry.id));
  const seen = shuffled.filter((entry) => exclude.has(entry.id));
  return [...unseen, ...seen];
}

/**
 * Bir gruptan istenen sayida soru secer ve blueprint'in LO kuralini uygular.
 *
 * Once her LO'ya sirayla birer soru dagitilir (round-robin). Bu, iki kurali
 * birden saglar: soru sayisi LO sayisindan azsa her soru farkli bir LO'ya
 * duser; fazlaysa her LO en az bir soru alir, artanlar tekrar dagitilir.
 */
function selectFromGroup(
  group: BlueprintGroup,
  pool: QuestionIndexEntry[],
  exclude: ReadonlySet<string>,
  rng: () => number,
): string[] {
  const candidates = candidatesForGroup(group, pool);
  if (candidates.length === 0) return [];

  const byObjective = new Map<string, QuestionIndexEntry[]>();
  for (const code of group.objectives) {
    const forCode = candidates.filter((entry) => entry.objectives.includes(code));
    if (forCode.length > 0) byObjective.set(code, preferUnseen(forCode, exclude, rng));
  }

  const selected: string[] = [];
  const used = new Set<string>();
  // LO sirasi da tohuma bagli: hangi LO'larin soru aldigi denemeden denemeye degissin.
  const objectiveOrder = shuffle([...byObjective.keys()], rng);

  while (selected.length < group.questions) {
    let addedThisPass = false;

    for (const code of objectiveOrder) {
      if (selected.length >= group.questions) break;

      const queue = byObjective.get(code) ?? [];
      const next = queue.find((entry) => !used.has(entry.id));
      if (!next) continue;

      used.add(next.id);
      selected.push(next.id);
      addedThisPass = true;
    }

    // Hicbir LO yeni soru veremiyorsa havuz tukenmistir; sonsuz dongu olmaz.
    if (!addedThisPass) break;
  }

  return selected;
}

export function generateExam({
  blueprint,
  pool,
  seed,
  exclude = new Set<string>(),
}: GenerateExamOptions): GeneratedExam {
  const rng = createRng(seed);
  const questionIds: string[] = [];
  const shortfalls: GroupShortfall[] = [];

  for (const group of blueprint.groups) {
    const selected = selectFromGroup(group, pool, exclude, rng);
    questionIds.push(...selected);

    if (selected.length >= group.questions) continue;

    shortfalls.push({
      groupId: group.id,
      chapter: group.chapter,
      kLevel: group.kLevel,
      objectives: group.objectives,
      required: group.questions,
      available: selected.length,
    });
  }

  // Sorular blueprint sirasiyla degil karisik sorulur; aksi halde sinav
  // bolum bolum ilerler ve gercek sinav boyle davranmaz.
  return { seed, questionIds: shuffle(questionIds, rng), shortfalls };
}

/** Havuzun bir denemeyi eksiksiz uretip uretemeyecegini onceden soyler. */
export function previewCoverage(
  blueprint: ExamBlueprint,
  pool: QuestionIndexEntry[],
): { total: number; shortfalls: GroupShortfall[] } {
  const shortfalls: GroupShortfall[] = [];
  let total = 0;

  for (const group of blueprint.groups) {
    const available = candidatesForGroup(group, pool).length;
    const usable = Math.min(available, group.questions);
    total += usable;

    if (available >= group.questions) continue;

    shortfalls.push({
      groupId: group.id,
      chapter: group.chapter,
      kLevel: group.kLevel,
      objectives: group.objectives,
      required: group.questions,
      available,
    });
  }

  return { total, shortfalls };
}
