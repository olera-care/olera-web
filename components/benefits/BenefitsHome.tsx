import Link from "next/link";
import type { WaiverProgram } from "@/data/waiver-library";
import { CARE_NEED_LABEL, type CareNeed } from "@/lib/benefits/match-care-need";
import type { FirstStepPick, BenefitsCascadeMeta } from "@/lib/family-comms/benefits-cascade.server";

/**
 * BenefitsHome — the /m/{token} results page, rebuilt as a guide instead of a
 * directory (plans/benefits-results-home.md, TJ 2026-07-28).
 *
 * Structure mirrors the provider "Your profile" page's DNA: personal greeting +
 * recognition of what we know, ONE warm hero card with one action (the
 * ten-minute first step, same selection + script as the day-2 email), a small
 * progress strip, then the other matches grouped by job and collapsed. The
 * flat 11-card wall answered "what exists"; this answers "what should I do".
 *
 * Server component, zero client JS: collapse uses native <details>, the call
 * action is a tel: link. The in-session overlay keeps the old ResultsSheet.
 */

export interface BenefitsHomeProps {
  firstName: string | null;
  stateName: string;
  stateSlug: string;
  careNeed: CareNeed;
  /** Display value, e.g. "Parent" | "Spouse" | "Self" | "Family member". */
  relationship: string | null;
  /** e.g. "asap" | "within_month" — humanized in the chip row. */
  timeline: string | null;
  payments: string[] | null;
  matches: WaiverProgram[];
  firstStep: FirstStepPick | null;
  callScript: string | null;
  cascade: BenefitsCascadeMeta;
}

const TIMELINE_LABELS: Record<string, string> = {
  asap: "Care needed soon",
  immediate: "Care needed soon",
  within_month: "Within a month",
  within_1_month: "Within a month",
  few_months: "In a few months",
  within_3_months: "In a few months",
  researching: "Planning ahead",
  exploring: "Planning ahead",
};

function relationshipChip(rel: string | null): string | null {
  if (!rel) return null;
  const v = rel.toLowerCase();
  if (v === "self" || v === "myself") return "Care for yourself";
  if (v.includes("parent")) return "Caring for a parent";
  if (v.includes("spouse")) return "Caring for a spouse";
  return "Caring for family";
}

/** Group the non-hero matches by the job they do for the family. Keyword
 *  classifier over name + tagline — same spirit as paysForCare() in the
 *  guidance module; precision matters less than not showing a wall. */
function groupLabel(p: WaiverProgram): string {
  const text = `${p.name} ${p.shortName || ""} ${p.tagline || ""}`.toLowerCase();
  if (/(snap|food|meal|grocer|nutrition)/.test(text)) return "Food & groceries";
  if (/(liheap|energy|weatheriz|utility|heating|cooling|phone|internet|lifeline)/.test(text))
    return "Home & utility bills";
  if (/(waiver|hcbs|pace|personal care|attendant|respite|adult day|nursing|assisted living|in-home|home care|long-term care)/.test(text))
    return "Help paying for care";
  if (/(medicare|medicaid|prescription|drug|health|ship|insurance|premium)/.test(text))
    return "Health coverage & costs";
  return "More support";
}

const GROUP_ORDER = [
  "Help paying for care",
  "Health coverage & costs",
  "Home & utility bills",
  "Food & groceries",
  "More support",
];

function savingsLine(range?: string): string | null {
  if (!range) return null;
  const m = range.match(/\$[\d,]+/g);
  if (!m || m.length === 0) return null;
  return `Up to ${m[m.length - 1]}${/\bmo\b|month/i.test(range) ? "/mo" : "/yr"}`;
}

/** Drop a trailing "(WAP)"-style parenthetical from the hero title. */
function stripParen(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "");
}

/** Draft `hours` values are free text; some are sentinels like "Contact for
 *  hours" that read as broken copy when rendered as hours. Only show values
 *  that look like actual hours. */
function looksLikeHours(h: string): boolean {
  return /\d|am|pm|mon|tue|wed|thu|fri|sat|sun|daily|hour|weekday/i.test(h) && !/contact/i.test(h);
}

