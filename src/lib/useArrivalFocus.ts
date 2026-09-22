/**
 * Focus for a screen that is navigated to rather than loaded.
 *
 * `/sonuc` and `/inceleme` replace the whole screen with no page load, so
 * nothing tells a screen reader where the user now is. Focusing the heading is
 * what announces it — the same treatment `StudySession`'s own result screen
 * already had, and the one the other two modes were missing.
 *
 * Only on that path, though. Opening either URL cold — a bookmark, a reload —
 * IS a page load, with nothing to announce; moving focus to a `tabIndex={-1}`
 * heading there would put the tab position AFTER it and leave the skip link
 * and the whole nav reachable only by Shift+Tab.
 *
 * The navigation TYPE is what expresses that, not `location.key`. The key looks
 * like it would — React Router keys the initial history entry `"default"` and
 * generates one for every navigation after it — but a `replace` navigation
 * writes its key into `history.state`, and the browser restores `history.state`
 * across a reload. So refreshing a result the session had handed over to came
 * back keyed, read as an arrival, and moved focus on a real page load. The type
 * is `"POP"` for both the initial load and a reload, and `"PUSH"`/`"REPLACE"`
 * only for a navigation the app performed.
 *
 * It is `"POP"` for the back button too, so returning to a result with Back no
 * longer announces the heading. That is the trade-off `StudySession`'s own
 * `finishedVia` already makes, and the cheaper mistake: a missed announcement
 * on a screen the user chose to go back to, rather than a broken tab order on
 * every refresh of the most common screen in the app.
 *
 * `ready` holds the move until the heading has rendered; before that there is
 * only a spinner to focus.
 */

import { useEffect, useRef, type RefObject } from "react";
import { useNavigationType } from "react-router-dom";

export function useArrivalFocus<T extends HTMLElement>(ready: boolean): RefObject<T | null> {
  const navigationType = useNavigationType();
  const ref = useRef<T>(null);
  const navigated = navigationType !== "POP";

  useEffect(() => {
    if (!navigated) return;
    if (!ready) return;
    ref.current?.focus();
  }, [navigated, ready]);

  return ref;
}
