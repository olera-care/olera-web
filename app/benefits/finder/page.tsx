"use client";

import BenefitsIntakeForm from "@/components/benefits/BenefitsIntakeForm";
import BenefitsResults from "@/components/benefits/BenefitsResults";
import { useCareProfile } from "@/lib/benefits/care-profile-context";

export default function BenefitsFinderPage() {
  const { pageState, result, errorMsg, reset } = useCareProfile();

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
