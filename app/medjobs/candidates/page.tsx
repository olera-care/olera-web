"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import RefreshAfterCheckout from "@/components/medjobs/RefreshAfterCheckout";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import DrDuBoseWelcome, { type NoteVariant } from "@/components/medjobs/DrDuBoseWelcome";
import EligibilityScreenerModal from "@/components/medjobs/EligibilityScreenerModal";
import ProvidersMarketing from "@/components/medjobs/ProvidersMarketing";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";
import { US_STATES } from "@/lib/power-pages";

const PAGE_SIZE = 20;
// Session key so the university filter persists across navigation (the
// provider lands filtered to their campus and stays there until they change
// it, even after exploring other parts of the portal and coming back).
const UNIVERSITY_FILTER_KEY = "medjobs_university_filter";

interface University {
  id: string;
  name: string;
  state: string | null;
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
  const router = useRouter();
  const { profiles, refreshAccountData, isLoading } = useAuth();

  // A provider is any account that owns an organization/caregiver profile.
  const providerProfile = profiles?.find(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  const hasProviderProfile = !!providerProfile;
  const isEligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null
  );
  const matchBuckets = (
    (providerProfile?.metadata as Record<string, unknown> | undefined)?.[
      "medjobs_demand_profile"
    ] as { coverage_buckets?: string[] } | undefined
  )?.coverage_buckets;

  const claimConflict = searchParams?.get("claim_conflict") === "1";
  // Magic-link arrivals (?welcome=1 / ?activate=1) auto-open the screener.
  const autoOpenScreener =
    searchParams?.get("welcome") === "1" || searchParams?.get("activate") === "1";
  const universityFromUrl = searchParams?.get("university") ?? null;
  // Campus slug threaded from /medjobs/providers?campus=… → resolved to a
  // university id below so the board lands filtered to that campus.
  const campusSlugParam = searchParams?.get("campus") ?? null;

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState<string>("");
  const [geoState, setGeoState] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [showScreener, setShowScreener] = useState(false);

  const initedRef = useRef(false);
  const geoTriedRef = useRef(false);
  const campusResolvedRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Universities for the dropdown.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("medjobs_universities")
      .select("id, name, state")
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

