"use client";

import dynamic from "next/dynamic";

const ServiceAreasMap = dynamic(
  () => import("./ServiceAreasMap").then((m) => m.ServiceAreasMap),
  { ssr: false, loading: () => <div className="flex-1 min-h-[400px] bg-gray-100 animate-pulse rounded-lg" /> }
);

export { ServiceAreasMap };
