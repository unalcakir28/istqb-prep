import en from "../src/lib/i18n/locales/en.json" with { type: "json" };

/**
 * UI strings for the selectors, read from the shipped English locale instead
 * of being retyped here. The specs select by accessible name, so a copy change
 * in `en.json` must fail the test rather than silently leave a selector
 * pointing at text the app no longer renders.
 */
export { en };

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits a locale template on its `{{placeholder}}` parts. */
function parts(template: string): string[] {
  return template.split(/(\{\{\w+\}\})/);
}

function placeholderOf(part: string): string | undefined {
  return part.match(/^\{\{(\w+)\}\}$/)?.[1];
}

/** Fills a locale template, e.g. `Question {{current}} of {{total}}`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return parts(template)
    .map((part) => {
      const key = placeholderOf(part);
      return key === undefined ? part : String(values[key]);
    })
    .join("");
}

/**
 * Turns a locale template into an anchored pattern. Each placeholder is
 * replaced by the sub-pattern given for it, so the surrounding wording stays
 * owned by `en.json` and only the variable parts are written by the test.
 */
export function pattern(template: string, patterns: Record<string, string>): RegExp {
  const body = parts(template)
    .map((part) => {
      const key = placeholderOf(part);
      return key === undefined ? escapeRegExp(part) : patterns[key];
    })
    .join("");

  return new RegExp(`^${body}$`);
}
