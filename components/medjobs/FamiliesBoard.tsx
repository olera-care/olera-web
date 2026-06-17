"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import BrowseCard from "@/components/browse/BrowseCard";
import StudentWelcomeNote, { type StudentNoteVariant } from "@/components/medjobs/StudentWelcomeNote";
import StudentEligibilityModal from "@/components/medjobs/StudentEligibilityModal";
import { SAMPLE_FAMILIES } from "@/lib/medjobs/demo-family";
import Pagination from "@/components/ui/Pagination";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import type { FamilyCard } from "@/app/api/medjobs/families/route";

const PAGE_SIZE = 12;

// Explore Job Options — care types a student can filter by. Only the ones with
// at least one job in the current catchment are shown.
const CARE_OPTIONS = [
  { label: "Memory Care", kw: "memory", image: "/images/memory-care.jpg" },
  { label: "Home Care", kw: "home care", image: "/images/home-care.jpg" },
  { label: "Assisted Living", kw: "assisted", image: "/images/assisted-living.jpg" },
  { label: "Skilled Nursing", kw: "nursing", image: "/images/nursing-home.jpg" },
  { label: "Home Health Care", kw: "home health", image: "/images/home-health.jpg" },
];

function cardMatches(c: FamilyCard, kw: string): boolean {
  const hay = `${c.primaryCategory} ${c.providerCategory ?? ""} ${(c.careTypes || []).join(" ")}`.toLowerCase();
  return hay.includes(kw);
}

// "Top" = evidence density (rating × log(reviews + 1)); newest order is the
// API fallback when ratings are sparse.
function evidenceScore(c: FamilyCard): number {
  return (c.rating || 0) * Math.log((c.reviewCount || 0) + 1);
}

interface StudentStatus {
  isLive: boolean;
  completeness: number | null;
  firstName: string | null;
}

