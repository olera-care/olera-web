"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import CandidateCard from "@/components/medjobs/CandidateCard";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import RefreshAfterCheckout from "@/components/medjobs/RefreshAfterCheckout";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import WelcomeBanner from "@/components/medjobs/WelcomeBanner";
import DrDuBoseWelcome from "@/components/medjobs/DrDuBoseWelcome";

const PAGE_SIZE = 20;
// Session key so the university filter persists across navigation (the
// provider lands filtered to their campus and stays there until they change
// it, even after exploring other parts of the portal and coming back).
const UNIVERSITY_FILTER_KEY = "medjobs_university_filter";

interface University {
  id: string;
  name: string;
}

export default function CandidateBrowsePage() {
  return (
    <Suspense fallback={<div />}>
      <CandidateBrowseInner />
    </Suspense>
  );
}

function CandidateBrowseInner() {
  const searchParams = useSearchParams();
  const { openAuth, activeProfile, profiles } = useAuth();
  const isProvider =
    activeProfile?.type === "organization" || activeProfile?.type === "caregiver";

  const claimConflict = searchParams?.get("claim_conflict") === "1";
  // Magic-link arrivals (?welcome=1 / ?activate=1) auto-open the eligibility screener.
  const autoOpenScreener =
    searchParams?.get("welcome") === "1" || searchParams?.get("activate") === "1";
  // The magic-link landing resolves the provider's campus → university id.
  const universityFromUrl = searchParams?.get("university") ?? null;

  // Pilot/subscription unlocks the full board; otherwise preview. Used both for
  // data redaction (server-side) and to decide whether to show the welcome
  // banner, which persists until the provider activates the pilot.
  const providerProfile = profiles?.find(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  const isEligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null
  );
  const matchBuckets = (
    (providerProfile?.metadata as Record<string, unknown> | undefined)?.[
      "medjobs_demand_profile"
    ] as { coverage_buckets?: string[] } | undefined
  )?.coverage_buckets;

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const initedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Universities for the dropdown.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("medjobs_universities")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }: { data: University[] | null }) => {
        if (data) setUniversities(data);
      });
  }, []);

  // Initialize the university filter once: session > magic-link url > none.
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    let initial = "";
    try {
      const stored = sessionStorage.getItem(UNIVERSITY_FILTER_KEY);
      if (stored) initial = stored;
    } catch {
      // sessionStorage unavailable — fall through
    }
    if (!initial && universityFromUrl) initial = universityFromUrl;
    if (initial) {
      setUniversityId(initial);
      try {
        sessionStorage.setItem(UNIVERSITY_FILTER_KEY, initial);
      } catch {
        // ignore
      }
    }
  }, [universityFromUrl]);

  const onUniversityChange = useCallback((id: string) => {
    setUniversityId(id);
    try {
      if (id) sessionStorage.setItem(UNIVERSITY_FILTER_KEY, id);
      else sessionStorage.removeItem(UNIVERSITY_FILTER_KEY);
    } catch {
      // ignore
    }
  }, []);

  const fetchCandidates = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          pageSize: String(PAGE_SIZE),
          sort,
        });
        if (universityId) params.set("universityId", universityId);

        const res = await fetch(`/api/medjobs/candidates?${params}`);
        const data = await res.json();
        const newCandidates = data.candidates || [];
        if (append) setCandidates((prev) => [...prev, ...newCandidates]);
        else setCandidates(newCandidates);
        setTotal(data.total || 0);
        setHasMore(newCandidates.length === PAGE_SIZE);
      } catch (err) {
        console.error("[medjobs/candidates] fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [universityId, sort]
  );

  // Refetch only when the actual query inputs change (university / sort, via
  // fetchCandidates' own deps). Eligibility no longer affects the result set
  // (profiles are de-blurred for any provider), so keying off it just caused a
  // skeleton flash when eligibility flipped after the screener.
  useEffect(() => {
    setPage(0);
    fetchCandidates(0, false);
  }, [fetchCandidates]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCandidates(nextPage, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchCandidates]);

  const selectedUniversityName =
    universities.find((u) => u.id === universityId)?.name ?? null;
  // Provider banner: shows for any signed-in provider; the banner itself
  // branches on eligibility (screener prompt vs "you're a fit").
  const showWelcome = isProvider;

  const selectClass =
    "appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat";
  const chevronBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <RefreshAfterCheckout />

      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          {!isProvider && (
            <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
              <Link href="/medjobs/providers" className="hover:text-primary-600 transition-colors">
                For Providers
              </Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-600">Interns</span>
            </nav>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">
            Pre-Health Interns Near You
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500 max-w-2xl">
            Vetted pre-nursing and pre-medical students who commit to a semester
            of recurring availability — ready to match with your clients.
          </p>

          {total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                {total} intern{total !== 1 ? "s" : ""} available
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {showWelcome && (
          <WelcomeBanner
            claimConflict={claimConflict}
            isEligible={isEligible}
            providerProfileId={providerProfile?.id}
            campusName={selectedUniversityName}
            orgName={providerProfile?.display_name ?? null}
            autoOpenScreener={autoOpenScreener}
          />
        )}

        {/* Filters — university + sort only */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={universityId}
            onChange={(e) => onUniversityChange(e.target.value)}
            className={selectClass}
            style={{ backgroundImage: chevronBg }}
            aria-label="Filter by university"
          >
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className={selectClass}
            style={{ backgroundImage: chevronBg }}
            aria-label="Sort order"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-100" />
                <div className="p-5 pt-4">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-24" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          universityId ? (
            // No real students at this campus yet → recruiting state + a warm
            // welcome from Dr. DuBose (the personal-recommendation fallback).
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6">
                <h2 className="font-display text-xl text-gray-900">
                  We&apos;re recruiting {selectedUniversityName || "student"} caregivers for you now.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  We&apos;ll email you the moment a student who fits your needs
                  joins. Want a head start? Meet Dr. DuBose and he&apos;ll
                  personally recommend a student.
                </p>
              </div>
              <DrDuBoseWelcome withCalendly />
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No interns found.</p>
              <p className="text-gray-400 text-sm mt-1">Try a different university filter.</p>
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  basePath="/medjobs/candidates"
                  matchBuckets={matchBuckets}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {hasMore && !loadingMore && <div ref={sentinelRef} className="h-1" />}

            {!hasMore && candidates.length > 0 && !isProvider && (
              <div className="mt-8 text-center">
                <div className="inline-flex flex-col items-center gap-3 px-8 py-6 bg-white rounded-2xl border border-gray-100">
                  <p className="text-base font-medium text-gray-900">
                    Ready to connect with interns?
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuth({ intent: "provider", defaultMode: "sign-in" })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Sign in as a Provider
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
