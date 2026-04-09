"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapAgency {
  lat: number;
  lng: number;
}

interface WeatherizationMapProps {
  agencies: MapAgency[];
  popularIndices: Set<number>;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  userLocation: { lat: number; lng: number; label: string } | null;
}

const TEXAS_BOUNDS: [[number, number], [number, number]] = [
  [25.84, -106.65],
  [36.5, -93.51],
];

export function WeatherizationMap({
  agencies,
  popularIndices,
  selectedIndex,
  onSelect,
  userLocation,
}: WeatherizationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
      zoomControl: false,
      minZoom: 6,
      maxBounds: L.latLngBounds([22, -112], [40, -88]),
      maxBoundsViscosity: 1,
    });
    map.setView([31.2, -99.5], 6);

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 18,
      subdomains: "abcd",
    }).addTo(map);

    // Highlight Texas boundary
    fetch(`https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json`)
      .then((res) => res.json())
      .then((geojson) => {
        const stateFeature = geojson.features?.find(
          (f: { properties: { name: string } }) => f.properties.name === "Texas"
        );
        if (stateFeature) {
          L.geoJSON(stateFeature, {
            style: {
              fillColor: "#4d9b96",
              fillOpacity: 0.1,
              color: "#4d9b96",
              weight: 2,
              opacity: 0.5,
            },
          }).addTo(map);
        }
      })
      .catch(() => { /* ignore */ });

    // Place pins for all agencies
    const makeIcon = (popular: boolean) =>
      L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:${popular ? 36 : 28}px;height:${popular ? 36 : 28}px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
          <svg width="${popular ? 28 : 22}" height="${popular ? 36 : 28}" viewBox="0 0 28 36" fill="none">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${popular ? "#0e7490" : "#4d9b96"}"/>
            <circle cx="14" cy="13" r="6" fill="white"/>
            <circle cx="14" cy="13" r="3" fill="${popular ? "#0e7490" : "#4d9b96"}"/>
          </svg>
        </div>`,
        iconSize: [popular ? 36 : 28, popular ? 36 : 28],
        iconAnchor: [popular ? 18 : 14, popular ? 36 : 28],
      });

    markersRef.current = agencies.map((agency, i) => {
      const popular = popularIndices.has(i);
      const marker = L.marker([agency.lat, agency.lng], {
        icon: makeIcon(popular),
        zIndexOffset: popular ? 1000 : 0,
      })
        .addTo(map)
        .on("click", () => {
          onSelectRef.current(i);
        });
      return marker;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
      userMarkerRef.current = null;
    };
  }, [agencies, popularIndices]);

  // Fly to selected pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedIndex === null) {
      map.flyTo([31.2, -99.5], 6, { animate: true, duration: 0.6 });
      return;
    }

    const agency = agencies[selectedIndex];
    if (!agency) return;
    map.flyTo([agency.lat, agency.lng], 9, { animate: true, duration: 0.8 });
  }, [selectedIndex, agencies]);

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;filter:drop-shadow(0 1px 3px rgba(14,116,144,0.4));">
          <div style="width:16px;height:16px;background:#0e7490;border:3px solid white;border-radius:50%;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon,
        zIndexOffset: 2000,
      }).addTo(map);
    }
  }, [userLocation]);

  return (
    <>
      <style>{`
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
        }
        .leaflet-control-attribution a {
          color: #9ca3af !important;
        }
        .leaflet-container {
          background: #f8fafa !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 400 }} />
    </>
  );
}
