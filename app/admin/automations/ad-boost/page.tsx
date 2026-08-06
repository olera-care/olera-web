import { Suspense } from "react";
import AdBoostJourneyExperience from "@/components/admin/AdBoostJourneyExperience";

export default function AdBoostAutomationJourneyPage() {
  return (
    <Suspense fallback={<p className="py-10 text-sm text-gray-400">Loading Ad Boost journey…</p>}>
      <AdBoostJourneyExperience />
    </Suspense>
  );
}
