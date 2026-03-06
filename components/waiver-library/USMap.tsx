"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { StateData } from "@/data/waiver-library";
import { useStateSearch } from "./StateSearchContext";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const usStatesData = require("us-atlas/states-10m.json");

// FIPS → state slug
const fipsToStateId: Record<string, string> = {
  "01": "alabama",      "02": "alaska",         "04": "arizona",
  "05": "arkansas",    "06": "california",      "08": "colorado",
  "09": "connecticut", "10": "delaware",         "12": "florida",
  "13": "georgia",     "15": "hawaii",           "16": "idaho",
  "17": "illinois",    "18": "indiana",          "19": "iowa",
  "20": "kansas",      "21": "kentucky",         "22": "louisiana",
  "23": "maine",       "24": "maryland",         "25": "massachusetts",
  "26": "michigan",    "27": "minnesota",        "28": "mississippi",
  "29": "missouri",    "30": "montana",          "31": "nebraska",
  "32": "nevada",      "33": "new-hampshire",    "34": "new-jersey",
  "35": "new-mexico",  "36": "new-york",         "37": "north-carolina",
  "38": "north-dakota","39": "ohio",             "40": "oklahoma",
  "41": "oregon",      "42": "pennsylvania",     "44": "rhode-island",
  "45": "south-carolina","46": "south-dakota",  "47": "tennessee",
  "48": "texas",       "49": "utah",             "50": "vermont",
  "51": "virginia",    "53": "washington",       "54": "west-virginia",
  "55": "wisconsin",   "56": "wyoming",
};

// Geographic centroids [longitude, latitude] for label placement
const stateCentroids: Record<string, [number, number]> = {
  alabama:        [-86.9, 32.8],
  alaska:         [-153.4, 64.2],
  arizona:        [-111.6, 34.3],
  arkansas:       [-92.4, 34.9],
  california:     [-119.7, 37.2],
  colorado:       [-105.5, 39.0],
  connecticut:    [-72.7, 41.6],
  delaware:       [-75.5, 39.0],
  florida:        [-82.5, 28.1],
  georgia:        [-83.4, 32.7],
  hawaii:         [-155.5, 19.9],
  idaho:          [-114.5, 44.4],
  illinois:       [-89.2, 40.0],
  indiana:        [-86.3, 40.3],
  iowa:           [-93.5, 42.1],
  kansas:         [-98.4, 38.5],
  kentucky:       [-85.3, 37.5],
  louisiana:      [-92.5, 31.1],
  maine:          [-69.4, 45.4],
  maryland:       [-76.8, 39.0],
  massachusetts:  [-71.8, 42.3],
  michigan:       [-84.5, 44.3],
  minnesota:      [-94.3, 46.4],
  mississippi:    [-89.7, 32.7],
  missouri:       [-92.5, 38.4],
  montana:        [-110.3, 47.0],
  nebraska:       [-99.9, 41.5],
  nevada:         [-116.4, 39.5],
  "new-hampshire":[-71.6, 43.7],
  "new-jersey":   [-74.5, 40.1],
  "new-mexico":   [-106.1, 34.4],
  "new-york":     [-75.5, 43.0],
  "north-carolina":[-79.4, 35.6],
  "north-dakota": [-100.5, 47.5],
  ohio:           [-82.8, 40.4],
  oklahoma:       [-97.5, 35.6],
  oregon:         [-120.6, 44.0],
  pennsylvania:   [-77.2, 41.2],
  "rhode-island": [-71.5, 41.7],
  "south-carolina":[-80.9, 33.8],
  "south-dakota": [-100.2, 44.4],
  tennessee:      [-86.7, 35.8],
  texas:          [-99.3, 31.5],
  utah:           [-111.1, 39.3],
  vermont:        [-72.7, 44.0],
  virginia:       [-78.2, 37.5],
  washington:     [-120.7, 47.4],
  "west-virginia":[-80.5, 38.6],
  wisconsin:      [-89.7, 44.5],
  wyoming:        [-107.6, 43.0],
};

// States too small to show a label clearly on the map
const hideLabel = new Set(["connecticut", "delaware", "rhode-island", "new-jersey", "maryland"]);

