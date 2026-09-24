# 07 — Content Authoring Guide

**Version:** 1.0 · **Date:** 19.09.2026

> **This project's bottleneck isn't the code, it's the content.** Writing 300 quality questions takes longer than writing the app. This document sets the quality bar for that work.

---

## 1. Golden rule

> **No question is ever copied, translated, or "adapted by changing the numbers" from an official ISTQB or TTB sample exam.**

Every question is written from scratch, starting from a **learning objective (LO)**. Rationale: [`08-legal-and-copyright.md`](08-legal-and-copyright.md).

This isn't a constraint, it's the **product's positioning**: the largest pools on the market are built from leaked or retired exam versions; ours is derived from the syllabus and traceable.

---

## 2. Question-writing process

```
1. Pick an LO           → from objectives.json, start with the one with the fewest questions in the coverage report
2. Read the K-level     → the LO's K-level determines the question type (§3)
3. Read the syllabus    → read the relevant section in TR and EN, note the terms
4. Write the question in EN → write in English; ISTQB's phrasing is built on English
5. Translate to TR      → follow the term glossary in §5; localize it, don't translate word-for-word
6. Write the rationales → a separate "why" for each option (§4)
7. Add attribution      → syllabusRef (§x.y.z), objectives[], kLevel
8. Self-review          → §6 checklist
9. Open a PR            → CI validates, a second reviewer checks
```

---

## 3. Question type by K-level

The K-level determines **what the question is supposed to make the candidate do**. The wrong K-level leads to both a mistimed question and an unrealistic exam.

### K1 — Remember (8 questions / 40)
Definitions, lists, terms. *"...'in tanımı hangisidir?"*, *"Aşağıdakilerden hangisi bir ... değildir?"*

✅ **Good:** "Kusurun (defect) ISTQB tanımı hangisidir?"
❌ **Bad:** "Aşağıdakilerden hangisi doğrudur?" (vague, no K-level)

### K2 — Understand (24 questions / 40) — **the majority of the exam**
Discriminating, explaining, classifying, matching examples. At this level the question **includes a scenario**.

✅ **Good:** "Bir geliştirici kodu derlerken sözdizimi hatası alıyor. Bu durum error, defect ve failure kavramlarından hangisine örnektir?"
❌ **Bad:** "Error nedir?" (this is K1)

> **The most productive pattern when writing K2 questions:** pit two concepts users commonly confuse against each other. Classic confusions found in the market research: *monitoring vs control*, *defect vs failure*, *verification vs validation*, *severity vs priority*, *test case vs test procedure*, *retesting vs regression testing*.

### K3 — Apply (8 questions / 40) — **all of them in Chapters 4 and 5**
Applying a technique to concrete data. Requires calculation, counting, derivation.

✅ **Good:** Equivalence partitioning, boundary value analysis, decision tables, state transitions, statement/decision coverage, test estimation.
❌ **Bad:** "Eşdeğerlik bölümlemesi nedir?" (this is K1/K2)

> **In the real exam, K3 questions are timed at 3 minutes per question**, but are still worth **1 point.** Calibrate difficulty accordingly: it should be solvable in 3 minutes.

> **There is no K4** — the Foundation Level has no K4 questions.

---

## 4. Writing rationales — our main differentiator

Every question carries a **two-layer** rationale:

### `rationale.summary`
2–3 sentences. Explains **why** the correct answer is correct, by naming the underlying concept. Does not restate the question.

### `rationale.byOption` — **mandatory for every option**

| Option | Rationale rule |
|---|---|
| Correct option | *"Doğru."* + why. Name the concept. |
| Wrong option | *"Yanlış."* + **what that option actually describes** + why it doesn't fit here |

> **The most common mistake:** *"Yanlış, çünkü doğru cevap C'dir."* This is not a rationale. Every wrong option must represent **a concept in its own right**, and that concept must be explained. This is exactly what the candidate needs to be able to tell apart on the exam.

