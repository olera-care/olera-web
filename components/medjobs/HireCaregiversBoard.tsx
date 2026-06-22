"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import { SAMPLE_CANDIDATES, isSampleSlug } from "@/lib/medjobs/demo-candidate";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import JobPostingBuilder from "@/components/medjobs/JobPostingBuilder";
import CandidateDetailPanel from "@/components/medjobs/CandidateDetailPanel";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import { getPostings, updatePosting, setStoragePrefix, HOURS_LABELS } from "@/lib/medjobs/job-postings";
import type { JobPosting } from "@/lib/medjobs/job-postings";
import { scoreCandidateForJob, STRONG_MATCH_THRESHOLD, scoreToPercent } from "@/lib/medjobs/job-match";

/**
 * HireCaregiversBoard — the signed-in provider's "Hire caregivers" board at
 * /provider/medjobs/candidates (the provider mirror of the student JobsBoard).
 * Candidate tiles + a campus map, filtered by university and availability.
 * Reuses the public candidate feed + BrowseMap; demo fallback keeps it full.
 */

const CampusMap = dynamic(() => import("@/components/browse/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  ),
});

interface University {
  id: string;
  name: string;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

const AVAIL_OPTIONS = [
  { label: "All availability", value: "" },
  { label: "Days", value: "in_between_classes" },
  { label: "Evenings", value: "evenings" },
  { label: "Weekends", value: "weekends" },
  { label: "Overnights", value: "overnights" },
  { label: "PRN", value: "prn" },
  { label: "Full-time", value: "full_time" },
];

function matchesAvailability(c: CandidateData, val: string): boolean {
  if (!val) return true;
  const meta = c.metadata;
  if (val === "prn") return !!meta.prn_willing;
  if (val === "full_time") return /30|40|full/i.test(meta.hours_per_week_range ?? "");
  return (meta.availability_types ?? []).includes(val);
}

export default function HireCaregiversBoard() {
  const { profiles } = useAuth();
  const providerProfile = profiles?.find((p) => p.type === "organization");
  const matchBuckets = (
    (providerProfile?.metadata as Record<string, unknown> | undefined)?.[
      "medjobs_demand_profile"
    ] as { coverage_buckets?: string[] } | undefined
  )?.coverage_buckets;
  const eligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null,
  );

  // Scope localStorage postings to this provider so each account is independent
  if (providerProfile?.id) setStoragePrefix(providerProfile.id);

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [availability, setAvailability] = useState("");
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  // When a provider creates their first posting from a student panel, we
  // remember that student so we can re-select them after the modal closes.
  const [pendingInviteCandidate, setPendingInviteCandidate] = useState<CandidateData | null>(null);
  /** Set of candidate IDs that have been quick-invited to the currently selected job. */
  const [quickInvitedIds, setQuickInvitedIds] = useState<Set<string>>(new Set());
  const [showFirstPostingPrompt, setShowFirstPostingPrompt] = useState(false);
  /** Invite-flow modal state — the candidate being invited. */
  const [inviteFlowCandidate, setInviteFlowCandidate] = useState<CandidateData | null>(null);
  /** The posting chosen in the invite flow (if provider had to pick one). */
  const [inviteFlowPosting, setInviteFlowPosting] = useState<JobPosting | null>(null);
  /** Whether the invite was sent (shows success state briefly). */
  const [inviteFlowSent, setInviteFlowSent] = useState(false);
  /** Confirmation checkbox — provider confirms the right job is attached. */
  const [inviteConfirmed, setInviteConfirmed] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const hasPostings = postings.length > 0;

  // Load postings from localStorage on mount and after creating one.
  const refreshPostings = useCallback(() => {
    setPostings(getPostings());
  }, []);

  useEffect(() => {
    refreshPostings();
  }, [refreshPostings]);

  useEffect(() => {
    const sb = createClient();
    sb.from("medjobs_universities")
      .select("id, name, state, lat, lng")
      .eq("is_active", true)
      .order("name")
      .then(({ data }: { data: University[] | null }) => {
        if (data) setUniversities(data);
      });
  }, []);

