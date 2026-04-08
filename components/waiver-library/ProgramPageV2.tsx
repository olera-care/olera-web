"use client";

import Link from "next/link";
import type {
  WaiverProgram,
  StateData,
  ContentSection,
  ApplicationGuide,
  StructuredEligibility,
} from "@/data/waiver-library";
import { ServiceAreasMap } from "@/components/waiver-library/ServiceAreasMapLoader";
import { CityBadge } from "@/components/waiver-library/CityBadge";

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
      {children}
    </p>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    benefit: "bg-emerald-50 text-emerald-600",
    resource: "bg-blue-50 text-blue-600",
    navigator: "bg-violet-50 text-violet-600",
    employment: "bg-amber-50 text-amber-600",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[type] || "bg-gray-100 text-gray-500"}`}>
      {type}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2 py-0.5 rounded-full border border-gray-200">
      {scope}
    </span>
  );
}

// ─── Eligibility Section ───────────────────────────────────────────────────

function EligibilitySection({ eligibility }: { eligibility: StructuredEligibility }) {
  return (
    <div className="space-y-6">
      {/* Summary bullets */}
      <ul className="space-y-2">
        {eligibility.summary.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-gray-700">
            <span className="text-emerald-500 mt-1 text-sm shrink-0">&#10003;</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>

      {/* Income table */}
      {eligibility.incomeTable && eligibility.incomeTable.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Income limits by household size</p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Household</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Monthly limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eligibility.incomeTable.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-700">{row.householdSize} {row.householdSize === 1 ? "person" : "people"}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">${row.monthlyLimit.toLocaleString()}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset limits */}
      {eligibility.assetLimits && (
        <div className="text-sm text-gray-700 leading-relaxed space-y-2">
          <p>
            <span className="font-medium text-gray-900">Assets must be under ${(eligibility.assetLimits.individual || 0).toLocaleString()}</span>
            {eligibility.assetLimits.couple && <> (${eligibility.assetLimits.couple.toLocaleString()} for couples)</>}
            {" — "}but not everything counts.
          </p>
          {eligibility.assetLimits.exemptAssets && eligibility.assetLimits.exemptAssets.length > 0 && (
            <p>
              <span className="font-medium text-gray-900">Your parent can keep</span> their {eligibility.assetLimits.exemptAssets.map((a, i) => (
                <span key={i}>{i > 0 && (i === eligibility.assetLimits!.exemptAssets!.length - 1 ? ", and " : ", ")}{a.toLowerCase()}</span>
              ))}.
              {eligibility.assetLimits.homeEquityCap && <> Home equity is exempt up to ${eligibility.assetLimits.homeEquityCap.toLocaleString()}.</>}
            </p>
          )}
          {eligibility.assetLimits.countedAssets && eligibility.assetLimits.countedAssets.length > 0 && (
            <p className="text-gray-500">
              What does count: {eligibility.assetLimits.countedAssets.map((a) => a.toLowerCase()).join(", ")}.
            </p>
          )}
        </div>
      )}

      {/* Functional requirement callout */}
      {eligibility.functionalRequirement && (
        <div className="p-3.5 rounded-lg bg-blue-50/60 border-l-2 border-blue-400">
          <p className="text-sm text-gray-700 leading-relaxed">{eligibility.functionalRequirement}</p>
        </div>
      )}
    </div>
  );
}

// ─── Application Guide ─────────────────────────────────────────────────────

function ApplicationSection({ guide }: { guide: ApplicationGuide }) {
  return (
    <div className="space-y-4">
      <p className="text-base text-gray-700 leading-relaxed">{guide.summary}</p>

      {guide.steps && guide.steps.length > 0 && (
        <ol className="space-y-4">
          {guide.steps.map((step) => (
            <li key={step.step} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold shrink-0 mt-0.5">
                {step.step}
              </span>
              <div>
                <p className="font-medium text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Timeline, waitlist, and tip as a single quiet block */}
      {(guide.processingTime || guide.waitlist || guide.tip) && (
        <div className="text-sm text-gray-600 leading-relaxed space-y-1.5 pt-1">
          {guide.processingTime && (
            <p>{guide.processingTime}{guide.waitlist ? `. ${guide.waitlist}.` : ""}</p>
          )}
          {!guide.processingTime && guide.waitlist && (
            <p>{guide.waitlist}</p>
          )}
          {guide.tip && (
            <p className="text-gray-500 italic">{guide.tip}</p>
          )}
        </div>
      )}

      {/* Application URLs */}
      {guide.urls && guide.urls.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {guide.urls.map((u, i) => (
            <a
              key={i}
              href={u.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 underline underline-offset-2 decoration-primary-200 transition-colors"
            >
              {u.label} &#8599;
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Content Sections ──────────────────────────────────────────────────────

function RenderContentSection({ section }: { section: ContentSection }) {
  if (section.type === "callout" && "text" in section) {
    const borderColor = {
      warning: "border-amber-400 bg-amber-50/60",
      tip: "border-blue-400 bg-blue-50/60",
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
            <div key={i} className="p-4 rounded-lg border border-gray-200">
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

  if (section.type === "documents" && "categories" in section) {
    const cats = section.categories as { name: string; items: string[] }[];
    return (
      <div>
        {section.heading && <p className="text-sm font-medium text-gray-900 mb-3">{section.heading}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cats.map((cat, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{cat.name}</p>
              <ul className="space-y-1">
                {cat.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5 shrink-0">&#8226;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "county-directory" && "offices" in section) {
    const offices = section.offices as { name: string; type: string; phone?: string; address?: string; url?: string }[];
    return (
      <div>
        {section.heading && <p className="text-sm font-medium text-gray-900 mb-3">{section.heading}</p>}
        <div className="space-y-2">
          {offices.map((office, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{office.name}</p>
                {office.address && <p className="text-xs text-gray-500 mt-0.5">{office.address}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {office.phone && (
                  <a href={`tel:${office.phone}`} className="text-xs text-primary-600 hover:text-primary-500 font-medium">
                    {office.phone}
                  </a>
                )}
                {office.url && (
                  <a href={office.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600">
                    &#8599;
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "income-table" && "rows" in section) {
    const rows = section.rows as { householdSize: number; monthlyLimit: number }[];
    return (
      <div>
        {section.heading && <p className="text-sm font-medium text-gray-900 mb-2">{section.heading}</p>}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Household</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Monthly limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-700">{row.householdSize} {row.householdSize === 1 ? "person" : "people"}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">${row.monthlyLimit.toLocaleString()}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {"footnote" in section && section.footnote && (
          <p className="text-xs text-gray-400 mt-1.5">{String(section.footnote)}</p>
        )}
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

  return null;
}

// ─── Main Component ────────────────────────────────────────────────────────

interface ProgramPageV2Props {
  program: WaiverProgram;
  state: StateData;
}

export function ProgramPageV2({ program, state }: ProgramPageV2Props) {
  const isFederal = program.geographicScope?.type === "federal";
  const programType = program.programType || "benefit";

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Structured data */}
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
      <header className="pt-6 pb-8 md:pt-8 md:pb-12">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link href="/waiver-library" className="hover:text-gray-600 transition-colors">Benefits Hub</Link>
            <span>&#8250;</span>
            <Link href={`/waiver-library/${state.id}`} className="hover:text-gray-600 transition-colors">{state.name}</Link>
            <span>&#8250;</span>
            <span className="text-gray-600">{program.shortName}</span>
          </nav>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <TypeBadge type={programType} />
            <ScopeBadge scope={isFederal ? "Federal" : "State"} />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">
            {program.name}
          </h1>

          {/* Savings — quiet, not a hero element */}
          {program.savingsRange && (
            <p className="mt-3 text-gray-500">
              Estimated savings: <span className="font-medium text-gray-700">{program.savingsRange}</span>
              {program.savingsSource && program.savingsSource !== "Free service" && (
                <span className="text-xs text-gray-400 ml-1.5">({program.savingsSource})</span>
              )}
            </p>
          )}
          {!program.savingsRange && program.savingsSource === "Free service" && (
            <p className="mt-3 text-sm text-gray-400">Free — no cost to you</p>
          )}
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="pb-20">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 space-y-12">

          {/* Intro */}
          {program.intro && (
            <section>
              <div className="text-lg text-gray-600 leading-relaxed space-y-4">
                {program.intro.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Eligibility */}
          {program.structuredEligibility && (
            <section>
              <SectionLabel>Eligibility</SectionLabel>
              <EligibilitySection eligibility={program.structuredEligibility} />
            </section>
          )}

          {/* How to apply */}
          {program.applicationGuide && (
            <section>
              <SectionLabel>How to apply</SectionLabel>
              <ApplicationSection guide={program.applicationGuide} />
            </section>
          )}

          {/* Content sections */}
          {program.contentSections && program.contentSections.length > 0 && (() => {
            // Group consecutive callouts into a single "Things to know" section
            const callouts = program.contentSections!.filter((s) => s.type === "callout");
            const nonCallouts = program.contentSections!.filter((s) => s.type !== "callout");

            return (
              <>
                {nonCallouts.map((section, i) => (
                  <section key={`nc-${i}`}>
                    <RenderContentSection section={section} />
                  </section>
                ))}
                {callouts.length > 0 && (
                  <section>
                    <SectionLabel>Things to know</SectionLabel>
                    <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                      {callouts.map((section, i) => (
                        <p key={i}>{"text" in section ? String(section.text) : ""}</p>
                      ))}
                    </div>
                  </section>
                )}
              </>
            );
          })()}

          {/* Source + contact */}
          {(program.sourceUrl || program.phone) && (
            <section className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {program.sourceUrl && (
                <a
                  href={program.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 font-medium underline underline-offset-2 decoration-primary-200 transition-colors"
                >
                  Official source &#8599;
                </a>
              )}
              {program.phone && (
                <a href={`tel:${program.phone}`} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  {program.phone}
                </a>
              )}
              {program.lastVerifiedDate && (
                <span className="text-xs text-gray-400">
                  Verified {program.lastVerifiedDate}
                </span>
              )}
            </section>
          )}

          {/* FAQs */}
          {program.faqs && program.faqs.length > 0 && (
            <section className="pt-4">
              <SectionLabel>Common questions</SectionLabel>
              <div className="space-y-0 divide-y divide-gray-200">
                {program.faqs.map((faq, i) => (
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
            </section>
          )}
        </div>

        {/* Service areas — wider container for map */}
        {program.serviceAreas && program.serviceAreas.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 lg:px-8 mt-12">
            <div className="max-w-2xl mb-6">
              <SectionLabel>Service areas</SectionLabel>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
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
          </div>
        )}
      </main>
    </div>
  );
}
