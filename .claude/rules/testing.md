---
paths:
  - "src/**/*.test.{ts,tsx}"
  - "e2e/**"
  - "vitest.config.ts"
  - "playwright.config.ts"
---

# Tests (Vitest + Playwright)

- **`@testing-library/user-event` is not installed.** Use `fireEvent` from
  `@testing-library/react`. Reaching for `userEvent` out of habit means
  proposing a new dependency, which needs asking first.
- **`yarn test` (Vitest) must not collect files from `e2e/`.** The exclude in
  `vitest.config.ts` prevents this; remove it and Playwright's `test.beforeEach`
  blows up, and the command comes back red even if all 135 unit tests pass.
- **The E2E browser launches with the `en-US` locale**, set explicitly in
  `playwright.config.ts`. UI language is picked from `navigator.language`, so the
  specs select on English labels — read from `src/lib/i18n/locales/en.json`
  through `e2e/labels.ts`, never retyped in a spec. `ExamSetup` seeds the
  question language from the UI language too, so a test that cares about
  question language sets it explicitly instead of assuming the locale.
- **Options can be checkboxes, not radios.** In a multi-select ("HANGİ İKİSİ")
  question, `getByRole("radio")` never matches; look for both.
- **Never hardcode a session URL.** `routeForAttempt` gives each attempt one legal
  URL and `SessionRunner` redirects anything else, so a hardcoded path silently
  lands somewhere else instead of failing where it was written. Navigate the way
  a user does, or derive the path.
- **Instant feedback locks the answer.** A test that wants to keep changing
  answers must switch instant feedback off on the practice setup screen — study
  mode always has it on.
- **Resuming lands on the first unanswered question**, not the last one visited.
