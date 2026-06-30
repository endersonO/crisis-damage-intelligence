import type { AoiRecord, DamageFeature, VlmRecord } from "@/components/types";

export const OFFLINE_CACHE = "rv-offline";

const Z_MIN = 13;
const Z_AREA_MAX = 16;
const DEEP_ZOOMS = [17, 18];
const MARGIN = 2;
const DEEP_BUFFER = 2;
const MAX_TILES_PER_AOI = 16000;
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

export function computeImportantUrls(
  aoi: AoiRecord,
  features: DamageFeature[],
  vlmMap: VlmMap,
): string[] {
  const urls = new Set<string>();
  const tileTemplates = [aoi.layers.afterTiles, aoi.layers.beforeTiles].filter(
    (template): template is string => typeof template === "string" && template.includes("{z}"),
  );

  const points: { lon: number; lat: number }[] = [];
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const feature of features) {
    if (!isImportant(feature, vlmMap)) continue;
    const lat = Number(feature.properties.centroid_lat);
    const lon = Number(feature.properties.centroid_lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push({ lon, lat });
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
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

  for (let z = Z_MIN; z <= Z_AREA_MAX; z += 1) {
    const nw = lonLatToTile(minLon, maxLat, z);
    const se = lonLatToTile(maxLon, minLat, z);
    const x0 = clamp(Math.min(nw.x, se.x) - MARGIN, 0, nw.n - 1);
    const x1 = clamp(Math.max(nw.x, se.x) + MARGIN, 0, nw.n - 1);
    const y0 = clamp(Math.min(nw.y, se.y) - MARGIN, 0, nw.n - 1);
    const y1 = clamp(Math.max(nw.y, se.y) + MARGIN, 0, nw.n - 1);
    for (let tx = x0; tx <= x1; tx += 1) {
      for (let ty = y0; ty <= y1; ty += 1) addTile(z, tx, ty);
    }
    if (urls.size > MAX_TILES_PER_AOI) return [...urls];
  }

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

export type PrecacheProgress = { done: number; total: number; stored: number; failed: number };

export type PrecacheResult = {
  /** Finished iterating without hitting the storage budget. */
  completed: boolean;
  /** Tiles cached now or already present in the offline cache. */
  stored: number;
  /** Tiles that failed to fetch/store (CORS-blocked, network error, or non-200). */
  failed: number;
  /** Tiles attempted in total. */
  total: number;
  /** Offline coverage is genuinely usable: we stored more than we failed. */
  ready: boolean;
};

export async function getOfflineBudgetBytes(): Promise<number> {
  try {
    const est = await navigator.storage?.estimate?.();
    const quota = est?.quota ?? 0;
    if (quota > 0) return Math.min(Math.floor(quota * 0.45), 400 * 1024 * 1024);
  } catch {
    // ignore
  }
  return 120 * 1024 * 1024;
}

async function currentUsageBytes(): Promise<number> {
  try {
    const est = await navigator.storage?.estimate?.();
    return est?.usage ?? 0;
  } catch {
    return 0;
  }
}

type PrecacheOpts = {
  onProgress?: (p: PrecacheProgress) => void;
  signal?: AbortSignal;
  budgetBytes?: number;
};

export async function precacheUrls(
  urls: string[],
  opts: PrecacheOpts = {},
): Promise<PrecacheResult> {
  const total = urls.length;
  if (typeof caches === "undefined" || urls.length === 0) {
    return { completed: true, stored: 0, failed: 0, total, ready: total === 0 };
  }
  const cache = await caches.open(OFFLINE_CACHE);
  let done = 0;
  let stored = 0;
  let failed = 0;
  let cursor = 0;
  let budgetHit = false;

  const report = () => opts.onProgress?.({ done, total, stored, failed });
  report();

  const worker = async () => {
    while (cursor < urls.length && !budgetHit) {
      if (opts.signal?.aborted) return;
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
        if (existing) {
          stored += 1;
        } else {
          // Explicit CORS: cross-origin tiles (e.g. R2 in production) only land
          // in the cache when the asset host returns Access-Control-Allow-Origin.
          // A blocked/opaque response throws or is !ok, so it is counted as a
          // miss instead of being silently reported as cached.
          const res = await fetch(url, { mode: "cors", signal: opts.signal });
          if (res.ok) {
            await cache.put(url, res.clone());
            stored += 1;
          } else {
            failed += 1;
          }
        }
      } catch {
        // CORS-blocked, offline, or intermittent link: count as a miss so the
        // caller never reports offline coverage that was never stored.
        if (!opts.signal?.aborted) failed += 1;
      }
      done += 1;
      if (done % 8 === 0 || done === total) report();
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  report();
  return {
    completed: !budgetHit,
    stored,
    failed,
    total,
    ready: stored > 0 && stored > failed,
  };
}

export async function precacheAoi(
  aoi: AoiRecord,
  features: DamageFeature[],
  vlmMap: VlmMap,
  opts: PrecacheOpts = {},
): Promise<PrecacheResult> {
  const urls = computeImportantUrls(aoi, features, vlmMap);
  return precacheUrls(urls, opts);
}
