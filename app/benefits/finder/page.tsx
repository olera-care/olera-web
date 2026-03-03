"use client";

import { useEffect, useRef } from "react";
import BenefitsIntakeForm from "@/components/benefits/BenefitsIntakeForm";
import BenefitsResults from "@/components/benefits/BenefitsResults";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getBenefitsIntakeCache,
  clearBenefitsIntakeCache,
} from "@/lib/benefits-intake-cache";
import type { BenefitsIntakeAnswers, BenefitsSearchResult } from "@/lib/types/benefits";
import type { FamilyMetadata } from "@/lib/types";

export default function BenefitsFinderPage() {
  const { pageState, result, errorMsg, reset, restoreResults } = useCareProfile();
  const { user, activeProfile } = useAuth();
  const restoredRef = useRef(false);

  // Restore saved results for returning logged-in users
  useEffect(() => {
    if (restoredRef.current || pageState !== "intake") return;
    if (!activeProfile) return;

    const meta = (activeProfile.metadata || {}) as FamilyMetadata;
    if (meta.benefits_results?.results && meta.benefits_results?.answers) {
      restoredRef.current = true;
      restoreResults(
        meta.benefits_results.results as unknown as BenefitsSearchResult,
        meta.benefits_results.answers as unknown as BenefitsIntakeAnswers,
        meta.benefits_results.location_display || "",
        { fromDb: true }
      );
    }
  }, [activeProfile, pageState, restoreResults]);

  // Restore from intake cache after anonymous → auth flow
  useEffect(() => {
    if (restoredRef.current) return;
    if (!user || !activeProfile) return;

    const cached = getBenefitsIntakeCache();
    if (!cached?.result) return;

    restoredRef.current = true;
    clearBenefitsIntakeCache();

    // fromDb: false → BenefitsResults sync useEffect will persist + sync
    restoreResults(cached.result, cached.answers, cached.locationDisplay);
  }, [user, activeProfile, restoreResults]);

  // Results use full workspace width; intake is focused and centered
  if (pageState === "results" && result) {
    return <BenefitsResults result={result} />;
  }

  return (
    <div className="max-w-lg">
      {/* Intake form — no card wrapper, content sits directly on page */}
      {pageState === "intake" && <BenefitsIntakeForm />}

      {/* Loading */}
      {pageState === "loading" && (
        <div className="py-16">
          <div className="inline-block w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-base text-gray-500">
            Finding programs you may qualify for...
          </p>
        </div>
      )}

      {/* Error */}
      {pageState === "error" && (
        <div className="py-12">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </p>
          <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
