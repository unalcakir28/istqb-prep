# 08 — Legal Framework and Copyright

**Version:** 1.0 · **Date:** 19.09.2026
**Status:** ⚠️ This document is not legal advice. A lawyer should be consulted before any commercial step is taken.

> **This document in one sentence:** official ISTQB sample exam questions cannot go on the site. All questions will be written from scratch. Learning objective codes, chapter titles, and exam parameters may be quoted with attribution.

---

## 1. ISTQB syllabus copyright clause (verbatim)

CTFL v4.0.1 syllabus, page 2:

> "All rights reserved. The authors hereby transfer the copyright to the ISTQB®. The authors (as current copyright holders) and ISTQB® (as the future copyright holder) have agreed to the following conditions of use:
>
> • **Extracts, for non-commercial use, from this document may be copied if the source is acknowledged.** Any Accredited Training Provider may use this syllabus as the basis for a training course if the authors and the ISTQB® are acknowledged as the source and copyright owners of the syllabus and provided that any advertisement of such a training course may mention the syllabus only after official accreditation of the training materials has been received from an ISTQB®-recognized Member Board.
>
> • **Any individual or group of individuals may use this syllabus as the basis for articles and books, if the authors and the ISTQB® are acknowledged as the source and copyright owners of the syllabus.**
>
> • **Any other use of this syllabus is prohibited without first obtaining the approval in writing of the ISTQB®.**
>
> • Any ISTQB®-recognized Member Board may translate this syllabus provided they reproduce the abovementioned Copyright Notice in the translated version of the syllabus."

## 2. Sample exam copyright clause (verbatim)

Sample Exam A v1.7, page 2 — **word-for-word the same structure**:

> • **Extracts, for non-commercial use, from this document may be copied if the source is acknowledged.**
>
> • Any Accredited Training Provider may **use this sample exam in their training course** if the authors and the ISTQB® are acknowledged as the source and copyright owners of the sample exam [...]
>
> • **Any individual or group of individuals may use this sample exam in articles and books, if the authors and the ISTQB® are acknowledged as the source and copyright owners of the sample exam.**
>
> • **Any other use of this sample exam is prohibited without first obtaining the approval in writing of the ISTQB®.**
>
> • Any ISTQB®-recognized Member Board may translate this sample exam [...]

The *Exam Structures & Rules* and *Exam Tables* documents carry the same 5 clauses too.

---

## 3. Analysis: what we can and cannot do

| Action | Status | Rationale |
|---|:---:|---|
| Showing chapter titles, LO codes and text, K-levels, the exam distribution table | ✅ | *"Extracts, for non-commercial use ... if the source is acknowledged"* — a limited extract, with attribution |
| Explaining the exam mechanics (40 questions / 26 points / 60 min) | ✅ | Factual information; not a copyright matter |
| **Our own original questions** | ✅ | Not a derivative work. **This is our core content strategy.** |
| Linking to the official PDFs | ✅ | Linking isn't copying |
| Showing glossary terms | ⚠️→✅ | Probably CC BY 4.0 — see §5, **verification needed** |
| Showing a few official questions as examples, with attribution | ⚠️ | "Extract" is arguable, but a **website isn't** in the list of permitted uses |
| **Putting all 186 official sample questions on the site** | ❌ | Not an "extract" — the whole document. Also, the permitted uses are limited to an *accredited training course* and *articles/books* |
| Ad or subscription revenue | ❌ | The permission is explicitly limited to **non-commercial** use |
| Republishing the full text of the syllabus | ❌ | Not an "extract" |
| Copying the TTB Turkish translation | ❌ | Translation rights belong to the Member Board; the same copyright notice applies |

