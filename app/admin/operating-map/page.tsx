import type { Metadata } from "next";
import OperatingMap from "@/components/admin/operating-map/OperatingMap";

export const metadata: Metadata = {
  title: "Operating Map",
};

export default function AdminOperatingMapPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Operating Map</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Every step of the marketplace in one figure — how a care recipient, a care provider,
          and a care worker each enter, what they complete, and what the three tracks deliver.
          No node is instrumented yet; a dash means we have not decided what would count.
        </p>
      </div>

      <OperatingMap />
    </div>
  );
}
