"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import FamilyCard from "@/components/medjobs/FamilyCard";
import type { FamilyData } from "@/components/medjobs/FamilyCard";
import StudentWelcomeNote, { type StudentNoteVariant } from "@/components/medjobs/StudentWelcomeNote";
import { SAMPLE_FAMILIES } from "@/lib/medjobs/demo-family";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

type FilterTab = "all" | "requested";

interface StudentStatus {
  isLive: boolean;
  completeness: number | null;
  firstName: string | null;
  campus: string | null;
}

export default function FamiliesHiringPage() {
  const { profiles, isLoading: authLoading } = useAuth();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<FamilyData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Fetch families immediately on mount (don't wait for auth)
  useEffect(() => {
    fetchFamilies(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When auth loads, capture the student profile + its live status (drives the note).
  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (!studentProfile) return;
    setStudentProfileId(studentProfile.id);
    fetchExistingInterviews();
    fetchStudentStatus(studentProfile.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profiles]);

  const fetchStudentStatus = async (profileId: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb
        .from("business_profiles")
        .select("is_active, display_name, city, metadata")
        .eq("id", profileId)
        .single();
      if (!data) return;
      const meta = (data.metadata || {}) as Record<string, unknown>;
      setStudentStatus({
        isLive: !!data.is_active,
        completeness: typeof meta.profile_completeness === "number" ? meta.profile_completeness : null,
        firstName: (data.display_name || "").trim().split(" ")[0] || null,
        campus: (meta.university as string) || data.city || null,
      });
    } catch {
      /* note falls back to generic copy */
    }
  };

  // Fetch existing interview requests from the API
  const fetchExistingInterviews = async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      if (!res.ok) return;
      const data = await res.json();
      const requestedIds = new Set<string>();
      const activeStatuses = ["proposed", "confirmed", "rescheduled", "completed"];
      for (const interview of data.interviews || []) {
        if (
          interview.proposed_by === interview.student_profile_id &&
          activeStatuses.includes(interview.status)
        ) {
          requestedIds.add(interview.provider_profile_id);
        }
      }
      setRequested(requestedIds);
    } catch {
      // Silently fail - user can still request interviews
    }
  };

  const fetchFamilies = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [countResult, dataResult] = await Promise.all([
        sb
          .from("business_profiles")
          .select("id", { count: "exact", head: true })
          .in("type", ["organization", "caregiver"])
          .eq("is_active", true),
        sb
          .from("business_profiles")
          .select("id, slug, display_name, city, state, category, image_url, description, care_types")
          .in("type", ["organization", "caregiver"])
          .eq("is_active", true)
          .order("display_name")
          .range(from, to),
      ]);

      setTotal(countResult.count || 0);
      if (dataResult.data) setFamilies(dataResult.data);
      setCurrentPage(page);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handlePageChange = (page: number) => {
    fetchFamilies(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filteredFamilies = activeTab === "requested"
    ? families.filter((p) => requested.has(p.id))
    : families;

  const requestedCount = families.filter((p) => requested.has(p.id)).length;

  // No real partners hiring for this view yet → show curated samples so the
  // board is never empty (mirrors the provider board's sample fallback).
  const showSamples = !loading && families.length === 0;

  const noteVariant: StudentNoteVariant = studentStatus?.isLive ? "live" : "not_live";
  const campusName = studentStatus?.campus ?? null;

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">
            Families hiring near you
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500 max-w-2xl">
            Local families hiring student caregivers this semester. Request an
            interview when you find one that fits.
          </p>
          {total > 0 && !loading && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                {total} famil{total !== 1 ? "ies" : "y"} hiring nearby
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* The note from Dr. DuBose — orientation + the one next step. */}
        {studentStatus && (
          <StudentWelcomeNote
            variant={noteVariant}
            campusName={campusName}
            firstName={studentStatus.firstName}
            completeness={studentStatus.completeness}
          />
        )}

        {/* Filter tabs */}
        {!loading && families.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requested")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "requested"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Requested{requestedCount > 0 ? ` (${requestedCount})` : ""}
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-gray-100 rounded-full w-16" />
                    <div className="h-5 bg-gray-100 rounded-full w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : showSamples ? (
          // No real partners hiring yet → curated samples, framed honestly.
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-500">
              Sample listings — the kind of families hiring{" "}
              {campusName ? `near ${campusName}` : "near you"} as partners join Olera
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_FAMILIES.map((f) => (
                <FamilyCard key={f.id} family={f} isDemo />
              ))}
            </div>
          </div>
        ) : filteredFamilies.length === 0 && activeTab === "requested" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-2">No interview requests yet.</p>
            <p className="text-sm text-gray-400">
              Browse families hiring near you and request an interview to get started.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all families &rarr;
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFamilies.map((f) => (
                <FamilyCard
                  key={f.id}
                  family={f}
                  isRequested={requested.has(f.id)}
                  canRequest={!!studentProfileId}
                  onRequestInterview={() => setModalTarget(f)}
                />
              ))}
            </div>

            {activeTab === "all" && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={handlePageChange}
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
          otherName={modalTarget.display_name}
          onClose={() => setModalTarget(null)}
          onScheduled={() => {
            setRequested((prev) => new Set(prev).add(modalTarget.id));
            setModalTarget(null);
          }}
        />
      )}
    </main>
  );
}
