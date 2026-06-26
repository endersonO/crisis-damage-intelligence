"use client";

import { useCallback, useEffect, useRef } from "react";
import OlMap from "ol/Map.js";
import View from "ol/View.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Feature from "ol/Feature.js";
import Overlay from "ol/Overlay.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import WebGLTileLayer from "ol/layer/WebGLTile.js";
import OSM from "ol/source/OSM.js";
import GeoTIFF from "ol/source/GeoTIFF.js";
import VectorSource from "ol/source/Vector.js";
import { Fill, Stroke, Style } from "ol/style.js";
import CircleStyle from "ol/style/Circle.js";
import { fromLonLat, toLonLat } from "ol/proj.js";
import { boundingExtent, getCenter } from "ol/extent.js";
import "ol/ol.css";
import type { AoiRecord, DamageFeature, VlmRecord } from "../types";

declare global {
  interface Window {
    __damageMapDebug?: {
      visibleFeatures: string[];
      selectedId?: string;
      center?: { lat: number; lng: number };
      zoom?: number;
      filter: Props["filter"];
      mode: Props["mode"];
      raster?: "before" | "after" | "none";
    };
  }
}

type Props = {
  aoi: AoiRecord;
  mode: "before" | "after";
  opacity: number;
  filter: "all" | "severe" | "vlm";
  vlm: Record<string, VlmRecord>;
  selectedId?: string;
  onSelect: (feature: DamageFeature) => void;
};

type OlDamageFeature = Feature & { original?: DamageFeature };

function damageClass(properties: DamageFeature["properties"], vlm?: VlmRecord) {
  const vlmClass = vlm?.vlm?.damage_class;
  const raw = String(vlmClass ?? properties.damage_class ?? properties.damage_gra ?? properties.confirmed_damage_class ?? "").toLowerCase();
  if (raw.includes("possibly")) return "possible";
  if (raw.includes("destroy") || raw.includes("major") || raw === "damaged" || raw === "major_damage") return "severe";
  if (raw.includes("minor") || raw.includes("possible")) return "possible";
  if (raw.includes("uncertain")) return "uncertain";
  return "low";
}

function colorFor(kind: string) {
  if (kind === "severe") return "#c42128";
  if (kind === "possible") return "#d78a1f";
  if (kind === "uncertain") return "#64748b";
  return "#7a7f87";
}

function passesFilter(feature: DamageFeature, filter: Props["filter"], vlm: Record<string, VlmRecord>) {
  const id = feature.properties.id;
  if (filter === "vlm") return Boolean(vlm[id]);
  if (filter === "severe") return damageClass(feature.properties, vlm[id]) === "severe";
  return true;
}

