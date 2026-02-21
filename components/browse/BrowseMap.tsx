"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ProviderCardData } from "@/lib/types/provider";

interface BrowseMapProps {
  providers: ProviderCardData[];
  hoveredProviderId: string | null;
  onMarkerHover: (id: string | null) => void;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

/** MapTiler vector tiles when key is available, CartoDB Positron raster fallback otherwise */
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
      layers: [
        {
          id: "carto-positron",
          type: "raster",
          source: "carto-positron",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    };

const SOURCE_ID = "providers";
const CIRCLE_LAYER = "provider-circles";
const TEXT_LAYER = "provider-labels";

/** Build GeoJSON FeatureCollection from providers */
function toGeoJSON(providers: ProviderCardData[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: providers.map((p) => ({
      type: "Feature" as const,
      id: hashId(p.id),
      geometry: {
        type: "Point" as const,
        coordinates: [p.lon!, p.lat!],
      },
      properties: {
        providerId: p.id,
        slug: p.slug,
        name: p.name,
        image: p.image,
        rating: p.rating,
        score: p.rating > 0 ? p.rating.toFixed(1) : "—",
        primaryCategory: p.primaryCategory,
        priceRange: p.priceRange,
      },
    })),
  };
}

/**
 * MapLibre feature state requires numeric IDs.
 * Hash the string provider_id to a stable integer.
 */
function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Build HTML for the popup preview card */
function buildPopupHTML(props: Record<string, unknown>): string {
  const rating = props.rating as number;
  const ratingHTML =
    rating > 0
      ? `<div style="display:flex;align-items:center;gap:4px;">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="#FDB022"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        <span style="font-size:13px;font-weight:600;color:#111;">${rating.toFixed(1)}</span>
      </div>`
      : "";

  return `
    <a href="/provider/${props.slug}" target="_blank" rel="noopener" style="display:block;width:240px;text-decoration:none;color:inherit;font-family:Inter,-apple-system,system-ui,sans-serif;">
      <div style="position:relative;width:100%;height:140px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img
          src="${props.image}"
          alt="${props.name}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.parentElement.style.background='#f3f4f6';this.style.display='none'"
        />
      </div>
      <div style="padding:10px 12px 12px;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
          <div style="font-size:15px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">
            ${props.name}
          </div>
          ${ratingHTML}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">
          ${props.primaryCategory}
        </div>
        <div style="margin-top:8px;font-size:14px;font-weight:700;color:#111;">
          ${props.priceRange}
        </div>
      </div>
    </a>
  `;
}

// ============================================================
// Component
// ============================================================

export default function BrowseMap({
  providers,
  hoveredProviderId,
  onMarkerHover,
}: BrowseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const prevHoveredRef = useRef<string | null>(null);
  const onMarkerHoverRef = useRef(onMarkerHover);
  onMarkerHoverRef.current = onMarkerHover;

  // Build a lookup: providerId → numeric feature id for setFeatureState
  const idMap = useRef<Map<string, number>>(new Map());

  const mappableProviders = useMemo(
    () => providers.filter((p) => p.lat != null && p.lon != null).slice(0, 50),
    [providers]
  );

  // ── Initialize map ──
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [-97.7431, 30.2672],
      zoom: 12,
      attributionControl: false,
    });

    // Zoom controls — top right
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Attribution — bottom right
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update GeoJSON source when providers change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Build id lookup
    idMap.current.clear();
    mappableProviders.forEach((p) => idMap.current.set(p.id, hashId(p.id)));

    const geojson = toGeoJSON(mappableProviders);

    const addSourceAndLayers = () => {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: geojson,
          promoteId: "providerId",
        });

        // Circle layer — teal score bubbles
        map.addLayer({
          id: CIRCLE_LAYER,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              21,
              18,
            ],
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#164e63", // primary-900
              "#0e7490", // primary-700
            ],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 1,
          },
        });

        // Text layer — score labels
        map.addLayer({
          id: TEXT_LAYER,
          type: "symbol",
          source: SOURCE_ID,
          layout: {
            "text-field": ["get", "score"],
            "text-size": 12,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // ── Mouse events ──
        map.on("mouseenter", CIRCLE_LAYER, (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (feature?.properties?.providerId) {
            onMarkerHoverRef.current(feature.properties.providerId as string);
          }
        });

        map.on("mouseleave", CIRCLE_LAYER, () => {
          map.getCanvas().style.cursor = "";
          onMarkerHoverRef.current(null);
        });

        // Click → popup
        map.on("click", CIRCLE_LAYER, (e) => {
          const feature = e.features?.[0];
          if (!feature || feature.geometry.type !== "Point") return;

          const coords = feature.geometry.coordinates.slice() as [number, number];
          const props = feature.properties;

          // Close existing popup
          popupRef.current?.remove();

          popupRef.current = new maplibregl.Popup({
            offset: 20,
            maxWidth: "260px",
            closeButton: true,
            className: "olera-map-popup",
          })
            .setLngLat(coords)
            .setHTML(buildPopupHTML(props as Record<string, unknown>))
            .addTo(map);
        });
      }

      // Fit bounds
      if (mappableProviders.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        mappableProviders.forEach((p) => bounds.extend([p.lon!, p.lat!]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
      }
    };

    if (map.isStyleLoaded()) {
      addSourceAndLayers();
    } else {
      map.once("load", addSourceAndLayers);
    }
  }, [mappableProviders]);

  // ── Handle hover sync (card → map) ──
  const updateHoveredFeature = useCallback(
    (providerId: string | null, prevId: string | null) => {
      const map = mapRef.current;
      if (!map || !map.getSource(SOURCE_ID)) return;

      if (prevId) {
        map.setFeatureState(
          { source: SOURCE_ID, id: prevId },
          { hover: false }
        );
      }
      if (providerId) {
        map.setFeatureState(
          { source: SOURCE_ID, id: providerId },
          { hover: true }
        );
      }
    },
    []
  );

  useEffect(() => {
    updateHoveredFeature(hoveredProviderId, prevHoveredRef.current);
    prevHoveredRef.current = hoveredProviderId;
  }, [hoveredProviderId, updateHoveredFeature]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Empty state */}
      {mappableProviders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-sm text-gray-400">No locations to display</p>
          </div>
        </div>
      )}

      {/* MapLibre popup + control styles */}
      <style jsx global>{`
        /* ── Navigation controls ── */
        .maplibregl-ctrl-group {
          border: none !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .maplibregl-ctrl-group button {
          width: 36px !important;
          height: 36px !important;
          border: none !important;
          border-bottom: 1px solid #eee !important;
        }
        .maplibregl-ctrl-group button:last-child {
          border-bottom: none !important;
        }
        .maplibregl-ctrl-group button:hover {
          background: #f5f5f5 !important;
        }

        /* ── Popup card ── */
        .olera-map-popup .maplibregl-popup-content {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08);
          border: none;
        }
        .olera-map-popup .maplibregl-popup-tip {
          border-top-color: #fff;
        }
        .olera-map-popup .maplibregl-popup-close-button {
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          font-size: 16px;
          color: #fff;
          background: rgba(0, 0, 0, 0.45);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background 0.15s ease;
          line-height: 26px;
          text-align: center;
          padding: 0;
          border: none;
        }
        .olera-map-popup .maplibregl-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
        }

        /* ── Attribution ── */
        .maplibregl-ctrl-attrib {
          background: rgba(255, 255, 255, 0.7) !important;
          font-size: 10px !important;
          color: #999 !important;
        }
        .maplibregl-ctrl-attrib a {
          color: #999 !important;
        }
      `}</style>
    </div>
  );
}
