/**
 * F0-17 — the product's name, in exactly one place.
 *
 * D-01 accepted a known brand risk: ISTQB® is a registered trademark and this
 * project uses it in its name. The expected outcome is not a lawsuit but a
 * letter asking for a rename (`docs/10-risks-and-metrics.md` R-01b), so the
 * mitigation is that renaming costs one line.
 *
 * It is deliberately NOT an i18n string. A product name is not translated —
 * putting it in the locales meant two copies that could drift, and neither of
 * them could reach `index.html`. `vite.config.ts` substitutes `%APP_NAME%` in
 * the HTML shell from this same constant, so the pre-hydration title and the
 * rendered header can never disagree.
 */
export const PRODUCT_NAME = "ISTQB-PREP";

/**
 * Where the project lives. There is no backend and no error-reporting service
 * (rule 7), so a question report is a GitHub issue the candidate opens
 * themselves — which also means the report is public, attributable and
 * reviewable, exactly like the questions it is about (F2-08).
 */
export const REPO_URL = "https://github.com/unalcakir28/istqb-prep";