✅ **Good:** *"Yanlış. Bu prensip her kombinasyonun test edilemeyeceğini söyler; test etkinliğinin zamanla azalmasını açıklamaz."*
❌ **Bad:** *"Yanlış, bu doğru cevap değil."*

### Attribution
Every rationale carries `syllabusRef` (`§4.2.3`), `objectives[]`, and `kLevel`, and is shown as a chip in the UI. This is **the highest-credibility feature that costs nothing beyond editorial discipline.**

---

## 5. Turkish terminology

### Source hierarchy
1. **Primary:** the TTB CTFL v4.0.1 Turkish syllabus — `data/ctfl-v4.0.1/terms.json`
2. **Secondary:** the TTB *Yazılım Testi Terimler Sözlüğü* (Software Testing Terms Glossary) — ⚠️ **based on v3.7, incompatible with v4.0.** Only used after verification.
3. **Last resort:** editorial translation — marked as `trSource: "editorial"` and subject to review.

> ### ⚠️ This section was completely rewritten on 19.09.2026
> Its first version was written before the official TR syllabus was available and **most of it was wrong** —
> in some rows the official term was even listed in the "do not use" column (e.g. **hata**, the correct
> match for *defect*, was mistakenly banned; *kusur*, which is not the syllabus's word for *defect*, was
> imposed in its place).
>
> **Correction, 22.09.2026.** An earlier version of this section, and of `CLAUDE.md`, said *kusur* "does
> not appear in the syllabus". That is false. It appears in four places in the TR syllabus, none of them
> as the translation of *defect* on its own:
>
> | Where | Phrase |
> | ----- | ------ |
> | §4.2.4 | *"...**kusur maskelenmesini**, yani bir hatanın diğerinin tespitini engellediği durumları önlemeye yardımcı olur."* |
> | §4.4.1 | *"Geliştiricilerin yapma eğiliminde olduğu **kusurlar**..."* |
> | §4.4.1 | *"**Kusur ortaya çıkarmaya yönelik saldırılar** hata tahminlemenin uygulanmasına yönelik metodik bir yaklaşımdır."* (fault attacks) |
> | §1 commentary | a remark about a flaw in the superseded FL2018 syllabus — nothing to do with the triad |
>
> The rule does not change: standalone *defect* is **hata**, and `terms.json` keeps *kusur* in
> `trForbidden`. Our content therefore writes *hata maskelenmesi* where the syllabus writes *kusur
> maskelenmesi*. What changes is the justification — the word is banned because it is the wrong
> translation of *defect*, not because the syllabus never uses it.
>
> The table below is now **measured, not derived** data: the ISTQB v4.0.1 (EN) and TTB v4.0.1 (TR)
> syllabi publish their per-chapter keyword lists in the same order, and the term counts matched
> exactly across all 6 chapters (30/17/10/18/26/1). The mapping is positional; not a single term was
> produced by editorial translation.
>
> The single source of truth is `data/ctfl-v4.0.1/terms.json`. This table is generated from it —
> **never edited by hand.**

### The critical distinction — where Turkish breaks down

The main pain point found in the market research:
> *"Error, bug, failure ingilizcede farklı anlamlara gelirken türkçede genellikle hepsi 'hata' başlığı altında ele alınıyor."*

**This distinction is directly tested on the exam.** The official terms:

| EN | Official TR | Why it gets confused |
|---|---|---|
| **error** | **insan hatası** | If it's just called "hata", it gets confused with *defect* |
| **defect** | **hata** | This is also the Turkish equivalent of "bug" |
| **failure** | **arıza** | NOT "başarısızlık" |
| root cause | kök neden | |

The official title of syllabus section 1.2.3: *"İnsan Hataları, Hatalar, Arızalar ve Kök Nedenler"*.

### Official term table (97 terms)

The `Chapter` column is the syllabus chapter where the term is defined as a keyword.

