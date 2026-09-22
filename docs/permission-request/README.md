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

Send the Turkish one first. TTB is an ISTQB-recognised member board, it published the Turkish
translations, and a member board's answer usually settles the question faster than the
international body's contact form.

## What to do with the answer

**If approval arrives:** put the reply (email or letter, with headers) under `docs/evidence/`, then
follow `docs/09-roadmap.md` Track A. The ingestion pipeline is already built and tested; publishing
is a single command once the evidence file exists.

**If it is refused or ignored:** nothing changes. The platform keeps its own authored questions, and
`/kaynaklar` keeps linking candidates to the publisher's own copies, which is what the notice
plainly allows.
