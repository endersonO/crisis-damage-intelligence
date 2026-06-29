import type { AoiRecord, DamageFeature, VlmRecord } from "@/components/types";

// Dedicated cache for the heavy raster payloads we proactively keep for
// offline use. The service worker serves /data/tiles and /data/chips from here
// (cache-first) when present.
export const OFFLINE_CACHE = "rv-offline";

// Tunables. Two-band strategy so the field responder can distinguish STREETS
// offline without caching the whole 412 MB pyramid:
//  - AREA band (z13–16): the full damage bounding box, contiguous, no gaps —
//    pan the whole damaged area at neighbourhood scale.
//  - DEEP band (z17–18): only a tight buffer AROUND each damaged building, so
//    streets are sharp exactly where the damage is (incl. retina over-zoom),
//    while empty sea/terrain between clusters is skipped.
const Z_MIN = 13;
const Z_AREA_MAX = 16;
const DEEP_ZOOMS = [17, 18];
const MARGIN = 2; // perimeter tiles around the bounding box
const DEEP_BUFFER = 2; // tiles around each feature at street zoom
const MAX_TILES_PER_AOI = 16000; // defensive cap
const CONCURRENCY = 6;

type VlmMap = Record<string, VlmRecord>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function lonLatToTile(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x: clamp(x, 0, n - 1), y: clamp(y, 0, n - 1), n };
}