| EN | Official TR | Chapter | Do not use |
|---|---|:--:|---|
| acceptance criteria | **kabul kriterleri** | 4 |  |
| acceptance test-driven development | **kabul testi güdümlü yazılım geliştirme** | 4 |  |
| acceptance testing | **kabul testi** | 2 |  |
| anomaly | **anomali** | 3 |  |
| black-box test technique | **kara kutu test tekniği** | 4 |  |
| black-box testing | **kara kutu testi** | 2 |  |
| boundary value analysis | **sınır değer analizi** | 4 |  |
| branch coverage | **dal kapsamı** | 4 | ~~dal kapsaması~~ |
| checklist-based testing | **kontrol listesine dayalı test etme** | 4 |  |
| collaboration-based test approach | **iş birliğine dayalı test yaklaşımı** | 4 |  |
| component integration testing | **bileşen entegrasyon testi** | 2 |  |
| component testing | **bileşen testi** | 2 |  |
| confirmation testing | **onaylama testi** | 2 | ~~doğrulama testi~~ |
| coverage | **kapsam** | 1, 4 | ~~kapsama~~ |
| coverage item | **kapsam öğesi** | 4 |  |
| debugging | **hata ayıklama** | 1 |  |
| decision table testing | **karar tablosu testi** | 4 |  |
| defect | **hata** | 1 | ~~kusur~~ |
| defect management | **hata yönetimi** | 5 |  |
| defect report | **hata raporu** | 5 |  |
| dynamic testing | **dinamik test** | 3 |  |
| entry criteria | **giriş kriterleri** | 5 |  |
| equivalence partitioning | **denklik paylarına ayırma** | 4 | ~~eşdeğerlik bölümlemesi~~ · ~~denklik bölümleme~~ |
| error | **insan hatası** | 1 | ~~hata~~ |
| error guessing | **hata tahminleme** | 4 |  |
| exit criteria | **çıkış kriterleri** | 5 |  |
| experience-based test technique | **tecrübeye dayalı test tekniği** | 4 |  |
| exploratory testing | **keşif testi** | 4 | ~~keşifsel test~~ · ~~araştırmacı test~~ |
| failure | **arıza** | 1 | ~~hata~~ · ~~başarısızlık~~ |
| formal review | **resmi gözden geçirme** | 3 |  |
| functional testing | **fonksiyonel test** | 2 |  |
| informal review | **gayri resmi gözden geçirme** | 3 |  |
| inspection | **teftiş** | 3 | ~~inceleme~~ |
| integration testing | **entegrasyon testi** | 2 |  |
| maintenance testing | **bakım testi** | 2 |  |
| non-functional testing | **fonksiyonel olmayan test** | 2 |  |
| product risk | **ürün riski** | 5 |  |
| project risk | **proje riski** | 5 |  |
| quality | **kalite** | 1 |  |
| quality assurance | **kalite güvence** | 1 |  |
| regression testing | **regresyon testi** | 2 | ~~gerileme testi~~ |
| review | **gözden geçirme** | 3 | ~~inceleme~~ |
| risk | **risk** | 5 |  |
| risk analysis | **risk analizi** | 5 |  |
| risk assessment | **risk değerlendirmesi** | 5 |  |
| risk control | **risk kontrolü** | 5 |  |
| risk identification | **risk belirleme** | 5 |  |
| risk level | **risk seviyesi** | 5 |  |
| risk management | **risk yönetimi** | 5 |  |
| risk mitigation | **risk azaltma** | 5 |  |
| risk monitoring | **risk gözetimi** | 5 |  |
| risk-based testing | **risk bazlı test** | 5 |  |
| root cause | **kök neden** | 1 |  |
| shift left | **shift-left** | 2 | ~~sola kaydırma~~ |
| state transition testing | **durum geçişi testi** | 4 |  |
| statement coverage | **komut kapsama yüzdesi** | 4 | ~~ifade kapsaması~~ |
| static analysis | **statik analiz** | 3 |  |
| static testing | **statik test** | 3 |  |
| system integration testing | **sistem entegrasyon testi** | 2 |  |
| system testing | **sistem testi** | 2 |  |
| technical review | **teknik gözden geçirme** | 3 |  |
| test analysis | **test analizi** | 1 |  |
| test approach | **test yaklaşımı** | 5 |  |
| test automation | **test otomasyonu** | 6 |  |
| test basis | **test esası** | 1 | ~~test dayanağı~~ · ~~test tabanı~~ |
| test case | **test senaryosu** | 1 | ~~test durumu~~ |
| test completion | **test tamamlama** | 1 |  |
| test completion report | **test tamamlama raporu** | 5 |  |
| test condition | **test koşulu** | 1 |  |
| test control | **test kontrolü** <br><sub>also in the syllabus: *test kontrol*</sub> | 1, 5 |  |
| test data | **test verisi** | 1 |  |
| test design | **test tasarımı** | 1 |  |
| test execution | **test koşumu** | 1 |  |
| test implementation | **test uyarlama** | 1 |  |
| test level | **test seviyesi** | 2 |  |
| test monitoring | **test gözetimi** | 1, 5 | ~~test izleme~~ |
| test object | **test nesnesi** | 1, 2 |  |
| test objective | **test hedefi** | 1 |  |
| test plan | **test planı** | 5 |  |
| test planning | **test planlama** | 1, 5 |  |
| test procedure | **test prosedürü** | 1 |  |
| test process | **test süreci** | 1 |  |
| test progress report | **test ilerleme raporu** | 5 |  |
| test pyramid | **test piramidi** | 5 |  |
| test result | **test sonucu** | 1 |  |
| test strategy | **test stratejisi** | 5 |  |
| test technique | **test tekniği** | 4 |  |
| test type | **test çeşidi** | 2 |  |
| testing | **test etme** | 1 |  |
| testing quadrants | **test çeyrekleri** | 5 |  |
| testware | **test çalışma ürünleri** | 1 | ~~testware~~ · ~~test ürünleri~~ |
| traceability | **izlenebilirlik** | 1 |  |
| validation | **sağlama** | 1 | ~~geçerleme~~ |
| verification | **doğrulama** | 1 |  |
| walkthrough | **üzerinden geçme** | 3 | ~~teknik gözden geçirme~~ |
| white-box test technique | **beyaz kutu test tekniği** | 4 |  |
| white-box testing | **beyaz kutu testi** | 2 |  |

