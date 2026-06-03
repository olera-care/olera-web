"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/positron/style.json?key=${MAPTILER_KEY}`
  : "https://demotiles.maplibre.org/style.json";

export const CAT_COLOR: Record<string, string> = {
  hospital: "#e11d48", skilled_nursing: "#d97706", hospice: "#7c3aed",
  assisted_living: "#199087", senior_resource: "#2563eb", home_health: "#059669",
};
const CAT_LABEL: Record<string, string> = {
  hospital: "Hospitals & ER", skilled_nursing: "Skilled nursing / rehab", hospice: "Hospice",
  assisted_living: "Assisted living", home_health: "Home health", senior_resource: "Senior resources",
};
const color = (cat: string) => CAT_COLOR[cat] ?? "#78716c";

export interface MapPin { id: string; name: string; cat: string; lat: number | null; lng: number | null; phone?: string | null }

/** A real map of the provider's local referral landscape — pins colored by source type. */
export default function CatchmentMap({ center, targets }: { center: { lat: number; lng: number }; targets: MapPin[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [center.lng, center.lat],
      zoom: 10,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    mapRef.current = map;

    const pts = targets.filter((t) => t.lat != null && t.lng != null);
    map.on("load", () => {
      const bounds = new maplibregl.LngLatBounds();
      for (const t of pts) {
        const el = document.createElement("div");
        el.style.cssText = `width:13px;height:13px;border-radius:9999px;background:${color(t.cat)};border:2px solid #fff;box-shadow:0 1px 3px rgba(28,25,23,.3);cursor:pointer;`;
        const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-size:12px;font-weight:600;color:#1c1917">${t.name}</div>` +
          `<div style="font-size:11px;color:#78716c;margin-top:1px">${CAT_LABEL[t.cat] ?? t.cat}${t.phone ? " · " + t.phone : ""}</div>`,
        );
        const marker = new maplibregl.Marker({ element: el }).setLngLat([t.lng!, t.lat!]).setPopup(popup).addTo(map);
        el.addEventListener("mouseenter", () => marker.getPopup() && map && popup.addTo(map).setLngLat([t.lng!, t.lat!]));
        el.addEventListener("mouseleave", () => popup.remove());
        bounds.extend([t.lng!, t.lat!]);
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 12.5, animate: false });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [center, targets]);

  return <div ref={ref} className="h-[320px] w-full rounded-2xl overflow-hidden border border-stone-200/80" />;
}
