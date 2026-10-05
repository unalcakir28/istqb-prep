/**
 * F3-07 — registers the service worker that `build/pwa.ts` emits.
 *
 * Production builds only: the dev server has no `sw.js`, and a worker left
 * over from a build would answer the dev server's requests from its cache.
 * Registration waits for `load` so it never competes with the first paint.
 * A browser without service workers simply runs the app online, as before.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL || "/";
    // Offline support is an extra: the app works the same without it.
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => undefined);
  });
}
