"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
import { Vault, Phone, Info, CaretDown, ArrowSquareOut, BookmarkSimple, CheckCircle, FileText, Clock, HourglassHigh, MapPin, ArrowsClockwise, Globe, ShareNetwork, Printer, Check, Stethoscope, House as HouseIcon, Wheelchair, Tooth, Eye, Car, FirstAid, Pill, HandCoins, Wrench, Users, Heart } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ProgramIcon } from "@/lib/program-icon";

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
    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 mb-3">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif leading-snug mb-1">
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
    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${styles[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide px-2.5 py-1 rounded-full border border-gray-200">
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
            <span className="text-gray-400 text-base ml-2">{stat.label}</span>
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
              <th className="px-5 py-3 text-left font-medium text-gray-500 text-[11px] uppercase tracking-wide">
                Household size
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500 text-[11px] uppercase tracking-wide">
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
                  <td className="px-5 py-3 text-gray-700 text-sm">
                    {row.householdSize}{" "}
                    {row.householdSize === 1 ? "person" : "people"}
                    {isHighlighted && (
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
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
          <Vault className="w-4 h-4 text-amber-600" aria-hidden="true" />
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
            What your parent can keep
          </p>
          <ul className="space-y-1">
            {limits.exemptAssets.map((a, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
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

function DocumentChecklist({ documents, heading, programName }: { documents: string[]; heading?: string; programName?: string }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const PREVIEW_COUNT = 3;
  const needsCollapse = documents.length > PREVIEW_COUNT + 1;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const progress = documents.length > 0 ? Math.round((checked.size / documents.length) * 100) : 0;
  const visibleDocs = needsCollapse && !expanded ? documents.slice(0, PREVIEW_COUNT) : documents;

  return (
    <div>
      {heading && (
        <p className="text-sm font-medium text-gray-900 mb-3">{heading}</p>
      )}

      {/* Progress bar + print */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-500 tabular-nums">
          {checked.size}/{documents.length}
        </span>
        <button
          onClick={() => {
            const printContent = documents.map((d, i) => `${checked.has(i) ? "☑" : "☐"} ${d}`).join("\n");
            const w = window.open("", "_blank");
            if (w) {
              w.document.write(`<pre style="font-family:system-ui;font-size:14px;line-height:2">${programName ? `Documents for ${programName}\n${"—".repeat(40)}\n\n` : ""}${printContent}</pre>`);
              w.document.close();
              w.print();
            }
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Print checklist"
          title="Print checklist"
        >
          <Printer className="w-4 h-4 text-gray-400 hover:text-gray-500" />
        </button>
      </div>

      <div className="relative">
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {visibleDocs.map((doc, i) => (
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

        {/* Gradient fade overlay when collapsed */}
        {needsCollapse && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-vanilla-100 via-vanilla-100/80 to-transparent rounded-b-xl pointer-events-none" />
        )}
      </div>

      {/* Show all / collapse toggle */}
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${documents.length} documents`}
        </button>
      )}

      {progress === 100 && (
        <p className="text-sm text-emerald-600 font-medium mt-3 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" weight="fill" /> All documents ready
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
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 hover:border-primary-200 hover:shadow-sm transition-all">
          <p className="font-medium text-gray-900 text-sm">{c.label}</p>
          {c.description && (
            <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
          )}
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
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
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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
              <CaretDown className="w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform duration-200 group-open:rotate-180" />
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

// --- Quick Eligibility Check (interactive) ---

function QuickEligibilityCheck({ elig }: { elig: StructuredEligibility }) {
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [result, setResult] = useState<"likely" | "unlikely" | "maybe" | null>(null);

  const handleCheck = () => {
    const ageNum = parseInt(age);
    const incomeNum = parseInt(income.replace(/[,$]/g, ""));
    if (isNaN(ageNum) || isNaN(incomeNum)) return;

    const ageReq = elig.ageRequirement;
    let ageOk = true;
    if (ageReq) {
      const ageMatch = ageReq.match(/(\d+)\+/);
      if (ageMatch && ageNum < parseInt(ageMatch[1])) ageOk = false;
    }

    let incomeOk = true;
    let incomeUnknown = false;
    if (elig.incomeTable && elig.incomeTable.length > 0) {
      const row1 = elig.incomeTable.find((r) => r.householdSize === 1);
      if (row1 && typeof row1.monthlyLimit === "number") {
        incomeOk = incomeNum <= row1.monthlyLimit;
      } else {
        incomeUnknown = true;
      }
    } else {
      const incomeLine = elig.summary.find((s) => /income|below|\$/i.test(s));
      if (incomeLine) {
        const limitMatch = incomeLine.match(/\$[\d,]+/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[0].replace(/[,$]/g, ""));
          incomeOk = incomeNum <= limit;
        } else { incomeUnknown = true; }
      } else { incomeUnknown = true; }
    }

    if (!ageOk) setResult("unlikely");
    else if (incomeUnknown) setResult("maybe");
    else if (!incomeOk) setResult("unlikely");
    else setResult("likely");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="font-semibold text-gray-900 mb-1">Quick eligibility check</p>
      <p className="text-sm text-gray-500 mb-4">Enter basic info for a rough estimate — not a guarantee.</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="elig-age" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Age</label>
          <input id="elig-age" type="number" value={age} onChange={(e) => { setAge(e.target.value); setResult(null); }} placeholder="65" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
        </div>
        <div className="flex-1">
          <label htmlFor="elig-income" className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Monthly income</label>
          <input id="elig-income" type="text" value={income} onChange={(e) => { setIncome(e.target.value); setResult(null); }} placeholder="$2,000" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
        </div>
        <div className="flex items-end">
          <button onClick={handleCheck} disabled={!age || !income} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">Check</button>
        </div>
      </div>
      {result === "likely" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200/50">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-sm font-medium text-emerald-800">You likely qualify based on age and income.</p>
            <p className="text-xs text-emerald-600 mt-0.5">Other factors (assets, residency, functional need) also apply. See full details below.</p>
          </div>
        </div>
      )}
      {result === "unlikely" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200/50">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">You may not meet the basic age or income requirements.</p>
            <p className="text-xs text-amber-600 mt-0.5">Some exceptions exist (disability, spend-down). Review the full criteria or call the program directly.</p>
          </div>
        </div>
      )}
      {result === "maybe" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200/50">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">We couldn&apos;t determine income limits for this program.</p>
            <p className="text-xs text-blue-600 mt-0.5">Age looks good. Contact the program directly to confirm income eligibility.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Coverage grid — "What's included" icon grid, extracted from intro/description
// ═══════════════════════════════════════════════════════════════════════════════

const COVERAGE_ICONS: Record<string, PhosphorIcon> = {
  medical: Stethoscope,
  doctor: Stethoscope,
  hospital: FirstAid,
  home: HouseIcon,
  attendant: Users,
  personal: Users,
  dental: Tooth,
  vision: Eye,
  transport: Car,
  prescription: Pill,
  equipment: Wheelchair,
  modification: Wrench,
  respite: Heart,
  financial: HandCoins,
};

function extractCoverageItems(program: WaiverProgram): { label: string; icon: PhosphorIcon }[] {
  // Parse coverage from intro + description + content sections
  const text = `${program.intro || ""} ${program.description || ""}`.toLowerCase();
  const items: { label: string; icon: PhosphorIcon }[] = [];
  const seen = new Set<string>();

  const patterns: [RegExp, string, string][] = [
    [/doctor visit|medical care|physician/i, "Doctor visits", "medical"],
    [/hospital/i, "Hospital care", "hospital"],
    [/personal attendant|attendant service|in-home care/i, "Personal attendants", "attendant"],
    [/home modification|adaptive aid|home repair/i, "Home modifications", "modification"],
    [/dental/i, "Dental care", "dental"],
    [/vision/i, "Vision care", "vision"],
    [/transport/i, "Transportation", "transport"],
    [/prescription|medication/i, "Prescriptions", "prescription"],
    [/medical equipment|wheelchair|durable medical/i, "Medical equipment", "equipment"],
    [/day program|adult day/i, "Day programs", "home"],
    [/respite/i, "Respite care", "respite"],
  ];

  for (const [regex, label, iconKey] of patterns) {
    if (regex.test(text) && !seen.has(iconKey)) {
      seen.add(iconKey);
      items.push({ label, icon: COVERAGE_ICONS[iconKey] || Stethoscope });
    }
  }

  return items;
}

function CoverageGrid({ items }: { items: { label: string; icon: PhosphorIcon }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary-600" weight="duotone" />
            </div>
            <span className="text-sm text-gray-700 leading-snug">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility: find related program slugs for linking
// ═══════════════════════════════════════════════════════════════════════════════

function findProgramSlug(name: string, state: StateData): string | null {
  const needle = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const p of state.programs) {
    const pName = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pShort = (p.shortName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (pName === needle || pShort === needle || pName.includes(needle) || needle.includes(pName)) {
      return p.id;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Resource One-Pager — for simple programs (hotlines, counseling, companion)
// No sections. Just what it is, who to call, where to go.
// ═══════════════════════════════════════════════════════════════════════════════

function ResourceOnePager({ program }: { program: WaiverProgram }) {
  const contacts = (program).contacts || [];

  return (
    <div className="space-y-8">
      {program.intro && (
        <div className="text-lg text-gray-600 leading-relaxed space-y-4">
          {program.intro.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {(program.phone || contacts.length > 0) && (
        <div className="rounded-2xl bg-primary-50/60 border border-primary-200/50 p-6">
          {contacts.length > 0 ? (
            <div className="space-y-4">
              {contacts.map((c, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-gray-900">{c.label}</p>
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="text-2xl font-bold text-primary-700 hover:text-primary-600 font-serif transition-colors">
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
              <a href={`tel:${program.phone}`} className="text-2xl font-bold text-primary-700 hover:text-primary-600 font-serif transition-colors">
                {program.phone}
              </a>
            </div>
          ) : null}
        </div>
      )}

      {program.contentSections && program.contentSections.length > 0 && (
        <div className="space-y-6">
          {program.contentSections.map((section, i) => (
            <RenderContentSection key={i} section={section} />
          ))}
        </div>
      )}

      {program.sourceUrl && (
        <div className="text-sm">
          <a href={program.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 font-medium underline underline-offset-2 decoration-primary-200 transition-colors inline-flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> Official source
          </a>
        </div>
      )}

      {program.faqs && program.faqs.length > 0 && (
        <FaqSection faqs={program.faqs} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section nav — sticky horizontal wayfinding (not tabs, no content hiding)
// ═══════════════════════════════════════════════════════════════════════════════

interface NavSection {
  id: string;
  label: string;
}

function SectionNav({ sections, activeId }: { sections: NavSection[]; activeId: string }) {
  return (
    <div className="sticky top-0 z-30 bg-vanilla-100/95 backdrop-blur-sm border-b border-gray-200/60">
      <nav className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide -mx-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeId === s.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

function useSectionObserver(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState(sectionIds[0] || "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionIds]);

  return activeId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component — single-scroll page. No tabs. Each section earns its space.
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
      onClick={() => toggleSave({ programId: program.id, stateId: state.id, name: program.name, shortName: program.shortName, programType: program.programType, savingsRange: program.savingsRange || undefined })}
      className="group p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={saved ? "Remove from saved programs" : "Save this program"}
      title={saved ? "Saved" : "Save program"}
    >
      <BookmarkSimple className={`w-5 h-5 transition-colors duration-150 ${saved ? "text-primary-600" : "text-gray-300 group-hover:text-gray-400"}`} weight={saved ? "fill" : "regular"} />
    </button>
  );
}

export function ProgramPageV3({ program, state, relatedArticles }: ProgramPageV3Props) {
  const programType = program.programType || "benefit";
  const isFederal = program.geographicScope?.type === "federal";
  const isResource = programType === "resource" || programType === "navigator";
  const [copied, setCopied] = useState(false);

  const elig = program.structuredEligibility;
  const guide = program.applicationGuide;
  const documents = program.documentsNeeded || [];
  const applicationNotes = program.applicationNotes || [];
  const contacts = program.contacts || [];
  const relatedPrograms = program.relatedPrograms || [];
  const coverageItems = extractCoverageItems(program);

  // Build section nav items based on available data
  const navSections: NavSection[] = [];
  if (!isResource) {
    navSections.push({ id: "overview", label: "Overview" });
    if (elig) navSections.push({ id: "eligibility", label: "Eligibility" });
    if (guide) navSections.push({ id: "how-to-apply", label: "How to Apply" });
    if (contacts.length > 0 || program.phone || program.sourceUrl) navSections.push({ id: "contact", label: "Contact" });
    if (program.faqs && program.faqs.length > 0) navSections.push({ id: "faq", label: "FAQ" });
  }
  const sectionIds = navSections.map((s) => s.id);
  const activeSection = useSectionObserver(sectionIds);

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Structured data */}
      {program.faqs && program.faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: program.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }) }} />
      )}

      {/* ─── 1. Hero ─── */}
      <header className="relative pt-6 pb-10 md:pt-8 md:pb-14 overflow-hidden">
        <HeaderAccent />
        <div className="relative max-w-2xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
            <Link href="/senior-benefits" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
            <span>›</span>
            <Link href={`/senior-benefits/${state.id}`} className="hover:text-gray-600 transition-colors">{state.name}</Link>
            <span>›</span>
            <span className="text-gray-600">{program.shortName}</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-display-sm md:text-display-md font-bold text-gray-900 font-serif leading-tight">
                <span className="relative inline">
                  {program.shortName || program.name}
                  <HandDrawnUnderline />
                </span>
              </h1>
              {program.tagline && program.tagline !== program.description && (
                <p className="mt-4 text-lg text-gray-500 leading-relaxed max-w-xl">{program.tagline}</p>
              )}
              {program.savingsRange ? (
                <p className="mt-3 text-sm text-gray-500">
                  Estimated savings: <span className="font-semibold text-gray-700">{program.savingsRange}</span>
                  {program.savingsSource && program.savingsSource !== "Free service" && (
                    <span className="text-gray-400 ml-1">({program.savingsSource})</span>
                  )}
                </p>
              ) : program.savingsSource === "Free service" ? (
                <p className="mt-3 text-sm font-medium text-emerald-600">Free — no cost to you</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-2">
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: program.name, url: window.location.href });
                  } else if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="group p-2 -m-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Share this program"
                title={copied ? "Link copied!" : "Share"}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" weight="bold" /> : <ShareNetwork className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />}
              </button>
              <BookmarkButton program={program} state={state} />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Section nav ─── */}
      {navSections.length > 0 && <SectionNav sections={navSections} activeId={activeSection} />}

      <main className="pb-24 pt-8">
        {isResource ? (
          <div className="max-w-2xl mx-auto px-6 lg:px-8">
            <ResourceOnePager program={program} />
          </div>
        ) : (
          <>
            {/* ─── 2. Quick eligibility check ─── */}
            {elig && (
              <section id="overview" className="max-w-3xl mx-auto px-6 lg:px-8 mb-16 scroll-mt-20">
                <QuickEligibilityCheck elig={elig} />
              </section>
            )}

            {/* ─── 3. Intro prose ─── */}
            {program.intro && (
              <section className="max-w-2xl mx-auto px-6 lg:px-8 mb-16">
                <div className="text-lg text-gray-600 leading-relaxed space-y-4">
                  {program.intro.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 5. What's covered (icon grid + prose context) ─── */}
            {coverageItems.length > 0 && (
              <section className="max-w-3xl mx-auto px-6 lg:px-8 mb-16">
                <SectionLabel>What&apos;s covered</SectionLabel>
                <CoverageGrid items={coverageItems} />
                {/* Content sections that aren't callouts — tier comparisons, prose expansions */}
                {program.contentSections && program.contentSections.filter((s) => s.type !== "callout").length > 0 && (
                  <div className="mt-8 max-w-2xl space-y-6">
                    {program.contentSections.filter((s) => s.type !== "callout").map((section, i) => (
                      <RenderContentSection key={i} section={section} />
                    ))}
                  </div>
                )}
              </section>
            )}

            <WavyDivider className="my-16 max-w-3xl mx-auto px-6" />

            {/* ─── 6. Eligibility details ─── */}
            {elig && (
              <section id="eligibility" className="max-w-2xl mx-auto px-6 lg:px-8 mb-16 space-y-10 scroll-mt-20">
                <div>
                  <SectionLabel>Eligibility details</SectionLabel>
                  <SectionHeading>Do you qualify?</SectionHeading>
                  <p className="text-gray-500 mt-1">Full requirements for this program.</p>
                </div>

                {/* Income table — wider */}
                {elig.incomeTable && elig.incomeTable.filter((r) => typeof r.monthlyLimit === "number" && typeof r.householdSize === "number").length > 0 && (
                  <div className="max-w-3xl">
                    <IncomeTable
                      rows={elig.incomeTable.filter((r) => typeof r.monthlyLimit === "number" && typeof r.householdSize === "number")}
                      heading="Income limits by household size"
                      footnote={elig.povertyLevelReference || undefined}
                    />
                  </div>
                )}

                {/* Asset limits */}
                {elig.assetLimits && (
                  <div>
                    <SectionLabel>Asset limits</SectionLabel>
                    <AssetLimitsDisplay limits={elig.assetLimits} />
                  </div>
                )}

                {/* Functional requirement */}
                {elig.functionalRequirement && (
                  <div>
                    <SectionLabel>Medical / functional requirement</SectionLabel>
                    <div className="p-4 rounded-xl bg-primary-50/40 border-l-2 border-primary-400">
                      <p className="text-sm text-gray-700 leading-relaxed">{elig.functionalRequirement}</p>
                    </div>
                  </div>
                )}

                {/* Other requirements */}
                {elig.otherRequirements && elig.otherRequirements.length > 0 && (
                  <div>
                    <SectionLabel>Other requirements</SectionLabel>
                    <ul className="space-y-2">
                      {elig.otherRequirements.map((r, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-2" />
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* ─── 7. How to apply — background shift for zone change ─── */}
            {guide && (
              <section id="how-to-apply" className="scroll-mt-20 mb-16">
                <div className="bg-vanilla-200/30 py-14">
                  <div className="max-w-2xl mx-auto px-6 lg:px-8 space-y-10">
                <div>
                  <SectionLabel>Application process</SectionLabel>
                  <SectionHeading>How to apply</SectionHeading>
                  <p className="text-lg text-gray-600 leading-relaxed mt-2">{guide.summary}</p>
                  {guide.tip && (
                    <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-lg bg-primary-50/40 border-l-2 border-primary-400">
                      <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 leading-relaxed">{guide.tip}</p>
                    </div>
                  )}
                </div>

                {/* Document checklist — wider, it's a tool */}
                {documents.length > 0 && (
                  <div className="max-w-3xl">
                    <SectionLabel>Documents you&apos;ll need</SectionLabel>
                    <DocumentChecklist documents={documents} programName={program.name} />
                  </div>
                )}

                {/* Application notes */}
                {applicationNotes.length > 0 && (
                  <ApplicationNotes notes={applicationNotes} />
                )}

                {/* Step journey */}
                {guide.steps && guide.steps.length > 0 && (
                  <div>
                    <SectionLabel>Steps to apply</SectionLabel>
                    <StepJourney steps={guide.steps} />
                  </div>
                )}

                {/* Processing time / waitlist */}
                {(guide.processingTime || guide.waitlist) && (
                  <div className={`grid gap-3 max-w-3xl ${guide.processingTime && guide.waitlist ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {guide.processingTime && (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">Processing time</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{guide.processingTime}</p>
                        </div>
                      </div>
                    )}
                    {guide.waitlist && (
                      <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <HourglassHigh className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-0.5">Waitlist</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{guide.waitlist}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Application URLs */}
                {guide.urls && guide.urls.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {guide.urls.map((u, i) => (
                      <a key={i} href={u.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                        {u.label}
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                )}
                  </div>
                </div>
              </section>
            )}

            {/* Service areas map — widest moment */}
            {program.serviceAreas && program.serviceAreas.length > 0 && (
              <section className="max-w-5xl mx-auto px-6 lg:px-8 mb-16">
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
                          <a href={`tel:${program.phone}`} className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">Call {program.phone}</a>
                        </div>
                      )}
                    </div>
                    <div className="border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50">
                      <ServiceAreasMap stateId={state.id} areas={program.serviceAreas} mapPins={program.mapPins} programName={program.name} noWrapper />
                    </div>
                  </div>
                </div>
              </section>
            )}

            <WavyDivider className="my-16 max-w-3xl mx-auto px-6" />

            {/* ─── 9. Contact block — warm, prominent ─── */}
            {(contacts.length > 0 || program.phone || program.sourceUrl) && (
              <section id="contact" className="max-w-3xl mx-auto px-6 lg:px-8 mb-16 scroll-mt-20">
                <div className="rounded-2xl bg-vanilla-200/60 border border-vanilla-300/50 p-6 md:p-8 space-y-6">
                  {contacts.length > 0 ? (
                    <div>
                      <SectionLabel>Get in touch</SectionLabel>
                      <ContactCards contacts={contacts} />
                    </div>
                  ) : program.phone ? (
                    <div>
                      <SectionLabel>Contact</SectionLabel>
                      <a href={`tel:${program.phone}`} className="inline-flex items-center gap-2 text-xl font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                        <Phone className="w-5 h-5" />
                        {program.phone}
                      </a>
                    </div>
                  ) : null}

                  {program.sourceUrl && (
                    <div>
                      <a href={program.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 underline underline-offset-2 decoration-primary-200 transition-colors">
                        <Globe className="w-4 h-4" /> Visit official program page
                      </a>
                      {program.lastVerifiedDate && (
                        <p className="text-xs text-gray-400 mt-1">Last verified {program.lastVerifiedDate}</p>
                      )}
                    </div>
                  )}

                  {/* Application forms */}
                  {program.forms && program.forms.length > 0 && (
                    <div>
                      <SectionLabel>Application forms</SectionLabel>
                      <div className="space-y-2">
                        {program.forms.map((form) => (
                          <a key={form.id} href={form.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition-all group">
                            <p className="font-medium text-sm text-gray-900 group-hover:text-primary-700 transition-colors flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                              {form.name}
                            </p>
                            {form.description && <p className="text-xs text-gray-500 mt-0.5 pl-5.5">{form.description}</p>}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ─── 10. Related programs ─── */}
            {relatedPrograms.length > 0 && (
              <section className="max-w-2xl mx-auto px-6 lg:px-8 mb-16">
                <SectionLabel>Related programs</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {relatedPrograms.map((name, i) => {
                    const slug = findProgramSlug(name, state);
                    return slug ? (
                      <Link key={i} href={`/senior-benefits/${state.id}/${slug}`} className="text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
                        {name}
                      </Link>
                    ) : (
                      <span key={i} className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">{name}</span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ─── 11. Things to know (callouts) ─── */}
            {program.contentSections && program.contentSections.filter((s) => s.type === "callout").length > 0 && (
              <section className="max-w-2xl mx-auto px-6 lg:px-8 mb-16">
                <SectionLabel>Things to know</SectionLabel>
                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  {program.contentSections.filter((s) => s.type === "callout").map((section, i) => (
                    <p key={i}>{"text" in section ? String(section.text) : ""}</p>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 12. FAQs ─── */}
            {program.faqs && program.faqs.length > 0 && (
              <section id="faq" className="max-w-2xl mx-auto px-6 lg:px-8 mb-16 scroll-mt-20">
                <FaqSection faqs={program.faqs} />
              </section>
            )}
          </>
        )}

        {/* ─── 13. Related articles ─── */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 lg:px-8 pt-10 border-t border-gray-200">
            <SectionLabel>Related articles</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedArticles.map((article) => {
                const href = article.section ? `/${article.section}/${article.slug}` : `/research-and-press/${article.slug}`;
                return (
                  <Link key={article.slug} href={href} className="group block">
                    {article.cover_image_url && (
                      <div className="rounded-xl overflow-hidden mb-3">
                        <img src={article.cover_image_url} alt={article.title} className="w-full aspect-[3/2] object-cover group-hover:opacity-90 transition-opacity" />
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug">{article.title}</h3>
                    {article.reading_time_minutes && <p className="text-xs text-gray-400 mt-1">{article.reading_time_minutes} min read</p>}
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