function Board() {
  const searchParams = useSearchParams();
  const { profiles, isLoading: authLoading } = useAuth();

  const campusParam = searchParams?.get("campus") || "";
  const autoScreener = searchParams?.get("screener") === "1";

  const [campus, setCampus] = useState<string>(campusParam);
  const [cards, setCards] = useState<FamilyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [careFilter, setCareFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<FamilyCard | null>(null);
  const [showScreener, setShowScreener] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const topJobsRef = useRef<HTMLDivElement>(null);

  const campusName = PARTNER_UNIVERSITIES.find((u) => u.slug === campus)?.name ?? null;

  const fetchFamilies = useCallback(async (campusSlug: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ sort: "newest" });
      if (campusSlug) qs.set("campus", campusSlug);
      const res = await fetch(`/api/medjobs/families?${qs.toString()}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchFamilies(campus);
  }, [campus, fetchFamilies]);

  // Auth → capture student profile + status (drives the note variant).
  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (!studentProfile) {
      setStudentProfileId(null);
      setStudentStatus(null);
      return;
    }
    setStudentProfileId(studentProfile.id);
    fetchExistingInterviews();
    fetchStudentStatus(studentProfile.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profiles]);

  // Open the screener for an anon arrival with ?screener=1 (reacts to the
  // param so the marketing "Apply" buttons can trigger it via navigation).
  useEffect(() => {
    if (authLoading) return;
    if (autoScreener && !studentProfileId) setShowScreener(true);
  }, [autoScreener, authLoading, studentProfileId]);

  const fetchStudentStatus = async (profileId: string) => {
    try {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data } = await sb
        .from("business_profiles")
        .select("is_active, display_name, metadata")
        .eq("id", profileId)
        .single();
      if (!data) return;
      const meta = (data.metadata || {}) as Record<string, unknown>;
      setStudentStatus({
        isLive: !!data.is_active,
        completeness: typeof meta.profile_completeness === "number" ? meta.profile_completeness : null,
        firstName: (data.display_name || "").trim().split(" ")[0] || null,
      });
      if (!campus && typeof meta.campus === "string") setCampus(meta.campus);
    } catch {
      /* note falls back to generic copy */
    }
  };

  const fetchExistingInterviews = async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      if (!res.ok) return;
      const data = await res.json();
      const ids = new Set<string>();
      const active = ["proposed", "confirmed", "rescheduled", "completed"];
      for (const iv of data.interviews || []) {
        if (iv.proposed_by === iv.student_profile_id && active.includes(iv.status)) {
          ids.add(iv.provider_profile_id);
        }
      }
      setRequested(ids);
    } catch {
      /* ignore */
    }
  };

  const showSamples = !loading && cards.length === 0; // real replaces demo

  const noteVariant: StudentNoteVariant = !studentProfileId
    ? "anon"
    : studentStatus?.isLive
      ? "live"
      : "not_live";

  // Care-filtered, "Top"-sorted set + the options that actually have jobs.
  const visibleCards = careFilter ? cards.filter((c) => cardMatches(c, careFilter)) : cards;
  const topCards = [...visibleCards].sort((a, b) => evidenceScore(b) - evidenceScore(a));
  const availableOptions = CARE_OPTIONS.filter((o) => cards.some((c) => cardMatches(c, o.kw)));
  const totalPages = Math.ceil(topCards.length / PAGE_SIZE);
  const pageCards = topCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSelectOption = (kw: string) => {
    setCareFilter(kw);
    setPage(1);
    topJobsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cardEl = (f: FamilyCard) => (
    <BrowseCard
      key={f.id}
      provider={f}
      variant="student"
      campus={campus || undefined}
      isRequested={requested.has(f.id)}
      canRequest={!!studentProfileId}
      onRequestInterview={() => (studentProfileId ? setModalTarget(f) : setShowScreener(true))}
    />
  );

  return (
    <>
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">
            Get real healthcare experience near {campusName || "you"}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500">
            Paid caregiving jobs for college students pursuing careers in medicine and nursing.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <StudentWelcomeNote
          variant={noteVariant}
          campusName={campusName}
          firstName={studentStatus?.firstName ?? null}
          completeness={studentStatus?.completeness ?? null}
          onCheckEligibility={() => setShowScreener(true)}
        />

        {/* Filter: campus (right-aligned) */}
        <div className="mb-6 flex justify-end">
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="">All providers</option>
            {PARTNER_UNIVERSITIES.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : showSamples ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_FAMILIES.map((f) => (
              <BrowseCard key={f.id} provider={f} variant="student" isDemo />
            ))}
          </div>
        ) : (
          <>
            {/* ── Top Jobs ── */}
            <div ref={topJobsRef} className="scroll-mt-20">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 font-display">
                  Top jobs near {campusName || "you"}
                  {careFilter ? <span className="text-gray-400 font-normal"> · filtered</span> : null}
                </h2>
                <div className="flex items-center gap-3 shrink-0">
                  {careFilter && (
                    <button
                      type="button"
                      onClick={() => setCareFilter(null)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Clear filter
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded((e) => !e);
                      setPage(1);
                    }}
                    className="text-sm font-semibold text-primary-700 hover:underline"
                  >
                    {expanded ? "Show less" : "View all jobs →"}
                  </button>
                </div>
              </div>

              {expanded ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageCards.map(cardEl)}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={topCards.length}
                        itemsPerPage={PAGE_SIZE}
                        onPageChange={(p) => {
                          setPage(p);
                          topJobsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        itemLabel="jobs"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="relative">
                  {topCards.length > 3 && (
                    <>
                      <button
                        type="button"
                        aria-label="Scroll left"
                        onClick={() => carouselRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label="Scroll right"
                        onClick={() => carouselRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                      >
                        ›
                      </button>
                    </>
                  )}
                  <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {topCards.map((f) => (
                      <div key={f.id} className="w-72 shrink-0 snap-start">
                        {cardEl(f)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Explore Job Options ── */}
            {availableOptions.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Explore job options</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  {availableOptions.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => onSelectOption(o.kw)}
                      className="relative overflow-hidden rounded-2xl group aspect-[4/3] shadow-sm hover:shadow-lg transition-shadow duration-300 text-left"
                    >
                      <Image src={o.image} alt={o.label} fill className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex items-end justify-between">
                        <h3 className="text-white font-bold text-base md:text-lg leading-tight">{o.label}</h3>
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors duration-300">
                          <svg className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalTarget && (
        <ScheduleInterviewModal
          providerProfileId={modalTarget.id}
          otherName={modalTarget.name}
          onClose={() => setModalTarget(null)}
          onScheduled={() => {
            setRequested((prev) => new Set(prev).add(modalTarget.id));
            setModalTarget(null);
          }}
        />
      )}

      {showScreener && (
        <StudentEligibilityModal
          context={{
            campusName,
            campusSlug: campus || null,
            universityName: searchParams?.get("uni") || campusName,
            demandCount: cards.length,
            referral: {
              campus: campus || null,
              partner_outreach_id: searchParams?.get("pid") || null,
              source: searchParams?.get("src") || null,
            },
          }}
          onClose={() => setShowScreener(false)}
          onComplete={() => setShowScreener(false)}
        />
      )}
    </>
  );
}

export default function FamiliesBoard() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <Board />
    </Suspense>
  );
}
