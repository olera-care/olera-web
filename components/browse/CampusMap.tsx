"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ProviderCardData } from "@/lib/types/provider";

interface CampusMapProps {
  providers: ProviderCardData[];
  hoveredProviderId: string | null;
  onMarkerHover: (id: string | null) => void;
  /** Campus center to anchor the 60-mi catchment ring. Null → markers only. */
  campusCenter?: { lat: number; lng: number } | null;
  radiusMiles?: number;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const MAP_STYLE: maplibregl.StyleSpecification | string = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/positron/style.json?key=${MAPTILER_KEY}`
  : {
      version: 8,
      sources: {
        "carto-positron": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>',
        },
      },
      layers: [{ id: "carto-positron", type: "raster", source: "carto-positron", minzoom: 0, maxzoom: 19 }],
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    };

const CAND_SOURCE = "campus-candidates";
const CAND_CIRCLE = "campus-cand-circle";
const CAND_TEXT = "campus-cand-text";
const RING_SOURCE = "campus-ring";
const RING_FILL = "campus-ring-fill";
const RING_LINE = "campus-ring-line";
const HUB_SOURCE = "campus-hub";
const HUB_CIRCLE = "campus-hub-circle";

function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic ~0.5-mi jitter so real home coords aren't pinned exactly. */
function jitter(p: ProviderCardData): [number, number] {
  const h = hashId(p.id);
  const dx = ((h % 1000) / 1000 - 0.5) * 0.014;
  const dy = (((h >> 10) % 1000) / 1000 - 0.5) * 0.014;
  return [p.lon! + dx, p.lat! + dy];
}

function toCandidateGeoJSON(providers: ProviderCardData[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: providers.map((p) => ({
      type: "Feature" as const,
      id: hashId(p.id),
      geometry: { type: "Point" as const, coordinates: jitter(p) },
      properties: { providerId: p.id, initials: initialsOf(p.name) },
    })),
  };
}

/** A lat-corrected circle polygon (~64 points) at radiusMiles around center. */
function ringPolygon(center: { lat: number; lng: number }, radiusMiles: number): GeoJSON.FeatureCollection {
  const latDeg = radiusMiles / 69;
  const lonDeg = radiusMiles / (69 * Math.cos((center.lat * Math.PI) / 180) || 1);
  const coords: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    coords.push([center.lng + lonDeg * Math.cos(a), center.lat + latDeg * Math.sin(a)]);
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} }],
  };
}

const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export default function CampusMap({
  providers,
  hoveredProviderId,
  onMarkerHover,
  campusCenter = null,
  radiusMiles = 60,
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const prevHoveredRef = useRef<string | null>(null);
  const onHoverRef = useRef(onMarkerHover);
  onHoverRef.current = onMarkerHover;

  const mappable = useMemo(
    () => providers.filter((p) => p.lat != null && p.lon != null).slice(0, 80),
    [providers],
  );

  // ── Init once ──
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: campusCenter ? [campusCenter.lng, campusCenter.lat] : [-97.7431, 30.2672],
      zoom: 9,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync sources/layers when data or campus changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const candData = toCandidateGeoJSON(mappable);
    const ringData = campusCenter ? ringPolygon(campusCenter, radiusMiles) : EMPTY;
    const hubData: GeoJSON.FeatureCollection = campusCenter
      ? {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [campusCenter.lng, campusCenter.lat] }, properties: {} },
          ],
        }
      : EMPTY;

    const apply = () => {
      // Ring (under everything)
      if (!map.getSource(RING_SOURCE)) {
        map.addSource(RING_SOURCE, { type: "geojson", data: ringData });
        map.addLayer({ id: RING_FILL, type: "fill", source: RING_SOURCE, paint: { "fill-color": "#4d8a8a", "fill-opacity": 0.06 } });
        map.addLayer({ id: RING_LINE, type: "line", source: RING_SOURCE, paint: { "line-color": "#4d8a8a", "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.6 } });
      } else {
        (map.getSource(RING_SOURCE) as maplibregl.GeoJSONSource).setData(ringData);
      }

      // Campus hub pin
      if (!map.getSource(HUB_SOURCE)) {
        map.addSource(HUB_SOURCE, { type: "geojson", data: hubData });
        map.addLayer({ id: HUB_CIRCLE, type: "circle", source: HUB_SOURCE, paint: { "circle-radius": 8, "circle-color": "#385e5e", "circle-stroke-width": 3, "circle-stroke-color": "#ffffff" } });
      } else {
        (map.getSource(HUB_SOURCE) as maplibregl.GeoJSONSource).setData(hubData);
      }

      // Candidates (initials bubbles, on top)
      if (!map.getSource(CAND_SOURCE)) {
        map.addSource(CAND_SOURCE, { type: "geojson", data: candData, promoteId: "providerId" });
        map.addLayer({
          id: CAND_CIRCLE,
          type: "circle",
          source: CAND_SOURCE,
          paint: {
            "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 20, 17],
            "circle-color": ["case", ["boolean", ["feature-state", "hover"], false], "#164e63", "#0e7490"],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: CAND_TEXT,
          type: "symbol",
          source: CAND_SOURCE,
          layout: { "text-field": ["get", "initials"], "text-size": 11, "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], "text-allow-overlap": true },
          paint: { "text-color": "#ffffff" },
        });
        map.on("mouseenter", CAND_CIRCLE, (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (f?.properties?.providerId) onHoverRef.current(f.properties.providerId as string);
        });
        map.on("mouseleave", CAND_CIRCLE, () => {
          map.getCanvas().style.cursor = "";
          onHoverRef.current(null);
        });
      } else {
        (map.getSource(CAND_SOURCE) as maplibregl.GeoJSONSource).setData(candData);
      }

      // Fit to the ring if we have a campus, else to the candidates.
      if (campusCenter) {
        const r = ringData.features[0];
        if (r && r.geometry.type === "Polygon") {
          const b = new maplibregl.LngLatBounds();
          (r.geometry.coordinates[0] as [number, number][]).forEach((c) => b.extend(c));
          map.fitBounds(b, { padding: 30, animate: false });
        }
      } else if (mappable.length > 0) {
        const b = new maplibregl.LngLatBounds();
        mappable.forEach((p) => b.extend([p.lon!, p.lat!]));
        map.fitBounds(b, { padding: 40, maxZoom: 13, animate: false });
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [mappable, campusCenter, radiusMiles]);

  // ── Hover sync (card → map) ──
  const updateHover = useCallback((id: string | null, prev: string | null) => {
    const map = mapRef.current;
    if (!map || !map.getSource(CAND_SOURCE)) return;
    if (prev) map.setFeatureState({ source: CAND_SOURCE, id: prev }, { hover: false });
    if (id) map.setFeatureState({ source: CAND_SOURCE, id }, { hover: true });
  }, []);

  useEffect(() => {
    updateHover(hoveredProviderId, prevHoveredRef.current);
    prevHoveredRef.current = hoveredProviderId;
  }, [hoveredProviderId, updateHover]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <p className="text-sm text-gray-400">No candidates to map yet</p>
        </div>
      )}
      <style jsx global>{`
        .maplibregl-ctrl-group {
          border: none !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
        }
      `}</style>
    </div>
  );
}
