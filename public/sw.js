// Service worker for Respuesta Venezuela.
//
// Goals, in order:
//   1. Make the app installable (PWA) and survive flaky / offline networks for
//      the app shell — this is a crisis tool used in degraded conditions.
//   2. Respect the project's low-bandwidth budget: NEVER cache the heavy map
//      payloads under /data/ (tiles, chips, COGs) or any cross-origin basemap
//      tiles. Those would blow past device storage and the asset budget.
const CACHE = "rv-shell-v2";
// Heavy raster payloads (tiles/chips) that the app proactively precaches for
// offline field use live here, kept separate from the app shell.
const OFFLINE = "rv-offline";
const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  // Do NOT skipWaiting here: a new SW waits so the page can show an
  // "update available" prompt; it only takes over when the user opts in.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("message", (event) => {
  const data = event.data;
  // The page posts this when the user taps "Update".
  if (data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  // The page reports the exact hashed JS/CSS chunks of this build so we can
  // cache the real app shell for offline — the SW can't know the hashes, and
  // on first load these chunks are fetched before the SW controls the page.
  if (data && data.type === "CACHE_SHELL" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE).then((cache) => cache.addAll(data.urls).catch(() => {})),
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE && key !== OFFLINE)
            .map((key) => caches.delete(key)),
        ),
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

  const path = url.pathname;

  // COG / GeoTIFF: too big to ever cache — always network.
  if (/\.(tif|tiff|cog)$/i.test(path)) return;

  // Map tiles + evidence chips: served from the offline cache when the app has
  // precached the important ones; otherwise straight to network (we do NOT add
  // here — precaching is done explicitly so we only store what matters).
  if (path.startsWith("/data/tiles/") || path.startsWith("/data/chips/")) {
    event.respondWith(
      caches
        .open(OFFLINE)
        .then((cache) => cache.match(request))
        .then((hit) => hit || fetch(request)),
    );
    return;
  }

  // Small operational data (catalog, damage GeoJSON, VLM JSONL/CSV):
  // CACHE-FIRST so it loads instantly offline and never waits on a network that
  // hangs (e.g. a VPN tunnel in airplane mode). Revalidated in the background.
  if (path.startsWith("/data/")) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
    return;
  }

  // Page navigations: CACHE-FIRST (serve the shell instantly, never block on a
  // hanging network), revalidate in the background, offline page as last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached || caches.match("/offline").then((o) => o || caches.match("/")));
        return cached || network;
      }),
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
