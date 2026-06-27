# Operator Guide - First 5 Minutes

## Objective

Use the map to quickly locate official Copernicus EMSR884 damage polygons, prioritize inspection, and share coordinates/exports with response teams.

## How To Use

1. Open the app and confirm the active AOI is an operational Venezuela AOI, not the xBD demo.
2. Use the AOI selector to switch between operational AOIs such as `AOI12 Caraballeda / La Guaira`, `AOI06 Moron`, `AOI08 San Felipe`, and `AOI02 Caracas`.
3. Read the indicators:
   - `features`: number of built-up polygons in the AOI.
   - `official destroyed/damaged`: `Destroyed` + `Damaged` from EMS.
   - `official possible`: `Possibly damaged` from EMS.
4. Use filters:
   - `All`: every EMS polygon.
   - `Destroyed/Damaged`: only `Destroyed` + `Damaged`.
   - `VLM reviewed`: only items with VLM review, if present.
5. In `Priority`, click an item. The map centers the polygon at zoom 18 and opens the popup.
6. Use the `Google Maps` link to share the location with field teams.
7. Download CSV, GeoJSON, or KML for external analysis, QGIS, Google Earth, or dashboards.

## Data Confidence

- Official Copernicus EMS vector labels are the source of record for AOI02/AOI06.
- `Destroyed` and `Damaged` are treated as confirmed damage from the EMS product.
- `Possibly damaged` is shown separately. Do not count it as confirmed destroyed/damaged.
- VLM, when present, is supporting evidence for prioritization; it does not replace EMS or human validation.
- The `Catia La Mar - Microsoft AI4G Predicted Damage` layer comes from HDX/Microsoft AI for Good Lab. It is an external predicted-damage footprint layer for triage, not an official EMS label.

## Do Not Overclaim

- EMS `builtUpA` features may not represent one individual building each.
- Official EMS labels are the source of record for this package.
- VLM and inferred labels are triage aids, not official confirmation.
- Absence of a marked polygon is not proof of no damage.

## Known Limitations

- AOI12 now includes the official EMS vector, EMS post-event imagery, and Vantor pre-event reference imagery. The Vantor reference is not official EMS before imagery and may have gaps.
- The external Microsoft/HDX layer has 9,134 predicted damaged candidates in Catia La Mar; use it as an additional lead, not as an official damage count.
- `builtUpA` polygons are official built-up assessment features; they are not guaranteed to be one building each.
- Large AOIs may require converting GeoJSON into PMTiles/vector tiles.
- National HOT/HDX buildings, roads, and POI datasets are useful context sources, but they are not loaded by default because they are large for the Vercel bundle.

## Newly Reviewed Sources

- Microsoft AI for Good Lab via HDX: `Venezuela Earthquakes: Building Damage Assessment in Catia La Mar`. Added as an external AOI with 9,134 `damaged=1` footprints.
- HOT via HDX: `Venezuela - M 7.5 Earthquake - June 2026 - OSM & Overture Data`. Documented as context source; not loaded by default because of size.