> **Writing rule:** the first time a term appears in a question, its English equivalent is given in parentheses: *"hata (defect)"*. If it recurs in the same question, it's used plain.

> ⚠️ **The real exam booklet is bilingual.** A candidate shouldn't have to see the Turkish term and go look up its English equivalent — our side-by-side mode replicates that exactly.

### Tone of the question language
- Not casual second-person phrasing, but **neutral exam language**: *"Aşağıdakilerden hangisi..."*, *"...için MİNİMUM kaç ... gerekir?"*
- Emphasis words are written in **UPPERCASE**: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`, `MİNİMUM`, `HANGİ İKİSİ` — the real exam does this, and it's what candidates overlook most.
- Turkish text runs ~15% longer than English; keep option text short.

---

## 6. Quality checklist

Before opening a PR, for every question:

**Structure**
- [ ] Targets a single LO (if more than one, `kLevel` is the highest of them)
- [ ] `kLevel` matches the LO's K-level
- [ ] `syllabusRef` points to the correct section
- [ ] `type`/`selectCount`/`correct` are consistent
- [ ] 4 options (can be 5 for multi — in the official exam, multi-select questions can have 5 options)

**Content**
- [ ] The question stem is understandable on its own, without looking at the options
- [ ] Wrong options are **plausible distractors** — no option that's obviously absurd
- [ ] No "Yukarıdakilerin hepsi" / "Hiçbiri" ("all of the above" / "none of the above") — they don't measure knowledge
- [ ] No double negatives
- [ ] The correct answer is **not noticeably longer** than the others (a classic cue leak)
- [ ] Options are mutually exclusive
- [ ] Emphasis words are written in uppercase

**Rationale**
- [ ] `summary` explains the correct answer by naming the concept
- [ ] `byOption` is filled in for **every option**
- [ ] Rationales for wrong options state what that option actually describes
- [ ] No rationale says "because the correct answer is X"

**Language**
- [ ] TR and EN have the same number and order of options
- [ ] Follows the term glossary (§5)
- [ ] TR text doesn't read like a machine translation
- [ ] The `error/defect/failure` distinction is preserved

**Legal**
- [ ] Not copied/adapted from an official sample exam
- [ ] `origin: "original"`

---

## 7. Coverage target and production plan

| Phase | Questions | Priority |
|---|---|---|
| **Phase 1 (MVP)** | **120** | ≥1 question per LO + weighted toward Chapters 4 and 5 |
| Phase 2 | 200 | ≥2 per LO; strengthen the K3 pool |
| Phase 3 | 300 | ≥3 per LO; reach the point where ≥3 full exams can be generated per chapter |
| Phase 4 | 400+ | Difficulty variety; questions with diagrams |

### Per-chapter target distribution (Phase 3 / 300 questions)
Proportional to the real exam's weighting, **plus an extra allowance for K3**:

| Chapter | Exam weight | Target questions | Why |
|---|---|---|---|
| 1 Fundamentals | 8/40 (20%) | 55 | |
| 2 Testing Throughout the SDLC | 6/40 (15%) | 40 | |
| 3 Static Testing | 4/40 (10%) | 28 | |
| 4 Analysis & Design | 11/40 (27.5%) | **90** | K3-heavy, needs the most practice |
| 5 Test Management | 9/40 (22.5%) | **70** | Chronically under-studied chapter |
| 6 Test Tools | 2/40 (5%) | 17 | |

> **Minimum for exam generation:** each LO group needs **at least 3x** as many published questions as its allotted question count, so generated exams don't repeat each other.

### Coverage report
`yarn stats` lists the number of published questions per LO and ranks the gaps. This report is auto-updated as `docs/coverage.md` and shown as a badge in the README.

---

## 8. AI usage policy

**Allowed:** draft generation, suggesting a Turkish translation, drafting a rationale, language checking, distractor ideas.

**Mandatory:** every AI output is verified against the syllabus and edited by a human. `status: "published"` isn't possible until `meta.reviewedBy` is filled in.

**Forbidden:**
- Publishing unverified AI output
- Asking an AI to "write an ISTQB sample exam question" — the model can reproduce an official question from memory out of its training data, which is a copyright violation
- Trusting a syllabus citation the AI fabricated (`syllabusRef` is verified by hand)

> The sneakiest mistake in model output: **assigning the wrong K-level** and **making up an LO code that doesn't exist.** CI catches the second one; the first needs a human eye.

---

## 9. Review workflow

```
Author → opens a PR (status: "draft")
  ↓
CI: JSON Schema (#1) + 20 checks (#2-#23, #14 and #23 retired)
  ↓
Reviewer: §6 checklist + syllabus comparison
  ↓
status: "review" → "published", meta.reviewedBy is filled in
  ↓
merge → deploy
```

Even on a single-person project, **writing and reviewing never happen in the same session** — at least a day's gap is left. Reviewing your own question the same day you wrote it stops you from seeing weak distractors.

### User error reports
Every question card has a "Bu soruda hata var" button → a pre-filled GitHub Issue (question ID, version, selected option, language). Incoming reports are triaged weekly; when a fix is accepted, the question's `revision` value is incremented and its SRS cards are moved to the `relearning` state.
