"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "./CatchmentMap";

// maplibre touches the DOM at init — load client-only (mirrors BrowseMap).
const CatchmentMap = dynamic(() => import("./CatchmentMap"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full rounded-2xl border border-stone-200/80 bg-stone-50 animate-pulse" />,
});

export default function CatchmentMapLoader(props: { center: { lat: number; lng: number }; targets: MapPin[] }) {
  return <CatchmentMap {...props} />;
}
