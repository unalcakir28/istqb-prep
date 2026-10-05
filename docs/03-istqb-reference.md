# 03 — ISTQB Reference Page

> This document is the **verified factual foundation** the product is built on. Every line has been confirmed by reading the official PDFs. Constants are read from here when writing code.
> **Last verified:** 19.09.2026 (CTFL) · 02.10.2026 (CT-AI v2.0, §8)

---

## 1. Current syllabus status

| Item | Value | Source |
|---|---|---|
| Current CTFL syllabus | **v4.0.1** | PDF cover + Revision History |
| v4.0.1 date | **15.09.2024** — "CTFL v4.0.1 – Errata" | syllabus p.3 |
| v4.0 general release | 21.04.2023 (announced 09.05.2023) | syllabus p.3 |
| v3.1 retirement | EN: 09.05.2024 · other languages: 09.11.2024 | ISTQB announcement |
| v4.1 / v5.0 | **NONE** (as of September 2026) | Exam Structures & Rules tables **v1.19, 19.08.2026** still contains only a "CTFL v4.0" row |

**Sources**
- Syllabus PDF: https://istqb.org/?sdm_process_download=1&download_id=3345
- Download page: https://istqb.org/sdm_categories/certified-tester-foundation-level-ctfl-v4-0/
- Exam Structures & Rules: https://istqb.org/?sdm_process_download=1&download_id=3829
- Exam Structures & Rules **tables**: https://istqb.org/?sdm_process_download=1&download_id=3832

**v4.0 → v4.0.1 diff (Appendix C):** Errata only. The *wording* of 6 learning objectives changed (FL-1.4.1, FL-2.1.5, FL-3.1.1, FL-3.1.3, FL-4.1.1, FL-5.2.3) + alignment with glossary terms (*artifacts → work products*, *performance → performance efficiency*). **LO numbers, count, and K-levels did not change.**

### TTB Turkish translation — EXISTS ✔
- PDF: https://www.turkishtestingboard.org/files/pdfs/ISTQB_CTFL_Syllabus-v4.0.1.pdf
- Page: https://www.turkishtestingboard.org/temel-seviye-sertifikali-test-uzmani-ders-programi-turkce/
- Title: *"Sertifikalı Test Uzmanı Temel Seviye Ders Programı v4.0.1"* [Certified Tester Foundation Level Syllabus v4.0.1]

> **Critical for the data model:** in the Turkish translation, **LO codes stay in English as `FL-x.y.z`** (there is no localisation like `ÖH-`). So the LO code can be used as a **language-independent primary key**.

⚠️ *Unresolved inconsistency:* TTB says "valid as of 6 May 2024," but ISTQB's v4.0.1 errata date is 15.09.2024. The TTB page is likely carrying over v4.0's effective date.

---

## 2. Chapter structure and the official exam question distribution

> This table is **not in the syllabus** — it's in a separate document: *Exam Structures & Rules tables* v1.19 (19.08.2026), "CTFL v4.0" sheet.

| # | English title | TTB Turkish title | Study time | # of LOs | LO K-distribution | **Questions** | **Points** | **Question K-distribution** |
|---|---|---|---|---|---|---|---|---|
| 1 | Fundamentals of Testing | Yazılım Testinin Temelleri | 180 min | 14 | K1=3, K2=11, K3=0 | **8** | **8** | K1=2, K2=6, K3=0 |
| 2 | Testing Throughout the Software Development Lifecycle | Yazılım Geliştirme Yaşam Döngüsü Boyunca Test | 130 min | 10 | K1=2, K2=8, K3=0 | **6** | **6** | K1=2, K2=4, K3=0 |
| 3 | Static Testing | Statik Testler | 80 min | 8 | K1=4, K2=4, K3=0 | **4** | **4** | K1=2, K2=2, K3=0 |
| 4 | Test Analysis and Design | Test Analizi ve Tasarımı | 390 min | 14 | K1=0, K2=9, K3=5 | **11** | **11** | K1=0, K2=6, K3=5 |
| 5 | Managing the Test Activities | Test Aktivitelerini Yönetme | 335 min | 16 | K1=4, K2=9, K3=3 | **9** | **9** | K1=1, K2=5, K3=3 |
| 6 | Test Tools | Test Araçları | 20 min | 2 | K1=1, K2=1, K3=0 | **2** | **2** | K1=1, K2=1, K3=0 |
| | **TOTAL** | | **1135 min** | **64** | K1=14, K2=42, K3=8 | **40** | **40** | K1=8, K2=24, K3=8 |

