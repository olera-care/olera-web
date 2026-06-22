"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPostings, updatePosting, deletePosting, setStoragePrefix, HOURS_LABELS } from "@/lib/medjobs/job-postings";
import { useAuth } from "@/components/auth/AuthProvider";
import type { JobPosting, PostingStatus } from "@/lib/medjobs/job-postings";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import { getTrackLabel } from "@/lib/medjobs-helpers";
import JobPostingBuilder from "@/components/medjobs/JobPostingBuilder";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";

const toTitleCase = (s: string) =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/* ── Status pill ── */
function StatusPill({ s }: { s: PostingStatus }) {
  if (s === "filled") return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">Filled</span>;
  if (s === "paused") return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Paused</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Active</span>;
}

/* ── Pipeline stage type ── */
type Stage = "invited" | "applied";

/* ── Candidate row ── */
function CandidateRow({
  candidate,
  actions,
}: {
  candidate: CandidateData;
  actions?: React.ReactNode;
}) {
  const track = getTrackLabel(candidate.metadata);
  const uni = candidate.metadata.university;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
      {candidate.image_url ? (
        <Image
          src={candidate.image_url}
          alt={candidate.display_name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover shadow-sm ring-1 ring-gray-100 shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-lg font-bold text-primary-600">
            {candidate.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-gray-900 truncate">{candidate.display_name}</p>
        <p className="text-sm text-gray-500 truncate">
          {[track, uni, candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <Link
          href={`/medjobs/candidates/${candidate.slug}`}
          target="_blank"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-primary-700 hover:text-primary-800 hover:bg-primary-50 border border-primary-200 transition-colors"
        >
          View profile
        </Link>
      </div>
    </div>
  );
}

/* ── Empty state for right panel ── */
function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">Select a job posting to view details</p>
      <p className="text-xs text-gray-400 mt-1">Click any posting on the left to manage it</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Main two-panel workspace
   ════════════════════════════════════════════════════════ */
function JobsWorkspaceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles } = useAuth();
  const providerProfile = profiles?.find((p) => p.type === "organization");

  // Scope localStorage postings to this provider
  if (providerProfile?.id) setStoragePrefix(providerProfile.id);

  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allCandidates, setAllCandidates] = useState<CandidateData[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifyOnDelete, setNotifyOnDelete] = useState(true);
  const [stage, setStage] = useState<Stage>("invited");
  // mobile: show detail panel
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const refreshPostings = useCallback(() => {
    setPostings(getPostings());
  }, []);

  useEffect(() => {
    refreshPostings();
  }, [refreshPostings]);

  // Pre-select from ?job= query param
  useEffect(() => {
    const jobParam = searchParams.get("job");
    if (jobParam) {
      setSelectedId(jobParam);
      setMobileShowDetail(true);
    }
  }, [searchParams]);

  // Fetch candidates for resolving IDs
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/medjobs/candidates?sort=newest&loadAll=true");
        const data = await res.json();
        setAllCandidates(data.candidates || []);
      } catch { /* ignore */ }
      finally { setLoadingCandidates(false); }
    })();
  }, []);

  const selectedPosting = selectedId ? postings.find((p) => p.id === selectedId) ?? null : null;

  const selectJob = (id: string) => {
    setSelectedId(id);
    setStage("invited");
    setMobileShowDetail(true);
    // Update URL without full nav
    router.replace(`/medjobs/jobs?job=${id}`, { scroll: false });
  };

  const handleBack = () => {
    setMobileShowDetail(false);
  };

  const handleStatusChange = (status: PostingStatus) => {
    if (!selectedId) return;
    updatePosting(selectedId, { status });
    refreshPostings();
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    // notifyOnDelete would trigger a message to applicants in production
    deletePosting(selectedId);
    setSelectedId(null);
    setMobileShowDetail(false);
    setShowDeleteModal(false);
    setNotifyOnDelete(true);
    refreshPostings();
  };

  // Merge real + demo candidates
  const allWithDemo = [...allCandidates, ...SAMPLE_CANDIDATES.filter((s) => !allCandidates.some((c) => c.id === s.id))];
  const candidateMap = new Map(allWithDemo.map((c) => [c.id, c]));

  const activePostings = postings.filter((p) => (p.status ?? "active") === "active");
  const pausedPostings = postings.filter((p) => p.status === "paused");
  const filledPostings = postings.filter((p) => p.status === "filled");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your workspace</h1>
        <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100/60 p-1">
          <Link
            href="/provider/medjobs/candidates"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-white/60 transition-all"
          >
            Hire
          </Link>
          <span className="px-5 py-2.5 rounded-lg bg-white text-sm font-semibold text-gray-900 shadow-sm">
            Manage work
            {postings.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-700">
                {postings.length}
              </span>
            )}
          </span>
        </div>
      </div>

      {postings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
          <p className="text-gray-500">No job postings yet.</p>
          <Link href="/provider/medjobs/candidates" className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline">
            Go to Hire to create one &rarr;
          </Link>
        </div>
      ) : (
        <div className="flex gap-5 min-h-[calc(100vh-180px)]">
          {/* ── Left panel: posting list ── */}
          <div className={`w-full lg:w-[340px] lg:shrink-0 ${mobileShowDetail ? "hidden lg:block" : "block"}`}>
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Active */}
              {activePostings.length > 0 && (
                <div>
                  <div className="px-4 pt-4 pb-2">
                    <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Active &middot; {activePostings.length}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {activePostings.map((p) => (
                      <PostingListItem
                        key={p.id}
                        posting={p}
                        isSelected={selectedId === p.id}
                        onClick={() => selectJob(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed (paused + filled) */}
              <div>
                <div className="px-4 pt-4 pb-2 border-t border-gray-100">
                  <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Completed &middot; {pausedPostings.length + filledPostings.length}
                  </h2>
                </div>
                {pausedPostings.length + filledPostings.length === 0 ? (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-gray-400">Paused or filled postings will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {[...pausedPostings, ...filledPostings].map((p) => (
                      <PostingListItem
                        key={p.id}
                        posting={p}
                        isSelected={selectedId === p.id}
                        onClick={() => selectJob(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel: selected job detail ── */}
          <div className={`flex-1 min-w-0 ${mobileShowDetail ? "block" : "hidden lg:block"}`}>
            {!selectedPosting ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm h-full">
                <EmptyDetail />
              </div>
            ) : (
              <JobDetailPanel
                posting={selectedPosting}
                candidateMap={candidateMap}
                loadingCandidates={loadingCandidates}
                stage={stage}
                setStage={setStage}
                showEdit={showEdit}
                setShowEdit={setShowEdit}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onBack={handleBack}
                refreshPostings={refreshPostings}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete job posting</h3>
              <p className="text-sm text-gray-500 text-center mb-5">
                This will permanently remove this posting. This action cannot be undone.
              </p>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors mb-5">
                <input
                  type="checkbox"
                  checked={notifyOnDelete}
                  onChange={(e) => setNotifyOnDelete(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Notify applicants</p>
                  <p className="text-xs text-gray-500 mt-0.5">Send a message to all applicants that this position has been closed.</p>
                </div>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors shadow-sm"
                >
                  Delete posting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   Left-panel posting list item
   ════════════════════════════════════════════════════════ */
function PostingListItem({
  posting: p,
  isSelected,
  onClick,
}: {
  posting: JobPosting;
  isSelected: boolean;
  onClick: () => void;
}) {
  const applicantCount = p.applicants.length || 2; // demo fallback
  const hired = p.hired.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 transition-colors ${
        isSelected
          ? "bg-primary-50/60 border-l-2 border-l-primary-600"
          : "hover:bg-gray-50/60 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <StatusPill s={p.status} />
      </div>
      <h3 className={`text-sm font-semibold leading-snug line-clamp-2 ${isSelected ? "text-primary-900" : "text-gray-900"}`}>
        {toTitleCase(p.title)}
      </h3>
      <p className="text-[11px] text-gray-400 mt-1">
        {applicantCount} applicant{applicantCount !== 1 ? "s" : ""} &middot; {hired}/{p.positionsNeeded} hired
      </p>
      <p className="text-[11px] text-gray-400">
        {HOURS_LABELS[p.hoursPerWeek] || p.hoursPerWeek} &middot; ${p.payMin}&ndash;${p.payMax}/hr
      </p>
    </button>
  );
}

/* ════════════════════════════════════════════════════════
   Right-panel job detail + applicant pipeline
   ════════════════════════════════════════════════════════ */
function JobDetailPanel({
  posting,
  candidateMap,
  loadingCandidates,
  stage,
  setStage,
  showEdit,
  setShowEdit,
  onStatusChange,
  onDelete,
  onBack,
  refreshPostings,
}: {
  posting: JobPosting;
  candidateMap: Map<string, CandidateData>;
  loadingCandidates: boolean;
  stage: Stage;
  setStage: (s: Stage) => void;
  showEdit: boolean;
  setShowEdit: (v: boolean) => void;
  onStatusChange: (s: PostingStatus) => void;
  onDelete: () => void;
  onBack: () => void;
  refreshPostings: () => void;
}) {
  // Demo: seed invited/applicants
  const demoInvited = posting.invited.length === 0
    ? ["sample-daniel-k", "sample-sofia-m"]
    : posting.invited;
  const demoApplicants = posting.applicants.length === 0
    ? ["sample-marcus-t", "sample-aaliyah-r"]
    : posting.applicants;

  const invitedCandidates = demoInvited.map((cid) => candidateMap.get(cid)).filter(Boolean) as CandidateData[];
  const applicantCandidates = demoApplicants.map((cid) => candidateMap.get(cid)).filter(Boolean) as CandidateData[];
  const hiredCandidates = posting.hired.map((cid) => candidateMap.get(cid)).filter(Boolean) as CandidateData[];

  const stageData: Record<Stage, { candidates: CandidateData[]; label: string }> = {
    invited: { candidates: invitedCandidates, label: "Invited" },
    applied: { candidates: applicantCandidates, label: "Applied" },
  };

  const currentStage = stageData[stage];
  const invitedCount = demoInvited.length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Mobile back button */}
      <div className="lg:hidden px-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-primary-700 hover:text-primary-800 font-medium"
        >
          &larr; All postings
        </button>
      </div>

      {/* Banner header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold text-gray-900 truncate">{toTitleCase(posting.title)}</h2>
              <StatusPill s={posting.status} />
            </div>
            <p className="text-xs text-gray-500">
              {HOURS_LABELS[posting.hoursPerWeek] || posting.hoursPerWeek} &middot; ${posting.payMin}&ndash;${posting.payMax}/hr &middot; {invitedCount} invited &middot; {applicantCandidates.length} applied &middot; {hiredCandidates.length}/{posting.positionsNeeded} hired
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <select
              value={posting.status}
              onChange={(e) => onStatusChange(e.target.value as PostingStatus)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="filled">Filled</option>
            </select>
            <button
              type="button"
              onClick={onDelete}
              title="Delete posting"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Applicant pipeline */}
      <div>
        {/* Stage toggle tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-gray-100">
          <nav className="flex gap-4 -mb-px">
            {(["invited", "applied"] as Stage[]).map((s) => {
              const count = stageData[s].candidates.length;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    stage === s
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {stageData[s].label}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      stage === s ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Stage content */}
        <div className="min-h-[200px]">
          {loadingCandidates ? (
            <div className="px-6 py-12 text-center">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ) : currentStage.candidates.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-500">
                {stage === "invited" && "No students invited yet."}
                {stage === "applied" && "No applications yet."}
              </p>
              {stage === "invited" && (
                <Link href="/provider/medjobs/candidates" className="mt-2 inline-block text-xs font-semibold text-primary-700 hover:underline">
                  Browse candidates to invite &rarr;
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {currentStage.candidates.map((c) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  actions={
                    <div className="flex items-center gap-1.5">
                      {stage === "invited" && (
                        <span className="text-[11px] font-medium text-gray-400 px-2 py-1">Pending</span>
                      )}
                      {stage === "applied" && posting.hired.includes(c.id) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Hired</span>
                      )}
                      <button
                        type="button"
                        title="Message"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50 border border-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        Message
                      </button>
                      <button
                        type="button"
                        title="Set up an interview"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50 border border-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Set up an interview
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description (collapsed below pipeline) */}
      {posting.description && (
        <div className="border-t border-gray-100 px-5 py-4">
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</h3>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">{posting.description}</p>
        </div>
      )}

      {(posting.certifications.length > 0 || posting.skills.length > 0) && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            {posting.certifications.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-[11px] font-semibold border border-primary-100">
                {c}
              </span>
            ))}
            {posting.skills.map((s) => (
              <span key={s} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md text-[11px] font-medium border border-gray-100">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setShowEdit(false)}>
          <div className="w-full max-w-xl my-8 rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <JobPostingBuilder
              onClose={() => setShowEdit(false)}
              onPublish={() => { setShowEdit(false); refreshPostings(); }}
              editingId={posting.id}
              initialData={posting}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsWorkspacePage() {
  return (
    <Suspense>
      <JobsWorkspaceInner />
    </Suspense>
  );
}
