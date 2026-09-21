# ADR-0005 — Bilingualism: language per question, side-by-side view

**Status:** Accepted · **Date:** 19.09.2026

## Context
TTB's real exam booklet presents **both the Turkish and English text of each question**; the candidate can read whichever language they prefer. The reason is practical: ISTQB terminology is built on English, and the Turkish equivalents are sometimes ambiguous. The two clearest complaints from candidates in market research are exactly this:

> *"there are serious translation errors in the Turkish questions"*
> *"Error, bug, and failure mean different things in English, while in Turkish they are usually all lumped under 'hata' (error)."*

The only product on the market that mimics this bilingual structure is a Udemy course with 161 students.

## Options considered

| Option | Pro | Con |
|---|---|---|
| Separate TR and EN sites (`/tr`, `/en`) | Clean SEO | Content is split in two; candidate can't get the real exam's bilingual experience |
| Single language choice per account | Simple | Not how the real exam works; doesn't cover the candidate's need to check the other language at a critical moment |
| **Per-question language switch + optional side-by-side** | Faithfully mimics the real exam booklet | Data model must hold every question in two languages; a question can't be published if the translation is missing |
| Turkish only | Focus | Loses the international audience and the terminology bridge |

## Decision
**Every question mandatorily includes TR and EN.** The user can:
- Switch language with a single keystroke (`L`) while on a question — **their given answer is kept, the timer doesn't stop**
- Optionally turn on **side-by-side** mode (two columns on wide screens, stacked on narrow ones)
- **Interface language** and **content language** are independent (a Turkish-UI user can still request English questions)

In the data model, the translation isn't a separate file — it lives inside the question's `i18n` object, because the question and its translation **are reviewed together**.

CI rule: the build **breaks** if `i18n.tr` and `i18n.en` aren't both filled in, if the option counts don't match, or if `rationale.byOption` isn't complete in both languages.

## Rationale
Making language switching an account setting would miss the exact moment the candidate needs it most: when they're unsure of a term's Turkish equivalent. The real exam already offers this; offering it ourselves is part of realistic rehearsal.

Not splitting the translation into a separate file is deliberate: terminology error is this project's R-04 risk, and reviewing the translation together with the question, in the same PR, with the same eyes, is our only safeguard.

## Consequences
- **+** Closest product to the real exam experience — a structural differentiator nobody else has
- **+** Terminology bridge: the candidate sees the EN equivalent while learning the TR term
- **+** The same content serves both the Turkish and international audience; the pool isn't split
- **−** Every question costs twice as much (authoring + translation + rationale in both languages)
- **−** A question with a missing translation can't be published → content production speed drops (amplifies R-02)
- **−** Two languages on one URL for SEO: `lang` attributes must be set correctly, `hreflang` strategy needs revisiting later
- **−** Side-by-side mode noticeably complicates the question-card component
