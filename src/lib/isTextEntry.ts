/** Typing in a real text field must never be swallowed by a shortcut. */
export function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;

  const tag = element.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;

  // Radios and checkboxes are the options themselves — shortcuts stay live
  // there, otherwise a keyboard user would lose them after the first answer.
  const type = (element as HTMLInputElement).type;
  return type !== "radio" && type !== "checkbox" && type !== "button";
}
