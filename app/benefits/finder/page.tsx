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
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Senior Benefits Finder
        </h1>
        <p className="text-base text-gray-600">
          Answer a few questions to discover programs you or your loved one
          may qualify for.
        </p>
      </div>

      {/* Intake form */}
      {pageState === "intake" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <BenefitsIntakeForm />
        </div>
      )}

      {/* Loading */}
      {pageState === "loading" && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-base text-gray-600">
            Finding programs you may qualify for...
          </p>
        </div>
      )}

      {/* Error */}
      {pageState === "error" && (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Something went wrong
          </p>
          <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
