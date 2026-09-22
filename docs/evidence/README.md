# evidence/

**Evidence** for claims that need verification goes here: screenshots, archive links, email correspondence.

Each item on the "Unverified" list in `docs/03-istqb-reference.md §7` is removed from that list once its evidence is added here.

## Verified

| File                                       | Claim                                                     | Verified   | For what |
| ------------------------------------------ | --------------------------------------------------------- | ---------- | -------- |
| `istqb-glossary-licence-2026-09-22.png`    | The ISTQB Glossary site footer carries a CC BY 4.0 notice. | 22.09.2026 | F0-02    |

### F0-02 — what was actually seen

Page: `https://glossary.istqb.org/en_US/search` (it redirects to `?term=&exact_matches_first=true`), rendered in a real browser rather than read from the app's i18n bundle, which is what the earlier attempt could only do.

The footer of the rendered page reads, verbatim:

> Except where otherwise noted, content on this site is licensed under a **Creative Commons Attribution 4.0 International license**

with the text linking to `https://creativecommons.org/licenses`, beside a `cc` mark and the version string **"ISTQB Glossary, V4.8.1"**.

Three things this does and does not settle:

1. **It settles the licence.** CC BY 4.0 permits reproducing a definition, including commercially, provided attribution is given. Our use is non-commercial anyway.
2. **It does not settle the version.** The live glossary is V4.8.1; our content is written against the CTFL **v4.0.1** syllabus. A definition copied from the glossary must therefore carry the glossary's own version, not the syllabus's, or the two get conflated.
3. **"Except where otherwise noted"** means the notice is a default, not a blanket. Any page that carries its own notice overrides it, so a definition is checked on the page it came from.

No glossary definition has been copied into `data/` yet. This entry unblocks that; it does not perform it.

## Pending

Nothing outstanding.
