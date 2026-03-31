"use client";

import { ServiceAreasMap } from "@/components/waiver-library/ServiceAreasMapLoader";

const AREAS = [
  { name: "Houston", description: "Harris, Fort Bend, Montgomery counties" },
  { name: "Dallas", description: "Dallas, Collin, Denton counties" },
  { name: "Fort Worth", description: "Tarrant County" },
  { name: "San Antonio", description: "Bexar County" },
  { name: "Austin", description: "Travis, Williamson counties" },
  { name: "El Paso", description: "El Paso County" },
];

const MAP_PINS = [
  { label: "Houston", lat: 29.7604, lng: -95.3698 },
  { label: "Dallas", lat: 32.7767, lng: -96.797 },
  { label: "Fort Worth", lat: 32.7555, lng: -97.3308 },
  { label: "San Antonio", lat: 29.4241, lng: -98.4936 },
  { label: "Austin", lat: 30.2672, lng: -97.7431 },
  { label: "El Paso", lat: 31.7619, lng: -106.485 },
];

export default function StarPlusServiceMap() {
  return (
    <div className="my-8 not-prose">
      <ServiceAreasMap
        stateId="texas"
        areas={AREAS}
        mapPins={MAP_PINS}
        programName="STAR+PLUS"
      />
    </div>
  );
}
