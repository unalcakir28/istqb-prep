# 10 — Risks and Metrics

**Version:** 1.0 · **Date:** 19.09.2026

---

## 1. Risk register

Probability and impact: **D** (low) · **O** (medium) · **Y** (high)

| # | Risk | Prob. | Impact | Mitigation |
|---|---|:--:|:--:|---|
| **R-01** | **Copyright infringement claim** — ISTQB objects even to our use of LO codes/titles | D | **Y** | All questions are original (K-1); non-commercial (K-2); attribution everywhere (K-3). The written permission request was cancelled by D-05 (K-5) — this narrowed R-01's mitigation basis down to K-1/K-2/K-3 and raised the risk somewhat. If an objection comes in, the data model is set up so the references can be removed and we continue with our own text only. |
| **R-01b** | **Trademark objection** — the product name `ISTQB-PREP` directly contains the registered trademark (D-01, `08 §K-4`); ISTQB sends a warning letter | **O** | O | The name isn't hardcoded, it's read from a single source → renaming is a one-line job; the ISTQB logo/color/typography isn't used; a disclaimer is on every page; the domain doesn't contain "istqb". **This risk was knowingly accepted in D-01** — in exchange, search visibility and clarity were gained. If a letter arrives, the name changes; the content isn't affected. |
| **R-02** | **Content production stalls** — the effort of writing 300 questions is heavy for one person | **Y** | **Y** | Target split into phases (120→200→300); progress visible via coverage report; MVP is meaningful at 120 questions; AI-drafted + human-verified for speed (§ [`07`](07-content-authoring-guide.md) §8). **This is the single biggest real risk.** |
| **R-03** | **The syllabus is updated (v4.1/v5.0)** and content goes stale | O | **Y** | Every question carries `syllabusVersion`; a written retirement policy; a quarterly check that watches ISTQB announcements; old questions aren't deleted, they're filtered. **Not falling into the trap we criticize is part of the project's identity.** |
| **R-04** | **Turkish terminology error** — a mistranslation teaches the candidate something wrong | O | **Y** | A mandatory term glossary (§ [`07`](07-content-authoring-guide.md) §5); a CI warning for term leakage; every Turkish term carries `trSource`; an error-reporting flow |
| **R-05** | **Question quality declines** — distractors weaken as the pool grows | O | O | §6 checklist; writing and review never happen on the same day; user error reports; per-question accuracy rate monitored (too high/too low = suspect) |
| **R-06** | **Nobody finds it** — a distribution problem (see CertSim's 100 installs as an example) | **Y** | O | SEO (clean URLs, Turkish keywords, `/syllabus` pages as an organic entry point); Turkish Medium/LinkedIn posts; sharing on Ekşi/Reddit/Discord; being open source also brings traffic from GitHub |
| **R-07** | **Mistaken for a dump site** — the category as a whole suffers from distrust | O | O | The claim "no question is taken from a real exam" on the home page; an LO + version badge on every question; open source = auditable |
| **R-08** | **IndexedDB data is lost** (browser cleanup, incognito tab) | O | D | Export feature (F3-08); an info note shown to the user on first use; not critical data |
| **R-09** | **The mock-exam pool falls short** — the blueprint needs 40 questions and the pool doesn't have them | **Y** (early on) | O | Explicit warning on the setup screen; incomplete generation is never done silently; the coverage report shows which group is short |
| **R-10** | **GitHub Pages limits** (100 GB/month bandwidth, 1 GB repo) | D | O | Static JSON is small; no media. If exceeded, migrate to Cloudflare Pages (same build) |
| **R-11** | **Single-person dependency (bus factor 1)** | **Y** | O | Everything documented; data in Git; setup is a single command; can continue under MIT + CC BY-SA |
| **R-12** | **Scope creep** — "let's add this too" | **Y** | O | Phase scopes are written down; [`09-roadmap.md`](09-roadmap.md) has a "deliberately deferred" list |
| **R-13** | **AI-generated question reproduces an official question from memory** → unintentional copyright infringement | O | **Y** | The AI is never asked for a "sample exam question," only generation from an LO; every question is manually checked against official sample exams; anything suspiciously similar is rejected |
| **R-14** | ~~If the Glossary license is **not** CC BY 4.0, glossary content can't be used~~ **Closed 22.09.2026** | — | — | Verified by eye in a browser: the footer is CC BY 4.0 (`docs/evidence/istqb-glossary-licence-2026-09-22.png`). Two caveats carried forward, both in [`08 §5`](08-legal-and-copyright.md): the live glossary is V4.8.1 rather than v4.0.1, and "except where otherwise noted" makes the notice a per-page default |

### Three risks to watch
**R-02 (content stalling)**, **R-03 (syllabus update)**, and **R-06 (distribution)**. The others are manageable; these three could end the project.

---

## 2. Success metrics

### North star
> **Number of completed mock exams that passed** (weekly).
> Not visitor count, not "started attempts" — a **completed session that produced learning.**

### Product metrics

| Metric | Target (6 months) | Why |
|---|---|---|
| Mock exam completion rate | ≥ 70% | Starting and abandoning signals bad UX or wrong difficulty |
| Review tour view rate | ≥ 60% | The real learning happens here; if low, the drop-off from the results screen is severe |
| Rationale expand rate (practice mode) | ≥ 80% | Is our differentiator actually being used? |
| 7-day return rate | ≥ 25% | Prep is a 2–4 week process; a single visit isn't enough |
| Average session duration | ≥ 8 min | |
| Second mock exam rate | ≥ 40% | Stopping after one attempt means they didn't trust it |

### Content metrics

| Metric | Target |
|---|---|
| Published question count | 120 (M1) → 300 (M3) |
| LO coverage | 64/64 (≥1 question) → 64/64 (≥3 questions) |
| Distractor rationale completeness | **100%** (CI enforced) |
| Open question error reports | < 5, average closure < 7 days |
| Per-question accuracy rate distribution | 30–85% (outliers get reviewed) |

### Technical metrics

| Metric | Target |
|---|---|
| Lighthouse (4 categories) | ≥ 95 |
| axe critical violations | 0 |
| JS bundle (gzip) | < 200 KB |
| LCP (3G Fast) | < 1.5 s |
| Test coverage (engine code) | ≥ 85 |
| Time spent with a broken build | < 24 hours |

### Impact metrics (survey, optional)

| Metric | Target (6 months) |
|---|---|
| "I passed the exam" reports | ≥ 50 |
| "Would you recommend this site?" (NPS) | ≥ 40 |
| "I needed this in addition to the official PDFs" | ≥ 70% |

---

## 3. Measurement method and privacy

**Principle:** No metric is collected at the expense of privacy.

| Metric type | How |
|---|---|
| Page views, event counts | Cookie-free counter that retains no IPs (Umami / GoatCounter) |
| Mock exam completion, rationale expansion | Aggregate event counter — no user identity |
| Per-question accuracy rate | ⚠️ **Requires a server.** Not collected in v1. In Phase 4, how to do this while preserving privacy will be researched (e.g. fully anonymous, session-based batch submission) |
| Return rate | Counter-side, no fingerprinting; rough estimates are acceptable |
| Impact metrics | Voluntary survey link (on the results screen, dismissible) |

**Never collected:** IP mapping, device fingerprinting, user answers, progress data, email.

---

## 4. Quarterly review

To be checked every 3 months:

- [ ] Has ISTQB published a new syllabus version? (istqb.org announcements)
- [ ] Have the official sample exams been updated? (version numbers)
- [ ] Have the TTB Turkish translations been updated?
- [ ] Has the Exam Structures & Rules tables version changed? (affects the blueprint)
- [ ] Has any term changed in the Glossary? (API `version` field)
- [ ] Coverage report: which LOs are still short?
- [ ] Are there questions with an abnormal accuracy rate?
- [ ] Open error reports
- [ ] Dependency security advisories
- [ ] Where do metrics stand against targets?