export default function MapPanel({ aoi, mode, opacity, filter, vlm, selectedId, onSelect }: Props) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);
  const baseRef = useRef<TileLayer<OSM> | null>(null);
  const beforeRef = useRef<WebGLTileLayer | null>(null);
  const afterRef = useRef<WebGLTileLayer | null>(null);
  const vectorRef = useRef<VectorLayer<VectorSource> | null>(null);
  const highlightRef = useRef<VectorLayer<VectorSource> | null>(null);
  const markerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const featuresRef = useRef<DamageFeature[]>([]);
  const olFeatureByIdRef = useRef<Map<string, OlDamageFeature>>(new Map());
  const modeRef = useRef(mode);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const setDebug = useCallback((visibleFeatures: DamageFeature[]) => {
    const map = mapRef.current;
    if (!map) return;
    const [lng, lat] = toLonLat(map.getView().getCenter() ?? [0, 0]);
    window.__damageMapDebug = {
      visibleFeatures: visibleFeatures.map((feature) => feature.properties.id),
      selectedId: selectedIdRef.current,
      center: { lat, lng },
      zoom: map.getView().getZoom(),
      filter,
      mode: modeRef.current,
      raster: afterRef.current?.getVisible() ? "after" : beforeRef.current?.getVisible() ? "before" : "none",
    };
  }, [filter]);

  const styleFor = useCallback((feature: OlDamageFeature) => {
    const original = feature.original;
    if (!original) return undefined;
    const kind = damageClass(original.properties, vlm[original.properties.id]);
    const color = colorFor(kind);
    return new Style({
      stroke: new Stroke({ color, width: kind === "low" ? 1 : 2 }),
      fill: new Fill({ color: hexToRgba(color, opacity) }),
    });
  }, [opacity, vlm]);

  const focusFeature = useCallback((id?: string) => {
    const map = mapRef.current;
    if (!map || !id) return;
    const feature = featuresRef.current.find((candidate) => candidate.properties.id === id);
    let olFeature = olFeatureByIdRef.current.get(id);
    if (!feature) return;
    if (!olFeature) {
      olFeature = new GeoJSON().readFeature(feature, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }) as OlDamageFeature;
      olFeature.original = feature;
    }
    const extent = olFeature.getGeometry()?.getExtent();
    const centroidLat = Number(feature.properties.centroid_lat);
    const centroidLon = Number(feature.properties.centroid_lon);
    const center = Number.isFinite(centroidLat) && Number.isFinite(centroidLon)
      ? fromLonLat([centroidLon, centroidLat])
      : extent
        ? getCenter(extent)
        : undefined;
    if (!center) return;
    map.getView().setCenter(center);
    map.getView().setZoom(18);
    highlightRef.current?.getSource()?.clear();
    if (olFeature.getGeometry()) {
      const highlightFeature = olFeature.clone() as OlDamageFeature;
      highlightFeature.original = feature;
      highlightRef.current?.getSource()?.addFeature(highlightFeature);
    }
    highlightRef.current?.setStyle(new Style({
      stroke: new Stroke({ color: "#ffffff", width: 5 }),
      fill: new Fill({ color: "rgba(255,255,255,0.08)" }),
    }));
    markerRef.current?.getSource()?.clear();
    const markerFeature = new Feature({ geometry: new GeoJSON().readGeometry({ type: "Point", coordinates: toLonLat(center) }, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }) });
    markerRef.current?.getSource()?.addFeature(markerFeature);
    markerRef.current?.setStyle(new Style({
      image: new CircleStyle({
        radius: 10,
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
        fill: new Fill({ color: "rgba(196,33,40,0.28)" }),
      }),
    }));
    if (popupRef.current) {
      popupRef.current.innerHTML = popupHtml(feature.properties);
      popupOverlayRef.current?.setPosition(center);
    }
    const [lng, lat] = toLonLat(center);
    nodeRef.current?.setAttribute("data-focused-id", id);
    nodeRef.current?.setAttribute("data-map-center", `${lat.toFixed(7)},${lng.toFixed(7)}`);
    nodeRef.current?.setAttribute("data-map-zoom", String(map.getView().getZoom()));
    setDebug(featuresRef.current.filter((candidate) => passesFilter(candidate, filter, vlm)));
  }, [filter, setDebug, vlm]);

  const renderVectors = useCallback(() => {
    const vector = vectorRef.current;
    if (!vector) return;
    const source = vector.getSource();
    if (!source) return;
    const visible = featuresRef.current.filter((feature) => passesFilter(feature, filter, vlm));
    const olFeatures = new GeoJSON().readFeatures({ type: "FeatureCollection", features: visible }, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    }) as OlDamageFeature[];
    olFeatureByIdRef.current.clear();
    olFeatures.forEach((feature, index) => {
      feature.original = visible[index];
      olFeatureByIdRef.current.set(visible[index].properties.id, feature);
    });
    source.clear();
    source.addFeatures(olFeatures);
    vector.setStyle((feature) => styleFor(feature as OlDamageFeature));
    nodeRef.current?.setAttribute("data-visible-features", String(visible.length));
    setDebug(visible);
    if (selectedIdRef.current) {
      window.setTimeout(() => focusFeature(selectedIdRef.current), 0);
    }
  }, [filter, focusFeature, setDebug, styleFor, vlm]);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const base = new TileLayer({ source: new OSM(), visible: true });
    const vector = new VectorLayer({ source: new VectorSource(), zIndex: 30 });
    const highlight = new VectorLayer({ source: new VectorSource(), zIndex: 40 });
    const marker = new VectorLayer({ source: new VectorSource(), zIndex: 50 });
    const popup = new Overlay({ element: popupRef.current ?? undefined, autoPan: { animation: { duration: 0 } }, offset: [0, -12] });
    const map = new OlMap({
      target: nodeRef.current,
      layers: [base, vector, highlight, marker],
      overlays: [popup],
      view: new View({ center: fromLonLat([aoi.center[1], aoi.center[0]]), zoom: 12 }),
      controls: [],
    });
    baseRef.current = base;
    vectorRef.current = vector;
    highlightRef.current = highlight;
    markerRef.current = marker;
    popupOverlayRef.current = popup;
    mapRef.current = map;

    map.on("singleclick", (event) => {
      const hit = map.forEachFeatureAtPixel(event.pixel, (feature) => feature as OlDamageFeature, {
        layerFilter: (layer) => layer === vectorRef.current,
      });
      if (hit?.original) onSelect(hit.original);
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [aoi.center, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (beforeRef.current) map.removeLayer(beforeRef.current);
    if (afterRef.current) map.removeLayer(afterRef.current);
    beforeRef.current = null;
    afterRef.current = null;
    featuresRef.current = [];
    vectorRef.current?.getSource()?.clear();
    highlightRef.current?.getSource()?.clear();
    markerRef.current?.getSource()?.clear();
    popupOverlayRef.current?.setPosition(undefined);

    if (aoi.layers.beforeImage) {
      beforeRef.current = new WebGLTileLayer({
        source: new GeoTIFF({ sources: [{ url: aoi.layers.beforeImage }], convertToRGB: "auto" }),
        opacity: 1,
        visible: modeRef.current === "before",
        zIndex: 10,
      });
      map.addLayer(beforeRef.current);
    }
    if (aoi.layers.afterImage) {
      afterRef.current = new WebGLTileLayer({
        source: new GeoTIFF({ sources: [{ url: aoi.layers.afterImage }], convertToRGB: "auto" }),
        opacity: 1,
        visible: modeRef.current === "after",
        zIndex: 11,
      });
      map.addLayer(afterRef.current);
    }

    fetch(aoi.layers.damage)
      .then((response) => response.json())
      .then((data: GeoJSON.FeatureCollection) => {
        featuresRef.current = (data.features as DamageFeature[]) ?? [];
        renderVectors();
      });

    const bounds3857 = boundingExtent([
      fromLonLat([aoi.bounds[0][1], aoi.bounds[0][0]]),
      fromLonLat([aoi.bounds[1][1], aoi.bounds[1][0]]),
    ]);
    map.getView().fit(bounds3857, { padding: [60, 60, 60, 60], duration: 0, maxZoom: 15 });
  }, [aoi, renderVectors]);

  useEffect(() => {
    renderVectors();
  }, [renderVectors]);

  useEffect(() => {
    beforeRef.current?.setVisible(mode === "before" && Boolean(aoi.layers.beforeImage));
    afterRef.current?.setVisible(mode === "after" && Boolean(aoi.layers.afterImage));
    if (!aoi.layers.beforeImage && mode === "before") afterRef.current?.setVisible(false);
    setDebug(featuresRef.current.filter((feature) => passesFilter(feature, filter, vlm)));
  }, [aoi.layers.afterImage, aoi.layers.beforeImage, filter, mode, setDebug, vlm]);

  useEffect(() => {
    focusFeature(selectedId);
  }, [focusFeature, selectedId]);

  return (
    <>
      <div ref={nodeRef} className="map-node" data-filter={filter} data-mode={mode} data-opacity={opacity} data-selected-id={selectedId ?? ""} />
      <div ref={popupRef} className="ol-popup" />
    </>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function popupHtml(p: DamageFeature["properties"]) {
  const mapsUrl = typeof p.google_maps_url === "string" ? p.google_maps_url : "";
  return (
    `<strong>${escapeHtml(p.id)}</strong><br/>` +
    `EMS: <strong>${escapeHtml(String(p.damage_gra ?? p.damage_class ?? "unknown"))}</strong><br/>` +
    `Damage: ${escapeHtml(String(p.damage_percent ?? p.damage_score ?? "-"))}%<br/>` +
    (mapsUrl ? `<a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noreferrer">Google Maps</a>` : "")
  );
}
