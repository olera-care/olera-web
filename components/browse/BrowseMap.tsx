"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Provider } from "@/components/providers/ProviderCard";

interface BrowseMapProps {
  providers: Provider[];
  hoveredProviderId: string | null;
  onMarkerHover: (id: string | null) => void;
}

// ============================================================
// Helpers
// ============================================================

/** TripAdvisor-style teal circle bubble with score */
function createScoreBubble(rating: number, isHovered: boolean): L.DivIcon {
  const score = rating > 0 ? rating.toFixed(1) : "—";

  return L.divIcon({
    className: "olera-score-marker",
    html: `<div class="olera-bubble${isHovered ? " olera-bubble--active" : ""}">${score}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

/** Build HTML for the popup preview card */
function buildPopupHTML(provider: Provider): string {
  const ratingHTML = provider.rating > 0
    ? `<div style="display:flex;align-items:center;gap:4px;">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="#FDB022"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
        <span style="font-size:13px;font-weight:600;color:#111;">${provider.rating.toFixed(1)}</span>
      </div>`
    : "";

  return `
    <a href="/provider/${provider.slug}" target="_blank" rel="noopener" style="display:block;width:240px;text-decoration:none;color:inherit;font-family:Inter,-apple-system,system-ui,sans-serif;">
      <div style="position:relative;width:100%;height:140px;overflow:hidden;border-radius:12px 12px 0 0;">
        <img
          src="${provider.image}"
          alt="${provider.name}"
          style="width:100%;height:100%;object-fit:cover;"
          onerror="this.parentElement.style.background='#f3f4f6';this.style.display='none'"
        />
      </div>
      <div style="padding:10px 12px 12px;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
          <div style="font-size:15px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">
            ${provider.name}
          </div>
          ${ratingHTML}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">
          ${provider.primaryCategory}
        </div>
        <div style="margin-top:8px;font-size:14px;font-weight:700;color:#111;">
          ${provider.priceRange}
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
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const prevHoveredRef = useRef<string | null>(null);
  const onMarkerHoverRef = useRef(onMarkerHover);
  onMarkerHoverRef.current = onMarkerHover;

  const mappableProviders = useMemo(
    () => providers.filter((p) => p.lat != null && p.lon != null).slice(0, 50),
    [providers]
  );

  // ── Initialize map ──
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([30.2672, -97.7431], 12);

    // CartoDB Positron — clean, minimal tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    // Zoom controls — top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Minimal attribution
    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org" target="_blank">OSM</a>, © <a href="https://carto.com" target="_blank">CARTO</a>')
      .addTo(map);

    mapRef.current = map;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update markers when providers change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (mappableProviders.length === 0) return;

    mappableProviders.forEach((provider) => {
      const icon = createScoreBubble(provider.rating, false);

      const marker = L.marker([provider.lat!, provider.lon!], { icon })
        .addTo(map)
        .bindPopup(buildPopupHTML(provider), {
          maxWidth: 260,
          minWidth: 240,
          className: "olera-map-popup",
          closeButton: true,
          offset: [0, -12],
        });

      marker.on("mouseover", () => onMarkerHoverRef.current(provider.id));
      marker.on("mouseout", () => onMarkerHoverRef.current(null));
      marker.on("click", () => {
        marker.openPopup();
      });

      markersRef.current.set(provider.id, marker);
    });

    const bounds = L.latLngBounds(
      mappableProviders.map((p) => [p.lat!, p.lon!] as L.LatLngTuple)
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [mappableProviders]);

  // ── Handle hover sync ──
  const updateHoveredMarker = useCallback(
    (providerId: string | null, prevId: string | null) => {
      if (prevId) {
        const prevMarker = markersRef.current.get(prevId);
        const prevProvider = mappableProviders.find((p) => p.id === prevId);
        if (prevMarker && prevProvider) {
          prevMarker.setIcon(createScoreBubble(prevProvider.rating, false));
          prevMarker.setZIndexOffset(0);
        }
      }
      if (providerId) {
        const marker = markersRef.current.get(providerId);
        const provider = mappableProviders.find((p) => p.id === providerId);
        if (marker && provider) {
          marker.setIcon(createScoreBubble(provider.rating, true));
          marker.setZIndexOffset(1000);
        }
      }
    },
    [mappableProviders]
  );

  useEffect(() => {
    updateHoveredMarker(hoveredProviderId, prevHoveredRef.current);
    prevHoveredRef.current = hoveredProviderId;
  }, [hoveredProviderId, updateHoveredMarker]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Empty state */}
      {mappableProviders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm text-gray-400">No locations to display</p>
          </div>
        </div>
      )}

      {/* Map styles */}
      <style jsx global>{`
        /* ── Score bubble markers ── */
        .olera-score-marker {
          background: none !important;
          border: none !important;
          overflow: visible !important;
        }
        .olera-bubble {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: Inter, -apple-system, system-ui, sans-serif;
          cursor: pointer;
          background: #0e7490;
          color: #fff;
          box-shadow: 0 2px 6px rgba(14,116,144,0.35);
          border: 2.5px solid #fff;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .olera-bubble:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(14,116,144,0.45);
        }
        .olera-bubble--active {
          background: #164e63;
          transform: scale(1.2);
          box-shadow: 0 4px 14px rgba(22,78,99,0.5);
        }

        /* ── Custom zoom controls ── */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
          border-radius: 12px !important;
          overflow: hidden;
          margin-top: 12px !important;
          margin-right: 12px !important;
        }
        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 18px !important;
          color: #333 !important;
          background: #fff !important;
          border: none !important;
          border-bottom: 1px solid #eee !important;
          transition: background 0.15s ease;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f5f5f5 !important;
          color: #111 !important;
        }

        /* ── Popup card ── */
        .olera-map-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
          border: none;
        }
        .olera-map-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        .olera-map-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .olera-map-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: none;
        }
        .olera-map-popup .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          width: 26px;
          height: 26px;
          font-size: 16px;
          color: #fff;
          background: rgba(0,0,0,0.45);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: background 0.15s ease;
          line-height: 26px;
          text-align: center;
          padding: 0;
        }
        .olera-map-popup .leaflet-popup-close-button:hover {
          background: rgba(0,0,0,0.65);
          color: #fff;
        }

        /* ── Attribution ── */
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          font-size: 10px !important;
          color: #999 !important;
          padding: 2px 6px !important;
          border-radius: 4px 0 0 0;
        }
        .leaflet-control-attribution a {
          color: #999 !important;
        }
      `}</style>
    </div>
  );
}
