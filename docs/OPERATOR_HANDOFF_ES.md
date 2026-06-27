# Guia Operativa - Primeros 5 Minutos

## Objetivo

Usar el mapa para ubicar rapidamente poligonos oficiales de daño de Copernicus EMSR884, priorizar inspeccion y compartir coordenadas/exportaciones con equipos de respuesta.

## Como usarlo

1. Abra la app y confirme que el AOI activo sea un AOI operativo de Venezuela, no el demo xBD.
2. Use el selector de AOI para cambiar entre AOIs operativos como `AOI12 Caraballeda / La Guaira`, `AOI06 Moron`, `AOI08 San Felipe` y `AOI02 Caracas`.
3. Revise los indicadores:
   - `estructuras`: numero de poligonos built-up en el AOI.
   - `destruidos/dañados oficiales`: suma de `Destroyed` + `Damaged` segun EMS.
   - `posibles oficiales`: `Possibly damaged` segun EMS.
4. Use filtros:
   - `Todos`: todos los poligonos EMS.
   - `Destruido/Dañado`: solo `Destroyed` + `Damaged`.
   - `Revisado VLM`: solo elementos con revision VLM, si existe.
5. En `Prioridad`, haga click en un elemento. El mapa centra el poligono a zoom 18 y abre el popup.
6. Use el link `Google Maps` para compartir la ubicacion con equipos de campo.
7. Descargue CSV, GeoJSON o KML para analisis externo, QGIS, Google Earth o tableros.

## Confianza del Dato

- Las etiquetas vectoriales oficiales de Copernicus EMS son la fuente principal para AOI02/AOI06.
- `Destroyed` y `Damaged` se tratan como daño confirmado por el producto EMS.
- `Possibly damaged` se muestra por separado. No debe contarse como destruido/dañado confirmado.
- VLM, si aparece, es evidencia auxiliar para priorizar revision; no reemplaza EMS ni validacion humana.
- La capa `Catia La Mar - Daño predicho Microsoft AI4G` viene de HDX/Microsoft AI for Good Lab. Es prediccion externa de huellas dañadas, util para triage, pero no es etiqueta oficial EMS.

## No Sobreafirmar

- Los features EMS `builtUpA` pueden no representar un edificio individual cada uno.
- Las etiquetas oficiales EMS son la fuente principal de verdad para este paquete.
- VLM y etiquetas inferidas son ayudas de triage, no confirmacion oficial.
- La ausencia de un poligono marcado no prueba que no haya daño.

## Limitaciones Conocidas

- AOI12 ya incluye vector oficial EMS, imagen posterior EMS y referencia pre-evento Vantor. La referencia Vantor no es imagen oficial EMS y puede tener huecos.
- La capa externa Microsoft/HDX tiene 9,134 candidatos predichos en Catia La Mar; debe usarse como indicio adicional, no como conteo oficial de daño.
- Los poligonos `builtUpA` son features oficiales de evaluacion built-up; no siempre equivalen a un edificio individual.
- Para AOIs grandes puede ser necesario convertir GeoJSON a PMTiles/vector tiles.
- Los datasets HOT/HDX nacionales de edificios/caminos/POI son utiles para contexto, pero no se cargan por defecto porque son pesados para Vercel.

## Nuevas fuentes revisadas

- Microsoft AI for Good Lab via HDX: `Venezuela Earthquakes: Building Damage Assessment in Catia La Mar`. Agregado como AOI externo con 9,134 huellas `damaged=1`.
- HOT via HDX: `Venezuela - M 7.5 Earthquake - June 2026 - OSM & Overture Data`. Documentado como fuente de contexto; no cargado por defecto por tamaño.
