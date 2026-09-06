import type { Metadata } from "next";
import OperatingMap from "@/components/admin/operating-map/OperatingMap";

export const metadata: Metadata = {
  title: "Operating Map",
};

export default function AdminOperatingMapPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Operating Map</h1>
      </div>

      <OperatingMap />
    </div>
  );
}
