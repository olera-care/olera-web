"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import BrowseCard from "@/components/browse/BrowseCard";
import Pagination from "@/components/ui/Pagination";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import type { FamilyCard } from "@/app/api/medjobs/families/route";

/**
 * JobsBoard — the signed-in student's "Find Jobs" board at /portal/medjobs/jobs.
 * A campus-catchment job board: cards (BrowseCard student variant) + a sticky
 * map, filtered by campus and care type. Reuses the public families feed
 * (/api/medjobs/families) and the directory's BrowseMap. Lives behind the
 * /portal middleware gate, so visitors are always authenticated.
 */

const BrowseMap = dynamic(() => import("@/components/browse/BrowseMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  ),
});

const PAGE_SIZE = 12;

const CARE_OPTIONS = [
  { label: "All care types", kw: "" },
  { label: "Memory Care", kw: "memory" },
  { label: "Home Care", kw: "home care" },
  { label: "Assisted Living", kw: "assisted" },
  { label: "Skilled Nursing", kw: "nursing" },
  { label: "Home Health Care", kw: "home health" },
];

function cardMatches(c: FamilyCard, kw: string): boolean {
  if (!kw) return true;
  const hay = `${c.primaryCategory} ${c.providerCategory ?? ""} ${(c.careTypes || []).join(" ")}`.toLowerCase();
  return hay.includes(kw);
}

// "Top" = evidence density (rating × log(reviews + 1)); program agencies first.
function evidenceScore(c: FamilyCard): number {
  return (c.rating || 0) * Math.log((c.reviewCount || 0) + 1);
}

interface StudentInfo {
  profileId: string | null;
  isLive: boolean;
  campus: string;
}

export default function JobsBoard() {
  const router = useRouter();
  const { profiles, isLoading: authLoading } = useAuth();

  const [student, setStudent] = useState<StudentInfo>({ profileId: null, isLive: false, campus: "" });
  const [campus, setCampus] = useState<string>("");
  const [careFilter, setCareFilter] = useState<string>("");
  const [cards, setCards] = useState<FamilyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<FamilyCard | null>(null);

  const campusName = PARTNER_UNIVERSITIES.find((u) => u.slug === campus)?.name ?? null;

  // Resolve the signed-in student's profile, live status, and home campus.
  useEffect(() => {
    if (authLoading) return;
    const sp = profiles?.find((p) => p.type === "student");
    if (!sp) {
      setStudent({ profileId: null, isLive: false, campus: "" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sb = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await sb
          .from("business_profiles")
          .select("is_active, metadata")
          .eq("id", sp.id)
          .single();
        if (cancelled) return;
        const meta = (data?.metadata || {}) as Record<string, unknown>;
        const homeCampus = typeof meta.campus === "string" ? meta.campus : "";
        setStudent({ profileId: sp.id, isLive: !!data?.is_active, campus: homeCampus });
        setCampus((c) => c || homeCampus);
      } catch {
        if (!cancelled) setStudent({ profileId: sp.id, isLive: false, campus: "" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, profiles]);

  // Existing interview requests → mark those cards as already requested.
  useEffect(() => {
    if (!student.profileId) return;
    let cancelled = false;
    (async () => {
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
        if (!cancelled) setRequested(ids);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student.profileId]);

  const fetchJobs = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ sort: "newest" });
      if (slug) qs.set("campus", slug);
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
    fetchJobs(campus);
  }, [campus, fetchJobs]);

  // Care-filter + Top-sort (program/claimed agencies first, then evidence density).
  const visible = cards.filter((c) => cardMatches(c, careFilter));
  const sorted = [...visible].sort((a, b) => {
    if (!!a.isProgram !== !!b.isProgram) return a.isProgram ? -1 : 1;
    return evidenceScore(b) - evidenceScore(a);
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageCards = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const mapCards = sorted.filter((c) => c.lat != null && c.lon != null);

  const onRequest = (f: FamilyCard) => {
    if (!student.profileId) {
      router.push("/medjobs/families?screener=1");
      return;
    }
    if (!student.isLive) {
      router.push("/portal/medjobs");
      return;
    }
    setModalTarget(f);
  };

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-6 text-3xl md:text-4xl font-bold text-gray-900">
        Find jobs near {campusName || "you"}
      </h1>

      {/* Reminder banner — above the filters, shown only while not live */}
      {student.profileId && !student.isLive && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Image
              src="/images/for-providers/team/logan.jpg"
              alt="Dr. Logan DuBose"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">Complete your profile to apply</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Browse every job now — finishing your profile unlocks interview requests.
              </p>
            </div>
          </div>
          <Link
            href="/portal/medjobs"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Finish your profile →
          </Link>
        </div>
      )}

      {/* Filters — campus + care type on one row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select value={campus} onChange={(e) => setCampus(e.target.value)} className={selectClass}>
          <option value="">All campuses</option>
          {PARTNER_UNIVERSITIES.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
        <select value={careFilter} onChange={(e) => setCareFilter(e.target.value)} className={selectClass}>
          {CARE_OPTIONS.map((o) => (
            <option key={o.label} value={o.kw}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Two-column: cards left, sticky map right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <p className="text-gray-500">
                No {CARE_OPTIONS.find((o) => o.kw === careFilter)?.label.toLowerCase() ?? "matching"} jobs
                near {campusName || "you"} yet.
              </p>
              {careFilter && (
                <button
                  type="button"
                  onClick={() => setCareFilter("")}
                  className="mt-3 text-sm font-semibold text-primary-700 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pageCards.map((f) => (
                  <div
                    key={f.id}
                    onMouseEnter={() => setHoveredId(f.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <BrowseCard
                      provider={f}
                      variant="student"
                      campus={campus || undefined}
                      isRequested={requested.has(f.id)}
                      canRequest={!!student.profileId}
                      onRequestInterview={() => onRequest(f)}
                    />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={sorted.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="jobs"
                  className="mt-6"
                />
              )}
            </>
          )}
        </div>

        {/* Sticky map (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
              <BrowseMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} />
            </div>
          </div>
        </div>
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
    </div>
  );
}
