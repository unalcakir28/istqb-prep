## What changed?

## Type

- [ ] Code
- [ ] Content (question / rationale / translation)
- [ ] Documentation
- [ ] Bug fix

---

## If this is a code PR

- [ ] `yarn lint` green
- [ ] `yarn test` green
- [ ] `yarn validate:data` green
- [ ] `tsc --noEmit` green

## If this is a content PR

### ⚖️ Originality statement (required)

- [ ] **I wrote this question myself.** I did not copy, translate, or adapt it from any official ISTQB/TTB sample exam, a paid course, or a "dump" source.

### Quality checklist (`docs/07-content-authoring-guide.md` §6)

- [ ] Targets a single LO; `kLevel` matches the LO
- [ ] `syllabusRef` points to the correct section
- [ ] `type` / `selectCount` / `correct` are consistent
- [ ] The question stem is understandable without looking at the options
- [ ] Distractors are plausible; no "all of the above"/"none of the above"; no double negatives
- [ ] The correct answer isn't noticeably longer than the others
- [ ] Emphasis keywords are in capitals (`EN İYİ`, `HARİÇ`, `HANGİ İKİSİ`)
- [ ] `rationale.byOption` is filled in **for every option** (TR and EN)
- [ ] No rationale says "because the correct answer is X"
- [ ] TR/EN option counts and order match
- [ ] Turkish terminology glossary followed (`error/defect/failure` → `insan hatası/hata/arıza`)
