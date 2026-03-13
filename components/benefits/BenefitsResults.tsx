"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BENEFIT_CATEGORIES } from "@/lib/types/benefits";
import type {
  BenefitsSearchResult,
  BenefitCategory,
  BenefitMatch,
} from "@/lib/types/benefits";
import { useCareProfile } from "@/lib/benefits/care-profile-context";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedBenefits } from "@/hooks/use-saved-benefits";
import { syncBenefitsToProfile } from "@/lib/benefits-profile-sync";
import { setBenefitsIntakeCache } from "@/lib/benefits-intake-cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";
import AAACard from "./AAACard";
import ProgramCard from "./ProgramCard";
import SaveResultsBanner from "./SaveResultsBanner";

// ── Success illustration for confirmation state ──
function MatchesSuccessIllustration({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" fill="#199087" fillOpacity="0.12" />
      <circle cx="24" cy="24" r="14" fill="white" />
      <path
        d="M17 24L21.5 28.5L31 19"
        stroke="#199087"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface BenefitsResultsProps {
  result: BenefitsSearchResult;
}

function generateShareText(
  matchedPrograms: BenefitMatch[],
  stateCode: string | null,
  age: number | null
) {
  const locationPart = stateCode ? ` in ${stateCode}` : "";
  const agePart = age ? `, for someone ${age} years old` : "";
  const header = `Your Benefits Results — ${matchedPrograms.length} program${matchedPrograms.length !== 1 ? "s" : ""} found${locationPart}${agePart}`;

  // Group by category
  const grouped = matchedPrograms.reduce<Record<string, BenefitMatch[]>>(
    (acc, m) => {
      const cat = m.program.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  const sections = Object.entries(grouped)
    .map(([cat, programs]) => {
      const catInfo = BENEFIT_CATEGORIES[cat as BenefitCategory];
      const lines = programs.map((m) => {
        const name = m.program.short_name || m.program.name;
        const topReason = m.matchReasons[0] || "";
        return `  - ${name} (${m.tierLabel})${topReason ? ` — ${topReason}` : ""}`;
      });
      return `${catInfo?.displayTitle}\n${lines.join("\n")}`;
    })
    .join("\n\n");

  return `${header}\n\n${sections}\n\nFound with Olera Benefits Finder\nhttps://olera.care/benefits/finder`;
}

export default function BenefitsResults({ result }: BenefitsResultsProps) {
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">(
    "all"
  );
  const [shareLabel, setShareLabel] = useState<"share" | "copied">("share");
  const { reset, answers, locationDisplay, restoredFromDb, publishCarePost } = useCareProfile();
  const { user, activeProfile, refreshAccountData } = useAuth();
  const { isSaved, toggleSave } = useSavedBenefits();
  const syncedRef = useRef(false);

  // Matches invitation card state
  const [matchesCardDismissed, setMatchesCardDismissed] = useState(false);
  const [matchesCardConfirmed, setMatchesCardConfirmed] = useState(false);
  const [matchesActivating, setMatchesActivating] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Determine if user should see Matches invitation card
  const profileMeta = activeProfile?.metadata as FamilyMetadata | undefined;
  const hasActiveMatches = profileMeta?.care_post?.status === "active";
  // Show card if: signed in, has profile, no active Matches (unless showing confirmation), not dismissed
  const showMatchesCard = user && activeProfile && !matchesCardDismissed &&
    (!hasActiveMatches || matchesCardConfirmed);

  // Get city from location display (step 1 location data)
  // locationDisplay is typically "City, ST" format
  const cityDisplay = locationDisplay?.split(",")[0]?.trim() || "your area";

  // Persist results to DB + sync intake answers to profile fields
  useEffect(() => {
    if (syncedRef.current || restoredFromDb) return;

    if (!user) {
      // Anonymous: cache intake data for post-auth restore (including care post preference)
      setBenefitsIntakeCache(answers, locationDisplay, result, publishCarePost);
      syncedRef.current = true;
      return;
    }

    if (!activeProfile) return; // wait for profile to load
    syncedRef.current = true;
    setSyncInProgress(true);

    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          setSyncInProgress(false);
          return;
        }
        const supabase = createClient();

        // 1. Persist full results to metadata.benefits_results
        const { data: current } = await supabase
          .from("business_profiles")
          .select("metadata")
          .eq("id", activeProfile.id)
          .single();

        const meta = (current?.metadata || {}) as FamilyMetadata;
        await supabase
          .from("business_profiles")
          .update({
            metadata: {
              ...meta,
              benefits_results: {
                answers: answers as unknown as Record<string, unknown>,
                results: result as unknown as Record<string, unknown>,
                location_display: locationDisplay,
                completed_at: new Date().toISOString(),
              },
            },
          })
          .eq("id", activeProfile.id);

        // 2. Sync intake answers to profile fields (reads fresh metadata)
        await syncBenefitsToProfile(answers, locationDisplay, activeProfile.id);

        // 3. Refresh auth context so profile reflects changes
        await refreshAccountData();

        // 4. Auto-publish care post if user opted in
        if (publishCarePost) {
          // Ensure timeline is set (required for care post publishing)
          const { data: fresh } = await supabase
            .from("business_profiles")
            .select("metadata")
            .eq("id", activeProfile.id)
            .single();

          const freshMeta = (fresh?.metadata || {}) as FamilyMetadata;
          if (!freshMeta.timeline) {
            await supabase
              .from("business_profiles")
              .update({ metadata: { ...freshMeta, timeline: "exploring" } })
              .eq("id", activeProfile.id);
          }

          await fetch("/api/care-post/publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "publish" }),
          });

          await refreshAccountData();
        }
      } catch (err) {
        console.error("[olera] Benefits persist/sync failed:", err);
      } finally {
        setSyncInProgress(false);
      }
    })();
  }, [user, activeProfile, answers, locationDisplay, result, restoredFromDb, publishCarePost, refreshAccountData]);

  const { matchedPrograms, localAAA } = result;

  // Unique categories present in results
  const presentCategories = Array.from(
    new Set(matchedPrograms.map((m) => m.program.category))
  );

  // Filter + group
  const filteredPrograms =
    activeFilter === "all"
      ? matchedPrograms
      : matchedPrograms.filter((m) => m.program.category === activeFilter);

  const grouped = filteredPrograms.reduce<Record<string, BenefitMatch[]>>(
    (acc, m) => {
      const cat = m.program.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  async function handleShare() {
    const text = generateShareText(matchedPrograms, answers.stateCode, answers.age);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareLabel("copied");
      setTimeout(() => setShareLabel("share"), 2000);
    } catch {
      // Clipboard not available
    }
  }

  // Activate Matches profile
  async function handleActivateMatches() {
    if (matchesActivating) return;
    setMatchesActivating(true);
    setMatchesError(null);

    try {
      const res = await fetch("/api/care-post/activate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityDisplay,
          state: answers.stateCode || undefined,
          primaryNeeds: answers.primaryNeeds || [],
        }),
      });

      if (res.ok) {
        setMatchesCardConfirmed(true);
        await refreshAccountData();
      } else {
        const data = await res.json().catch(() => ({}));
        setMatchesError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("[olera] Matches activation error:", err);
      setMatchesError("Something went wrong. Please try again.");
    } finally {
      setMatchesActivating(false);
    }
  }

  function handleDismissMatchesCard() {
    setMatchesCardDismissed(true);
  }

  function handleMatchesCardDone() {
    setMatchesCardDismissed(true);
    setMatchesCardConfirmed(false);
  }

  // Empty state
  if (matchedPrograms.length === 0 && !localAAA) {
    return (
      <div className="py-16">
        <p className="font-display text-display-xs font-medium text-gray-900 mb-2">
          No matching programs found
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-md">
          Try adjusting your answers, or contact your local Area Agency on Aging
          for personalized help.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 min-h-[44px] bg-gray-900 text-white rounded-full text-sm font-medium border-none cursor-pointer hover:bg-gray-800 transition-colors"
        >
          Try different answers
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Soft auth banner for anonymous users */}
      <SaveResultsBanner />

      {/* Header — serif with match count + share */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-display-sm font-medium text-gray-900 mb-1 leading-snug tracking-tight">
            {matchedPrograms.length} program{matchedPrograms.length !== 1 ? "s" : ""} matched
          </h2>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-gray-400 hover:text-gray-900 bg-transparent border-none cursor-pointer transition-colors shrink-0"
            aria-label="Share results"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {shareLabel === "copied" ? "Copied!" : "Share results"}
          </button>
        </div>
        <p className="text-sm text-gray-400">
          Based on your care profile
        </p>
      </div>

      {/* AAA card */}
      {localAAA && (
        <div className="mb-10">
          <AAACard agency={localAAA} />
        </div>
      )}

      {/* Matches invitation card — for signed-in users without active Matches */}
      {showMatchesCard && (
        <div className="mb-10">
          <div className="border border-vanilla-300 border-l-4 border-l-primary-500 bg-vanilla-100 rounded-2xl p-5 lg:p-6">
            {matchesCardConfirmed ? (
              /* ── Confirmation state ── */
              <div className="flex flex-col items-center text-center py-2">
                <MatchesSuccessIllustration className="w-12 h-12 mb-3" />
                <h3 className="font-display text-display-xs font-medium text-gray-900 mb-1">
                  Your profile is live in {cityDisplay}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mb-4">
                  Providers in your area can now find you. We&apos;ll email you the moment someone reaches out.
                </p>
                <Link
                  href="/portal/matches"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mb-2"
                >
                  View your Matches profile &rarr;
                </Link>
                <button
                  onClick={handleMatchesCardDone}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ── Invitation state ── */
              <>
                <p className="text-xs font-medium text-gray-400 mb-2 tracking-widest uppercase">
                  Let providers find you
                </p>
                <h3 className="font-display text-display-xs font-medium text-gray-900">
                  Now let care providers find you
                </h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xl">
                  You&apos;ve already told us everything we need. We&apos;ll share your care profile with
                  qualified providers in {cityDisplay} — they reach out, and you decide who to talk to.
                </p>
                {matchesError && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      We couldn&apos;t set up your profile right now.
                    </p>
                    <Link
                      href="/portal/matches"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Visit your Matches tab to complete setup.
                    </Link>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <button
                    onClick={handleActivateMatches}
                    disabled={matchesActivating || syncInProgress}
                    className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-primary-600 text-white rounded-full text-sm font-medium border-none cursor-pointer hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {syncInProgress ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving results...
                      </>
                    ) : matchesActivating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Activating...
                      </>
                    ) : (
                      "Yes, let providers find me"
                    )}
                  </button>
                  <button
                    onClick={handleDismissMatchesCard}
                    className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    No thanks
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter tabs — quiet, text-style */}
      {presentCategories.length > 1 && (
        <div
          className="flex items-center gap-1 mb-6 border-b border-vanilla-200 -mx-1 px-1"
          role="toolbar"
          aria-label="Filter by category"
        >
          <button
            onClick={() => setActiveFilter("all")}
            aria-pressed={activeFilter === "all"}
            className={`px-3 py-2.5 min-h-[44px] text-sm font-medium border-none cursor-pointer transition-colors bg-transparent -mb-px ${
              activeFilter === "all"
                ? "text-gray-900 border-b-2 border-b-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
            style={activeFilter === "all" ? { borderBottom: "2px solid #111827" } : {}}
          >
            All
          </button>
          {presentCategories.map((cat) => {
            const info = BENEFIT_CATEGORIES[cat];
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                aria-pressed={isActive}
                className={`px-3 py-2.5 min-h-[44px] text-sm font-medium border-none cursor-pointer transition-colors bg-transparent -mb-px ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                style={isActive ? { borderBottom: "2px solid #111827" } : {}}
              >
                {info?.displayTitle}
              </button>
            );
          })}
        </div>
      )}

      {/* Program list — single column, divided by category */}
      {Object.entries(grouped).map(([cat, programs]) => {
        const info = BENEFIT_CATEGORIES[cat as BenefitCategory];
        return (
          <div key={cat} className="mb-8">
            <p className="text-xs font-medium text-gray-400 mb-1 tracking-widest uppercase">
              {info?.displayTitle}
            </p>
            <div>
              {programs.map((m, i) => (
                <div
                  key={m.id}
                  className="animate-card-enter"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProgramCard
                    match={m}
                    isSaved={isSaved(m.program.name)}
                    onToggleSave={() => toggleSave(m.program.name)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