> ⚠️ **The K-distribution of LOs and the K-distribution of questions are different.** E.g. Chapter 3 has 4 K1 LOs, but only 2 K1 questions are asked. The data model must keep the two in separate fields.

### Question timing table

| K-Level | Questions | Min per question | Total |
|---|---|---|---|
| K1 | 8 | 1 | 8 min |
| K2 | 24 | 1 | 24 min |
| K3 | 8 | 3 | 24 min |
| **TOTAL** | **40** | | **56 min** (exam is 60 min) |

### LO → question mapping rule (critical for exam generation)

The official table defines questions in **LO groups** and sets this rule:

> *"If there are more questions than LOs to distribute within a group of LOs then at least ONE question MUST BE BASED ON each LO. If there are fewer questions than LOs to distribute within a group of LOs then each question MUST COVER a different LO."*

Example groups:

| Chapter | LO group | Questions | K |
|---|---|---|---|
| 1 | `{FL-1.1.1, FL-1.2.2}` | 1 | K1 |
| 1 | `{FL-1.5.2}` | 1 | K1 |
| 1 | `{FL-1.1.2, FL-1.2.1, FL-1.2.3, FL-1.3.1, FL-1.4.1, FL-1.4.2}` | 1 | K2 |
| 1 | `{FL-1.4.3, FL-1.4.4, FL-1.4.5}` | **3** | K2 |
| 1 | `{FL-1.5.1, FL-1.5.3}` | 1 | K2 |
| 4 | `{FL-4.2.1, FL-4.2.2, FL-4.2.3, FL-4.2.4, FL-4.5.3}` | **5** | K3 |
| 5 | `{FL-5.1.4, FL-5.1.5, FL-5.5.1}` | **3** | K3 |
| 6 | `{FL-6.1.1}` | 1 | K2 |
| 6 | `{FL-6.2.1}` | 1 | K1 |

> This mechanism is **directly implementable**: we keep the LO groups and the question count per group in `exam-blueprint.json`, and run this rule during exam generation. We would be the only product on the market doing this.
> ⚠️ The full group list will be extracted verbatim from the official table during implementation and written into `data/ctfl-v4.0.1/exam-blueprint.json` (see TODO F0-05).

---

## 3. Exam mechanics

Source: *Exam Structures and Rules* v1.2 (02.05.2025)

| Property | Value | Clause |
|---|---|---|
| Total questions | **40** | EST Overview |
| Total points | **40** | EST Overview |
| Pass mark | **26 points** (*"Exactly 65% of the points = 26,00"*) | EST Overview + §5.3.1 |
| Pass percentage | **at least 65%** | §5.3.1 |
| Duration | **60 minutes** | EST Overview |
| Non-native English speakers | **+25% → 75 minutes** | §6.2.1 |
| Format | Multiple choice | §2.1.4, §5.1.2 |
| Points per question | **Every question is worth exactly 1 point** | §5.2.1 |
| Negative marking | **Not mentioned in any official document** ⚠️ | — |

The +25% row is a verified fact and stays. The product does not offer it: the extension belongs to a candidate sitting in a language that is not their own, a Turkish candidate sitting the Turkish paper does not get it, and what the mock exam simulates is the paper. `data/ctfl-v4.0.1/meta.json` therefore carries only `durationMinutes`. See D-06 in `docs/00-project-overview.md §9`.

### Correcting three common mistakes

**a) There is NO multi-point K3 question in Foundation.**
§5.2.1 (Foundation only): *"Each question is worth exactly ONE point."* K3 questions are also worth 1 point. The multi-point K3 (2 points) / K4 (3 points) rule (§5.2.2) is **only for Advanced Level and Specialist modules.** This is a very common piece of misinformation in the market.

**b) Questions with more than one correct answer DO EXIST — still worth 1 point.**
The official sample exams contain the phrase *"Select TWO options"*; the answer key has multi-answers like `a, e`.

| Set | Number of "Select TWO options" questions |
|---|---|
| A | 4 |
| B | 1 |
| C | 1 |
| D | 3 |

