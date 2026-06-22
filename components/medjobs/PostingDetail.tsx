"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JobPosting } from "@/lib/medjobs/job-postings";
import { HOURS_LABELS } from "@/lib/medjobs/job-postings";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";
import { useFavoriteCandidates } from "@/hooks/use-favorite-candidates";
import { updatePosting } from "@/lib/medjobs/job-postings";
import { US_STATES } from "@/lib/power-pages";

const PAGE_SIZE = 20;
type Tab = "find" | "invited" | "applicants" | "hired";

interface University {
  id: string;
  name: string;
  state: string | null;
}

export default function PostingDetail({
  posting,
  matchBuckets,
  onBack,
}: {
  posting: JobPosting;
  matchBuckets?: string[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("find");

  // ── Find Students state (relocated candidate grid) ──
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set(posting.invited));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { toggleFavorite } = useFavoriteCandidates();

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
        console.error("[PostingDetail] fetch error:", err);
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

  const inviteCandidate = useCallback((candidateId: string) => {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      next.add(candidateId);
      const newInvited = [...next];
      updatePosting(posting.id, { invited: newInvited });
      return next;
    });
  }, [posting.id]);

  const showSamples = !loading && candidates.length === 0;
  const filled = posting.hired.length;
  const needed = posting.positionsNeeded;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "find", label: "Find Students", count: total || undefined },
    { key: "invited", label: "Invited", count: posting.invited.length || undefined },
    { key: "applicants", label: "Applicants", count: posting.applicants.length || undefined },
    { key: "hired", label: "Hired", count: posting.hired.length || undefined },
  ];

  const selectClass =
    "appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat";
  const chevronBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

  // Filter candidates by search query
  const filteredCandidates = search.trim()
    ? candidates.filter((c) =>
        (c.display_name || "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : candidates;

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        All Postings
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900 font-display">{posting.title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {HOURS_LABELS[posting.hoursPerWeek] || posting.hoursPerWeek}
          </span>
          <span className="text-sm text-gray-500">
            ${posting.payMin}&ndash;${posting.payMax}/hr
          </span>
        </div>
      </div>

      {/* Positions progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${Math.min(100, (filled / needed) * 100)}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 shrink-0">
          {filled} of {needed} position{needed !== 1 ? "s" : ""} filled
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1.5 text-xs ${tab === t.key ? "text-primary-500" : "text-gray-400"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "find" && (
        <>
          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students\u2026"
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-gray-300 w-full sm:w-64"
            />
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className={selectClass}
              style={{ backgroundImage: chevronBg }}
              aria-label="Filter by university"
            >
              <option value="">All universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
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

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
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
                  </div>
                </div>
              ))}
            </div>
          ) : showSamples ? (
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
                {filteredCandidates.map((candidate) => (
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
        </>
      )}

      {tab === "invited" && (
        <EmptyTab
          icon="send"
          heading="No invites yet"
          body="Find students in the Find Students tab and invite them to apply to this posting."
        />
      )}

      {tab === "applicants" && (
        <EmptyTab
          icon="inbox"
          heading="No applicants yet"
          body="Once students apply or accept your invites, they\u2019ll appear here. Starred applicants came through your invites."
        />
      )}

      {tab === "hired" && (
        <EmptyTab
          icon="check"
          heading="No hires yet"
          body={`Review applicants and hire up to ${needed} student${needed !== 1 ? "s" : ""} for this role.`}
        />
      )}
    </div>
  );
}

function EmptyTab({ icon, heading, body }: { icon: "send" | "inbox" | "check"; heading: string; body: string }) {
  const icons = {
    send: (
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    inbox: (
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
      </svg>
    ),
    check: (
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icons[icon]}
      <h3 className="mt-3 text-sm font-semibold text-gray-700">{heading}</h3>
      <p className="mt-1 text-sm text-gray-400 max-w-sm">{body}</p>
    </div>
  );
}
