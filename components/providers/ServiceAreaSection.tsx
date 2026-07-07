"use client";

import { useRef, useState } from "react";
import CoverageAreaMap from "./CoverageAreaMap";
import type { CoverageAreaMapHandle } from "./CoverageAreaMap";

interface ServiceArea {
  name: string;
  lat: number;
  lng: number;
}

interface ServiceAreaSectionProps {
  center: { lat: number; lng: number };
  areas: ServiceArea[];
  providerName: string;
}

export default function ServiceAreaSection({ center, areas, providerName }: ServiceAreaSectionProps) {
  const mapRef = useRef<CoverageAreaMapHandle>(null);
  const [zip, setZip] = useState("");
  const [zipResult, setZipResult] = useState<"covered" | "not-covered" | null>(null);
  const [checking, setChecking] = useState(false);

  const checkZip = async () => {
    if (!zip || zip.length < 5) return;
    setChecking(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        const lats = areas.map((a) => a.lat);
        const lngs = areas.map((a) => a.lng);
        const padding = 0.15;
        const inRange =
          lat >= Math.min(...lats) - padding &&
          lat <= Math.max(...lats) + padding &&
          lng >= Math.min(...lngs) - padding &&
          lng <= Math.max(...lngs) + padding;

        setZipResult(inRange ? "covered" : "not-covered");
        mapRef.current?.dropPin(lat, lng, inRange);
      } else {
        setZipResult("not-covered");
      }
    } catch {
      setZipResult("not-covered");
    }
    setChecking(false);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`;

  return (
    <>
      {/* Zip code checker */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Enter your zip code"
              value={zip}
              onChange={(e) => {
                setZip(e.target.value.replace(/\D/g, ""));
                setZipResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && checkZip()}
              className="w-full pl-11 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={checkZip}
            disabled={zip.length < 5 || checking}
            className="px-6 py-3 text-base font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? "Checking..." : "Check coverage"}
          </button>
        </div>
        {zipResult === null && (
          <p className="mt-2 text-sm text-gray-400">See in seconds whether your address is covered.</p>
        )}
        {zipResult === "covered" && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            This area is within the service coverage area
          </p>
        )}
        {zipResult === "not-covered" && (
          <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            This zip code may be outside the typical service area. Contact the provider to confirm.
          </p>
        )}
      </div>

      {/* Map with overlay elements */}
      <div className="relative">
        <CoverageAreaMap
          ref={mapRef}
          center={center}
          areas={areas}
          providerName={providerName}
        />

        {/* Open in Maps link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-white hover:text-teal-800 transition-colors shadow-sm"
        >
          Open in Maps
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
        </a>

        {/* Community count */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 shadow-sm">
          Serving {areas.length} communities across Tarrant County
        </div>
      </div>

      {/* Areas served */}
      <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Areas served</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {areas.map((area) => (
            <button
              key={area.name}
              type="button"
              onClick={() => mapRef.current?.focusArea(area.lat, area.lng, area.name)}
              className="flex items-center gap-2.5 text-left group cursor-pointer hover:bg-white rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              <svg className="w-4 h-4 text-teal-600 shrink-0 group-hover:text-teal-800 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-sm text-gray-900 underline decoration-gray-300 underline-offset-2 group-hover:text-teal-700 group-hover:decoration-teal-500 transition-colors">{area.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