/** Parse "$X,XXX – $Y,YYY/year" → average of X and Y */
function parseSavingsAverage(savingsRange: string): number {
  const matches = savingsRange.match(/\$([\d,]+)/g);
  if (!matches || matches.length === 0) return 0;
  const nums = matches.map((m) => Number(m.replace(/[$,]/g, "")));
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const STATE_FILL = "#1a8fa8"; // teal

interface TooltipInfo {
  stateId: string;
  name: string;
  x: number;
  y: number;
}

interface USMapProps {
  states: StateData[];
}

export function USMap({ states }: USMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { query, setQuery } = useStateSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  const stateMap = new Map(states.map((s) => [s.id, s]));

  // Compute total estimated savings per state
  const stateSavings = useMemo(() => {
    const map = new Map<string, number>();
    for (const state of states) {
      const total = state.programs.reduce(
        (sum, p) => sum + parseSavingsAverage(p.savingsRange),
        0
      );
      map.set(state.id, total);
    }
    return map;
  }, [states]);

  // Top states by program count for "Most explored" section
  const topStates = useMemo(
    () =>
      [...states]
        .sort((a, b) => b.programs.length - a.programs.length)
        .slice(0, 6),
    [states]
  );

  // Aggregate stats
  const totalPrograms = useMemo(
    () => states.reduce((sum, s) => sum + s.programs.length, 0),
    [states]
  );
  const totalSavingsMillions = useMemo(() => {
    let total = 0;
    for (const [, v] of stateSavings) total += v;
    return Math.round(total / 1_000_000);
  }, [stateSavings]);

  const matchedIds: Set<string> | null = query.trim()
    ? new Set(
        states
          .filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.abbreviation.toLowerCase().includes(query.toLowerCase())
          )
          .map((s) => s.id)
      )
    : null;

  function isActive(stateId: string): boolean {
    return !matchedIds || matchedIds.has(stateId);
  }

  function getFill(stateId: string | undefined, hovered: boolean): string {
    if (!stateId) return "#e5e7eb";
    if (!isActive(stateId)) return "#d1dbe6"; // dimmed
    if (hovered) return "#083344"; // primary-950
    return STATE_FILL;
  }

  function formatSavings(amount: number): string {
    if (amount >= 1000) return `$${Math.round(amount / 1000)}k`;
    return `$${Math.round(amount)}`;
  }

  return (
    <div>
      {/* Map */}
      <div ref={containerRef} className="relative w-full select-none mx-auto" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.12)) drop-shadow(0 2px 3px rgba(0,0,0,0.08))" }}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1050 }}
          viewBox="0 70 800 500"
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={usStatesData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = String(geo.id).padStart(2, "0");
                const stateId = fipsToStateId[fips];
                const state = stateId ? stateMap.get(stateId) : undefined;
                const isHovered = hoveredId === stateId;
                const fill = getFill(stateId, isHovered);
                const programCount = state?.programs.length ?? 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) => {
                      if (!stateId || !containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      setHoveredId(stateId);
                      setTooltip({
                        stateId,
                        name: state?.name ?? stateId,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                    onMouseMove={(e) => {
                      if (!containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      setTooltip((prev) =>
                        prev
                          ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
                          : null
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                      setTooltip(null);
                    }}
                    onClick={() => stateId && router.push(`/waiver-library/${stateId}`)}
                    style={{
                      default: {
                        fill,
                        stroke: "#ffffff",
                        strokeWidth: isHovered ? 1.5 : 0.5,
                        outline: "none",
                        cursor: stateId ? "pointer" : "default",
                      },
                      hover: {
                        fill: stateId && isActive(stateId) ? "#083344" : "#d1dbe6",
                        stroke: "#ffffff",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: stateId ? "pointer" : "default",
                      },
                      pressed: {
                        fill: "#155e75",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* State labels: show program count badge on hover, abbreviation otherwise */}
          {states.map((state) => {
            const centroid = stateCentroids[state.id];
            if (!centroid || hideLabel.has(state.id)) return null;
            const active = isActive(state.id);
            const programCount = state.programs.length;
            const isHovered = hoveredId === state.id;
            const showBadge = isHovered || (matchedIds && matchedIds.has(state.id));

            if (showBadge) {
              return (
                <Marker key={state.id} coordinates={centroid}>
                  <circle
                    r={9}
                    fill="#ffffff"
                    stroke="#0e7490"
                    strokeWidth={1.5}
                    style={{ pointerEvents: "none" }}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "7px",
                      fontWeight: 700,
                      fill: "#0e7490",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    {programCount}
                  </text>
                </Marker>
              );
            }

            return (
              <Marker key={state.id} coordinates={centroid}>
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "7px",
                    fontWeight: 600,
                    fill: active ? "#ffffff" : "#9ca3af",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {state.abbreviation}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Hover tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 min-w-[200px]"
            style={{ left: tooltip.x + 16, top: tooltip.y - 80 }}
          >
            <p className="font-semibold text-gray-900 text-sm">{tooltip.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {stateMap.get(tooltip.stateId)?.programs.length ?? 0} programs available
            </p>
            {(stateSavings.get(tooltip.stateId) ?? 0) > 0 && (
              <p className="text-gray-500 text-xs mt-0.5">
                Est. savings: ~{formatSavings(stateSavings.get(tooltip.stateId)!)}
                /yr
              </p>
            )}
            <p className="mt-1.5 text-primary-600 text-xs font-medium">Click to explore →</p>
          </div>
        )}
      </div>

      {/* No-match message when searching */}
      {query && matchedIds && matchedIds.size === 0 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          No states match &ldquo;{query}&rdquo;.{" "}
          <button
            onClick={() => setQuery("")}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Most explored states */}
      <div className="mt-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-display mb-4">Most explored states</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topStates.map((state) => (
            <Link
              key={state.id}
              href={`/waiver-library/${state.id}`}
              className="group px-5 py-4 rounded-xl bg-white border-2 border-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:border-primary-300 hover:-translate-y-1 cursor-pointer transition-all duration-300"
            >
              <p className="font-semibold text-gray-900 text-lg group-hover:text-primary-700 transition-colors whitespace-nowrap">{state.name} <span className="inline-block ml-0.5 text-primary-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span></p>
              <p className="text-sm text-gray-500 mt-1">{state.programs.length} programs {"\u00B7"} <span className="text-primary-600 font-medium">up to ~{formatSavings(stateSavings.get(state.id) ?? 0)}/yr in savings</span></p>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-8 rounded-2xl bg-primary-900 px-6 py-6 md:py-8 text-center">
        <h3 className="text-2xl md:text-3xl font-semibold text-white font-display mb-2">Don&apos;t know where to start?</h3>
        <p className="text-primary-200 mb-4">Answer a few quick questions and see every program you qualify for. Free, no signup required.</p>
        <Link
          href="/benefits/finder"
          className="group inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-md"
        >
          Check My Benefits
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
