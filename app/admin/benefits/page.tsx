"use client";

import { useState, useMemo } from "react";
import { allStates, type WaiverProgram, type StateData } from "@/data/waiver-library";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVerificationStats(programs: WaiverProgram[]) {
  const verified = programs.filter((p) => p.lastVerifiedDate).length;
  const withSource = programs.filter((p) => p.sourceUrl).length;
  const savingsVerified = programs.filter((p) => p.savingsVerified).length;
  return { total: programs.length, verified, withSource, savingsVerified };
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

function ProgramPreview({ program }: { program: WaiverProgram }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
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

      {/* Verification metadata */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-gray-50">
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
    </div>
  );
}

function ProgramRow({ program }: { program: WaiverProgram }) {
  const [expanded, setExpanded] = useState(false);
  const category = inferCategory(program);
  const isVerified = !!program.lastVerifiedDate;

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
      {expanded && <ProgramPreview program={program} />}
    </div>
  );
}

// ─── State Grid Card ────────────────────────────────────────────────────────

function StateCard({
  state,
  onClick,
}: {
  state: StateData;
  onClick: () => void;
}) {
  const stats = getVerificationStats(state.programs);
  const health = getStateHealth(state);

  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-800">
          {state.abbreviation}
        </span>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
          health === "verified"
            ? "bg-emerald-50 text-emerald-600"
            : health === "partial"
            ? "bg-amber-50 text-amber-600"
            : "text-gray-400"
        }`}>
          {stats.verified}/{stats.total}
        </span>
      </div>
      <p className="text-[13px] text-gray-500 leading-snug truncate mb-2.5">
        {state.name}
      </p>
      <ProgressBar value={stats.verified} total={stats.total} />
    </button>
  );
}

// ─── State Detail View ──────────────────────────────────────────────────────

function StateDetail({
  state,
  onBack,
}: {
  state: StateData;
  onBack: () => void;
}) {
  const stats = getVerificationStats(state.programs);

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
        <h2 className="text-xl font-semibold text-gray-900">{state.name}</h2>
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

      {/* Program list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {state.programs.map((program) => (
          <ProgramRow key={program.id} program={program} />
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
    return getVerificationStats(allPrograms);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Benefits Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          {globalStats.verified} of {globalStats.total} programs verified
          {globalStats.withSource > 0 && <> &middot; {globalStats.withSource} with source URLs</>}
          {globalStats.savingsVerified > 0 && <> &middot; {globalStats.savingsVerified} savings sourced</>}
        </p>
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
