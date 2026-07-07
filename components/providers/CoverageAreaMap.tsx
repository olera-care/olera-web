"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

interface CoverageArea {
  name: string;
  lat: number;
  lng: number;
}

interface CoverageAreaMapProps {
  center: { lat: number; lng: number };
  areas: CoverageArea[];
  providerName: string;
}

export interface CoverageAreaMapHandle {
  focusArea: (lat: number, lng: number, name: string) => void;
  resetView: () => void;
  dropPin: (lat: number, lng: number, covered: boolean) => void;
}

const HOUSE_PIN_SVG = `<svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 45C18 45 34 28.5 34 18C34 9.16 26.84 2 18 2C9.16 2 2 9.16 2 18C2 28.5 18 45 18 45Z" fill="#0d9488" stroke="white" stroke-width="2"/>
  <path d="M18 10L10 16v8a1 1 0 001 1h3v-5h8v5h3a1 1 0 001-1v-8L18 10z" fill="white"/>
</svg>`;

const COVERED_PIN_SVG = `<svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 45C18 45 34 28.5 34 18C34 9.16 26.84 2 18 2C9.16 2 2 9.16 2 18C2 28.5 18 45 18 45Z" fill="#16a34a" stroke="white" stroke-width="2"/>
  <path d="M12 18l4 4 8-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const NOT_COVERED_PIN_SVG = `<svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 45C18 45 34 28.5 34 18C34 9.16 26.84 2 18 2C9.16 2 2 9.16 2 18C2 28.5 18 45 18 45Z" fill="#dc2626" stroke="white" stroke-width="2"/>
  <path d="M13 13l10 10M23 13l-10 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const pts = [...points].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  function cross(o: [number, number], a: [number, number], b: [number, number]) {
    return (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
  }
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function expandPolygon(hull: [number, number][], padding: number): [number, number][] {
  const centerLat = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const centerLng = hull.reduce((s, p) => s + p[1], 0) / hull.length;
  return hull.map(([lat, lng]) => {
    const dLat = lat - centerLat;
    const dLng = lng - centerLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist === 0) return [lat, lng] as [number, number];
    const scale = (dist + padding) / dist;
    return [centerLat + dLat * scale, centerLng + dLng * scale] as [number, number];
  });
}

const CoverageAreaMap = forwardRef<CoverageAreaMapHandle, CoverageAreaMapProps>(
  function CoverageAreaMap({ center, areas, providerName }, ref) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const allPointsRef = useRef<[number, number][]>([]);
    const searchMarkerRef = useRef<L.Marker | null>(null);
    const coveragePolygonRef = useRef<L.Polygon | null>(null);

    const focusArea = useCallback((lat: number, lng: number, _name: string) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    }, []);

    const resetView = useCallback(() => {
      const map = mapInstanceRef.current;
      if (!map || allPointsRef.current.length === 0) return;
      import("leaflet").then((mod) => {
        const L = mod.default;
        const bounds = L.latLngBounds(allPointsRef.current.map(([lat, lng]) => [lat, lng]));
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 12, duration: 0.8 });
      });
    }, []);

    const showCoveragePolygon = useCallback(() => {
      const map = mapInstanceRef.current;
      if (!map || coveragePolygonRef.current) return;
      if (allPointsRef.current.length < 3) return;
      import("leaflet").then((mod) => {
        const L = mod.default;
        if (!mapInstanceRef.current) return;
        const hull = convexHull(allPointsRef.current);
        const expanded = expandPolygon(hull, 0.04);
        const polygon = L.polygon(expanded, {
          color: "#3b82f6",
          weight: 2,
          opacity: 0.4,
          fillColor: "#93c5fd",
          fillOpacity: 0.2,
          smoothFactor: 2,
        }).addTo(mapInstanceRef.current);
        coveragePolygonRef.current = polygon;
      });
    }, []);

    const dropPin = useCallback((lat: number, lng: number, covered: boolean) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      showCoveragePolygon();
      import("leaflet").then((mod) => {
        const L = mod.default;
        const icon = L.divIcon({
          className: "",
          html: covered ? COVERED_PIN_SVG : NOT_COVERED_PIN_SVG,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -40],
        });
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(
            covered
              ? `<strong style="color:#16a34a">Covered</strong><br/>This area is within the service range`
              : `<strong style="color:#dc2626">Not covered</strong><br/>This area may be outside the service range`
          )
          .openPopup();
        searchMarkerRef.current = marker;
        map.flyTo([lat, lng], 13, { duration: 0.8 });
      });
    }, [showCoveragePolygon]);

    useImperativeHandle(ref, () => ({ focusArea, resetView, dropPin }), [focusArea, resetView, dropPin]);

    useEffect(() => {
      if (!mapRef.current) return;
      let map: L.Map | null = null;
      const init = async () => {
        const L = (await import("leaflet")).default;
        // @ts-ignore -- CSS import handled by bundler
        await import("leaflet/dist/leaflet.css");
        if (!mapRef.current) return;
        map = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: 11,
          scrollWheelZoom: false,
          attributionControl: false,
        });
        mapInstanceRef.current = map;
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
        }).addTo(map);
        const allPoints: [number, number][] = [[center.lat, center.lng]];
        for (const area of areas) {
          allPoints.push([area.lat, area.lng]);
        }
        allPointsRef.current = allPoints;
        const pinIcon = L.divIcon({
          className: "",
          html: HOUSE_PIN_SVG,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          popupAnchor: [0, -40],
        });
        L.marker([center.lat, center.lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup(`<strong>${providerName}</strong><br/>Home base`);
        for (const area of areas) {
          L.marker([area.lat, area.lng], { icon: pinIcon })
            .addTo(map)
            .bindPopup(`<strong>${area.name}</strong><br/>Service area`);
        }
        if (allPoints.length > 1) {
          const bounds = L.latLngBounds(allPoints.map(([lat, lng]) => [lat, lng]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      };
      init();
      return () => {
        if (map) map.remove();
        mapInstanceRef.current = null;
      };
    }, [center, areas, providerName]);

    return (
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-xl border border-gray-200 overflow-hidden"
      />
    );
  }
);

export default CoverageAreaMap;