  // Resolve a threaded campus slug (?campus=…) to a university id.
  useEffect(() => {
    if (!initedRef.current || campusResolvedRef.current) return;
    if (universityId || universityFromUrl || !campusSlugParam) return;
    campusResolvedRef.current = true;
    const supabase = createClient();
    supabase
      .from("medjobs_universities")
      .select("id")
      .eq("slug", campusSlugParam)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (data?.id) setUniversityId((cur) => cur || data.id);
      });
  }, [campusSlugParam, universityId, universityFromUrl]);

  // Geo auto-filter: when nothing pinned the campus (no session, no url param,
  // no resolvable campus slug), detect the visitor's state from the SAME proven
  // endpoint the directory's city pages use (/api/geo → Vercel edge geo, state
  // only — no sparse lat/lng). Resolved to a university below.
  useEffect(() => {
    if (!initedRef.current || geoTriedRef.current) return;
    if (universityId || universityFromUrl || campusSlugParam) return;
    geoTriedRef.current = true;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { state?: string | null }) => setGeoState(d?.state ?? null))
      .catch(() => {});
  }, [universityId, universityFromUrl, campusSlugParam]);

  // Resolve the geo'd state → the active university in that state. Soft default,
  // NOT persisted (user can still pick "All universities"). If no campus exists
  // in that state we leave the board on "All" rather than forcing a wrong campus.
  useEffect(() => {
    if (!geoState || universities.length === 0) return;
    if (universityId || universityFromUrl || campusSlugParam) return;
    const abbr = geoState.trim().toUpperCase(); // /api/geo returns 2-letter
    const fullName = US_STATES[abbr]?.toLowerCase(); // tolerate "Texas" rows too
    const match = universities.find((u) => {
      const s = (u.state ?? "").trim();
      return s.toUpperCase() === abbr || (!!fullName && s.toLowerCase() === fullName);
    });
    if (match) setUniversityId((cur) => cur || match.id);
  }, [geoState, universities, universityId, universityFromUrl, campusSlugParam]);

  // Auto-open the screener for a ?welcome=1 / ?activate=1 arrival who isn't
  // eligible yet — works for anon (the screener's claim step signs them in) and
  // for not-eligible providers. Wait for auth to settle so an already-eligible
  // provider doesn't briefly see it.
  useEffect(() => {
    if (autoOpenedRef.current || isLoading) return;
    if (autoOpenScreener && !isEligible && !claimConflict) {
      autoOpenedRef.current = true;
      setShowScreener(true);
    }
  }, [autoOpenScreener, isEligible, claimConflict, isLoading]);

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

  const realCount = candidates.length;
  // Samples fill the board only when there are no real students for the
  // current filter (and the real fetch has settled).
  const showSamples = !loading && realCount === 0;

  // The Note from Dr. DuBose — the universal anchor; variant by state.
  const noteVariant: NoteVariant = !hasProviderProfile
    ? "anon"
    : !isEligible
      ? "not_eligible"
      : loading || realCount > 0
        ? "happy"
        : "fallback";

  // Both anon and not-eligible providers open the screener; the screener's own
  // claim step handles anon sign-in + org creation/claim in-modal.
  const onCheckEligibility = useCallback(() => {
    setShowScreener(true);
  }, []);

  // On screener completion, refresh auth in place (no reload), close, and strip
  // the one-shot params so a manual refresh doesn't re-open the screener.
  // After the needs quiz, land the provider on their profile tab (/provider),
  // where the state-aware welcome banner picks up the next step (book a call in
  // the fallback era; browse candidates once there's liquidity). The screener's
  // claim flow establishes the session before this runs, so /provider (gated)
  // is reachable.
  const onScreenerComplete = useCallback(async () => {
    await refreshAccountData();
    setShowScreener(false);
    router.push("/provider");
  }, [refreshAccountData, router]);

  const selectClass =
    "appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat";
  const chevronBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

  return (
    <main className="min-h-screen bg-white">
      <RefreshAfterCheckout />

      {/* Hero — two-column, campus-aware */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 md:pt-12 md:pb-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Hire college students {selectedUniversityName ? `from ${selectedUniversityName}` : "near you"}
              </h1>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
                Future doctors, nurses, and healthcare professionals seeking caregiving jobs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <button
                  type="button"
                  onClick={onCheckEligibility}
                  className="inline-flex items-center px-7 py-3.5 bg-primary-600 text-white text-[15px] font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
                >
                  Tell us your hiring needs →
                </button>
                <a
                  href="#candidates"
                  className="inline-flex items-center px-5 py-3.5 text-gray-500 text-[15px] font-medium hover:text-gray-900 transition-colors"
                >
                  Browse student caregivers
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>
              <div className="mt-6 flex items-center gap-2.5">
                <Image
                  src="/images/for-providers/team/logan.jpg"
                  alt="Dr. Logan DuBose"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover shadow-sm"
                />
                <p className="text-sm text-gray-500">
                  Co-Founded by Logan DuBose, MD &middot; GP &middot; Researcher
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[3/2] rounded-3xl overflow-hidden bg-gray-100 shadow-xl shadow-gray-900/10">
                <Image
                  src="/images/medjobs/provider-caregiving.jpg"
                  alt="Student caregiver with a senior client"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 sm:-left-6 max-w-[88%] rounded-xl border border-primary-100 bg-white px-4 py-3 shadow-lg shadow-gray-900/10">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Students from
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { name: "University of Houston", logo: "/images/medjobs/universities/houston.png" },
                    { name: "Texas A&M University", logo: "/images/medjobs/universities/texas-am.png" },
                    { name: "Prairie View A&M", logo: "/images/medjobs/universities/prairie-view.webp" },
                    { name: "University of Michigan", logo: "/images/medjobs/universities/michigan.png" },
                    { name: "University of Maryland", logo: "/images/medjobs/universities/maryland.png" },
                  ].map((uni) => (
                    <Image
                      key={uni.name}
                      src={uni.logo}
                      alt={uni.name}
                      width={120}
                      height={60}
                      className="h-6 w-auto object-contain opacity-80"
                    />
                  ))}
                  <span className="text-lg leading-none text-gray-300" aria-hidden="true">
                    …
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {claimConflict && (
          <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4">
            <h2 className="font-serif text-lg text-gray-900">
              This organization is already linked to another team member.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              You can browse the board freely. To be added to the existing team
              account, email{" "}
              <a href="mailto:logan@olera.care" className="font-medium text-primary-700 hover:underline">
                logan@olera.care
              </a>{" "}
              and we&apos;ll handle it.
            </p>
          </div>
        )}

        {/* The Note from Dr. DuBose — universal anchor, state-specific. */}
        {!claimConflict && (
          <DrDuBoseWelcome
            variant={noteVariant}
            campusName={selectedUniversityName}
            orgName={providerProfile?.display_name ?? null}
            onCheckEligibility={onCheckEligibility}
          />
        )}

        {/* Top candidates */}
        <div id="candidates" className="scroll-mt-20 mb-4 flex items-center justify-between gap-3">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Top candidates {selectedUniversityName ? `near ${selectedUniversityName}` : "near you"}
          </h2>
          {total > 0 && (
            <span className="shrink-0 text-sm text-gray-500">{total} available</span>
          )}
        </div>

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
        ) : showSamples ? (
          // No real students for this filter yet → show curated samples so the
          // board is never empty. Header frames them honestly as "joining near".
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_CANDIDATES.map((c) => (
              <BrowseCard
                key={c.id}
                provider={candidateToCardFormat(c, { isDemo: true })}
                variant="candidate"
                isDemo
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <BrowseCard
                  key={candidate.id}
                  provider={candidateToCardFormat(candidate)}
                  variant="candidate"
                  href={`/medjobs/candidates/${candidate.slug}`}
                  matchLabel={candidateMatchLabel(matchBuckets, candidate) ?? undefined}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {hasMore && !loadingMore && <div ref={sentinelRef} className="h-1" />}
          </>
        )}
      </div>

      <ProvidersMarketing />

      {showScreener && (
        <EligibilityScreenerModal
          providerProfileId={providerProfile?.id}
          campusName={selectedUniversityName}
          orgName={providerProfile?.display_name ?? null}
          onClose={() => setShowScreener(false)}
          onComplete={onScreenerComplete}
        />
      )}
    </main>
  );
}
