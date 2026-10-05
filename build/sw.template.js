/**
 * F3-07 — the service worker. `build/pwa.ts` fills in the two placeholders
 * below and emits the result as `sw.js`; this file is never served as it is.
 *
 * Three rules, one per kind of request:
 *
 *   - The app shell (index.html and every file the build emitted) is cached
 *     on install, so the app opens with no network at all. The worker's
 *     version is hashed from those files' contents, so any change to one
 *     installs a new worker with a fresh copy of all of them.
 *   - data/manifest.json goes to the network first, and offline gets the
 *     last copy. Nothing else under data/ is touched: its file names never
 *     change and `contentClient` already caches it per `dataVersion`. A
 *     copy kept here would carry no version, and offline it would be handed
 *     to `contentClient` as the current one and stored under the new
 *     version's name.
 *   - A page navigation goes to the network first, and offline gets the
 *     cached shell, which routes on the client as usual.
 *
 * No `skipWaiting`: a new version waits until every tab of the old one is
 * closed, so a running tab keeps the shell its lazy chunks belong to.
 *
 * Nothing here sends anything anywhere (rule 7); it only answers the page's
 * own requests from a cache on this device.
 */

const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;

const SHELL_CACHE = `istqb-prep-shell:${VERSION}`;
const MANIFEST_CACHE = "istqb-prep-offline-manifest";
const SCOPE = new URL(self.registration.scope);
const SHELL_URL = new URL("./", SCOPE).href;
const MANIFEST_URL = new URL("data/manifest.json", SCOPE).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `reload` skips the HTTP cache: GitHub Pages lets a browser keep a
      // page for 10 minutes, and an old index.html beside the new scripts
      // would open a blank app offline.
      .then((cache) =>
        cache.addAll(
          PRECACHE.map((file) => new Request(new URL(file, SCOPE), { cache: "reload" })),
        ),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("istqb-prep-shell:") && name !== SHELL_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** The network's answer, kept for later; the kept copy only if there is none. */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

/**
 * A navigation is answered by the network whatever its status: GitHub Pages
 * serves the app's deep links as its 404 page, and that page is the app.
 */
async function navigate(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const shell = await caches.match(SHELL_URL);
    if (shell) return shell;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return networkFirst(request, SHELL_CACHE);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Fonts and links to other sites are left to the browser.
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }
  if (url.href.split("?")[0] === MANIFEST_URL) {
    event.respondWith(networkFirst(request, MANIFEST_CACHE));
    return;
  }
  if (url.pathname.startsWith(`${SCOPE.pathname}data/`)) return;
  event.respondWith(cacheFirst(request));
});