### The biggest risk
The permitted forms of use are **explicitly enumerated** (an accredited training provider's course, articles, and books), and the clause closes with this sentence:

> *"Any other use ... is prohibited without first obtaining the approval in writing of the ISTQB®."*

**A practice-exam web app isn't on that list.** This doesn't automatically make the project unlawful — a short extract (LO codes, titles) is defensible — but **bulk use of official questions is not.**

---

## 4. Decisions made

### K-1 — All questions are original
Official ISTQB or TTB sample exam questions never enter the question bank **in any form** (copy, rephrasing, translation, "adaptation"). In the data model, the `origin` field **has no** `official` value; only `original`, `adapted` (a scenario adapted from a publicly available standard), and `community`.

> **What "adapted" does NOT mean:** taking an official question and changing the numbers isn't adaptation, it's a derivative work. `adapted` is only for cases like *a scenario description taken from a publicly available standard such as ISO 29119*.

### K-2 — No commercial use
The site is free. No ads, no subscriptions — not even a donate button in v1. This satisfies the *"for non-commercial use"* condition and is the main basis of the copyright argument. **If this decision ever changes, this entire analysis has to be redone.**

### K-3 — Attribution everywhere
- At the bottom of every page: *"Bu proje ISTQB® ve Turkish Testing Board ile ilişkili değildir. ISTQB® tescilli bir markadır."*
- On every LO/chapter title quotation: *"Kaynak: ISTQB® CTFL Syllabus v4.0.1 © ISTQB®"*
- On the `/kaynaklar` page: direct links to all official documents, and the full text of the copyright notice

### K-4 — Trademark use
- The name "ISTQB" is used **only descriptively** ("ISTQB sınavına hazırlık" — "preparing for the ISTQB exam"), never as a trademark.
- The ISTQB or TTB **logo is never used**.
- When the name "ISTQB" is used in the product name, **the descriptive-use defense weakens**. Turning a registered trademark into your own product's name doesn't enjoy the same protection as descriptive use like "ISTQB sınavına hazırlık".
- The impression that ISTQB or TTB has approved or accredited this is **never given anywhere** — this matters more than usual here because the name sits close to the trademark (see §6 disclaimer).

> **D-01 (19.09.2026): the product name `ISTQB-PREP` was chosen, and the risk in this clause was knowingly accepted.**
> Rationale: search visibility, and the fact that it's the word candidates are already searching for. The project is a personal, non-commercial effort; this strengthens the copyright footing (K-2) but doesn't by itself remove the trademark risk. The risk is logged at `10 §R-01b`.
> Mitigations this decision requires:
> - The disclaimer footer must be visible **on every page**, not buried (F1-C3).
> - The ISTQB logo, corporate color, or typography is never used; the wordmark is clearly distinct from ISTQB's.
> - The product name **is never hardcoded into code or data files** — it's read from a single place (`meta`/i18n), so that if a cease-and-desist letter ever arrives, renaming is a one-line job.
> - If a domain is ever registered (D-02: not being registered for now), it's recommended it not contain the word "istqb"; keeping the name and the domain apart lowers the risk.

### K-5 — No written permission request will be filed (D-05, 19.09.2026)
A permission request to ISTQB or TTB **will not be filed**. Rationale: asking for permission implies the assumption that permission is needed — but our footing isn't permission, it's K-1 (all questions are original), K-2 (no commercial use), and K-3 (attribution everywhere). All three hold regardless of any application.

This cost was accepted knowingly: it forgoes an official assurance and any chance of collaborating with TTB. The decision is revisited if direct contact ever comes from ISTQB or TTB; in that case the position stays defensible precisely because K-1 was adhered to.

### K-6 — Licensing
| Asset | License |
|---|---|
| Source code | **MIT** |
| Questions, rationales, translations (the ones we wrote) | **CC BY-SA 4.0** |
| Quoted ISTQB material (LO codes, titles) | © ISTQB, under extract rights |
| Glossary terms | Depends on the source — §5 |

> **Why CC BY-SA and not CC BY-NC?** The NC restriction might look like it just echoes ISTQB's non-commercial condition, but it would apply to *our own* content and would discourage contribution. SA (share-alike), on the other hand, stops the content from being taken and locked into a closed product without being shared back. For a dissenting view and a re-litigation of this decision, see D-03.

---

## 5. ISTQB Glossary license ⚠️

In the Glossary site's own localization file (`https://api.glossary.istqb.org/assets/translations/en_US.json`), the following footer text was found:

> *"Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license"*

**If true, this is CC BY 4.0** — the definitions of all 1128 terms could be used, with attribution, even commercially. That would make it our safest content source.

⚠️ **NOT FULLY VERIFIED.** This text was only found in the i18n JSON; since the Glossary is a JavaScript SPA, it couldn't be confirmed that the footer actually renders on the live page, no `creativecommons.org` link was found in the JS bundles, and the Wayback archive only preserved the SPA shell.

> **Action (TODO F0-02):** open `https://glossary.istqb.org/en_US/home` in a browser and **verify the footer by eye**, then save a screenshot under `docs/evidence/`. Until verified, glossary definitions are **rewritten in our own words**, never copied verbatim.

---

## 6. Other legal items

### 6.1 Personal data (KVKK / GDPR)
- **No personal data is ever sent** to a server. All progress lives on the user's device (IndexedDB).
- No cookies are used → no cookie banner is needed.
- If analytics are ever added, a cookieless counter that doesn't store IPs is used (Umami / GoatCounter).
- A privacy policy page is published regardless: "we collect nothing" is also a policy, and it's a trust signal.

### 6.2 Disclaimer
Visible on the site:
> *"Bu platform bağımsız bir topluluk projesidir; ISTQB® veya Turkish Testing Board ile hiçbir bağlantısı yoktur, onlar tarafından onaylanmamıştır. İçerik resmî müfredata dayanılarak özgün olarak hazırlanmıştır ancak sınavda çıkacak soruları yansıtmaz. Sınav sonucunuza dair hiçbir garanti verilmez. Resmî ve güncel bilgi için istqb.org ve turkishtestingboard.org adreslerine başvurunuz."*

### 6.3 Contributor declaration
If question contributions are ever opened up (Phase 4), a mandatory checkbox in the PR template:
> ☐ Bu soruyu **kendim yazdım**. Herhangi bir resmî ISTQB/TTB örnek sınavından, ücretli bir kurstan veya "dump" kaynağından kopyalamadım/uyarlamadım.

### 6.4 The anti-"dump" stance
ISTQB's code of ethics forbids sharing real exam questions. Some competitors openly violate this (*"Questions taken exclusively from the previous real exams"*). Our positioning is the exact opposite, and **this is a marketing advantage, not just a constraint**:

> *"Bu sitedeki hiçbir soru gerçek ISTQB sınavından alınmamıştır. Hepsi müfredattaki öğrenme hedeflerine göre sıfırdan yazılmıştır ve hangi hedefe ait olduğu her soruda yazar."*

---

## 7. To-do checklist

- [ ] (F0-02) Verify the Glossary footer license in a browser by eye, take a screenshot
- [x] ~~(F0-03) Send a written permission email to ISTQB~~ — cancelled by D-05
- [x] ~~(F0-04) Send an email to TTB about Turkish content and collaboration~~ — cancelled by D-05
- [x] ~~Make sure the product name doesn't evoke the ISTQB trademark~~ — this constraint was **knowingly dropped** by D-01 (name: `ISTQB-PREP`)
- [ ] Make the product name readable from a single source (keep the renaming cost low) — D-01 mitigation
- [ ] `/kaynaklar` page: full copyright notice text + official links
- [ ] Privacy policy page
- [ ] Disclaimer footer
- [ ] Originality declaration in the PR template
- [ ] `LICENSE` (MIT) + `CONTENT-LICENSE` (CC BY-SA 4.0)
