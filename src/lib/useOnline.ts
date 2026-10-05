/**
 * F3-13 — whether the browser says it is online, kept current.
 *
 * `navigator.onLine` is only half reliable: `false` means there is no
 * network at all, but `true` does not promise one that works. So it is used
 * one way only — to explain a failure as being offline when the browser says
 * so — and never to stop a request from being tried.
 */

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