/** Doc strings carry long parentheticals ("(pay stubs, Social Security award
 *  letter, pension statements)") that turn checklist rows into paragraphs on
 *  a phone. The page trims them; the full detail lives in the program guide. */
function trimDoc(d: string): string {
  return d.replace(/\s*\([^)]*\)/g, "").trim();
}

export default function BenefitsHome(props: BenefitsHomeProps) {
  const {
    firstName,
    stateName,
    stateSlug,
    careNeed,
    relationship,
    timeline,
    payments,
    matches,
    firstStep,
    callScript,
    cascade,
  } = props;

  const careLabel = CARE_NEED_LABEL[careNeed] || null;
  const chips = [
    stateName,
    careLabel ? careLabel.charAt(0).toUpperCase() + careLabel.slice(1) : null,
    relationshipChip(relationship),
    timeline ? TIMELINE_LABELS[timeline] || null : null,
    payments && payments.length ? payments.join(", ") : null,
  ].filter(Boolean) as string[];

  const others = matches.filter((p) => p.id !== firstStep?.programId);
  const grouped = new Map<string, WaiverProgram[]>();
  for (const p of others) {
    const g = groupLabel(p);
    grouped.set(g, [...(grouped.get(g) || []), p]);
  }
  const groups = GROUP_ORDER.filter((g) => grouped.has(g)).map((g) => ({
    label: g,
    programs: grouped.get(g)!,
  }));

  // Progress: matched is always done; first step advances with the cascade.
  const stepState =
    cascade.outcome === "moving"
      ? 3
      : cascade.first_step_sent_at || firstStep
        ? 2
        : 1;

  const phoneHref = firstStep ? `tel:${firstStep.contact.phone.replace(/[^\d+]/g, "")}` : "";

  // The hero needs its "why": drafts often lack a savings range (WAP in GA),
  // but the matched program data usually carries one. Draft wins, match fills.
  const heroMatch = firstStep ? matches.find((p) => p.id === firstStep.programId) : null;
  const heroSavings = firstStep?.savingsRange
    ? `Typically ${firstStep.savingsRange}`
    : savingsLine(heroMatch?.savingsRange);

  return (
    <main className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-xl px-5 py-8 sm:py-12">
        {/* ── Recognition ─────────────────────────────────────────────── */}
        <h1 className="font-serif text-[28px] font-bold leading-tight text-gray-900">
          {firstName ? `Hi ${firstName},` : "Hello,"} here&apos;s your plan.
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
          Based on what you shared with us:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-700"
            >
              {c}
            </span>
          ))}
        </div>

        {/* ── Progress strip ──────────────────────────────────────────── */}
        <div className="mt-7 flex items-center gap-2 text-[12px] font-medium">
          {["Matched", "First step", "In motion"].map((label, i) => {
            const n = i + 1;
            const done = n < stepState;
            const active = n === stepState;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6 bg-gray-300" />}
                <span
                  className={
                    done
                      ? "text-emerald-700"
                      : active
                        ? "rounded-full bg-gray-900 px-2.5 py-1 text-white"
                        : "text-gray-400"
                  }
                >
                  {done ? "✓ " : ""}
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Start here (the hero holds ONLY the decision + the action;
               support content lives on the light page below) ─────────── */}
        {firstStep ? (
          <>
            <section className="mt-5 rounded-2xl bg-[#33261e] p-6 text-[#f7f3ee] shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c9b8a8]">
                Start here
              </p>
              <h2 className="mt-1.5 font-serif text-[22px] font-bold leading-snug">
                {stripParen(firstStep.name)}
              </h2>
              {heroSavings && (
                <p className="mt-1 text-[14px] font-semibold text-emerald-300">{heroSavings}</p>
              )}
              <p className="mt-3 text-[15px] leading-relaxed text-[#e8e0d6]">
                Apply by phone in about ten minutes.
              </p>
              <p className="mt-3 text-[13px] text-[#c9b8a8]">{stripParen(firstStep.contact.label)}</p>
              <a
                href={phoneHref}
                className="mt-2 block rounded-xl bg-[#f7f3ee] px-5 py-3.5 text-center text-[16px] font-bold text-[#33261e] transition-opacity hover:opacity-90"
              >
                Call {firstStep.contact.phone}
              </a>
              {firstStep.contact.hours && looksLikeHours(firstStep.contact.hours) && (
                <p className="mt-2 text-center text-[13px] text-[#c9b8a8]">{firstStep.contact.hours}</p>
              )}
            </section>

            {/* Support content — light, scannable, out of the hero */}
            {callScript && (
              <details className="mt-5 border-b border-gray-200 pb-4">
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  What to say when they answer <span className="text-gray-400">›</span>
                </summary>
                <p className="mt-2 border-l-2 border-gray-300 pl-3 text-[14px] leading-relaxed text-gray-600">
                  &ldquo;{callScript}&rdquo;
                </p>
              </details>
            )}
            {firstStep.documents.length > 0 && (
              <div className="mt-5">
                <p className="text-[15px] font-semibold text-gray-900">Have these nearby, if you can</p>
                <ul className="mt-2 space-y-1.5">
                  {firstStep.documents.map((d) => (
                    <li key={d} className="text-[14px] leading-relaxed text-gray-600">
                      <span className="text-emerald-700">&#10003;</span>&nbsp; {trimDoc(d)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] text-gray-400">
                  You can still call if you don&apos;t have everything.
                </p>
              </div>
            )}
            <Link
              href={firstStep.programPath}
              className="mt-4 inline-block text-[14px] font-semibold text-primary-700 underline underline-offset-2"
            >
              See the full guide for {firstStep.shortName}
            </Link>
          </>
        ) : (
          matches[0] && (
            <section className="mt-5 rounded-2xl bg-[#33261e] p-6 text-[#f7f3ee] shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c9b8a8]">
                Start here
              </p>
              <h2 className="mt-1.5 font-serif text-[22px] font-bold leading-snug">
                {matches[0].name}
              </h2>
              {matches[0].tagline && (
                <p className="mt-2 text-[14px] leading-relaxed text-[#d8ccc0]">{matches[0].tagline}</p>
              )}
              <Link
                href={`/benefits/${stateSlug}/${matches[0].id}`}
                className="mt-4 block rounded-xl bg-[#f7f3ee] px-5 py-3.5 text-center text-[16px] font-bold text-[#33261e] transition-opacity hover:opacity-90"
              >
                See how to apply
              </Link>
            </section>
          )
        )}

        {/* ── The rest, held not shouted ──────────────────────────────── */}
        {groups.length > 0 && (
          <section className="mt-9">
            <h3 className="font-serif text-[19px] font-semibold text-gray-900">
              Your other {others.length} {others.length === 1 ? "match" : "matches"}
            </h3>
            <p className="mt-1 text-[14px] text-gray-500">
              We&apos;re holding these for you. Start with the one above; these will still be here.
            </p>
            <div className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
              {groups.map((g) => (
                <details key={g.label} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[15px] font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    <span>
                      {g.label}
                      <span className="ml-2 text-[13px] font-normal text-gray-400">
                        {g.programs.length}
                      </span>
                    </span>
                    <span className="text-gray-400 transition-transform group-open:rotate-90">›</span>
                  </summary>
                  <ul className="space-y-3 pb-4">
                    {g.programs.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/benefits/${stateSlug}/${p.id}`}
                          className="block"
                        >
                          <span className="text-[15px] font-medium text-gray-900 hover:text-primary-700">
                            {p.shortName || p.name}
                          </span>
                          {savingsLine(p.savingsRange) && (
                            <span className="ml-2 text-[13px] font-medium text-emerald-700">
                              {savingsLine(p.savingsRange)}
                            </span>
                          )}
                          {p.tagline && (
                            <span className="mt-0.5 block text-[13px] leading-snug text-gray-500">
                              {p.tagline}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Quiet human line ────────────────────────────────────────── */}
        <p className="mt-9 text-[14px] leading-relaxed text-gray-500">
          Not sure where to start? Email{" "}
          <a href="mailto:support@olera.care" className="font-medium text-primary-700">
            support@olera.care
          </a>{" "}
          and a real person will point you the right way.
        </p>
      </div>
    </main>
  );
}
