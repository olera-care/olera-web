import type { Metadata } from "next";
import { Suspense } from "react";
import OperatingMapView from "@/components/admin/operating-map/OperatingMapView";

export const metadata: Metadata = {
  title: "Operating Map",
};

export default function AdminOperatingMapPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Operating Map</h1>
      </div>

      {/* useSearchParams needs a Suspense boundary to prerender. */}
      <Suspense fallback={null}>
        <OperatingMapView />
      </Suspense>
    </div>
  );
}
