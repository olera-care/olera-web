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
import ProgramCard from "./ProgramCard";
// SaveResultsBanner removed — value shown first, auth prompted on bookmark
import BenefitsReportHeader from "./BenefitsReportHeader";
import RecommendedFirstStep from "./RecommendedFirstStep";
import DocumentChecklist from "./DocumentChecklist";
import BenefitsPackageFAQ from "./BenefitsPackageFAQ";

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

const INITIAL_VISIBLE = 5;

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
  const [activeFilter, setActiveFilter] = useState<BenefitCategory | "all">("all");
  const [shareLabel, setShareLabel] = useState<"share" | "copied">("share");
  const [showAll, setShowAll] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Expand everything for print
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBefore = () => setIsPrinting(true);
    const onAfter = () => setIsPrinting(false);
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, []);

  const { reset, answers, locationDisplay, restoredFromDb, publishCarePost } = useCareProfile();
  const { user, account, activeProfile, refreshAccountData } = useAuth();
  const { isSaved, toggleSave } = useSavedBenefits();
  const syncedRef = useRef(false);

  // Matches invitation card state
  const [matchesCardDismissed, setMatchesCardDismissed] = useState(false);
  const [matchesCardConfirmed, setMatchesCardConfirmed] = useState(false);
  const [matchesActivating, setMatchesActivating] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const profileMeta = activeProfile?.metadata as FamilyMetadata | undefined;
  const hasActiveMatches = profileMeta?.care_post?.status === "active";
  const showMatchesCard = user && activeProfile && !matchesCardDismissed &&
    (!hasActiveMatches || matchesCardConfirmed);

  const cityDisplay = locationDisplay?.split(",")[0]?.trim() || "your area";

  // ─── Persist results (unchanged) ──────────────────────────────────────────
  useEffect(() => {
    if (syncedRef.current || restoredFromDb) return;

    if (!user) {
      setBenefitsIntakeCache(answers, locationDisplay, result, publishCarePost);
      syncedRef.current = true;
      return;
    }

    if (!activeProfile) return;
    syncedRef.current = true;
    setSyncInProgress(true);

    (async () => {
      try {
        if (!isSupabaseConfigured()) { setSyncInProgress(false); return; }
        const supabase = createClient();

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

        await syncBenefitsToProfile(answers, locationDisplay, activeProfile.id);
        await refreshAccountData();

        if (publishCarePost) {
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

  // ─── Derived data ─────────────────────────────────────────────────────────

  const { matchedPrograms, localAAA } = result;

  const presentCategories = Array.from(
    new Set(matchedPrograms.map((m) => m.program.category))
  );

  const filteredPrograms =
    activeFilter === "all"
      ? matchedPrograms
      : matchedPrograms.filter((m) => m.program.category === activeFilter);

  // For progressive reveal: skip the first program (shown as hero)
  const remainingPrograms = filteredPrograms.slice(1);
  const visiblePrograms = (showAll || isPrinting) ? remainingPrograms : remainingPrograms.slice(0, INITIAL_VISIBLE);
  const hiddenCount = remainingPrograms.length - visiblePrograms.length;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleShare() {
    const text = generateShareText(matchedPrograms, answers.stateCode, answers.age);
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareLabel("copied");
      setTimeout(() => setShareLabel("share"), 2000);
    } catch { /* noop */ }
  }

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

  // ─── Empty state ──────────────────────────────────────────────────────────

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

  // ─── Main results ─────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* ── Beat 1: The moment of relief ─────────────────────────────── */}

      <BenefitsReportHeader
        programCount={matchedPrograms.length}
        answers={answers}
        locationDisplay={locationDisplay}
        matchedPrograms={matchedPrograms}
        userName={account?.display_name?.split(" ")[0] ?? null}
        onShare={handleShare}
        shareLabel={shareLabel}
        onEditAnswers={reset}
        localAAA={localAAA}
      />

      {/* FAQ */}
      <BenefitsPackageFAQ stateCode={answers.stateCode} />

      {/* Print footer */}
      <p className="hidden print:block text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
        Generated by Olera Benefits Finder &mdash; olera.care/benefits/finder &mdash; {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
