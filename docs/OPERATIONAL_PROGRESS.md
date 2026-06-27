# Operational Progress

Update this after every work loop. Keep entries factual: what changed, how it was tested, where evidence lives, what remains blocked, and the next recommended action.

## Current Deployment

- Public app: https://crisis-damage-intelligence.vercel.app
- Package/repo path: `/Users/luisrosal/Documents/Codex/2026-06-26/he/outputs/crisis_damage_intelligence_platform`
- Primary app file: `src/components/OperationsConsole.tsx`
- Map implementation: `src/components/map/MapPanel.tsx`
- Catalog: `public/data/catalog.json`

## Current Operational Data State

- AOI12 La Guaira / Caraballeda:
  - Official EMSR884 vector: 120 features.
  - EMS post-event imagery: available.
  - Vantor pre-event reference: available with partial coverage/gaps.
  - VLM before/after comparisons: 107 reviewed, 13 skipped because before coverage was missing/black.
- AOI02 Caracas:
  - Official EMSR884 vector: 17 features.
  - MONIT01 points: 20.
  - Post-event imagery available.
  - Vantor pre-event reference scene identified: B160001100FD1910, 2026-03-20, LG06, 1% cloud cover.
  - VLM before/after comparisons: 17 reviewed, 0 skipped, but 15 are uncertain comparison problems because many post-event chips are dark/hazy, shadowed, or centered on canopy rather than clear rooftops.
- AOI06 Moron:
  - Official EMSR884 vector: 129 features.
  - MONIT01 points: 96.
  - Post-event imagery available.
- AOI08 San Felipe:
  - Official EMSR884 vector: 43 features.
  - MONIT01 points: 183.
  - Post-event imagery available.
- AOI03 Antimano:
  - Imagery available.
  - No official damage vector currently shown.
- AOI10 Guacara:
  - Imagery available.
  - No official damage vector currently shown.
- Catia La Mar:
  - Microsoft AI4G external prediction layer: 9,134 candidates.
  - This is triage-only and not official EMS confirmation.

## Recent Completed Work

### Before/After VLM For AOI12

- Added `scripts/run_minimax_ems_before_after_review.py`.
- AOI12 catalog now points to `vlm_before_after_review.jsonl`.
- Evidence panel prefers before/after comparison chip where available.
- Public QA verified `ems_00050` shows `dated_pre_event_comparison`.
- Deployment: https://crisis-damage-intelligence.vercel.app

Results:
- reviewed: 107
- skipped no-before/black-before: 13
- likely_destroyed: 26
- possible_major_damage: 33
- uncertain_comparison_problem: 32
- minor_visible_damage: 14
- no_change_visible: 2

QA evidence:
- `qa/local-before-after-vlm-qa.png`
- `qa/vercel-before-after-vlm-qa.png`

### Popup Clear On Background Click

- Map popup opens when clicking a feature.
- Clicking outside a polygon clears selected feature, popup, marker, and highlight.
- Public QA passed.

QA evidence:
- `qa/local-click-background-clears-popup.png`
- `qa/vercel-click-background-clears-popup.png`

### Affected Area Navigation

- Left navigation now shows affected areas instead of technical AOI/layer records.
- Label changed from `Ir a ciudad / AOI` to `Ir a zona afectada`.
- Areas are sorted by aggregated impact signal.
- Current order in Spanish:
  1. La Guaira / Caraballeda / Catia La Mar
  2. San Felipe
  3. Moron
  4. Caracas
  5. Antimano
  6. Guacara

QA evidence:
- `qa/local-city-nav-impact-order.png`
- `qa/vercel-city-nav-impact-order.png`

### Damage Opacity Behavior

- Damage opacity now applies to polygon and point outlines, not only fill.
- Moving opacity slider no longer refocuses the selected feature or forces zoom.
- Public QA passed with opacity `0.52 -> 0.05` and same focused feature.

QA evidence:
- `qa/local-opacity-slider-no-refocus.png`
- `qa/vercel-opacity-slider-no-refocus.png`

### AOI02 Caracas Before/After VLM Pilot

- Objective: expand credible before/after VLM beyond AOI12.
- Inventory result:
  - AOI02 has usable Vantor pre-event scene coverage for all 17 official EMS features.
  - Scene selected: `B160001100FD1910`, Vantor LG06, `2026-03-20T14:46:55Z`, 1% cloud cover.
  - AOI06 Moron, AOI08 San Felipe, and AOI10 Guacara have no Vantor Open Data pre-event scene intersection in the current Venezuela Earthquake Jun 2026 STAC collection.
  - AOI03 Antimano has Vantor pre-event scene intersections, but no official EMS damage vector yet.
- Implementation:
  - Generalized `scripts/run_minimax_ems_before_after_review.py` to support remote `/vsicurl/` Vantor COGs and CRS-safe chip extraction via `-projwin_srs EPSG:4326`.
  - Added yellow/black EMS feature outline overlays to before/after chips so the VLM and human reviewer can compare the mapped feature geometry, not only the centroid reticle.
  - Added `--force` and `--chips-only` runner modes so chips can be regenerated with better evidence overlays without re-spending VLM calls.
  - Ran VLM before/after for all 17 AOI02 official EMS features.
  - Updated `public/data/catalog.json` so AOI02 VLM layer uses `vlm_before_after_review.jsonl`.
