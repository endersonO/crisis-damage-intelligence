# Pre-Event Baseline Suitability Report

Generated from `ops/baseline_inventory/pre_event_baseline_inventory.json`.

Only imagery marked `usable_for_building_vlm=true` should be used for building-level before/after VLM. Sentinel-2 and unknown-date/context-only basemaps are not acceptable for building damage comparison.

## Summary

| AOI | Building-level baseline | Total candidates | Usable feature coverage | Decision |
|---|---:|---:|---:|---|
| `emsr884-aoi03-antimano` | 4 | 21 | 0 | usable pilot only; internal candidates, not official vectors |
| `emsr884-aoi06-moron` | 0 | 3 | 0 | blocked: only 10 m Sentinel-2 context baseline found |
| `emsr884-aoi08-san-felipe` | 0 | 3 | 0 | blocked: only 10 m Sentinel-2 context baseline found |
| `emsr884-aoi10-guacara` | 0 | 8 | 0 | blocked: no official damage vector and only context baseline found |

## AOI Detail

### AOI03 Antimano

Building-level candidate baselines:
- vantor-open-data `B160001100FD1910`; datetime 2026-03-20T14:46:55.249591Z; gsd 0.5 m; cloud 1; features covered 0; license CC-BY-NC-4.0
- vantor-open-data `B160001100FF4510`; datetime 2026-03-21T14:31:32.374596Z; gsd 0.5 m; cloud 3; features covered 0; license CC-BY-NC-4.0
- vantor-open-data `B1400011000BDF10`; datetime 2026-02-09T12:03:36.37465Z; gsd 0.5 m; cloud 5; features covered 0; license CC-BY-NC-4.0
- vantor-open-data `B120001100513B10`; datetime 2026-04-07T15:14:46.124708Z; gsd 0.5 m; cloud 12; features covered 0; license CC-BY-NC-4.0

Context-only candidates found:
- openaerialmap `6a3f353290cf21f32ffb7471`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3f378090cf21f32ffb7cec`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3dc248ad92c093ebc2e30f`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3db5d1ad92c093ebc2d5dc`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3e838353a0547eb32c0500`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3dc45bad92c093ebc2e377`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3db821ad92c093ebc2d8dd`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3ed6f7bf65f2909b560011`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- openaerialmap `6a3ed5c0bf65f2909b55fb2b`; datetime None; gsd None; features covered None; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260212T145719_R039_T19PGM_20260212T183501`; datetime 2026-02-12T14:57:19.024000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`

### AOI06 Moron

No high-resolution building-level pre-event baseline found in the current public inventory.

Context-only candidates found:
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260205T150719_R082_T19PEM_20260205T202216`; datetime 2026-02-05T15:07:19.024000Z; gsd 10; features covered 129; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260322T150721_R082_T19PEM_20260322T215310`; datetime 2026-03-22T15:07:21.025000Z; gsd 10; features covered 129; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260121T150721_R082_T19PEM_20260122T084512`; datetime 2026-01-21T15:07:21.025000Z; gsd 10; features covered 129; judgement `context_only_not_building_level`

### AOI08 San Felipe

No high-resolution building-level pre-event baseline found in the current public inventory.

Context-only candidates found:
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260205T150719_R082_T19PEM_20260205T202216`; datetime 2026-02-05T15:07:19.024000Z; gsd 10; features covered 43; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260322T150721_R082_T19PEM_20260322T215310`; datetime 2026-03-22T15:07:21.025000Z; gsd 10; features covered 43; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260121T150721_R082_T19PEM_20260122T084512`; datetime 2026-01-21T15:07:21.025000Z; gsd 10; features covered 43; judgement `context_only_not_building_level`

### AOI10 Guacara

No high-resolution building-level pre-event baseline found in the current public inventory.

Context-only candidates found:
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260205T150719_R082_T19PFM_20260205T202216`; datetime 2026-02-05T15:07:19.024000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260121T150721_R082_T19PFM_20260122T084512`; datetime 2026-01-21T15:07:21.025000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260322T150721_R082_T19PFM_20260322T215310`; datetime 2026-03-22T15:07:21.025000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260302T150721_R082_T19PFM_20260302T200008`; datetime 2026-03-02T15:07:21.025000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260131T150721_R082_T19PFM_20260131T181211`; datetime 2026-01-31T15:07:21.025000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2C_MSIL2A_20260210T150721_R082_T19PFM_20260210T182511`; datetime 2026-02-10T15:07:21.025000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260327T150719_R082_T19PFM_20260327T201139`; datetime 2026-03-27T15:07:19.024000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`
- planetary-computer-sentinel-2-l2a `S2B_MSIL2A_20260506T150719_R082_T19PFM_20260506T184710`; datetime 2026-05-06T15:07:19.024000Z; gsd 10; features covered 0; judgement `context_only_not_building_level`

## Operational Rule

- Do not run or publish before/after building VLM for AOI06, AOI08, or AOI10 until a high-resolution pre-event baseline is found.
- Post-event-only VLM may remain available as lower-confidence triage evidence, but it must stay labeled separately from before/after comparison.
- AOI03 VLM remains internal because it is based on OSM candidates, not official EMS damage features.
