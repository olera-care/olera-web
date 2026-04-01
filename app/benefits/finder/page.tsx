"use client";

import { useState, useEffect, useRef } from "react";
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

const BUILD_PHASES = [
  "Scanning federal programs",
  "Checking state-specific benefits",
  "Evaluating eligibility criteria",
  "Calculating potential savings",
  "Finalizing your package",
];

export default function BenefitsFinderPage() {
  const { pageState, result, errorMsg, reset, restoreResults, setPublishCarePost, previewCount } = useCareProfile();
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

    // Restore the "Let providers find me" preference from cache
    if (cached.publishCarePost !== undefined) {
      setPublishCarePost(cached.publishCarePost);
    }

    // fromDb: false → BenefitsResults sync useEffect will persist + sync
    restoreResults(cached.result, cached.answers, cached.locationDisplay);
  }, [user, activeProfile, restoreResults, setPublishCarePost]);

  // Results use full workspace width; intake is focused and centered
  if (pageState === "results" && result) {
    return <BenefitsResults result={result} />;
  }

  return (
    <div className="max-w-lg">
      {/* Intake form — no card wrapper, content sits directly on page */}
      {pageState === "intake" && <BenefitsIntakeForm />}

      {/* Loading — building animation */}
      {pageState === "loading" && <BuildingAnimation targetCount={previewCount ?? 20} />}

      {/* Error — shown if API call fails */}
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

function BuildingAnimation({ targetCount }: { targetCount: number }) {
  const [buildCount, setBuildCount] = useState(0);
  const [buildPhase, setBuildPhase] = useState(0);

  useEffect(() => {
    let current = 0;
    const countUp = () => {
      if (current < targetCount) {
        current++;
        setBuildCount(current);
        setTimeout(countUp, 100 + Math.random() * 150);
      }
    };
    const startTimer = setTimeout(countUp, 1000);

    const phaseTimers: ReturnType<typeof setTimeout>[] = [];
    BUILD_PHASES.forEach((_, i) => {
      if (i > 0) {
        phaseTimers.push(setTimeout(() => setBuildPhase(i), i * 1300));
      }
    });

    return () => {
      clearTimeout(startTimer);
      phaseTimers.forEach(clearTimeout);
    };
  }, [targetCount]);

  return (
    <div className="py-12 animate-step-in">
      <div className="max-w-sm">
        {/* Animated book */}
        <div className="relative w-64 h-44 mx-auto mb-8">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-4 rounded-[50%] bg-black/10 blur-md" style={{ animation: "bf-shadow-pulse 1.8s ease-in-out infinite" }} />
          <div className="absolute bottom-4 left-1/2 w-52 h-36 rounded-xl border border-gray-200" style={{ transform: "translateX(-50%) rotate(-2deg)", background: "linear-gradient(170deg, #f5f3f0, #ede9e4)", animation: "bf-page-in 0.6s ease-out forwards", opacity: 0, animationDelay: "0.3s" }} />
          <div className="absolute bottom-4 left-1/2 w-52 h-36 rounded-xl border border-gray-200" style={{ transform: "translateX(-50%) rotate(-1deg)", background: "linear-gradient(170deg, #faf9f7, #f5f3f0)", animation: "bf-page-in 0.6s ease-out forwards", opacity: 0, animationDelay: "0.8s" }} />
          <div className="absolute bottom-4 left-1/2 w-52 h-36 rounded-xl border border-gray-200 overflow-hidden" style={{ transform: "translateX(-50%)", background: "linear-gradient(170deg, #fff, #fdfcfb 40%, #faf9f7)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "bf-page-in 0.6s ease-out forwards", opacity: 0, animationDelay: "1.5s" }}>
            <div className="h-7 bg-primary-800 flex items-center px-3">
              <span className="text-[8px] font-bold text-primary-200 tracking-widest uppercase">Olera Benefits Package</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="h-2 bg-gray-200 rounded-full w-3/4" style={{ animation: "bf-line-fill 1s ease-out forwards", animationDelay: "2.2s", transformOrigin: "left", transform: "scaleX(0)" }} />
              <div className="h-2 bg-gray-100 rounded-full w-full" style={{ animation: "bf-line-fill 1s ease-out forwards", animationDelay: "2.5s", transformOrigin: "left", transform: "scaleX(0)" }} />
              <div className="h-2 bg-gray-100 rounded-full w-5/6" style={{ animation: "bf-line-fill 1s ease-out forwards", animationDelay: "2.8s", transformOrigin: "left", transform: "scaleX(0)" }} />
              <div className="flex gap-2 mt-3">
                <div className="h-5 bg-success-100 border border-success-200 rounded-md flex-1" style={{ animation: "bf-line-fill 0.8s ease-out forwards", animationDelay: "3.2s", transformOrigin: "left", transform: "scaleX(0)" }} />
                <div className="h-5 bg-primary-50 border border-primary-100 rounded-md flex-1" style={{ animation: "bf-line-fill 0.8s ease-out forwards", animationDelay: "3.5s", transformOrigin: "left", transform: "scaleX(0)" }} />
              </div>
            </div>
          </div>

          {/* Floating icons */}
          <div className="absolute top-2 right-6 w-8 h-8 bg-success-100 border border-success-200 rounded-lg flex items-center justify-center" style={{ animation: "bf-icon-float 0.5s ease-out forwards", animationDelay: "1.0s", opacity: 0 }}>
            <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
          </div>
          <div className="absolute top-8 left-6 w-8 h-8 bg-primary-100 border border-primary-200 rounded-lg flex items-center justify-center" style={{ animation: "bf-icon-float 0.5s ease-out forwards", animationDelay: "1.3s", opacity: 0 }}>
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center" style={{ animation: "bf-icon-float 0.5s ease-out forwards", animationDelay: "1.6s", opacity: 0 }}>
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
        </div>

        {/* Title + counter */}
        <h3 className="font-display text-xl font-bold text-gray-900 mb-3">Building your benefits package</h3>

        <div className="flex items-center gap-2 mb-1.5">
          <svg className="w-4 h-4 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-900 font-semibold tabular-nums">
            <span className="text-primary-600">{buildCount}</span> of {targetCount} programs matched
          </p>
        </div>

        <p className="text-xs text-gray-400 mb-4 h-4" key={buildPhase} style={{ animation: "bf-phase-fade 1.3s ease-in-out" }}>
          {BUILD_PHASES[buildPhase]}...
        </p>

        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${targetCount > 0 ? (buildCount / targetCount) * 100 : 0}%` }} />
        </div>
      </div>

      <style>{`
        @keyframes bf-page-in {
          0% { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.9); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes bf-line-fill {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes bf-icon-float {
          0% { opacity: 0; transform: translateY(20px) scale(0.5); }
          60% { opacity: 1; transform: translateY(-5px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bf-shadow-pulse {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleX(0.8); }
          50% { opacity: 0.5; transform: translateX(-50%) scaleX(1); }
        }
        @keyframes bf-phase-fade {
          0% { opacity: 0; transform: translateY(4px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