function buildTileUrl(template: string, z: number, x: number, y: number) {
  return template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

function isImportant(feature: DamageFeature, vlmMap: VlmMap) {
  return !feature.properties.not_official_ems || Boolean(vlmMap[feature.properties.id]);
}

// All the same-origin tile + chip URLs that cover the IMPORTANT damage in an
// AOI (official EMS or VLM-reviewed), with a perimeter buffer for context.
export function computeImportantUrls(
  aoi: AoiRecord,
  features: DamageFeature[],
  vlmMap: VlmMap,
): string[] {
  const urls = new Set<string>();
  const tileTemplates = [aoi.layers.afterTiles, aoi.layers.beforeTiles].filter(
    (t): t is string => typeof t === "string" && t.includes("{z}"),
  );

  // Important (official/VLM) damage points + bounding box + evidence chips.
  const points: { lon: number; lat: number }[] = [];
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const feature of features) {
    if (!isImportant(feature, vlmMap)) continue;
    const lat = Number(feature.properties.centroid_lat);
    const lon = Number(feature.properties.centroid_lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push({ lon, lat });
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
    const vlm = vlmMap[feature.properties.id];
    if (vlm) {
      for (const chip of [vlm.before_event_chip, vlm.post_event_chip, vlm.compare_chip]) {
        if (typeof chip === "string" && chip) urls.add(chip);
      }
    }
  }

  if (points.length === 0 || tileTemplates.length === 0) return [...urls];

  const addTile = (z: number, x: number, y: number) => {
    for (const template of tileTemplates) urls.add(buildTileUrl(template, z, x, y));
  };

  // AREA band: every tile in the damage bounding box (+ margin), contiguous.
  for (let z = Z_MIN; z <= Z_AREA_MAX; z += 1) {
    const nw = lonLatToTile(minLon, maxLat, z); // north-west (min y)
    const se = lonLatToTile(maxLon, minLat, z); // south-east (max y)
    const x0 = clamp(Math.min(nw.x, se.x) - MARGIN, 0, nw.n - 1);
    const x1 = clamp(Math.max(nw.x, se.x) + MARGIN, 0, nw.n - 1);
    const y0 = clamp(Math.min(nw.y, se.y) - MARGIN, 0, nw.n - 1);
    const y1 = clamp(Math.max(nw.y, se.y) + MARGIN, 0, nw.n - 1);
    for (let tx = x0; tx <= x1; tx += 1) {
      for (let ty = y0; ty <= y1; ty += 1) addTile(z, tx, ty);
    }
    if (urls.size > MAX_TILES_PER_AOI) return [...urls];
  }

  // DEEP band: street-level tiles only around each damaged building.
  for (const z of DEEP_ZOOMS) {
    const seen = new Set<string>();
    for (const { lon, lat } of points) {
      const { x, y, n } = lonLatToTile(lon, lat, z);
      for (let dx = -DEEP_BUFFER; dx <= DEEP_BUFFER; dx += 1) {
        for (let dy = -DEEP_BUFFER; dy <= DEEP_BUFFER; dy += 1) {
          const tx = clamp(x + dx, 0, n - 1);
          const ty = clamp(y + dy, 0, n - 1);
          const key = `${tx}/${ty}`;
          if (seen.has(key)) continue;
          seen.add(key);
          addTile(z, tx, ty);
        }
      }
      if (urls.size > MAX_TILES_PER_AOI) return [...urls];
    }
  }

  return [...urls];
}

export type PrecacheProgress = { done: number; total: number };

// How much of the storage quota we're willing to use for offline imagery,
// leaving generous headroom so the app shell (HTML/CSS/JS) is NEVER evicted.
// Without this, a large precache fills the quota and the browser evicts the
// shell, breaking the whole offline experience.
export async function getOfflineBudgetBytes(): Promise<number> {
  try {
    const est = await navigator.storage?.estimate?.();
    const quota = est?.quota ?? 0;
    if (quota > 0) return Math.min(Math.floor(quota * 0.45), 400 * 1024 * 1024);
  } catch {
    // ignore
  }
  return 120 * 1024 * 1024; // conservative fallback
}

async function currentUsageBytes(): Promise<number> {
  try {
    const est = await navigator.storage?.estimate?.();
    return est?.usage ?? 0;
  } catch {
    return 0;
  }
}

// Cache a list of URLs into OFFLINE_CACHE with bounded concurrency. Idempotent
// (skips already-cached entries) and best-effort (per-URL failures ignored).
type PrecacheOpts = {
  onProgress?: (p: PrecacheProgress) => void;
  signal?: AbortSignal;
  budgetBytes?: number;
};

// Cache a list of URLs into OFFLINE_CACHE with bounded concurrency. Idempotent
// (skips already-cached entries), best-effort (per-URL failures ignored), and
// budget-aware: stops once storage usage approaches budgetBytes so the cache
// never fills the quota and evicts the app shell. Returns false if it stopped
// early because the budget was hit.
export async function precacheUrls(
  urls: string[],
  opts: PrecacheOpts = {},
): Promise<boolean> {
  if (typeof caches === "undefined" || urls.length === 0) return true;
  const cache = await caches.open(OFFLINE_CACHE);
  const total = urls.length;
  let done = 0;
  let cursor = 0;
  let budgetHit = false;

  const report = () => opts.onProgress?.({ done, total });
  report();

  const worker = async () => {
    while (cursor < urls.length && !budgetHit) {
      if (opts.signal?.aborted) return;
      // Periodically check we're still within budget (leave room for the shell).
      if (opts.budgetBytes && cursor % 40 === 0) {
        if ((await currentUsageBytes()) > opts.budgetBytes) {
          budgetHit = true;
          return;
        }
      }
      const url = urls[cursor];
      cursor += 1;
      try {
        const existing = await cache.match(url);
        if (!existing) {
          const res = await fetch(url, { signal: opts.signal });
          if (res.ok) await cache.put(url, res.clone());
        }
      } catch {
        // best-effort: ignore this URL (offline / 404 / aborted)
      }
      done += 1;
      if (done % 8 === 0 || done === total) report();
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return !budgetHit;
}

export async function precacheAoi(
  aoi: AoiRecord,
  features: DamageFeature[],
  vlmMap: VlmMap,
  opts: PrecacheOpts = {},
): Promise<boolean> {
  const urls = computeImportantUrls(aoi, features, vlmMap);
  return precacheUrls(urls, opts);
}

// Loads an AOI's damage features + VLM map from the network (for zones that are
// not the active one and therefore not in memory). Tolerant of failures.
export async function fetchAoiData(
  aoi: AoiRecord,
  signal?: AbortSignal,
): Promise<{ features: DamageFeature[]; vlmMap: VlmMap }> {
  const features: DamageFeature[] = [];
  const vlmMap: VlmMap = {};

  try {
    const res = await fetch(aoi.layers.damage, { signal });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.features)) {
        for (const f of json.features as DamageFeature[]) {
          if (f?.properties) {
            f.properties.aoi_id = f.properties.aoi_id ?? aoi.id;
            features.push(f);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  if (aoi.layers.vlm) {
    try {
      const res = await fetch(aoi.layers.vlm, { signal });
      if (res.ok) {
        const text = await res.text();
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const rec = JSON.parse(trimmed) as VlmRecord;
            if (rec?.id) vlmMap[rec.id] = rec;
          } catch {
            // skip malformed line
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { features, vlmMap };
}
