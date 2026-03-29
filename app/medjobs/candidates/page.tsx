"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { matchesTrackFilter } from "@/lib/medjobs-helpers";
import CandidateRow from "@/components/medjobs/CandidateRow";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFilters from "@/components/medjobs/CandidateFilters";
import type { CandidateFilterValues } from "@/components/medjobs/CandidateFilters";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

const PAGE_SIZE = 20;

export default function CandidateBrowsePage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CandidateFilterValues>({
    search: "",
    state: "",
    track: "",
    sort: "newest",
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);

    let query = getSupabase()
      .from("business_profiles")
      .select(
        "id, slug, display_name, city, state, description, care_types, metadata, image_url, created_at",
        { count: "exact" }
      )
      .eq("type", "student")
      .eq("is_active", true)
      .order("created_at", { ascending: filters.sort === "oldest" })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters.state) {
      query = query.eq("state", filters.state);
    }

    if (filters.search.trim()) {
      query = query.ilike("display_name", `%${filters.search.trim()}%`);
    }

    const { data, count } = await query;

    let results = (data || []) as CandidateData[];

    // Client-side track filter (JSONB field)
    if (filters.track) {
      results = results.filter((c) => matchesTrackFilter(c.metadata, filters.track));
    }

    setCandidates(results);
    setTotal(filters.track ? results.length : count || 0);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleFilterChange = useCallback(
    (newFilters: CandidateFilterValues) => {
      // Debounce search, apply other filters immediately
      if (newFilters.search !== filters.search) {
        setFilters((prev) => ({ ...prev, search: newFilters.search }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setFilters(newFilters);
          setPage(0);
        }, 300);
      } else {
        setFilters(newFilters);
        setPage(0);
      }
    },
    [filters.search]
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link
              href="/medjobs"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              &larr; MedJobs
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Student Candidates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} student{total !== 1 ? "s" : ""} available
            </p>
          </div>
          <Link
            href="/medjobs/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Apply Now
          </Link>
        </div>

        {/* Filters */}
        <CandidateFilters
          filters={filters}
          onChange={handleFilterChange}
          showSort
        />

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-5 border-b border-gray-100 last:border-b-0 animate-pulse"
              >
                <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">
              No candidates found matching your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100">
              {candidates.map((candidate) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  basePath="/medjobs/candidates"
                />
              ))}
            </div>

            {/* Provider upsell */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                <Link
                  href="/provider/medjobs/candidates"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in as a provider
                </Link>{" "}
                to see contact details and reach out directly.
              </p>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