  const fetchCandidates = useCallback(async (uniId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "newest", loadAll: "true" });
      if (uniId) params.set("universityId", uniId);
      const res = await fetch(`/api/medjobs/candidates?${params}`);
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(universityId);
  }, [universityId, fetchCandidates]);

  const selectedUni = universities.find((u) => u.id === universityId);
  const campusName = selectedUni?.name ?? null;
  const campusCenter =
    selectedUni?.lat != null && selectedUni?.lng != null
      ? { lat: selectedUni.lat, lng: selectedUni.lng }
      : null;
  const isDemoEra = !loading && candidates.length === 0;
  const baseCards = candidates.length > 0 ? candidates : SAMPLE_CANDIDATES;
  const filtered = baseCards.filter((c) => matchesAvailability(c, availability));
  const availLabel = AVAIL_OPTIONS.find((o) => o.value === availability)?.label ?? null;
  const mapCards = filtered
    .map((c) => candidateToCardFormat(c, isDemoEra ? { isDemo: true } : undefined))
    .filter((c) => c.lat != null && c.lon != null);

  // ── Job-match scoring & sorting ──
  const selectedJob = postings.find((p) => p.id === selectedJobId) ?? null;
  const activePostings = postings.filter((p) => (p.status ?? "active") === "active");

  // Build a set of already-invited candidate IDs for the selected job
  const alreadyInvitedIds = new Set(selectedJob?.invited ?? []);

  const scoreMap = new Map<string, number>();
  const pctMap = new Map<string, number>();
  if (selectedJob) {
    // Demo placeholder scores — realistic spread so the UI shows green/orange/yellow
    const demoScores = [92, 85, 67, 54, 41, 38, 73, 88, 60, 45];
    for (let i = 0; i < filtered.length; i++) {
      const c = filtered[i];
      const realScore = scoreCandidateForJob(c, selectedJob);
      scoreMap.set(c.id, realScore);
      const realPct = scoreToPercent(realScore, selectedJob);
      // Use demo scores when the real algorithm produces uniformly low results
      pctMap.set(c.id, isDemoEra ? demoScores[i % demoScores.length] : realPct);
    }
  }

  const sortedCandidates = selectedJob
    ? [...filtered].sort((a, b) => (pctMap.get(b.id) ?? 0) - (pctMap.get(a.id) ?? 0))
    : filtered;

  const toTitleCase = (s: string) =>
    s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700";

  /** Called when JobPostingBuilder closes (either cancel or publish). */
  const handlePostJobClose = useCallback(() => {
    setShowPostJob(false);
    refreshPostings();
    // If the provider came from a student panel, re-select that student.
    if (pendingInviteCandidate) {
      setSelectedCandidate(pendingInviteCandidate);
      // Auto-open invite flow for the candidate after first posting is created
      setTimeout(() => {
        const freshPostings = getPostings();
        if (freshPostings.length > 0) {
          setInviteFlowCandidate(pendingInviteCandidate);
          setInviteFlowPosting(freshPostings[0]);
          setInviteFlowSent(false);
          setInviteConfirmed(false);
        }
        setPendingInviteCandidate(null);
      }, 300);
    }
  }, [refreshPostings, pendingInviteCandidate]);

  /** Called when the provider tries to invite but has no postings yet. */
  const handleCreateFirstFromPanel = useCallback((candidate: CandidateData) => {
    setPendingInviteCandidate(candidate);
    setShowFirstPostingPrompt(true);
  }, []);

  /** Open the invite flow modal for a candidate (from card or detail panel). */
  const handleStartInvite = useCallback((candidate: CandidateData) => {
    const firstName = candidate.display_name.split(" ")[0];
    setInviteFlowCandidate(candidate);
    setInviteFlowSent(false);
    setInviteConfirmed(false);
    setInviteMessage(`Hey ${firstName}, we thought you'd be great for this role. Check it out and apply if you think it's a fit!`);
    // If a job is selected in the dropdown, pre-fill it
    if (selectedJob) {
      setInviteFlowPosting(selectedJob);
    } else {
      setInviteFlowPosting(null);
    }
  }, [selectedJob]);

  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  /** Confirm and send the invite — creates a real connection via API (skips API for demo candidates). */
  const handleConfirmInvite = useCallback(async () => {
    if (!inviteFlowCandidate || !inviteFlowPosting || inviteSending) return;
    setInviteSending(true);
    setInviteError(null);

    const isSample = isSampleSlug(inviteFlowCandidate.slug);

    // Real candidates: create a connection via API
    if (!isSample) {
      try {
        const res = await fetch("/api/medjobs/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentProfileId: inviteFlowCandidate.id,
            message: inviteMessage.trim() || undefined,
            posting: {
              id: inviteFlowPosting.id,
              title: inviteFlowPosting.title,
              hoursPerWeek: inviteFlowPosting.hoursPerWeek,
              payMin: inviteFlowPosting.payMin,
              payMax: inviteFlowPosting.payMax,
            },
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // 409 = already invited, treat as success
          if (res.status !== 409) {
            console.error("[invite] API error:", res.status, data.error);
            setInviteError(data.error || "Something went wrong. Please try again.");
            setInviteSending(false);
            return;
          }
        }
      } catch (err) {
        console.error("[invite] unexpected error:", err);
        setInviteError("Network error. Please try again.");
        setInviteSending(false);
        return;
      }
    }

    // Update localStorage so card badges stay in sync (both real and demo)
    const cid = inviteFlowCandidate.id;
    if (!inviteFlowPosting.invited.includes(cid)) {
      updatePosting(inviteFlowPosting.id, {
        invited: [...inviteFlowPosting.invited, cid],
      });
    }

    // For demo candidates, also save a demo conversation so the inbox can display it
    if (isSample && providerProfile) {
      try {
        const demoKey = `medjobs_demo_conversations_${providerProfile.id}`;
        const existing = JSON.parse(localStorage.getItem(demoKey) || "[]");
        const dedupId = `demo-${inviteFlowPosting.id}-${cid}`;
        if (!existing.some((c: { id: string }) => c.id === dedupId)) {
          existing.push({
            id: dedupId,
            type: "invitation",
            status: "pending",
            from_profile_id: providerProfile.id,
            to_profile_id: cid,
            message: inviteMessage.trim() || `You're invited to apply for ${inviteFlowPosting.title}`,
            metadata: {
              job_posting: {
                title: inviteFlowPosting.title,
                hoursPerWeek: inviteFlowPosting.hoursPerWeek,
                payMin: inviteFlowPosting.payMin,
                payMax: inviteFlowPosting.payMax,
              },
              posting_id: inviteFlowPosting.id,
              thread: [
                {
                  from_profile_id: providerProfile.id,
                  text: inviteMessage.trim() || `You're invited to apply for ${inviteFlowPosting.title}`,
                  created_at: new Date().toISOString(),
                  type: "system",
                },
              ],
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            candidate_name: inviteFlowCandidate.display_name,
            candidate_image: inviteFlowCandidate.image_url || null,
          });
          localStorage.setItem(demoKey, JSON.stringify(existing));
        }
      } catch {}
    }

    setQuickInvitedIds((prev) => new Set(prev).add(cid));
    setInviteFlowSent(true);
    refreshPostings();
    setInviteSending(false);
  }, [inviteFlowCandidate, inviteFlowPosting, inviteSending, refreshPostings]);

  const closeInviteFlow = useCallback(() => {
    setInviteFlowCandidate(null);
    setInviteFlowPosting(null);
    setInviteFlowSent(false);
    setInviteConfirmed(false);
    setInviteSending(false);
    setInviteError(null);
    setInviteMessage("");
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Workspace toggle ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Hire a student</h1>
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100/60 p-1">
          <span className="px-5 py-2.5 rounded-lg bg-white text-sm font-semibold text-gray-900 shadow-sm">
            Hire
          </span>
          <Link
            href="/medjobs/jobs"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-white/60 transition-all"
          >
            Manage work
            {postings.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-700">
                {postings.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Welcome banner (zero postings) ── */}
      {eligible && !hasPostings && (
        <div className="mb-8 rounded-2xl border border-primary-100/60 bg-gradient-to-r from-primary-50 to-vanilla-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src="/images/for-providers/team/logan.jpg"
                alt="Dr. Logan DuBose"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">Welcome! Let&apos;s get started.</p>
                <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                  Post a job first and we&apos;ll connect you with the right caregivers.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              <button
                type="button"
                onClick={() => setShowPostJob(true)}
                className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Post a Job &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post another job (has postings) ── */}
      {eligible && hasPostings && (
        <div className="mb-8 rounded-2xl border border-primary-100/60 bg-gradient-to-r from-primary-50 to-vanilla-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src="/images/for-providers/team/logan.jpg"
                alt="Dr. Logan DuBose"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">Need more help?</p>
                <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                  Post another job and we&apos;ll match you with the best candidates.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              <button
                type="button"
                onClick={() => setShowPostJob(true)}
                className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Post a Job &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">
          {selectedJob
            ? <>Candidates for: <span className="text-primary-700 truncate">{toTitleCase(selectedJob.title)}</span></>
            : "Browse candidates"}
        </h2>
        <div className="flex items-center gap-3">
          {hasPostings && (
            <select
              value={selectedJobId}
              onChange={(e) => { setSelectedJobId(e.target.value); setQuickInvitedIds(new Set()); }}
              className={`${selectClass} max-w-[200px] truncate`}
              aria-label="Match to a job"
            >
              <option value="">Match to a job</option>
              {activePostings.map((p) => (
                <option key={p.id} value={p.id}>{toTitleCase(p.title)}</option>
              ))}
            </select>
          )}
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={selectClass}>
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectClass}>
            {AVAIL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(selectedJobId || universityId || availability) && (
            <button
              type="button"
              onClick={() => {
                setSelectedJobId("");
                setUniversityId("");
                setAvailability("");
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <p className="text-gray-500">
                No {availLabel ? availLabel.toLowerCase() : "matching"} caregivers near {campusName || "you"} yet.
              </p>
              {availability && (
                <button type="button" onClick={() => setAvailability("")} className="mt-3 text-sm font-semibold text-primary-700 hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedCandidates.map((c) => {
                const pct = pctMap.get(c.id) ?? null;
                const rawScore = scoreMap.get(c.id) ?? 0;
                const isStrongMatch = selectedJob && (pct != null ? pct >= 50 : rawScore >= STRONG_MATCH_THRESHOLD);
                const jobMatchLabel = isStrongMatch ? "Strong match" : undefined;
                const isCandidateInvited = selectedJob
                  ? alreadyInvitedIds.has(c.id) || quickInvitedIds.has(c.id)
                  : false;

                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) return;
                      e.preventDefault();
                      setSelectedCandidate(c);
                    }}
                    className={`cursor-pointer rounded-2xl transition-shadow ${
                      selectedCandidate?.id === c.id ? "ring-2 ring-primary-500 shadow-md" : ""
                    }`}
                  >
                    {isDemoEra ? (
                      <BrowseCard
                        provider={candidateToCardFormat(c, { isDemo: true })}
                        variant="candidate"
                        isDemo
                        matchScore={pct}
                        onQuickInvite={() => hasPostings ? handleStartInvite(c) : handleCreateFirstFromPanel(c)}
                        isInvited={isCandidateInvited}
                      />
                    ) : (
                      <BrowseCard
                        provider={candidateToCardFormat(c)}
                        variant="candidate"
                        href={`/medjobs/candidates/${c.slug}`}
                        matchLabel={jobMatchLabel ?? candidateMatchLabel(matchBuckets, c) ?? undefined}
                        matchScore={pct}
                        onQuickInvite={() => hasPostings ? handleStartInvite(c) : handleCreateFirstFromPanel(c)}
                        isInvited={isCandidateInvited}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            {selectedCandidate ? (
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                <CandidateDetailPanel
                  candidate={selectedCandidate}
                  onClose={() => setSelectedCandidate(null)}
                  hasPostings={hasPostings}
                  postings={postings}
                  selectedJob={selectedJob}
                  onPostJob={() => setShowPostJob(true)}
                  onCreateFirst={() => handleCreateFirstFromPanel(selectedCandidate)}
                  onInvite={() => handleStartInvite(selectedCandidate)}
                />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
                <CampusMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} campusCenter={campusCenter} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── First posting prompt ── */}
      {showFirstPostingPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowFirstPostingPrompt(false); setPendingInviteCandidate(null); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Create a job posting first</h3>
            <p className="text-sm text-gray-500 mb-6">
              You need a job posting before you can invite candidates. Create your first one now!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setShowFirstPostingPrompt(false); setPendingInviteCandidate(null); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowFirstPostingPrompt(false); setShowPostJob(true); }}
                className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                Create job posting
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostJob && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={handlePostJobClose}>
          <div className="w-full max-w-xl my-8 rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <JobPostingBuilder
              onClose={handlePostJobClose}
              onPublish={handlePostJobClose}
              provider={providerProfile ? {
                name: providerProfile.display_name ?? "",
                location: null,
                category: null,
                description: null,
                profileSlug: providerProfile.slug ?? null,
              } : null}
            />
          </div>
        </div>
      )}

      {/* ── Invite flow modal ── */}
      {inviteFlowCandidate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={closeInviteFlow}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {inviteFlowSent ? (
              /* ── Success state ── */
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Congrats, you invited {inviteFlowCandidate.display_name.split(" ")[0]}!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  They&rsquo;ll get an email and can reply in their inbox.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <Link
                    href="/medjobs/inbox"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
                  >
                    Go to Inbox
                  </Link>
                  <button
                    type="button"
                    onClick={closeInviteFlow}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    Keep Browsing
                  </button>
                </div>
              </div>
            ) : !inviteFlowPosting ? (
              /* ── Step 1: pick a posting ── */
              <div>
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    Which job is this invite for?
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select a posting to attach to your invite to {inviteFlowCandidate.display_name.split(" ")[0]}.
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                  {activePostings.map((p) => {
                    const alreadyInvited = p.invited.includes(inviteFlowCandidate.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={alreadyInvited}
                        onClick={() => setInviteFlowPosting(p)}
                        className="w-full text-left px-5 py-3.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-default transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{toTitleCase(p.title)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {HOURS_LABELS[p.hoursPerWeek] || p.hoursPerWeek} &middot; ${p.payMin}&ndash;${p.payMax}/hr
                        </p>
                        {alreadyInvited && (
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">Already invited</p>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={closeInviteFlow} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Step 2: message preview + confirm ── */
              <div>
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Invite to Apply</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    You&rsquo;re inviting {inviteFlowCandidate.display_name.split(" ")[0]} to check out your posting. If they apply, they&rsquo;ll show up in your hiring dashboard.
                  </p>
                </div>
                <div className="px-5 py-5 space-y-4">
                  {/* Editable message */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 text-sm text-gray-800 leading-relaxed bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded-xl placeholder:text-gray-400"
                      placeholder={`Write a message to ${inviteFlowCandidate.display_name.split(" ")[0]}...`}
                    />
                  </div>

                  {/* Attached posting card */}
                  <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Attached job posting</p>
                    <p className="text-sm font-semibold text-gray-900">{toTitleCase(inviteFlowPosting.title)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {HOURS_LABELS[inviteFlowPosting.hoursPerWeek] || inviteFlowPosting.hoursPerWeek} &middot; ${inviteFlowPosting.payMin}&ndash;${inviteFlowPosting.payMax}/hr
                    </p>
                    <button
                      type="button"
                      onClick={() => { setInviteFlowPosting(null); setInviteConfirmed(false); }}
                      className="mt-2 text-xs font-medium text-primary-700 hover:text-primary-800"
                    >
                      Change posting &rarr;
                    </button>
                  </div>

                  {/* Confirmation checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={inviteConfirmed}
                      onChange={(e) => setInviteConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 leading-snug">
                      I&rsquo;m sending the right job posting to {inviteFlowCandidate.display_name.split(" ")[0]}.
                    </span>
                  </label>

                  <p className="text-xs text-gray-400">
                    This message will be sent to {inviteFlowCandidate.display_name.split(" ")[0]}&rsquo;s inbox.
                  </p>
                </div>
                {inviteError && (
                  <div className="mx-5 mb-0 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{inviteError}</p>
                  </div>
                )}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeInviteFlow}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmInvite}
                    disabled={!inviteConfirmed || inviteSending}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
                  >
                    {inviteSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                    {inviteSending ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
