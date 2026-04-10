"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  WaiverProgram,
  StateData,
  ContentSection,
  ApplicationGuide,
  StructuredEligibility,
} from "@/data/waiver-library";
import { ServiceAreasMap } from "@/components/waiver-library/ServiceAreasMapLoader";
import { CityBadge } from "@/components/waiver-library/CityBadge";
import { useSavedPrograms } from "@/hooks/use-saved-programs";

// ═══════════════════════════════════════════════════════════════════════════════
// Design atoms — shared visual vocabulary from the state page, adapted
// for program-level depth. The state page paints with bold strokes (full-width
// dark bands, organic blobs). The program page uses the same palette but with
// more restraint — accent lines, quieter illustrations, precise moments.
// ═══════════════════════════════════════════════════════════════════════════════

// --- Organic SVG elements ---

function HeaderAccent() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/3 opacity-[0.08] pointer-events-none"
      viewBox="0 0 300 200"
      fill="none"
      aria-hidden="true"
    >
      {/* Soft teal shape — atmospheric, not literal */}
      <path
        d="M200 30c40 10 80 50 75 95s-55 65-100 75-80-10-95-50S160 20 200 30Z"
        fill="#96c8c8"
      />
      {/* Warm accent dot */}
      <circle cx="260" cy="60" r="12" fill="#e9bd91" opacity="0.5" />
      {/* Tiny floating dots */}
      <circle cx="240" cy="140" r="4" fill="#96c8c8" opacity="0.4" />
      <circle cx="255" cy="155" r="2.5" fill="#e9bd91" opacity="0.3" />
    </svg>
  );
}

function WavyDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full h-5 text-primary-200/30 ${className}`}
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 10c100-6 200 6 300 0s200-6 300 0 200 6 300 0 200-6 300 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandDrawnUnderline() {
  return (
    <svg
      className="absolute -bottom-1.5 left-0 w-full h-2.5 text-primary-300/50"
      viewBox="0 0 200 10"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 7c30-3 60-5 100-4s70 2 96 1"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// --- Typography atoms ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-3">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-serif leading-snug mb-1">
      {children}
    </h2>
  );
}

// --- Badge atoms ---

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    benefit: "bg-emerald-50 text-emerald-600",
    resource: "bg-blue-50 text-blue-600",
    navigator: "bg-violet-50 text-violet-600",
    employment: "bg-amber-50 text-amber-600",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${styles[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2.5 py-1 rounded-full border border-gray-200">
      {scope}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Reusable components — these are the building blocks the pipeline selects from.
// Each component is self-contained and renders well at any width.
// ═══════════════════════════════════════════════════════════════════════════════

// --- Stat Callout (the "bold moment" for program pages) ---

function StatCallout({ stats }: { stats: { value: string; label: string }[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="bg-gray-900 rounded-2xl py-8 px-8 md:px-10">
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
        {stats.map((stat, i) => (
          <div key={i}>
            <span className="text-display-xs md:text-display-sm font-bold text-white font-serif">
              {stat.value}
            </span>
            <span className="text-gray-400 text-sm ml-2">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Income Table ---

function IncomeTable({
  rows,
  heading,
  footnote,
  highlightRow,
}: {
  rows: { householdSize: number; monthlyLimit: number }[];
  heading?: string;
  footnote?: string;
  highlightRow?: number;
}) {
  return (
    <div>
      {heading && (
        <p className="text-sm font-medium text-gray-900 mb-3">{heading}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                Household size
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
                Monthly income limit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => {
              const isHighlighted = highlightRow === row.householdSize;
              return (
                <tr
                  key={i}
                  className={isHighlighted ? "bg-primary-50/40" : ""}
                >
                  <td className="px-5 py-3 text-gray-700">
                    {row.householdSize}{" "}
                    {row.householdSize === 1 ? "person" : "people"}
                    {isHighlighted && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {typeof row.monthlyLimit === "number" ? `$${row.monthlyLimit.toLocaleString()}/mo` : String(row.monthlyLimit || "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footnote && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{footnote}</p>
      )}
    </div>
  );
}

// --- Asset Limits ---

function AssetLimitsDisplay({ limits }: { limits: NonNullable<StructuredEligibility["assetLimits"]> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M10 2L2 7v6l8 5 8-5V7L10 2z" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 12v6M2 7l8 5 8-5" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            Assets must be under ${typeof limits.individual === "number" ? limits.individual.toLocaleString() : "—"}
            {limits.couple != null && typeof limits.couple === "number" && (
              <span className="text-gray-500 font-normal">
                {" "}(${limits.couple.toLocaleString()} for couples)
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">But not everything counts.</p>
        </div>
      </div>

      {limits.exemptAssets && limits.exemptAssets.length > 0 && (
        <div className="pl-11">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            What your parent can keep
          </p>
          <ul className="space-y-1">
            {limits.exemptAssets.map((a, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                {a}
              </li>
            ))}
          </ul>
          {limits.homeEquityCap && (
            <p className="text-xs text-gray-400 mt-2">
              Home equity exempt up to ${typeof limits.homeEquityCap === "number" ? limits.homeEquityCap.toLocaleString() : "—"}
            </p>
          )}
        </div>
      )}

      {limits.countedAssets && limits.countedAssets.length > 0 && (
        <div className="pl-11 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            What does count
          </p>
          <p className="text-sm text-gray-500">
            {limits.countedAssets.map((a) => a.toLowerCase()).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Document Checklist (interactive) ---

function DocumentChecklist({ documents, heading }: { documents: string[]; heading?: string }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const progress = documents.length > 0 ? Math.round((checked.size / documents.length) * 100) : 0;

  return (
    <div>
      {heading && (
        <p className="text-sm font-medium text-gray-900 mb-3">{heading}</p>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-400 tabular-nums">
          {checked.size}/{documents.length}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {documents.map((doc, i) => (
          <label
            key={i}
            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-vanilla-50/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/20"
            />
            <span
              className={`text-sm leading-relaxed transition-colors ${
                checked.has(i) ? "text-gray-400 line-through" : "text-gray-700"
              }`}
            >
              {doc}
            </span>
          </label>
        ))}
      </div>

      {progress === 100 && (
        <p className="text-sm text-emerald-600 font-medium mt-3 flex items-center gap-1.5">
          <span>&#10003;</span> All documents ready
        </p>
      )}
    </div>
  );
}

// --- Step Journey (visual application steps) ---

function StepJourney({ steps }: { steps: { step: number; title: string; description: string }[] }) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-[15px] top-8 bottom-8 w-px bg-gray-200" aria-hidden="true" />

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.step} className="relative flex items-start gap-4 pb-8 last:pb-0">
            {/* Step number circle */}
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold shrink-0">
              {step.step}
            </div>
            <div className="pt-1 min-w-0">
              <p className="font-semibold text-gray-900 leading-snug">{step.title}</p>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Contact Cards ---

function ContactCards({ contacts }: { contacts: { label: string; description?: string; phone?: string | null; hours?: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {contacts.map((c, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
          <p className="font-medium text-gray-900 text-sm">{c.label}</p>
          {c.description && (
            <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
          )}
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {c.phone}
            </a>
          )}
          {c.hours && (
            <p className="text-xs text-gray-400">{c.hours}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Application Notes (conditional warnings/tips) ---

function ApplicationNotes({ notes }: { notes: string[] }) {
  return (
    <div className="space-y-2.5">
      {notes.map((note, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50/60 border-l-2 border-amber-400"
        >
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700 leading-relaxed">{note}</p>
        </div>
      ))}
    </div>
  );
}

// --- FAQ Section ---

function FaqSection({ faqs, label = "Common questions" }: { faqs: { question: string; answer: string }[]; label?: string }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="divide-y divide-gray-200">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-4 first:pt-0">
            <summary className="flex items-start justify-between gap-4 cursor-pointer list-none text-gray-900 font-medium leading-snug hover:text-gray-700 transition-colors">
              {faq.question}
              <svg
                className="w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed pr-8">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// --- Content Section Renderer (from pipeline contentSections) ---

function RenderContentSection({ section }: { section: ContentSection }) {
  if (section.type === "callout" && "text" in section) {
    const borderColor: Record<string, string> = {
      warning: "border-amber-400 bg-amber-50/60",
      tip: "border-primary-400 bg-primary-50/40",
      info: "border-gray-300 bg-gray-50/60",
    };
    const tone = "tone" in section ? String(section.tone) as "warning" | "tip" | "info" : "info";
    return (
      <div className={`p-3.5 rounded-lg border-l-2 ${borderColor[tone] || borderColor.info}`}>
        <p className="text-sm text-gray-700 leading-relaxed">{String(section.text)}</p>
      </div>
    );
  }

  if (section.type === "tier-comparison" && "tiers" in section) {
    const tiers = section.tiers as { name: string; description: string; incomeLimit?: string; coverage?: string }[];
    return (
      <div>
        {section.heading && <p className="text-sm font-medium text-gray-900 mb-3">{section.heading}</p>}
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white">
              <p className="font-medium text-gray-900">{tier.name}</p>
              <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
              {tier.incomeLimit && <p className="text-xs text-gray-400 mt-1">Income limit: {tier.incomeLimit}</p>}
              {tier.coverage && <p className="text-xs text-gray-400">Coverage: {tier.coverage}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "prose" && "body" in section) {
    return (
      <div>
        {section.heading && <p className="text-sm font-medium text-gray-900 mb-2">{section.heading}</p>}
        <div className="text-gray-700 leading-relaxed space-y-3">
          {String(section.body).split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "income-table" && "rows" in section) {
    const rows = section.rows as { householdSize: number; monthlyLimit: number }[];
    return (
      <IncomeTable
        rows={rows}
        heading={section.heading ? String(section.heading) : undefined}
        footnote={"footnote" in section ? String(section.footnote) : undefined}
      />
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab system — the structural backbone. Adapts based on program type.
// ═══════════════════════════════════════════════════════════════════════════════

type TabId = "about" | "eligibility" | "apply" | "resources";

interface TabDef {
  id: TabId;
  label: string;
}

function getAvailableTabs(program: WaiverProgram): TabDef[] {
  const type = program.programType || "benefit";
  const complexity = program.complexity || "medium";

  // Resources and navigators: just About + Resources
  if (type === "resource" || type === "navigator") {
    return [
      { id: "about", label: "About" },
      { id: "resources", label: "Resources" },
    ];
  }

  // Simple benefits: About + How to Apply + Resources
  if (complexity === "simple") {
    return [
      { id: "about", label: "About" },
      { id: "apply", label: "How to Apply" },
      { id: "resources", label: "Resources" },
    ];
  }

  // Deep/medium benefits + employment: all 4 tabs
  return [
    { id: "about", label: "About" },
    { id: "eligibility", label: "Eligibility" },
    { id: "apply", label: "How to Apply" },
    { id: "resources", label: "Resources" },
  ];
}

function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabDef[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  // Don't render tabs if there's only one
  if (tabs.length <= 1) return null;

  return (
    <div className="sticky top-0 z-30 bg-vanilla-100/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab content renderers
// ═══════════════════════════════════════════════════════════════════════════════

function AboutTab({ program, state }: { program: WaiverProgram; state: StateData }) {
  const intent = program.layoutIntent;

  // Build stats for the bold moment — layoutIntent guides what to feature
  const stats: { value: string; label: string }[] = [];
  const highlight = intent?.aboutHighlight;

  if (highlight === "waitlist" && program.applicationGuide?.waitlist) {
    // Waitlist is the defining feature — lead with it
    const wlMatch = program.applicationGuide.waitlist.match(/\d+/);
    if (wlMatch) stats.push({ value: wlMatch[0] + "+", label: "month typical wait" });
  }
  if (program.savingsRange && highlight !== "waitlist") {
    const match = program.savingsRange.match(/\$[\d,]+/);
    if (match) stats.push({ value: match[0] + "+", label: "potential savings" });
  }
  if (program.serviceAreas && program.serviceAreas.length > 0) {
    stats.push({ value: String(program.serviceAreas.length), label: "service areas" });
  }
  // Coverage highlight: count what's included
  if (highlight === "coverage" && program.contentSections) {
    const coverageSection = program.contentSections.find(
      (s) => s.type === "tier-comparison" || (s.type === "prose" && s.heading?.toString().toLowerCase().includes("cover"))
    );
    if (coverageSection && "tiers" in coverageSection) {
      const tiers = coverageSection.tiers as unknown[];
      stats.push({ value: String(tiers.length), label: "coverage tiers" });
    }
  }

  // Collect callouts from content sections
  const callouts = program.contentSections?.filter((s) => s.type === "callout") || [];
  const nonCallouts = program.contentSections?.filter((s) => s.type !== "callout") || [];

  return (
    <>
      {/* Intro prose — focused reading width */}
      {program.intro && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <div className="text-lg text-gray-600 leading-relaxed space-y-4">
            {program.intro.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Stat callout — the bold moment. Wider than prose. */}
      {stats.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 lg:px-8 mt-10">
          <StatCallout stats={stats} />
          {/* Savings source attribution — quiet, below the dark band */}
          {program.savingsRange && program.savingsSource && program.savingsSource !== "Free service" && (
            <p className="text-xs text-gray-400 mt-2">Source: {program.savingsSource}</p>
          )}
        </section>
      )}

      {/* Savings as text only when there's no stat callout to show it */}
      {stats.length === 0 && program.savingsRange && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-6">
          <p className="text-sm text-gray-500">
            Estimated savings: <span className="font-medium text-gray-700">{program.savingsRange}</span>
            {program.savingsSource && program.savingsSource !== "Free service" && (
              <span className="text-xs text-gray-400 ml-1.5">({program.savingsSource})</span>
            )}
          </p>
        </section>
      )}

      <WavyDivider className="my-10 max-w-3xl mx-auto px-6" />

      {/* Content sections — non-callout ones (tier comparisons, prose, etc.) */}
      {nonCallouts.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 space-y-8">
          {nonCallouts.map((section, i) => (
            <div key={i}>
              <RenderContentSection section={section} />
            </div>
          ))}
        </section>
      )}

      {/* Things to know — merged callouts */}
      {callouts.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-10">
          <SectionLabel>Things to know</SectionLabel>
          <div className="text-sm text-gray-700 leading-relaxed space-y-3">
            {callouts.map((section, i) => (
              <p key={i}>{"text" in section ? String(section.text) : ""}</p>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {program.faqs && program.faqs.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-12">
          <FaqSection faqs={program.faqs} />
        </section>
      )}
    </>
  );
}

function EligibilityTab({ program }: { program: WaiverProgram }) {
  const elig = program.structuredEligibility;
  if (!elig) {
    return (
      <section className="max-w-2xl mx-auto px-6 lg:px-8">
        <p className="text-gray-500">Eligibility details are being researched for this program.</p>
      </section>
    );
  }

  return (
    <>
      {/* Summary bullets */}
      <section className="max-w-2xl mx-auto px-6 lg:px-8">
        <SectionLabel>Who qualifies</SectionLabel>
        <ul className="space-y-2.5">
          {elig.summary.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-gray-700">
              <span className="text-emerald-500 mt-0.5 text-sm shrink-0">&#10003;</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Income table — wider, it's the bold moment of this tab */}
      {elig.incomeTable && elig.incomeTable.filter((r) => typeof r.monthlyLimit === "number" && typeof r.householdSize === "number").length > 0 && (
        <section className="max-w-3xl mx-auto px-6 lg:px-8 mt-10">
          <IncomeTable
            rows={elig.incomeTable.filter((r) => typeof r.monthlyLimit === "number" && typeof r.householdSize === "number")}
            heading="Income limits by household size"
            footnote={elig.povertyLevelReference || undefined}
          />
        </section>
      )}

      {/* Asset limits */}
      {elig.assetLimits && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <SectionLabel>Asset limits</SectionLabel>
          <AssetLimitsDisplay limits={elig.assetLimits} />
        </section>
      )}

      {/* Functional requirement */}
      {elig.functionalRequirement && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <SectionLabel>Medical / functional requirement</SectionLabel>
          <div className="p-4 rounded-xl bg-primary-50/40 border-l-2 border-primary-400">
            <p className="text-sm text-gray-700 leading-relaxed">{elig.functionalRequirement}</p>
          </div>
        </section>
      )}

      {/* Other requirements */}
      {elig.otherRequirements && elig.otherRequirements.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <SectionLabel>Other requirements</SectionLabel>
          <ul className="space-y-2">
            {elig.otherRequirements.map((r, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2.5">
                <span className="text-gray-300 mt-0.5 shrink-0">&#8226;</span>
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

    </>
  );
}

function HowToApplyTab({ program, state }: { program: WaiverProgram; state: StateData }) {
  const guide = program.applicationGuide;

  // Use pipeline documentsNeeded if available, else try contentSections for documents type
  const documents = (program).documentsNeeded || [];
  const applicationNotes = (program).applicationNotes || [];

  return (
    <>
      {/* Application summary */}
      {guide && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <p className="text-lg text-gray-600 leading-relaxed">{guide.summary}</p>
        </section>
      )}

      {/* Document checklist — wider, it's a tool */}
      {documents.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 lg:px-8 mt-10">
          <SectionLabel>Documents you&apos;ll need</SectionLabel>
          <DocumentChecklist documents={documents} />
        </section>
      )}

      {/* Application notes / warnings */}
      {applicationNotes.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <ApplicationNotes notes={applicationNotes} />
        </section>
      )}

      <WavyDivider className="my-10 max-w-3xl mx-auto px-6" />

      {/* Step journey */}
      {guide?.steps && guide.steps.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <SectionLabel>Steps to apply</SectionLabel>
          <StepJourney steps={guide.steps} />
        </section>
      )}

      {/* Processing time / waitlist */}
      {(guide?.processingTime || guide?.waitlist) && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1.5">
            {guide.processingTime && (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Processing time:</span> {guide.processingTime}
              </p>
            )}
            {guide.waitlist && (
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Waitlist:</span> {guide.waitlist}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Application URLs */}
      {guide?.urls && guide.urls.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-6">
          <div className="flex flex-wrap gap-3">
            {guide.urls.map((u, i) => (
              <a
                key={i}
                href={u.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {u.label}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Service areas map — full-width moment */}
      {program.serviceAreas && program.serviceAreas.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 lg:px-8 mt-12">
          <SectionLabel>Service areas</SectionLabel>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6">
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                  {program.serviceAreas.map((area) => (
                    <div key={area.name} className="py-2">
                      <CityBadge name={area.name} />
                      <p className="text-sm text-gray-500 mt-1">{area.description}</p>
                    </div>
                  ))}
                </div>
                {program.phone && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Don&apos;t see your area?</p>
                    <a href={`tel:${program.phone}`} className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
                      Call {program.phone}
                    </a>
                  </div>
                )}
              </div>
              <div className="border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50">
                <ServiceAreasMap
                  stateId={state.id}
                  areas={program.serviceAreas}
                  mapPins={program.mapPins}
                  programName={program.name}
                  noWrapper
                />
              </div>
            </div>
          </div>
        </section>
      )}

    </>
  );
}

function ResourcesTab({ program }: { program: WaiverProgram }) {
  const contacts = (program).contacts || [];
  const relatedPrograms = (program).relatedPrograms || [];

  return (
    <>
      {/* Primary contacts — front and center */}
      {contacts.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 lg:px-8">
          <SectionLabel>Key contacts</SectionLabel>
          <ContactCards contacts={contacts} />
        </section>
      )}

      {/* Simple phone fallback if no structured contacts */}
      {contacts.length === 0 && program.phone && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <SectionLabel>Contact</SectionLabel>
          <a
            href={`tel:${program.phone}`}
            className="inline-flex items-center gap-2 text-lg font-semibold text-primary-600 hover:text-primary-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {program.phone}
          </a>
        </section>
      )}

      {/* Official source */}
      {program.sourceUrl && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <SectionLabel>Official source</SectionLabel>
          <a
            href={program.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 underline underline-offset-2 decoration-primary-200 transition-colors"
          >
            Visit official program page &#8599;
          </a>
          {program.lastVerifiedDate && (
            <p className="text-xs text-gray-400 mt-1">
              Last verified {program.lastVerifiedDate}
            </p>
          )}
        </section>
      )}

      {/* Application forms */}
      {program.forms && program.forms.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8 mt-8">
          <SectionLabel>Application forms</SectionLabel>
          <div className="space-y-2">
            {program.forms.map((form) => (
              <a
                key={form.id}
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all group"
              >
                <p className="font-medium text-sm text-gray-900 group-hover:text-primary-700 transition-colors">
                  {form.name} &#8599;
                </p>
                {form.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{form.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      <WavyDivider className="my-10 max-w-3xl mx-auto px-6" />

      {/* Related programs */}
      {relatedPrograms.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 lg:px-8">
          <SectionLabel>Related programs</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {relatedPrograms.map((name, i) => (
              <span
                key={i}
                className="text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      )}

    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Resource One-Pager — for simple programs (hotlines, counseling, companion)
// No tabs. Just what it is, who to call, where to go.
// ═══════════════════════════════════════════════════════════════════════════════

function ResourceOnePager({ program, state }: { program: WaiverProgram; state: StateData }) {
  const contacts = (program).contacts || [];

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 space-y-8">
        {/* Intro */}
        {program.intro && (
          <div className="text-lg text-gray-600 leading-relaxed space-y-4">
            {program.intro.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* Phone CTA — prominent */}
        {(program.phone || contacts.length > 0) && (
          <div className="rounded-2xl bg-primary-50/60 border border-primary-200/50 p-6">
            {contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((c, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-900">{c.label}</p>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                        className="text-2xl font-bold text-primary-700 hover:text-primary-600 font-serif transition-colors"
                      >
                        {c.phone}
                      </a>
                    )}
                    {c.hours && <p className="text-xs text-gray-500 mt-0.5">{c.hours}</p>}
                    {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                  </div>
                ))}
              </div>
            ) : program.phone ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Call for help</p>
                <a
                  href={`tel:${program.phone}`}
                  className="text-2xl font-bold text-primary-700 hover:text-primary-600 font-serif transition-colors"
                >
                  {program.phone}
                </a>
              </div>
            ) : null}
          </div>
        )}

        {/* Content sections */}
        {program.contentSections && program.contentSections.length > 0 && (
          <div className="space-y-6">
            {program.contentSections.map((section, i) => (
              <RenderContentSection key={i} section={section} />
            ))}
          </div>
        )}

        {/* Source */}
        {program.sourceUrl && (
          <div className="text-sm">
            <a
              href={program.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 font-medium underline underline-offset-2 decoration-primary-200 transition-colors"
            >
              Official source &#8599;
            </a>
          </div>
        )}

        {/* FAQs */}
        {program.faqs && program.faqs.length > 0 && (
          <FaqSection faqs={program.faqs} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component — the orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

interface RelatedArticle {
  slug: string;
  title: string;
  cover_image_url?: string | null;
  reading_time_minutes?: number | null;
  section?: string | null;
}

interface ProgramPageV3Props {
  program: WaiverProgram;
  state: StateData;
  relatedArticles?: RelatedArticle[];
}

function BookmarkButton({ program, state }: { program: WaiverProgram; state: StateData }) {
  const { isSaved, toggleSave } = useSavedPrograms();
  const saved = isSaved(program.id);

  return (
    <button
      onClick={() =>
        toggleSave({
          programId: program.id,
          stateId: state.id,
          name: program.name,
          shortName: program.shortName,
          programType: program.programType,
          savingsRange: program.savingsRange || undefined,
        })
      }
      className="group p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={saved ? "Remove from saved programs" : "Save this program"}
      title={saved ? "Saved" : "Save program"}
    >
      <svg
        className={`w-5 h-5 transition-colors duration-150 ${
          saved ? "text-primary-600 fill-primary-600" : "text-gray-300 group-hover:text-gray-400"
        }`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={saved ? 0 : 1.5}
        fill={saved ? "currentColor" : "none"}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}

export function ProgramPageV3({ program, state, relatedArticles }: ProgramPageV3Props) {
  const programType = program.programType || "benefit";
  const isFederal = program.geographicScope?.type === "federal";
  const isResource = programType === "resource" || programType === "navigator";

  const tabs = getAvailableTabs(program);
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Structured data for FAQs */}
      {program.faqs && program.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: program.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            }),
          }}
        />
      )}

      {/* ─── Page header ─── */}
      <header className="relative pt-6 pb-8 md:pt-8 md:pb-10 overflow-hidden">
        <HeaderAccent />
        <div className="relative max-w-2xl mx-auto px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/senior-benefits" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
            <span>&#8250;</span>
            <Link href={`/senior-benefits/${state.id}`} className="hover:text-gray-600 transition-colors">{state.name}</Link>
            <span>&#8250;</span>
            <span className="text-gray-600">{program.shortName}</span>
          </nav>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <TypeBadge type={programType} />
            <ScopeBadge scope={isFederal ? "Federal" : "State"} />
          </div>

          {/* Title + bookmark */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-display-xs md:text-display-sm font-bold text-gray-900 font-serif leading-tight">
              <span className="relative inline">
                {program.name}
              </span>
            </h1>
            <BookmarkButton program={program} state={state} />
          </div>

          {/* Tagline */}
          {program.tagline && program.tagline !== program.description && (
            <p className="mt-3 text-gray-500 leading-relaxed">{program.tagline}</p>
          )}

          {/* Free service badge */}
          {!program.savingsRange && program.savingsSource === "Free service" && (
            <p className="mt-2 text-sm text-gray-400">Free — no cost to you</p>
          )}
        </div>
      </header>

      {/* ─── Tab navigation ─── */}
      {!isResource && <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* ─── Tab content ─── */}
      <main className="pt-8 pb-20">
        {isResource ? (
          <ResourceOnePager program={program} state={state} />
        ) : (
          <>
            {/* Render all tabs, hide inactive with CSS to preserve state (document checklist etc.) */}
            <div className={activeTab === "about" ? "" : "hidden"}><AboutTab program={program} state={state} /></div>
            {tabs.some((t) => t.id === "eligibility") && (
              <div className={activeTab === "eligibility" ? "" : "hidden"}><EligibilityTab program={program} /></div>
            )}
            {tabs.some((t) => t.id === "apply") && (
              <div className={activeTab === "apply" ? "" : "hidden"}><HowToApplyTab program={program} state={state} /></div>
            )}
            {tabs.some((t) => t.id === "resources") && (
              <div className={activeTab === "resources" ? "" : "hidden"}><ResourcesTab program={program} /></div>
            )}
          </>
        )}
        {/* Related Articles — shows when articles are available for this state/topic */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 lg:px-8 mt-16 pt-10 border-t border-gray-200">
            <SectionLabel>Related articles</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedArticles.map((article) => {
                const href = article.section
                  ? `/${article.section}/${article.slug}`
                  : `/research-and-press/${article.slug}`;
                return (
                  <Link
                    key={article.slug}
                    href={href}
                    className="group block"
                  >
                    {article.cover_image_url && (
                      <div className="rounded-xl overflow-hidden mb-3">
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="w-full aspect-[3/2] object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    {article.reading_time_minutes && (
                      <p className="text-xs text-gray-400 mt-1">
                        {article.reading_time_minutes} min read
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
