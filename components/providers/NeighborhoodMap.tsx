"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

// ============================================================
// Types
// ============================================================

export interface NearbyPlace {
  name: string;
  distance: string;
  lat: number;
  lng: number;
}

export interface NearbyCategory {
  label: string;
  icon: "hospital" | "pharmacy" | "grocery" | "dining" | "parks" | "worship";
  places: NearbyPlace[];
}

interface NeighborhoodMapProps {
  /** Provider display name */
  providerName: string;
  /** Provider coordinates */
  center: { lat: number; lng: number };
  /** Full address string */
  address?: string;
  /** Nearby place categories with coordinates */
  categories: NearbyCategory[];
}

// ============================================================
// Category colors for map markers
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  hospital: "#dc2626",
  pharmacy: "#7c3aed",
  grocery: "#2563eb",
  dining: "#ea580c",
  parks: "#16a34a",
  worship: "#ca8a04",
};

// ============================================================
// Category icon SVGs (small, for marker popups)
// ============================================================

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? "w-5 h-5 text-teal-600 shrink-0";
  switch (icon) {
    case "hospital":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12z" />
        </svg>
      );
    case "pharmacy":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      );
    case "grocery":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      );
    case "dining":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 3.75V16.5" />
        </svg>
      );
    case "parks":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m-7-9H4m16 0h1M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
    case "worship":
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Component
// ============================================================

export default function NeighborhoodMap({
  providerName,
  center,
  address,
  categories,
}: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const placeMarkersRef = useRef<L.Marker[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visible = categories.filter((c) => c.places.length > 0);

  // Summary label
  const hasCloseMedical = categories.find((c) => c.label === "Hospital")?.places.some((p) => parseFloat(p.distance) <= 5);
  const hasCloseShopping = categories.find((c) => c.label === "Grocery")?.places.some((p) => parseFloat(p.distance) <= 5);
  const summaryParts: string[] = [];
  if (hasCloseMedical) summaryParts.push("medical care");
  if (hasCloseShopping) summaryParts.push("shopping");
  const summary = summaryParts.length > 0 ? `Close to ${summaryParts.join(" and ")}` : null;

  // Ref to hold the Leaflet module once loaded
  const leafletRef = useRef<typeof L | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      // @ts-expect-error -- CSS import handled by bundler
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      const Lf = leaflet.default;
      leafletRef.current = Lf;

      const map = Lf.map(mapRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
        zoomControl: false,
        center: [center.lat, center.lng],
        zoom: 13,
      });

      Lf.control.zoom({ position: "topright" }).addTo(map);

      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
        subdomains: "abcd",
      }).addTo(map);

      // Olera house marker for the provider
      const houseIcon = Lf.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.25));">
          <div style="width:40px;height:40px;border-radius:50%;background:#0d9488;display:flex;align-items:center;justify-content:center;border:2.5px solid white;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div style="width:8px;height:8px;background:#0d9488;transform:rotate(45deg);margin-top:-5px;"></div>
        </div>`,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -48],
      });

      Lf.marker([center.lat, center.lng], { icon: houseIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,-apple-system,system-ui,sans-serif;padding:4px 2px;">
            <strong style="font-size:14px;color:#111;">${providerName}</strong>
            ${address ? `<br/><span style="font-size:12px;color:#666;">${address}</span>` : ""}
          </div>`,
          { className: "olera-popup", closeButton: false }
        );

      mapInstanceRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center.lat, center.lng, providerName, address]);

  // Update place markers when active category changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const Lf = leafletRef.current;
    if (!map || !Lf) return;

    // Clear existing place markers
    for (const m of placeMarkersRef.current) {
      m.remove();
    }
    placeMarkersRef.current = [];

    if (!activeCategory) {
      // Reset view to center
      map.setView([center.lat, center.lng], 13, { animate: true });
      return;
    }

    const cat = categories.find((c) => c.label === activeCategory);
    if (!cat || cat.places.length === 0) return;

    const color = CATEGORY_COLORS[cat.icon] || "#0d9488";

    const markers: L.Marker[] = [];
    const points: [number, number][] = [[center.lat, center.lng]];

    for (const place of cat.places) {
      const placeIcon = Lf.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
            <circle cx="14" cy="13" r="6" fill="white"/>
            <circle cx="14" cy="13" r="3" fill="${color}"/>
          </svg>
        </div>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });

      const marker = Lf.marker([place.lat, place.lng], { icon: placeIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,-apple-system,system-ui,sans-serif;padding:4px 2px;">
            <strong style="font-size:13px;color:#111;">${place.name}</strong>
            <br/><span style="font-size:12px;color:#666;">${place.distance} away</span>
          </div>`,
          { className: "olera-popup", closeButton: false }
        );
      markers.push(marker);
      points.push([place.lat, place.lng]);
    }

    placeMarkersRef.current = markers;

    // Fit bounds to show provider + all places in this category
    const bounds = Lf.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });

    // Open first place popup after animation
    if (markers.length > 0) {
      setTimeout(() => markers[0].openPopup(), 400);
    }
  }, [activeCategory, categories, center.lat, center.lng]);

  const handleCategoryClick = (label: string) => {
    setActiveCategory((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <style>{`
        .olera-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06);
          border: none;
          padding: 0;
        }
        .olera-popup .leaflet-popup-content {
          margin: 10px 14px;
        }
        .olera-popup .leaflet-popup-tip {
          box-shadow: none;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 16px !important;
          color: #374151 !important;
          border: none !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f9fafb !important;
          color: #0e7490 !important;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          font-size: 10px !important;
          color: #9ca3af !important;
          border-radius: 6px 0 0 0 !important;
          padding: 2px 6px !important;
        }
        .leaflet-control-attribution a {
          color: #9ca3af !important;
        }
        .leaflet-container {
          background: #f8fafa !important;
        }
      `}</style>

      {/* Map */}
      <div className="mt-4 mb-5 rounded-xl overflow-hidden border border-gray-200">
        <div ref={mapRef} style={{ height: 280, width: "100%" }} />
      </div>

      {/* Summary */}
      {summary && <p className="text-sm text-teal-700 font-medium mb-5">{summary}</p>}
      {!summary && visible.length > 0 && <div className="mb-5" />}

      {/* Category grid — clickable */}
      {visible.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
          {visible.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleCategoryClick(cat.label)}
                className={`text-left rounded-lg transition-colors p-2 -m-2 ${
                  isActive ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon icon={cat.icon} className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-700" : "text-teal-600"}`} />
                  <h3 className={`text-sm font-semibold ${isActive ? "text-teal-800" : "text-gray-900"}`}>{cat.label}</h3>
                </div>
                <div className="space-y-1.5">
                  {cat.places.map((place) => (
                    <div key={place.name} className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-gray-700 truncate">{place.name}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{place.distance}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
