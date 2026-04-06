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

export default function OpenJobsPage() {
  const { profiles, isLoading: authLoading } = useAuth();
  const [providers, setProviders] = useState<JobProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [modalTarget, setModalTarget] = useState<JobProviderData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) setStudentProfileId(studentProfile.id);
    fetchProviders(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profiles]);

  const fetchProviders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

      // Get total count
      const { count } = await sb
        .from("business_profiles")
        .select("id", { count: "exact", head: true })
        .in("type", ["organization", "caregiver"])
        .eq("is_active", true);

      setTotal(count || 0);

      // Get paginated data
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await sb
        .from("business_profiles")
        .select("id, slug, display_name, city, state, category, image_url, description, care_types")
        .in("type", ["organization", "caregiver"])
        .eq("is_active", true)
        .order("display_name")
        .range(from, to);

      if (data) setProviders(data);
      setCurrentPage(page);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const handlePageChange = (page: number) => {
    fetchProviders(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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

        {/* Loading skeleton */}
        {(authLoading || loading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-5 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-50 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-50 rounded w-2/3" />
                    <div className="h-4 bg-gray-50 rounded w-full" />
                    <div className="h-4 bg-gray-50 rounded w-4/5" />
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="h-3 bg-gray-50 rounded w-1/2 mb-3" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-100 rounded w-20" />
                      <div className="h-9 bg-gray-100 rounded-xl w-36" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
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
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <JobProviderCard
                  key={p.id}
                  provider={p}
                  isRequested={requested.has(p.id)}
                  canRequest={!!studentProfileId}
                  onRequestInterview={() => setModalTarget(p)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