**c) Scope of examinability**
- §4.1.2 — **All LOs** in the syllabus are examinable
- §4.1.3 — **All keywords in the Glossary** tied to the syllabus are examinable
- §4.1.4 (FL + Specialist) — All keywords in the syllabus are examinable **at the level of understanding their definitions (K2)**
- Syllabus §0.6 — *"All sections of the syllabus are examinable, except for the Introduction and Appendices"*. Chapter 7 references (standards/books) are not examinable.
- §5.4.2 — If a question touches more than one LO, it targets **the LO with the highest K-level**.

> ⚠️ **Negative marking:** the terms `negative mark`, `penalty`, `deduct` were searched across the syllabus, Exam Rules, Exam Tables, and all 4 sample exams — **none of them contain it**. The industry treats it as "does not exist," but this could not be confirmed with an official statement. **Do not claim this on the site;** if needed, add a note saying "not stated in the official documents."

---

## 4. Official sample exams

**There are four sets: A, B, C, D.** (C and D are skipped in most sources.)

| Set | Version | Date | Compatible syllabus | Main questions | Additional questions | Questions | Answers |
|---|---|---|---|---|---|---|---|
| A | v1.7 | 01.04.2025 | **4.0.1** | 40 | **+26** (`#A1–#A26`) | [3352](https://istqb.org/?sdm_process_download=1&download_id=3352) | [3357](https://istqb.org/?sdm_process_download=1&download_id=3357) |
| B | v1.7 | 01.04.2025 | **4.0.1** | 40 | 0 | [3359](https://istqb.org/?sdm_process_download=1&download_id=3359) | [3365](https://istqb.org/?sdm_process_download=1&download_id=3365) |
| C | v1.6 | 25.03.2025 | 4.0 | 40 | 0 | [3369](https://istqb.org/?sdm_process_download=1&download_id=3369) | [3372](https://istqb.org/?sdm_process_download=1&download_id=3372) |
| D | v1.5 | 02.05.2025 | 4.0 | 40 | 0 | [3376](https://istqb.org/?sdm_process_download=1&download_id=3376) | [3380](https://istqb.org/?sdm_process_download=1&download_id=3380) |

**Total official question pool: 4×40 + 26 = 186 questions.**

### Structure of the answer documents (the model for our rationale format)

Each answer PDF contains:
1. **Answer Key table:** `Question # | Correct Answer | LO | K-Level | Points`
2. **Detailed table per question:** `Question | Correct | Explanation/Rationale | LO | K-Level | Points`
3. **A separate rationale for each option** — in the document's own words, *"Justification for each response (answer) option"*

> This structure is the official basis for our **distractor-based rationale** format: ISTQB itself justifies every single option separately, and products on the market don't imitate this. We will.

### Official note on the sample exam structure

> *"The first 40 questions (and their answers) are arranged according to the exam structure and rules and therefore simulate a sample exam. The block 'Additional Questions' ... are not part of the sample exam but may help the learner to gain deeper knowledge."*
>
> Footnote: *"In this sample exam the questions are sorted by the LO they target; **this cannot be expected of a live exam**."*

**Verified:** Set A's question order matches the chapter distribution exactly — Q1-8 (Ch1), Q9-14 (Ch2), Q15-18 (Ch3), Q19-29 (Ch4), Q30-38 (Ch5), Q39-40 (Ch6).
> **Product decision:** our exams **shuffle** the questions (like the real exam), but a "study in chapter order" mode is also offered separately.

### Turkish sample exams (TTB)
Page: https://www.turkishtestingboard.org/en/certified-tester-foundation-level-sample-exam-turkish/
- Set A (TR): https://www.turkishtestingboard.org/files/exams/FL-orneksinav-A-ceviri.pdf — *"Örnek Sınav Set A, Versiyon 1.5, Syllabus v4.0 ile uyumludur"* [Sample Exam Set A, Version 1.5, compatible with Syllabus v4.0]; **questions and answers in a single PDF**; format: `1) ... (1 puan – 1 seçenek seçin)` [1) ... (1 point – select 1 option)], for multi-answer: `HANGİ İKİSİ` [WHICH TWO]
- ⚠️ Direct PDF addresses for B, C, D could not be found; they are accessed via separate pages through the TTB menu.
- ⚠️ The Turkish translations lag behind the English ones (TR Set A v1.5 / v4.0 vs EN v1.7 / v4.0.1).

---

## 5. All ISTQB certifications (September 2026)

> Source: *Exam Structures & Rules tables* v1.19 (19.08.2026) Overview table. This table is direct seed data for `data/certifications.json`.

| Stream | Level | Abbreviation | Name | Questions | Points | Pass mark | Duration | +25% | On TTB |
|---|---|---|---|---|---|---|---|---|---|
| Core | Foundation | **CTFL** | Certified Tester Foundation Level v4.0 | 40 | 40 | 26 | 60 | 75 | ✔ TR+EN |
| Core | Advanced | CTAL-AT | Agile Tester v2.0 | 40 | 52 | 34 | 90 | 113 | ✔ |
| Core | Advanced | CTAL-TA | Test Analyst v4.0 | 45 | 78 | 51 | 120 | 150 | ✔ TR |
| Core | Advanced | CTAL-TA | Test Analyst v3.1 | 40 | 80 | 52 | 120 | 150 | — |
| Core | Advanced | CTAL-TAE | Test Automation Engineering v2.0 | 40 | 66 | 43 | 90 | 113 | ✔ |
| Core | Advanced | CTAL-TM | Test Management v3.0 | 50 | 88 | 58 | 120 | 150 | ✔ |
| Core | Advanced | CTAL-TTA | Technical Test Analyst v4.0 | 45 | 78 | 51 | 120 | 150 | ✔ |
| Agile | Foundation | CTFL-AT | Agile Tester | 40 | 40 | 26 | 90 | 113 | ✔ EN |
| Agile | Advanced | CTAL-ATT | Agile Technical Tester | 40 | 64 | 42 | 90 | 113 | — |
| Specialist | — | CT-AcT | Acceptance Testing | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-AI | AI Testing v2.0 | 40 | 44 | 29 | 60 | 75 | ✔ EN syllabus only; TTB exams from 21.10.2027 (§8) |
| Specialist | — | CT-AI | AI Testing v1.0 | 40 | 47 | 31 | 60 | 75 | ✔ TR |
| Specialist | — | CT-ATLaS | Agile Test Leadership at Scale v2.0 | 40 | 71 | 47 | 120 | 150 | — |
| Specialist | — | CT-ATLaS | ATLaS v2.0 UPGRADE | 23 | 44 | 29 | 75 | 94 | — |
| Specialist | — | CT-AuT | Automotive Software Tester v2.1 | 40 | 40 | 26 | 60 | 75 | ✔ TR |
| Specialist | — | CT-AuT | Automotive Software Tester v1.0 | 40 | 40 | 26 | 60 | 75 | ✔ |
| Specialist | — | CT-GaMe | Game Testing | 40 | 40 | 26 | 60 | 75 | ✔ |
| Specialist | — | CT-GenAI | Testing with Generative AI | 40 | 46 | 30 | 60 | 75 | ✔ |
| Specialist | — | CT-GT | Gambling Industry Tester | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-FT | Finance Testing | 40 | 45 | 30 | 60 | 75 | — |
| Specialist | — | CT-MAT | Mobile Application Testing | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-MBT | Model-Based Tester | 40 | 40 | 26 | 60 | 75 | — |
| Specialist | — | CT-PT | Performance Testing | 40 | 40 | 26 | 90 | 113 | ✔ |
| Specialist | — | CT-QDO | Quality in DevOps | 40 | 45 | 30 | 60 | 75 | — |
| Specialist | — | CT-SEC | Security Tester | 45 | 80 | 52 | 120 | 150 | — |
| Specialist | — | CT-STE | Security Test Engineer | 40 | 43 | 28 | 75 | 94 | — |
| Specialist | — | CT-TAS | Test Automation Strategy v1.0 | 40 | 49 | 32 | 60 | 75 | — |
| Specialist | — | CT-UT | Usability Testing | 40 | 40 | 26 | 60 | 75 | — |

**Expert Level** (different exam structure, includes essays; not in the Overview table):
CTEL-ITP-ATP · CTEL-ITP-ITPI · CTEL-TM-SM · CTEL-TM-OTM · CTEL-TM-MTT
⚠️ Expert Level exam parameters could not be verified in an official table.

### TTB practical information
- Exam format: **Remote Online** (appointment system, from your own computer)
- CTFL fee: **5,950 TRY + 20% VAT**
- No prerequisite
- TTB has been administering exams since 2006; ISO 9001 / 17024 certifications valid until May 2027
- **The exam booklet has questions in both Turkish and English** → direct basis for our bilingual UX

---

## 6. Glossary / terminology

### Official ISTQB Glossary — has an open JSON API ✔

- Web: https://glossary.istqb.org/en_US/home
- **API (no authentication):** `https://api.glossary.istqb.org/v1/terms`

Verified:
- Total terms: **1128**
- Each term: `{id, term, slug, version, definition, references[], used_in[{syllabus_name, version}]}`
- Can be filtered by `used_in` → **215 terms tied to CTFL v4.0** (`syllabus_name: "Foundation", version: "v4.0"`)
- The `references` field contains citations to standards such as ISO 29119

> This is the cleanest and legally safest source for generating flashcards and term quizzes.

### Turkish status

- ⚠️ **No Turkish term translation found** in the ISTQB online glossary. There is a UI translation (`https://api.glossary.istqb.org/assets/translations/tr_TR.json`), but the Turkish version of the term definitions is not in the API. (Since it's an SPA, language-selector behavior could not be tested — not conclusive.)
  Seen 05.10.2026: the per-term endpoint `https://api.glossary.istqb.org/v1/terms/<slug>` lists a `tr_TR` entry among each term's `languages` (checked for `test-case`). What it holds, and under which notice, was not checked; `yarn fetch:glossary` does not read it.
- **TTB has its own separate Turkish glossary:** *"ISTQB® Yazılım Testi Terimler Sözlüğü"* [ISTQB® Software Testing Glossary of Terms] (564 terms)
  https://www.turkishtestingboard.org/yazilim-testi-terimler-sozlugu-glossary/
- ⚠️ **This glossary is based on ISTQB Standard Glossary v3.7 — not compatible with CTFL v4.0.** v4.0 changed many terms (*artifacts → work products*, *performance → performance efficiency*, *test documentation → testware*).

> **Product rule:** for Turkish terminology, **TTB's v4.0.1 Turkish syllabus is primary**, and the TTB glossary is secondary and used **only after verification**. See [`07-content-authoring-guide.md`](07-content-authoring-guide.md).

---

## 7. Could not be verified

The following items must **not be asserted** in the product:

1. **Negative marking** — not mentioned in any official document; can't be said to exist, can't be said not to.
2. ~~**The ISTQB Glossary's CC BY 4.0 license**~~ — **verified 22.09.2026** and removed from this list. The footer of the rendered page (`glossary.istqb.org/en_US/search`, glossary V4.8.1) reads *"Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license"*, linking to creativecommons.org. Screenshot: `docs/evidence/istqb-glossary-licence-2026-09-22.png`. Two caveats carried forward: the live glossary is **V4.8.1**, not the syllabus's v4.0.1, and the API does not report the release, so the copied data records each term's `revision` and the index records `fetchedAt` (docs/08 §5); and *"except where otherwise noted"* makes the notice a default that a page can override, so each page is checked on its own.
3. **Turkish term translation in the Glossary** — not found in the API.
4. **Direct PDF addresses for TTB Turkish sample exams B/C/D.**
5. **Expert Level exam parameters.**
6. The contradiction between TTB's "6 May 2024" date and ISTQB's 15.09.2024 errata date.
7. Whether Sample Exams C and D will be updated to v4.0.1.
8. **CTFL-AT exam length.** The *Exam Structures & Rules tables* v1.19 Overview row gives **90** minutes; ISTQB's CTFL-AT certification page (read 02.10.2026) gives **60** (+25% non-native). Not used by the product (F4-01 moved to CT-AI, §8); `data/certifications.json` keeps the tables' value.
9. **Turkish wording of the CT-AI v2.0 learning objectives.** No Turkish v2.0 syllabus exists (§8), so the TR texts in `data/ct-ai-v2.0/objectives.json` are editorial translations, marked as such in that file's `source`.

---

## 8. CT-AI v2.0 (Certified Tester AI Testing) — the second certification

> **Last verified:** 02.10.2026. Read from the syllabus PDF and the *Exam Structures & Rules tables* v1.19, sheet "CT-AI v2.0". Neither is redistributed; local reading copies live in the git-ignored `.sources/`.

### Why CT-AI and not CTFL-AT

F4-01 named CTFL-AT. ISTQB's CTFL-AT page (read 02.10.2026) says the certification is in its **sunset**: exams and training only *"until the sunset dates (6 May 2027 for English, 6 November 2027 for non-English)"*. The same page says *"it does not appear to be useful for a candidate to take the AT exam if he/she is CTFL 4 certified"*, and TTB offers it in English only. On 02.10.2026 the second certification was moved to CT-AI v2.0.

### Status

| Item | Value | Source |
|---|---|---|
| Current syllabus | **v2.0**, released by the ISTQB General Assembly **17.04.2026** | syllabus p.3 (Revision History), p.8 |
| Release announcement | 21.04.2026 (page metadata; the post shows no date) | istqb.org news |
| v1.0 retirement | EN: **21.04.2027** · other languages: **21.10.2027** | ISTQB CT-AI page |
| Prerequisite | CTFL | ISTQB CT-AI page |
| Turkish syllabus | **None for v2.0.** TTB lists the v2.0 syllabus in English only. The Turkish TTB syllabus is v1.0 (2021). | TTB pages |
| TTB exam | v1.0 today (40 questions, 47 points, pass 31); v2.0 *"will be valid in the exams to be held as of Thursday, October 21, 2027"* | TTB AI Testing exam page |

**Sources**
- Syllabus PDF: https://istqb.org/?sdm_process_download=1&download_id=9558
- Certification page: https://istqb.org/certifications/certified-tester-ai-testing-ct-ai/
- Exam Structures & Rules tables: https://istqb.org/?sdm_process_download=1&download_id=3832
- TTB v2.0 syllabus page (EN): https://www.turkishtestingboard.org/sertifikali-test-uzmani-yapay-zeka-testi-ct-ai-mufredati-v2-0-ingilizce/
- TTB v1.0 Turkish syllabus (terminology reference only): https://www.turkishtestingboard.org/files/ISTQB-CT-AI-Syllabus-v1-TR.pdf
- TTB exam page: https://www.turkishtestingboard.org/en/ai-testing-exam/
- Sample exam (questions v2.2, answers v2.2): linked from the ISTQB certification page. **Rule 1 applies** — never copied, translated or adapted.

### Exam

40 questions · **44 points** · pass **29** (65% of 44 is 28.60) · **60 min** (75 with +25%) · K2 = 36 questions, K3 = 4 · **a K2 question is worth 1 point, a K3 question 2 points** · no K1, no K4.

| Chapter | Title | Training | LOs | Questions | Points |
|---|---|---|---|---|---|
| 1 | Introduction to Artificial Intelligence | 120 min | 8 (K2) | 6 (K2) | 6 |
| 2 | Quality Characteristics for AI-Based Systems | 45 min | 3 (K2) | 3 (K2) | 3 |
| 3 | Machine Learning | 375 min | 7 K2 + 1 K3 | 6 K2 + 1 K3 | 8 |
| 4 | Testing AI-Based Systems | 195 min | 6 K2 + 1 K3 | 6 K2 + 1 K3 | 8 |
| 5 | Input Data Testing for Machine Learning Systems | 180 min | 5 K2 + 1 K3 | 5 K2 + 1 K3 | 7 |
| 6 | Model Testing for Machine Learning Systems | 225 min | 8 K2 + 1 K3 | 8 K2 + 1 K3 | 10 |
| 7 | Machine Learning Development Testing | 30 min | 2 (K2) | 2 (K2) | 2 |
| **Total** | | **1170 min** | **43** (K2 = 39, K3 = 4) | **40** | **44** |

**LO → question mapping:** chapter 1 is one group — 6 questions over its 8 LOs. In chapters 2–7 every LO is its own group of exactly 1 question; chapter 3 lists AI-3.3.1 (K3) as its own group, and its seven K2 LOs as one group of 6 questions.

**LO codes** are `AI-x.y.z`, and the last part can be two digits (`AI-6.1.10`). The numbering has gaps — AI-3.1.3, 3.2.2, 3.3.2, 3.3.3, 3.4.2, 4.2.3, 5.1.7 and 6.1.6 are **hands-on objectives** (`HO-`, levels H1/H2) and are not examined. The four K3 LOs: AI-3.3.1 (confusion-matrix metrics), AI-4.2.2 (red teaming), AI-5.1.5 (dataset constraint testing), AI-6.1.5 (metamorphic testing).

**Copyright:** the same notice as CTFL — *"Extracts, for non-commercial use, from this document may be copied if the source is acknowledged."* The LO texts are copied as extracts with the source named, as for CTFL.

