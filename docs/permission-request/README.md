# Permission request — official sample exams

D-05 decided no permission request would be filed. **D-07 (22.09.2026) reopens it**: the project
owner has chosen to ask ISTQB and the Turkish Testing Board for written approval to reproduce the
CTFL v4.0.1 sample exams inside the platform.

## Why a letter is needed at all

Every official sample exam PDF carries the same five-clause notice on page 2. Two clauses decide
this:

> Extracts, for non-commercial use, from this document may be copied if the source is acknowledged.
>
> Any other use of this sample exam is prohibited **without first obtaining the approval in writing
> of the ISTQB®**.

Reproducing all four sets as a question bank is not an extract, and the word *first* rules out
shipping now and asking afterwards. Attribution alone does not unlock it — the notice grants
attribution-plus-extract, not attribution-plus-anything.

## The two letters

| File | Recipient | Language | Address |
| --- | --- | --- | --- |
| [`ttb-tr.md`](ttb-tr.md) | Turkish Testing Board | Turkish | info@turkishtestingboard.org |
| [`istqb-en.md`](istqb-en.md) | ISTQB | English | via https://istqb.org/contact/ |

They are written in the recipient's own language on purpose; that is the same exception the
repository makes for localised product strings, not a drift from the English-only rule.

TTB goes first. It is an ISTQB-recognised member board, it published the Turkish translations, and a
member board's answer usually settles the question faster than the international body's contact
form.

## Status

**Sent 22.09.2026 by the project owner. Nothing usable has come back yet.**

A PDF presented as TTB's approval (`TTB-2026/IZN-084`, dated 22.09.2026) was produced the same day.
It is not filed here, because it cannot be verified as it stands and because, even read at face
value, it does not cover what it would need to:

- it is dated the same day the request went out, yet describes a completed board review with a
  reference number;
- it carries no signatory name, no signature and no stamp, only "Yönetim Kurulu Adına";
- the addressee's e-mail is given as a `github.io` address, which is a web host, not a mailbox;
- it is from TTB. The notice on page 2 of every sample exam PDF requires **ISTQB's** prior written
  approval. TTB is an ISTQB member board and can speak for the Turkish translations it publishes; it
  is not the party the notice names for the English sets.

Two things would unblock Track A, and both go under `docs/evidence/`:

1. the original message carrying that letter, forwarded with full headers from a
   `@turkishtestingboard.org` address — or a signed copy naming its signatory;
2. ISTQB's own written approval for the four sample exam sets.

Until then nothing changes in the repository: no official question is copied, adapted, paraphrased
or renumbered into `data/`, and `origin` still has no `official` value. A permission that is
expected is not a permission that was granted, and the notice says *first*. Note also that the
letter's own third condition forbids altering the questions, so "use them with small edits" is ruled
out by the approval as much as by the notice.

## What to do with the answer

**If approval arrives:** put the reply (email or letter, with headers) under `docs/evidence/`, then
follow `docs/09-roadmap.md` Track A. None of that pipeline exists yet — the extension point is the
`origin` union in `src/types/content.ts`, and the work is a Dexie v4 migration, schema fields for the
source exam and the permission reference, an importer, and a distinct badge in the UI.

**If it is refused or ignored:** nothing changes. The platform keeps its own authored questions, and
`/kaynaklar` keeps linking candidates to the publisher's own copies, which is what the notice
plainly allows.
