"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import JobProviderCard from "@/components/medjobs/JobProviderCard";
import type { JobProviderData } from "@/components/medjobs/JobProviderCard";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

type FilterTab = "all" | "requested";

export default function OpenJobsPage() {
  const { profiles, isLoading: authLoading } = useAuth();
  const [providers, setProviders] = useState<JobProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<JobProviderData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Fetch providers immediately on mount (don't wait for auth)
  useEffect(() => {
    fetchProviders(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update studentProfileId and fetch existing interviews when auth loads
  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) {
      setStudentProfileId(studentProfile.id);
      // Fetch existing interview requests
      fetchExistingInterviews();
    }
  }, [authLoading, profiles]);

  // Fetch existing interview requests from the API
  const fetchExistingInterviews = async () => {
    try {
      const res = await fetch("/api/medjobs/interviews");
      if (!res.ok) return;
      const data = await res.json();
      // Build set of provider IDs that student has already requested
      // Exclude cancelled/no_show interviews so user can re-request
      const requestedIds = new Set<string>();
      const activeStatuses = ["proposed", "confirmed", "rescheduled", "completed"];
      for (const interview of data.interviews || []) {
        // Only count active interviews initiated by the student (student → provider requests)
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

  const fetchProviders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Run count and data queries in parallel
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
      if (dataResult.data) setProviders(dataResult.data);
      setCurrentPage(page);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handlePageChange = (page: number) => {
    fetchProviders(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Filter providers based on active tab
  const filteredProviders = activeTab === "requested"
    ? providers.filter((p) => requested.has(p.id))
    : providers;

  const requestedCount = providers.filter((p) => requested.has(p.id)).length;

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Open Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse providers hiring through MedJobs. Request an interview to get started.
          </p>
          {total > 0 && !loading && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                {total} provider{total !== 1 ? "s" : ""} hiring
              </span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        {!loading && providers.length > 0 && (
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

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
              >
                <div className="flex">
                  {/* Image placeholder */}
                  <div className="w-32 sm:w-40 min-h-[140px] bg-gray-100 shrink-0" />
                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col">
                    <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-48 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-32 mb-3" />
                    <div className="flex gap-1.5 mb-3">
                      <div className="h-5 bg-gray-100 rounded-full w-16" />
                      <div className="h-5 bg-gray-100 rounded-full w-20" />
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="h-4 bg-gray-100 rounded w-20" />
                      <div className="h-9 bg-gray-100 rounded-lg w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No open positions right now.</p>
            <p className="text-sm text-gray-400">
              Make sure your profile is complete — providers in your area will be able to find you when they start hiring.
            </p>
            <Link href="/portal/medjobs" className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700">
              &larr; Back to your profile
            </Link>
          </div>
        ) : filteredProviders.length === 0 && activeTab === "requested" ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No interview requests yet.</p>
            <p className="text-sm text-gray-400">
              Browse available providers and request an interview to get started.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all providers &rarr;
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredProviders.map((p) => (
                <JobProviderCard
                  key={p.id}
                  provider={p}
                  isRequested={requested.has(p.id)}
                  canRequest={!!studentProfileId}
                  onRequestInterview={() => setModalTarget(p)}
                />
              ))}
            </div>

            {/* Pagination - only show for "All" tab */}
            {activeTab === "all" && totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  itemLabel="providers"
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
