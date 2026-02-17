"use client";

import { useState, useEffect, useRef } from "react";
import BenefitsIntakeForm from "@/components/benefits/BenefitsIntakeForm";
import BenefitsResults from "@/components/benefits/BenefitsResults";
import type { BenefitsIntakeAnswers, BenefitsSearchResult } from "@/lib/types/benefits";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import {
  setBenefitsIntakeCache,
  getBenefitsIntakeCache,
  clearBenefitsIntakeCache,
} from "@/lib/benefits-intake-cache";
import { syncBenefitsToProfile } from "@/lib/benefits-profile-sync";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";

type PageState = "intake" | "loading" | "results" | "error";

export default function BenefitsFinderPage() {
  const [pageState, setPageState] = useState<PageState>("intake");
  const [result, setResult] = useState<BenefitsSearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [intakeAnswers, setIntakeAnswers] = useState<BenefitsIntakeAnswers | null>(null);
  const [locationDisplay, setLocationDisplay] = useState("");
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const { user, activeProfile, refreshAccountData } = useAuth();
  const deferredHandled = useRef(false);
  const restoredRef = useRef(false);

  // Restore saved results for returning logged-in users
  useEffect(() => {
    if (restoredRef.current) return;
    if (!activeProfile) return;

    // Fast path: check in-memory auth context
    const meta = (activeProfile.metadata || {}) as FamilyMetadata;
    if (meta.benefits_results?.results && meta.benefits_results?.answers) {
      restoredRef.current = true;
      setResult(meta.benefits_results.results as unknown as BenefitsSearchResult);
      setIntakeAnswers(meta.benefits_results.answers as unknown as BenefitsIntakeAnswers);
      setLocationDisplay(meta.benefits_results.location_display || "");
      setCompletedAt(meta.benefits_results.completed_at || null);
      setPageState("results");
      return;
    }

    // Fallback: auth context may be stale if user navigated away before
    // refreshAccountData() completed — check DB directly
    (async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", activeProfile.id)
        .single();

      if (restoredRef.current) return; // another path restored while we queried
      const dbMeta = (data?.metadata || {}) as FamilyMetadata;
      if (dbMeta.benefits_results?.results && dbMeta.benefits_results?.answers) {
        restoredRef.current = true;
        setResult(dbMeta.benefits_results.results as unknown as BenefitsSearchResult);
        setIntakeAnswers(dbMeta.benefits_results.answers as unknown as BenefitsIntakeAnswers);
        setLocationDisplay(dbMeta.benefits_results.location_display || "");
        setCompletedAt(dbMeta.benefits_results.completed_at || null);
        setPageState("results");
      }
    })();
  }, [activeProfile]);

  // Handle post-auth deferred action (anonymous user who clicked Save → auth → return)
  useEffect(() => {
    if (deferredHandled.current) return;
    if (!user || !activeProfile) return;

    const deferred = getDeferredAction();
    if (deferred?.action !== "save_benefit") return;

    deferredHandled.current = true;
    clearDeferredAction();

    // Restore cached intake answers and results
    const cached = getBenefitsIntakeCache();
    if (cached) {
      // Sync intake answers to profile
      syncBenefitsToProfile(cached.answers, cached.locationDisplay, activeProfile.id);

      setIntakeAnswers(cached.answers);
      setLocationDisplay(cached.locationDisplay);

      // Restore results if cached
      if (cached.result) {
        setResult(cached.result);
        setPageState("results");
      }

      clearBenefitsIntakeCache();
    }

    // Save the specific benefit
    if (deferred.benefitProgramName) {
      const saveBenefit = async () => {
        if (!isSupabaseConfigured()) return;
        const supabase = createClient();

        const { data } = await supabase
          .from("business_profiles")
          .select("metadata")
          .eq("id", activeProfile.id)
          .single();

        const meta = (data?.metadata || {}) as FamilyMetadata;
        const current = meta.saved_benefits || [];
        if (!current.includes(deferred.benefitProgramName!)) {
          await supabase
            .from("business_profiles")
            .update({
              metadata: { ...meta, saved_benefits: [...current, deferred.benefitProgramName!] },
            })
            .eq("id", activeProfile.id);

          await refreshAccountData();
        }
      };
      saveBenefit().catch(console.error);
    }
  }, [user, activeProfile, refreshAccountData]);

  // Persist benefits results to profile metadata
  async function persistResults(
    answers: BenefitsIntakeAnswers,
    locDisplay: string,
    searchResult: BenefitsSearchResult
  ) {
    if (!activeProfile || !isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", activeProfile.id)
        .single();

      const meta = (data?.metadata || {}) as FamilyMetadata;
      const now = new Date().toISOString();
      await supabase
        .from("business_profiles")
        .update({
          metadata: {
            ...meta,
            benefits_results: {
              answers: answers as unknown as Record<string, unknown>,
              results: searchResult as unknown as Record<string, unknown>,
              location_display: locDisplay,
              completed_at: now,
            },
          },
        })
        .eq("id", activeProfile.id);

      setCompletedAt(now);
      await refreshAccountData();
    } catch (err) {
      console.error("[olera] Failed to persist benefits results:", err);
    }
  }

  async function handleSubmit(answers: BenefitsIntakeAnswers, locDisplay: string) {
    setIntakeAnswers(answers);
    setLocationDisplay(locDisplay);
    setPageState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/benefits/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong");
      }

      const data: BenefitsSearchResult = await res.json();
      setResult(data);
      setPageState("results");

      // Cache for anonymous → auth flow
      setBenefitsIntakeCache(answers, locDisplay, data);

      // Persist to profile for logged-in users (awaited so DB write
      // completes before user can navigate away)
      await persistResults(answers, locDisplay, data);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to find matching programs"
      );
      setPageState("error");
    }
  }

  function handleStartOver() {
    setResult(null);
    setErrorMsg(null);
    setIntakeAnswers(null);
    setLocationDisplay("");
    setCompletedAt(null);
    setPageState("intake");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Non-results states: constrained width */}
      {pageState !== "results" && (
        <div className="max-w-lg mx-auto px-4 pt-10 pb-16">
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
              <BenefitsIntakeForm onSubmit={handleSubmit} />
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
                onClick={handleStartOver}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-primary-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results: own layout — header/pills are unconstrained, cards stay narrow */}
      {pageState === "results" && result && (
        <div className="pt-10 pb-16">
          <BenefitsResults
            result={result}
            intakeAnswers={intakeAnswers}
            locationDisplay={locationDisplay}
            onStartOver={handleStartOver}
            completedAt={completedAt}
          />
        </div>
      )}
    </main>
  );
}