- Results:
  - reviewed: 17
  - skipped no-before/black-before: 0
  - uncertain_comparison_problem: 15
  - no_change_visible: 1
  - minor_visible_damage: 1
  - action priorities: 13 review, 3 urgent_review, 1 deprioritize
- QA performed:
  - `npm run lint && npm run build`
  - Local browser QA: navigated to Caracas, opened `ems_00001`, verified compare chip loads and evidence shows `dated_pre_event_comparison`.
- Evidence:
  - `qa/aoi02-before-after-vlm-pilot-contact-sheet.png`
  - `qa/aoi02-before-after-vlm-full-contact-sheet.png`
  - `qa/aoi02-before-after-vlm-outlined-pilot-contact-sheet.png`
  - `qa/aoi02-before-after-vlm-outlined-full-contact-sheet.png`
  - `qa/local-aoi02-before-after-vlm.png`
- Result:
  - AOI02 now has complete before/after VLM coverage, but outputs are mostly uncertainty flags. The outline overlays show why: several EMS polygons are broad or edge-aligned and the centroid/outlined geometry may include canopy, road edge, or shadow instead of a clean roof target. This should be treated as a successful evidence-quality finding, not as a strong damage classifier.
- Next recommended action:
  - Search for better non-Vantor pre-event imagery for AOI02 or use AOI03 as an imagery-only comparison pilot only if there are credible damage candidates. Do not scale AOI02 further without improving post-event chip quality or candidate centering.

### AOI02 Coordinate Verification

- Objective: verify that AOI02 map navigation, Google Maps links, and before/after chips are using the intended coordinates.
- Checks performed:
  - Compared `centroid_lat` / `centroid_lon` against each feature's `google_maps_url` query for AOI02, AOI12, and AOI06 samples.
  - Confirmed all 17 AOI02 feature centroids fall inside their source geometry bounding boxes.
  - Browser QA selected Caracas `ems_00001` and confirmed map center is `10.4101149,-66.8746227` at zoom 18, matching the feature centroid `10.41011488724138,-66.87462265793104`.
  - Checked chip extraction window for AOI02 `ems_00001`; before and after raster pixel coordinates both fall inside their respective rasters, with the same EPSG:4326 source window.
- Result:
  - No lat/lon swap or wrong-coordinate navigation was found.
  - The visual issue in AOI02 appears to come from EMS feature centroids and imagery quality: some `builtUpA` features/centroids fall on canopy, shadows, or broad mapped areas rather than a clearly visible roof center.
- Evidence:
  - `qa/local-aoi02-coordinate-centering-check.png`
- Next recommended action:
  - For VLM chips, consider using a better representative point derived from polygon interior/building footprint or a small multi-chip context around the feature, instead of relying only on the EMS centroid.

## Known Gaps

1. Imagery is still active-area based. The map loads all vector features, but not all AOI imagery at once.
2. Vercel deployment package is too large because chips/tiles are still bundled.
3. Area ranking currently includes external prediction counts in the visible order; this is labeled, but needs better source-weighted ranking.
4. VLM before/after exists for AOI12 and AOI02 only. AOI02 is mostly uncertainty due to imagery quality/centering.
5. Mobile end-to-end QA is incomplete.
6. Operator docs may be stale after the recent area-navigation and VLM before/after changes.
7. Human validation workflow is not implemented.
8. External bookmarked/social sources still need systematic review and ingestion only if trustworthy.

## Blockers

- More before imagery coverage is needed before running credible before/after VLM for AOI06, AOI08, and AOI10. AOI02 has coverage but poor comparison quality in many chips.
- Moving assets to R2/CDN requires confirming public object URLs and updating catalog paths safely.
- Any social media/bookmark evidence requires source verification before it can be shown as operational data.

## Active Goal

Improve the crisis damage intelligence app, prioritizing more before/after VLM analysis. The markdown files are memory and guardrails for the loop; they are not the goal.

## Next Recommended Loop

Run the next before/after VLM expansion loop:

1. Validate AOI02 on Vercel after deployment.
2. Search for better before imagery or alternative baselines for AOI06, AOI08, and AOI10 outside the current Vantor STAC collection.
3. For AOI03 Antimano, only run VLM if credible candidate features are available; imagery alone is not enough.
4. Add UI copy/metrics that surface AOI02's high uncertainty rate so users do not overread the VLM layer.

Do not run post-event-only VLM as if it were before/after comparison.

## Loop Entry Template

### YYYY-MM-DD HH:MM Local - Short Title

- Objective:
- Files changed:
- Commands run:
- QA performed:
- Screenshots/evidence:
- Deployment:
- Result:
- Blockers:
- Next recommended action:
