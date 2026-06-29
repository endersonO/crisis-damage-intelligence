// Service worker for Respuesta Venezuela.
//
// Goals, in order:
//   1. Make the app installable (PWA) and survive flaky / offline networks for
//      the app shell — this is a crisis tool used in degraded conditions.
//   2. Respect the project's low-bandwidth budget: NEVER cache the heavy map
//      payloads under /data/ (tiles, chips, COGs) or any cross-origin basemap
//      tiles. Those would blow past device storage and the asset budget.
const CACHE = "rv-shell-v1";
const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests; let basemap / CDN tiles go to the network.
  if (url.origin !== self.location.origin) return;

  // Heavy geospatial payloads are intentionally network-only.
  if (url.pathname.startsWith("/data/")) return;

  // Page navigations: network-first, fall back to the cached shell / offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"))
            .then((fallback) => fallback || caches.match("/")),
        ),
    );
    return;
  }

  // Static assets (_next/static, generated icons, fonts): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
