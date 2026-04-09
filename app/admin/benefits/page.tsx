"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { allStates, type WaiverProgram, type StateData } from "@/data/waiver-library";
import { pipelineData, type PipelineComparison, type PipelineStateSummary } from "@/data/pipeline-summary";
import { pipelineDrafts, type PipelineDraft, type PipelineStateOverview } from "@/data/pipeline-drafts";

// ─── Draft Review Types ────────────────────────────────────────────────────

interface DraftReview {
  id: string;
  program_id: string;
  state_id: string;
  status: string;
  comment: string | null;
  reviewed_by: string;
  created_at: string;
}

const STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-600" },
  { value: "reviewed", label: "Reviewed", color: "bg-blue-100 text-blue-700" },
  { value: "needs-changes", label: "Needs Changes", color: "bg-amber-100 text-amber-700" },
  { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { value: "published", label: "Published", color: "bg-primary-100 text-primary-700" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVerificationStats(programs: WaiverProgram[]) {
  const verified = programs.filter((p) => p.lastVerifiedDate).length;
  const withSource = programs.filter((p) => p.sourceUrl).length;
  const savingsVerified = programs.filter((p) => p.savingsVerified).length;
  return { total: programs.length, verified, withSource, savingsVerified };
}

function getContentStats(programs: WaiverProgram[]) {
  const withIntro = programs.filter((p) => p.intro).length;
  const withFaqs = programs.filter((p) => p.faqs && p.faqs.length > 0).length;
  const withRichContent = programs.filter((p) => p.contentSections && p.contentSections.length > 0).length;
  const withAppGuide = programs.filter((p) => p.applicationGuide).length;
  const drafts = programs.filter((p) => p.contentStatus === "pipeline-draft").length;
  const reviewed = programs.filter((p) => p.contentStatus === "approved" || p.contentStatus === "published").length;
  return { withIntro, withFaqs, withRichContent, withAppGuide, drafts, reviewed };
}

type StateReadiness = "published" | "drafted" | "explored" | "scaffolding";

function getStateReadiness(state: StateData): StateReadiness {
  const pipeline = pipelineData[state.abbreviation] as PipelineStateSummary | undefined;
  const stats = getVerificationStats(state.programs);
  const content = getContentStats(state.programs);

  // Green: verified + has real content
  if (stats.verified > 0 && content.withIntro > 0) return "published";
  // Blue: drafts exist (in pipeline or on programs)
  if (pipeline?.draftsGenerated && pipeline.draftsGenerated > 0) return "drafted";
  if (content.drafts > 0) return "drafted";
  // Amber: pipeline explored but no drafts yet
  if (pipeline?.exploredAt) return "explored";
  // Gray: template scaffolding
  return "scaffolding";
}

function getStateHealth(state: StateData): "verified" | "partial" | "unverified" {
  const stats = getVerificationStats(state.programs);
  if (stats.verified === stats.total) return "verified";
  if (stats.verified > 0) return "partial";
  return "unverified";
}

const CATEGORY_COLORS: Record<string, string> = {
  healthcare: "bg-blue-50 text-blue-700",
  income: "bg-emerald-50 text-emerald-700",
  housing: "bg-violet-50 text-violet-700",
  food: "bg-orange-50 text-orange-700",
  utilities: "bg-amber-50 text-amber-700",
  caregiver: "bg-rose-50 text-rose-700",
};

function inferCategory(program: WaiverProgram): string {
  const text = `${program.name} ${program.description}`.toLowerCase();
  if (text.includes("caregiver") || text.includes("respite") || text.includes("companion")) return "caregiver";
  if (text.includes("snap") || text.includes("food") || text.includes("nutrition") || text.includes("meals")) return "food";
  if (text.includes("housing") || text.includes("section 8") || text.includes("rent")) return "housing";
  if (text.includes("energy") || text.includes("liheap") || text.includes("utility") || text.includes("weatherization")) return "utilities";
  if (text.includes("ssi") || text.includes("supplemental security") || text.includes("employment") || text.includes("scsep")) return "income";
  return "healthcare";
}

// ─── Components ─────────────────────────────────────────────────────────────

function VerificationDot({ program }: { program: WaiverProgram }) {
  if (program.lastVerifiedDate) {
    return (
      <span className="relative flex h-2 w-2" title={`Verified ${program.lastVerifiedDate} by ${program.verifiedBy}`}>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </span>
    );
  }
  return (
    <span className="relative flex h-2 w-2" title="Not yet verified">
      <span className="h-2 w-2 rounded-full bg-gray-300" />
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] || "bg-gray-50 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide uppercase ${colors}`}>
      {category}
    </span>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-amber-400" : "bg-gray-100"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PipelineDiffs({ comparison }: { comparison: PipelineComparison }) {
  if (!comparison.diffs.length && !comparison.novelFields.length) return null;

  return (
    <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-lg space-y-2">
      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pipeline Findings</p>
      {comparison.diffs.map((diff, i) => (
        <div key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
          <span className="text-amber-500 mt-0.5 shrink-0">&#9888;</span>
          <span>
            <span className="font-medium">{diff.field}</span>: ours says{" "}
            <span className="line-through text-amber-600">{diff.ours}</span>
            {" → "}
            <span className="font-medium">{diff.found.length > 80 ? diff.found.slice(0, 80) + "..." : diff.found}</span>
            {diff.source && (
              <a href={diff.source} target="_blank" rel="noopener noreferrer" className="ml-1 text-amber-600 underline underline-offset-2">source</a>
            )}
          </span>
        </div>
      ))}
      {comparison.novelFields.length > 0 && (
        <div className="text-xs text-amber-700 mt-1 pt-1 border-t border-amber-100">
          <span className="font-medium">Missing from model:</span>{" "}
          {comparison.novelFields.map((nf) => nf.field).join(", ")}
        </div>
      )}
    </div>
  );
}

function DraftReviewPanel({ programId, stateId }: { programId: string; stateId: string }) {
  const [reviews, setReviews] = useState<DraftReview[]>([]);
  const [status, setStatus] = useState("draft");
  const [comment, setComment] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/draft-reviews?state=${stateId}`);
      const data = await res.json();
      if (data.reviews) {
        const programReviews = data.reviews.filter((r: DraftReview) => r.program_id === programId);
        setReviews(programReviews);
        if (programReviews.length > 0) {
          setStatus(programReviews[0].status);
        }
      }
    } catch { /* silent */ }
  }, [programId, stateId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const submit = async () => {
    if (!reviewer.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/admin/draft-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          stateId,
          status,
          comment: comment.trim() || undefined,
          reviewedBy: reviewer.trim(),
        }),
      });
      setComment("");
      await fetchReviews();
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const currentStatus = reviews[0]?.status || "draft";
  const statusStyle = STATUSES.find((s) => s.value === currentStatus) || STATUSES[0];

  return (
    <div className="space-y-3">
      {/* Current status */}
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
        {reviews[0] && (
          <span className="text-[11px] text-gray-400">
            by {reviews[0].reviewed_by} · {new Date(reviews[0].created_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Review history */}
      {reviews.length > 0 && (
        <div className="space-y-1.5">
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                STATUSES.find((s) => s.value === r.status)?.color.split(" ")[0] || "bg-gray-200"
              }`} />
              <div>
                <span className="font-medium text-gray-600">{r.reviewed_by}</span>
                <span className="text-gray-400"> changed to {r.status}</span>
                {r.comment && <p className="text-gray-500 mt-0.5">{r.comment}</p>}
              </div>
              <span className="text-gray-300 ml-auto shrink-0">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add review */}
      <div className="flex items-start gap-2 pt-1">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="Your name"
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional)"
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          onClick={submit}
          disabled={submitting || !reviewer.trim()}
          className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0"
        >
          {submitting ? "..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function DraftPreview({ draft, stateId }: { draft: PipelineDraft; stateId: string }) {
  return (
    <div className="mt-4 p-5 bg-blue-50/40 border border-blue-100 rounded-xl space-y-5">
      {/* Review panel */}
      <DraftReviewPanel programId={draft.id} stateId={stateId} />

      {/* Draft header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Draft
          </span>
          <span className="text-[11px] text-blue-500">
            {draft.programType} &middot; {draft.complexity} &middot; {draft.draftedAt}
          </span>
        </div>
        {draft.geographicScope && (
          <span className="text-[11px] text-gray-400">
            {draft.geographicScope.type}{draft.geographicScope.stateVariation ? " (state variation)" : ""}
          </span>
        )}
      </div>

      {/* Tagline */}
      <p className="text-sm text-gray-600 italic">{draft.tagline}</p>

      {/* Intro */}
      {draft.intro && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Overview</p>
          <div className="text-sm text-gray-700 leading-relaxed space-y-2">
            {draft.intro.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Savings */}
      {draft.savingsRange ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <span className="text-sm font-medium text-emerald-700">{draft.savingsRange}</span>
          {draft.savingsSource && <span className="text-[11px] text-emerald-500">&middot; {draft.savingsSource}</span>}
        </div>
      ) : draft.savingsSource ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
          <span className="text-sm text-gray-500">{draft.savingsSource}</span>
        </div>
      ) : null}

      {/* Structured Eligibility */}
      {draft.structuredEligibility && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Eligibility</p>
          <ul className="space-y-1">
            {draft.structuredEligibility.summary.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                {s}
              </li>
            ))}
          </ul>

          {/* Income table */}
          {draft.structuredEligibility.incomeTable && draft.structuredEligibility.incomeTable.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-1.5 text-left font-medium text-gray-500">Household Size</th>
                    <th className="px-3 py-1.5 text-left font-medium text-gray-500">Monthly Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {draft.structuredEligibility.incomeTable.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-700">{row.householdSize}</td>
                      <td className="px-3 py-1.5 text-gray-700">${row.monthlyLimit.toLocaleString()}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Asset limits */}
          {draft.structuredEligibility.assetLimits && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {draft.structuredEligibility.assetLimits.exemptAssets && draft.structuredEligibility.assetLimits.exemptAssets.length > 0 && (
                <div className="p-2.5 bg-emerald-50/50 rounded-lg">
                  <p className="text-[11px] font-medium text-emerald-600 mb-1">Doesn&apos;t Count</p>
                  <ul className="space-y-0.5">
                    {draft.structuredEligibility.assetLimits.exemptAssets.map((a, i) => (
                      <li key={i} className="text-xs text-gray-600">{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {draft.structuredEligibility.assetLimits.countedAssets && draft.structuredEligibility.assetLimits.countedAssets.length > 0 && (
                <div className="p-2.5 bg-amber-50/50 rounded-lg">
                  <p className="text-[11px] font-medium text-amber-600 mb-1">Counts Against Limit</p>
                  <ul className="space-y-0.5">
                    {draft.structuredEligibility.assetLimits.countedAssets.map((a, i) => (
                      <li key={i} className="text-xs text-gray-600">{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Functional requirement */}
          {draft.structuredEligibility.functionalRequirement && (
            <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg">
              {draft.structuredEligibility.functionalRequirement}
            </p>
          )}
        </div>
      )}

      {/* Application Guide */}
      {draft.applicationGuide && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">How to Apply</p>
          <p className="text-sm text-gray-700 mb-2">{draft.applicationGuide.summary}</p>

          {draft.applicationGuide.steps && draft.applicationGuide.steps.length > 0 && (
            <ol className="space-y-2">
              {draft.applicationGuide.steps.map((step) => (
                <li key={step.step} className="text-sm text-gray-700 flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[11px] font-semibold text-blue-600 shrink-0 mt-0.5">
                    {step.step}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">{step.title}</span>
                    <span className="text-gray-500"> — {step.description}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
            {draft.applicationGuide.processingTime && (
              <span>Processing: {draft.applicationGuide.processingTime}</span>
            )}
            {draft.applicationGuide.waitlist && (
              <span className="text-amber-500">Waitlist: {draft.applicationGuide.waitlist}</span>
            )}
          </div>

          {draft.applicationGuide.tip && (
            <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2.5 rounded-lg">
              Tip: {draft.applicationGuide.tip}
            </p>
          )}
        </div>
      )}

      {/* Content Sections */}
      {draft.contentSections && draft.contentSections.length > 0 && (
        <div className="space-y-3">
          {draft.contentSections.map((section, i) => {
            if (section.type === "callout" && "text" in section) {
              const toneColors: Record<string, string> = {
                warning: "bg-amber-50 border-amber-100 text-amber-700",
                tip: "bg-blue-50 border-blue-100 text-blue-700",
                info: "bg-gray-50 border-gray-200 text-gray-600",
              };
              const tone = String("tone" in section ? section.tone : "info");
              return (
                <div key={i} className={`text-xs p-2.5 rounded-lg border ${toneColors[tone] || toneColors.info}`}>
                  {String(section.text)}
                </div>
              );
            }
            if (section.type === "tier-comparison" && "tiers" in section) {
              const tiers = section.tiers as { name: string; description: string; incomeLimit?: string; coverage?: string }[];
              return (
                <div key={i}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {(section as { heading?: string }).heading || "Program Tiers"}
                  </p>
                  <div className="grid gap-2">
                    {tiers.map((tier, j) => (
                      <div key={j} className="p-2.5 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{tier.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                        {tier.incomeLimit && <p className="text-xs text-gray-400 mt-0.5">Income: {tier.incomeLimit}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (section.type === "documents" && "categories" in section) {
              const cats = section.categories as { name: string; items: string[] }[];
              return (
                <div key={i}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {(section as { heading?: string }).heading || "Documents Needed"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cats.map((cat, j) => (
                      <div key={j} className="p-2.5 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-1">{cat.name}</p>
                        <ul className="space-y-0.5">
                          {cat.items.map((item, k) => (
                            <li key={k} className="text-xs text-gray-500">&#8226; {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* FAQs */}
      {draft.faqs && draft.faqs.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">FAQs ({draft.faqs.length})</p>
          <div className="space-y-2">
            {draft.faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="text-sm text-gray-700 font-medium cursor-pointer hover:text-gray-900 list-none flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 mt-1 shrink-0 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {faq.question}
                </summary>
                <p className="text-sm text-gray-500 leading-relaxed mt-1.5 ml-[22px]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Source + phone */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-blue-100 text-xs text-gray-400">
        {draft.sourceUrl && (
          <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">
            Official source &#8599;
          </a>
        )}
        {draft.phone && <span>Phone: {draft.phone}</span>}
      </div>
    </div>
  );
}

function ProgramPreview({ program, stateId, pipelineComparison, draft }: { program: WaiverProgram; stateId: string; pipelineComparison?: PipelineComparison; draft?: PipelineDraft }) {
  const [showDraft, setShowDraft] = useState(draft ? true : false);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
      {/* Draft toggle + preview */}
      {draft && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDraft(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showDraft ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Draft Content
            </button>
            <button
              onClick={() => setShowDraft(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !showDraft ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Current Content
            </button>
          </div>
          <a
            href={`/waiver-library/${stateId}/${program.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </a>
        </div>
      )}

      {/* Draft preview */}
      {showDraft && draft ? (
        <DraftPreview draft={draft} stateId={stateId} />
      ) : (
        <>
          {/* Pipeline diffs */}
          {pipelineComparison && (pipelineComparison.diffs.length > 0 || pipelineComparison.novelFields.length > 0) && (
            <PipelineDiffs comparison={pipelineComparison} />
          )}

          {/* Description */}
          {program.intro && (
            <div>
              <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Overview</p>
              <p className="text-sm text-gray-700 leading-relaxed">{program.intro}</p>
            </div>
          )}

          {/* Eligibility */}
          {program.eligibilityHighlights.length > 0 && (
            <div>
              <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Eligibility</p>
              <ul className="space-y-1">
                {program.eligibilityHighlights.map((h, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Steps */}
          {program.applicationSteps.length > 0 && (
            <div>
              <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">How to Apply</p>
              <ol className="space-y-2">
                {program.applicationSteps.map((step) => (
                  <li key={step.step} className="text-sm text-gray-700 flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 shrink-0 mt-0.5">
                      {step.step}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{step.title}</span>
                      <span className="text-gray-500"> — {step.description}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Links & verification metadata */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-gray-50">
            <a
              href={`/waiver-library/${stateId}/${program.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-gray-900 hover:text-primary-700 underline underline-offset-2 decoration-gray-300"
            >
              View live page &#8599;
            </a>
            {program.sourceUrl && (
              <a
                href={program.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2 decoration-primary-200"
              >
                Official source &#8599;
              </a>
            )}
            {program.lastVerifiedDate && (
              <span className="text-xs text-gray-400">
                Verified {program.lastVerifiedDate} by {program.verifiedBy}
              </span>
            )}
            {program.savingsSource && (
              <span className="text-xs text-gray-400">
                Savings: {program.savingsSource}
              </span>
            )}
            {program.phone && (
              <span className="text-xs text-gray-400">
                Phone: {program.phone}
              </span>
            )}
          </div>

          {/* FAQs */}
          {program.faqs && program.faqs.length > 0 && (
            <div>
              <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-2">FAQs ({program.faqs.length})</p>
              <div className="space-y-2">
                {program.faqs.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="text-sm text-gray-700 font-medium cursor-pointer hover:text-gray-900 list-none flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400 mt-1 shrink-0 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {faq.question}
                    </summary>
                    <p className="text-sm text-gray-500 leading-relaxed mt-1.5 ml-[22px]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProgramRow({ program, stateId, pipelineComparison, draft }: { program: WaiverProgram; stateId: string; pipelineComparison?: PipelineComparison; draft?: PipelineDraft }) {
  const [expanded, setExpanded] = useState(false);
  const category = inferCategory(program);
  const isVerified = !!program.lastVerifiedDate;
  const hasDiffs = pipelineComparison && pipelineComparison.diffsFound > 0;

  return (
    <div
      className={`px-5 py-3.5 transition-colors ${
        expanded ? "bg-gray-50/50" : "hover:bg-gray-50/50"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        <VerificationDot program={program} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 truncate">
              {program.name}
            </span>
            <CategoryBadge category={category} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {program.savingsRange && (
              <span className="text-xs text-emerald-600 font-medium">{program.savingsRange}</span>
            )}
            {!program.savingsRange && (
              <span className="text-xs text-gray-400">Free service</span>
            )}
            {!isVerified && (
              <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                Unverified
              </span>
            )}
            {hasDiffs && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                {pipelineComparison.diffsFound} diff{pipelineComparison.diffsFound > 1 ? "s" : ""}
              </span>
            )}
            {draft && (
              <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                Draft
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {expanded && <ProgramPreview program={program} stateId={stateId} pipelineComparison={pipelineComparison} draft={draft} />}
    </div>
  );
}

// ─── State Grid Card ────────────────────────────────────────────────────────

const READINESS_STYLES: Record<StateReadiness, { border: string; dot: string; label: string }> = {
  published: { border: "border-emerald-200 hover:border-emerald-300", dot: "bg-emerald-400", label: "Published" },
  drafted: { border: "border-blue-200 hover:border-blue-300", dot: "bg-blue-400", label: "Drafts Ready" },
  explored: { border: "border-amber-200 hover:border-amber-300", dot: "bg-amber-400", label: "Explored" },
  scaffolding: { border: "border-gray-200 hover:border-gray-300", dot: "bg-gray-200", label: "" },
};

function StateCard({
  state,
  onClick,
}: {
  state: StateData;
  onClick: () => void;
}) {
  const stats = getVerificationStats(state.programs);
  const content = getContentStats(state.programs);
  const readiness = getStateReadiness(state);
  const style = READINESS_STYLES[readiness];
  const pipeline = pipelineData[state.abbreviation] as PipelineStateSummary | undefined;

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border bg-white hover:shadow-sm transition-all duration-150 group ${style.border}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-800">
            {state.abbreviation}
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">
          {stats.total}
        </span>
      </div>
      <p className="text-[13px] text-gray-500 leading-snug truncate mb-2">
        {state.name}
      </p>

      {/* Content depth indicators */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
        {content.withIntro > 0 && (
          <span className="text-blue-500">{content.withIntro} content</span>
        )}
        {stats.verified > 0 && (
          <span className="text-emerald-500">{stats.verified} verified</span>
        )}
        {content.withIntro === 0 && stats.verified === 0 && (
          <span>Template only</span>
        )}
      </div>

      <ProgressBar value={content.withIntro || stats.verified} total={stats.total} />

      {/* Pipeline status line */}
      {pipeline && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
          <p className="text-[11px] text-gray-400">
            Explored {pipeline.exploredAt}
          </p>
          {pipeline.draftsGenerated !== undefined && pipeline.draftsGenerated > 0 && (
            <p className="text-[11px] text-blue-500 font-medium">
              {pipeline.draftsGenerated} draft{pipeline.draftsGenerated > 1 ? "s" : ""} ready
            </p>
          )}
          {pipeline.diffsFound > 0 && (
            <p className="text-[11px] text-amber-600 font-medium">
              {pipeline.diffsFound} issue{pipeline.diffsFound > 1 ? "s" : ""}
            </p>
          )}
          {pipeline.classification && (
            <p className="text-[11px] text-gray-400">
              {Object.entries(pipeline.classification.types || {}).map(([t, n]) => `${n} ${t}`).join(", ")}
            </p>
          )}
        </div>
      )}
    </button>
  );
}

// ─── State Detail View ──────────────────────────────────────────────────────

function StateOverviewPreview({ overview, stateName }: { overview: PipelineStateOverview; stateName: string }) {
  return (
    <div className="space-y-5">
      {/* Intro */}
      <div>
        <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Intro</p>
        <div className="text-sm text-gray-700 leading-relaxed space-y-2">
          {overview.intro.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* Start here */}
      {overview.startHere.length > 0 && (
        <div>
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Where to Start ({overview.startHere.length} picks)</p>
          <div className="space-y-2">
            {overview.startHere.map((pick, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <span className="font-medium text-gray-900">{pick.name}</span>
                  <span className="text-gray-500"> — {pick.why}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By need */}
      {overview.byNeed.length > 0 && (
        <div>
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Browse by Need ({overview.byNeed.length} groups)</p>
          <div className="space-y-3">
            {overview.byNeed.map((group, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-gray-900">{group.need}</p>
                <p className="text-gray-500 mt-0.5">{group.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {group.programs.map((name, j) => (
                    <span key={j} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick facts */}
      {overview.quickFacts.length > 0 && (
        <div>
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Quick Facts</p>
          <ul className="space-y-1.5">
            {overview.quickFacts.map((fact, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5 shrink-0">&#8226;</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources vs Benefits */}
      {overview.resourcesVsBenefits && (
        <div>
          <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Resources vs Benefits</p>
          <p className="text-sm text-gray-700 leading-relaxed">{overview.resourcesVsBenefits}</p>
        </div>
      )}
    </div>
  );
}

function StateDetail({
  state,
  onBack,
}: {
  state: StateData;
  onBack: () => void;
}) {
  const stats = getVerificationStats(state.programs);
  const pipeline = pipelineData[state.abbreviation];
  const comparisons = pipeline?.comparisons || [];
  const stateDrafts = pipelineDrafts[state.abbreviation]?.programs || [];
  const stateOverview = pipelineDrafts[state.abbreviation]?.stateOverview;
  const [showStateOverview, setShowStateOverview] = useState(!!stateOverview);

  // Match pipeline comparisons to existing programs by ID or fuzzy name
  function findComparison(program: WaiverProgram): PipelineComparison | undefined {
    return comparisons.find((c) =>
      c.existingId === program.id ||
      c.name.toLowerCase().includes(program.name.toLowerCase().slice(0, 20)) ||
      program.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 20))
    );
  }

  function findDraft(program: WaiverProgram): PipelineDraft | undefined {
    return stateDrafts.find((d) =>
      d.name.toLowerCase().includes(program.name.toLowerCase().slice(0, 20)) ||
      program.name.toLowerCase().includes(d.name.toLowerCase().slice(0, 20))
    );
  }

  return (
    <div>
      {/* Back + header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        All states
      </button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{state.name}</h2>
          <a
            href={`/waiver-library/${state.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview state page
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {stats.total} programs &middot;{" "}
          {stats.verified > 0 ? (
            <span className={stats.verified === stats.total ? "text-emerald-600" : "text-amber-600"}>
              {stats.verified} verified
            </span>
          ) : (
            <span className="text-gray-400">none verified</span>
          )}
          {stats.savingsVerified > 0 && (
            <> &middot; {stats.savingsVerified} savings sourced</>
          )}
        </p>
        <div className="mt-3 max-w-xs">
          <ProgressBar value={stats.verified} total={stats.total} />
        </div>
      </div>

      {/* Pipeline summary */}
      {pipeline && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Pipeline explored {pipeline.exploredAt} &middot; {pipeline.programsFound} programs found
            {pipeline.diffsFound > 0 && (
              <span className="text-amber-600 font-medium"> &middot; {pipeline.diffsFound} data issues</span>
            )}
            {pipeline.newPrograms > 0 && (
              <span> &middot; {pipeline.newPrograms} new programs discovered</span>
            )}
          </div>
        </div>
      )}

      {/* State overview toggle */}
      {stateOverview && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStateOverview(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showStateOverview ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Draft State Overview
            </button>
            <button
              onClick={() => setShowStateOverview(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !showStateOverview ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Programs Only
            </button>
          </div>

          {showStateOverview && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <StateOverviewPreview overview={stateOverview} stateName={state.name} />
            </div>
          )}
        </div>
      )}

      {/* Program list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {state.programs.map((program) => (
          <ProgramRow
            key={program.id}
            program={program}
            stateId={state.id}
            pipelineComparison={findComparison(program)}
            draft={findDraft(program)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type StatusFilter = "all" | "verified" | "partial" | "unverified";

export default function AdminBenefitsPage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const globalStats = useMemo(() => {
    const allPrograms = allStates.flatMap((s) => s.programs);
    const verification = getVerificationStats(allPrograms);
    const content = getContentStats(allPrograms);

    // Pipeline stats
    const pipelineStates = Object.keys(pipelineData);
    const exploredCount = pipelineStates.length;
    const draftedCount = pipelineStates.filter((s) => {
      const p = pipelineData[s] as PipelineStateSummary;
      return p.draftsGenerated && p.draftsGenerated > 0;
    }).length;

    // Readiness breakdown
    const readiness = { published: 0, drafted: 0, explored: 0, scaffolding: 0 };
    for (const s of allStates) {
      readiness[getStateReadiness(s)]++;
    }

    return { ...verification, ...content, exploredCount, draftedCount, readiness };
  }, []);

  const filteredStates = useMemo(() => {
    let states = [...allStates];

    // Search
    if (search) {
      const q = search.toLowerCase();
      states = states.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abbreviation.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      states = states.filter((s) => getStateHealth(s) === statusFilter);
    }

    // Sort: verified states first, then partial, then unverified
    const order = { verified: 0, partial: 1, unverified: 2 };
    states.sort((a, b) => order[getStateHealth(a)] - order[getStateHealth(b)]);

    return states;
  }, [search, statusFilter]);

  const stateData = selectedState
    ? allStates.find((s) => s.abbreviation === selectedState)
    : null;

  // Counts per status for filter pills
  const statusCounts = useMemo(() => {
    const counts = { all: allStates.length, verified: 0, partial: 0, unverified: 0 };
    for (const s of allStates) {
      counts[getStateHealth(s)]++;
    }
    return counts;
  }, []);

  return (
    <div>
      {/* Summary Bar */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Benefits Data</h1>
          <p className="text-sm text-gray-400">
            {globalStats.total.toLocaleString()} programs &middot; {allStates.length} states
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Verification */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Verified</p>
            <p className="text-2xl font-semibold text-gray-900">{globalStats.verified}</p>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${Math.max((globalStats.verified / globalStats.total) * 100, 0.5)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {((globalStats.verified / globalStats.total) * 100).toFixed(1)}% of {globalStats.total.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Content Quality */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">With Real Content</p>
            <p className="text-2xl font-semibold text-gray-900">{globalStats.withIntro}</p>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.max((globalStats.withIntro / globalStats.total) * 100, 0.5)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {globalStats.withFaqs} with FAQs &middot; {globalStats.withSource} sourced
              </p>
            </div>
          </div>

          {/* Pipeline */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Pipeline</p>
            <p className="text-2xl font-semibold text-gray-900">{globalStats.exploredCount}</p>
            <p className="text-[11px] text-gray-400 mt-2">
              {globalStats.exploredCount} explored &middot; {globalStats.draftedCount} drafted
            </p>
          </div>

          {/* State Readiness */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">State Readiness</p>
            <div className="flex items-center gap-1.5 mt-1">
              {globalStats.readiness.published > 0 && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-600">{globalStats.readiness.published}</span>
                </span>
              )}
              {globalStats.readiness.drafted > 0 && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-gray-600">{globalStats.readiness.drafted}</span>
                </span>
              )}
              {globalStats.readiness.explored > 0 && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-gray-600">{globalStats.readiness.explored}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-gray-200" />
                <span className="text-gray-400">{globalStats.readiness.scaffolding}</span>
              </span>
            </div>
            <div className="flex gap-0.5 mt-2 h-1.5 rounded-full overflow-hidden bg-gray-100">
              {globalStats.readiness.published > 0 && (
                <div className="bg-emerald-400" style={{ width: `${(globalStats.readiness.published / allStates.length) * 100}%` }} />
              )}
              {globalStats.readiness.drafted > 0 && (
                <div className="bg-blue-400" style={{ width: `${(globalStats.readiness.drafted / allStates.length) * 100}%` }} />
              )}
              {globalStats.readiness.explored > 0 && (
                <div className="bg-amber-400" style={{ width: `${(globalStats.readiness.explored / allStates.length) * 100}%` }} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Published &middot; Drafted &middot; Explored &middot; Scaffolding
            </p>
          </div>
        </div>
      </div>

      {stateData ? (
        <StateDetail
          state={stateData}
          onBack={() => setSelectedState(null)}
        />
      ) : (
        <>
          {/* Search + filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1">
              {(["all", "verified", "partial", "unverified"] as StatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {status === "all"
                      ? `All ${statusCounts.all}`
                      : status === "verified"
                      ? `Verified ${statusCounts.verified}`
                      : status === "partial"
                      ? `Partial ${statusCounts.partial}`
                      : `Unverified ${statusCounts.unverified}`}
                  </button>
                )
              )}
            </div>
          </div>

          {/* State grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredStates.map((state) => (
              <StateCard
                key={state.abbreviation}
                state={state}
                onClick={() => setSelectedState(state.abbreviation)}
              />
            ))}
          </div>

          {filteredStates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-gray-400">No states match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
