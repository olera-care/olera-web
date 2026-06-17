"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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

interface StudentStatus {
  isLive: boolean;
  completeness: number | null;
  firstName: string | null;
}

function FamiliesInner() {
  const searchParams = useSearchParams();
  const { profiles, isLoading: authLoading } = useAuth();

  const campusParam = searchParams?.get("campus") || "";
  const autoScreener = searchParams?.get("screener") === "1";

  const [campus, setCampus] = useState<string>(campusParam);
  const sort = "newest";
  const [cards, setCards] = useState<FamilyCard[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<FamilyCard | null>(null);
  const [showScreener, setShowScreener] = useState(false);

  const campusName = PARTNER_UNIVERSITIES.find((u) => u.slug === campus)?.name ?? null;

  const fetchFamilies = useCallback(
    async (page: number, campusSlug: string, sortVal: string) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page), sort: sortVal });
        if (campusSlug) qs.set("campus", campusSlug);
        const res = await fetch(`/api/medjobs/families?${qs.toString()}`);
        const data = await res.json();
        setCards(data.cards || []);
        setTotal(data.total || 0);
        setCurrentPage(page);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchFamilies(1, campus, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus, sort]);

  // Auth → capture student profile + status (drives the note variant).
  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (!studentProfile) {
      setStudentProfileId(null);
      setStudentStatus(null);
      // Unauthed: auto-open the screener when arriving from a flyer link.
      if (autoScreener) setShowScreener(true);
      return;
    }
    setStudentProfileId(studentProfile.id);
    fetchExistingInterviews();
    fetchStudentStatus(studentProfile.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profiles]);

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
      // If the student has a campus and the board isn't filtered, start local.
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

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showSamples = !loading && cards.length === 0; // real replaces demo

  const noteVariant: StudentNoteVariant = !studentProfileId
    ? "anon"
    : studentStatus?.isLive
      ? "live"
      : "not_live";

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">
            Get real healthcare experience near {campusName || "you"}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500 max-w-2xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((f) => (
                <BrowseCard
                  key={f.id}
                  provider={f}
                  variant="student"
                  campus={campus || undefined}
                  isRequested={requested.has(f.id)}
                  canRequest={!!studentProfileId}
                  onRequestInterview={() =>
                    studentProfileId ? setModalTarget(f) : setShowScreener(true)
                  }
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={(p) => {
                    fetchFamilies(p, campus, sort);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  itemLabel="families"
                />
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
            demandCount: total,
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
    </main>
  );
}

export default function MedjobsFamiliesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8]" />}>
      <FamiliesInner />
    </Suspense>
  );
}
