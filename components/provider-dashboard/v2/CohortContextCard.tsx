"use client";

import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar C — Cohort context, reframed.
 *
 * "Families like you searched for X near Y this month" — uses the same
 * geographic-radius cohort data as the onboard teaser, but reframes for
 * the logged-in provider dashboard. Softer, more contextual than "you
 * vs. peers."
 *
 * Hides entirely when cohort is too small / sparse — patient framing
 * handled by the hero section instead.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

export default function CohortContextCard({ data }: Props) {
  const { cohort, views, profile } = data;
  if (!cohort.scope || cohort.demand === 0) return null;

  const cat = humanCategory(profile.category)?.toLowerCase() ?? "senior care";
  const placePhrase =
    cohort.scope === "near"
      ? `near ${profile.city ?? "you"}`
      : `in ${humanState(profile.state) ?? "your state"}`;
  const sectionLabel = cohort.scope === "near" ? "Families near you" : "Families in your state";
  const reached = views.thisPeriod;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">
          {sectionLabel}
        </p>
      </div>
      <p className="text-[18px] md:text-[20px] leading-snug text-gray-900 font-display font-semibold">
        {cohort.demand.toLocaleString()}{" "}
        {cohort.demand === 1 ? "family" : "families"} searched for {cat} {placePhrase}{" "}
        this month.
      </p>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {reached === 0
          ? "None reached your page yet. A complete listing typically gets in front of more of them."
          : `${reached.toLocaleString()} ${reached === 1 ? "has" : "have"} reached your page so far.`}
      </p>
    </div>
  );
}

function humanCategory(category: string | null): string | null {
  if (!category) return null;
  const map: Record<string, string> = {
    assisted_living: "Assisted living",
    memory_care: "Memory care",
    nursing_home: "Nursing homes",
    home_care_agency: "Home care",
    home_health_agency: "Home health care",
    independent_living: "Independent living",
  };
  return map[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanState(state: string | null): string | null {
  if (!state) return null;
  const map: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
    WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
  };
  return map[state.toUpperCase()] ?? state;
}
