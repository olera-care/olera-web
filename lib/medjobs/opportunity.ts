/**
 * Builds the "About this opportunity" content for the student-context provider
 * page. Degrades gracefully: a claimed/engaged employer shows the richest
 * version we have; an unclaimed directory listing shows a credible, general
 * version built from its care type, clearly framed as typical and confirmed
 * with the employer.
 *
 * Pay is intentionally NOT taken from the directory's price range — that number
 * is the cost of care to a family, not a caregiver's wage. Showing it would
 * mislead students, so pay is "set with the employer" until an employer posts a
 * wage.
 */

/** Canned, honest task lists per care type — the fallback source of truth. */
const TASKS_BY_TYPE: { match: RegExp; label: string; tasks: string[] }[] = [
  {
    match: /memory|dementia|alzheimer/i,
    label: "Memory care",
    tasks: ["companionship and supervision for people living with dementia", "help with daily routines and meals", "calm redirection and safety monitoring"],
  },
  {
    match: /assisted|independent|senior living|residential/i,
    label: "Senior living support",
    tasks: ["helping residents with daily activities", "companionship and mobility support", "mealtime help"],
  },
  {
    match: /home health/i,
    label: "Home health support",
    tasks: ["non-clinical support alongside the care team", "companionship and basic daily-living help", "mobility support"],
  },
  {
    match: /nursing home|skilled nursing/i,
    label: "Skilled nursing support",
    tasks: ["helping residents with daily living (non-clinical)", "companionship and mobility support", "mealtime help"],
  },
  {
    match: /adult day/i,
    label: "Adult day care",
    tasks: ["helping run activities", "companionship", "mealtime support"],
  },
  {
    match: /hospice/i,
    label: "Hospice support",
    tasks: ["companionship and comfort-focused, non-clinical support", "help with daily routines", "being a calm, steady presence"],
  },
  {
    // Home care / non-medical / default
    match: /.*/,
    label: "In-home senior care",
    tasks: ["companionship", "help with meals and light housekeeping", "mobility support", "errands and appointments"],
  },
];

export interface Opportunity {
  roleLabel: string;
  tasks: string[];
  when: string;
  pay: string;
  isFallback: boolean;
  note?: string;
  /** Optional, only when the employer has filled them in ("Your ideal caregiver"). */
  certifications?: string[];
  skills?: string[];
  hoursLabel?: string;
}

/**
 * The persisted "Your ideal caregiver" fields a provider can optionally add to
 * sharpen matches and enrich their student-facing opportunity. Stored on
 * business_profiles.metadata[OPPORTUNITY_PROFILE_KEY]. Everything is optional —
 * the deterministic fallback (buildOpportunity) covers anything left blank, so
 * the provider is always "live" without filling any of this in.
 */
export const OPPORTUNITY_PROFILE_KEY = "medjobs_opportunity";

export type HoursPerWeek = "0_10" | "10_20" | "20_30" | "30_plus";

export interface OpportunityProfile {
  certifications?: string[];
  skills?: string[];
  hours_per_week?: HoursPerWeek;
  pay_min?: string;
  pay_max?: string;
  commitment?: "one_term" | "multiple_terms";
}

const HOURS_LABELS: Record<HoursPerWeek, string> = {
  "0_10": "Up to 10 hrs/wk",
  "10_20": "10–20 hrs/wk",
  "20_30": "20–30 hrs/wk",
  "30_plus": "30+ hrs/wk",
};

/** Read the persisted opportunity profile off a profile's metadata. */
export function readOpportunityProfile(
  metadata: Record<string, unknown> | null | undefined,
): OpportunityProfile {
  const raw = metadata?.[OPPORTUNITY_PROFILE_KEY];
  return raw && typeof raw === "object" ? (raw as OpportunityProfile) : {};
}

/**
 * Profile completeness for the unified provider profile bar. Intentionally
 * low-stakes: the provider is live regardless; this just nudges enrichment.
 * Returns a 0–100 percentage across a small set of value-bearing fields.
 */
export function opportunityCompleteness(
  profile: OpportunityProfile,
  demandCoverage?: string[] | null,
): number {
  const checks = [
    (demandCoverage?.length ?? 0) > 0, // coverage from the eligibility screener
    (profile.certifications?.length ?? 0) > 0,
    !!profile.hours_per_week,
    !!(profile.pay_min && profile.pay_max),
    (profile.skills?.length ?? 0) > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function buildOpportunity(args: {
  /** Free text describing the care type/category (e.g. "Memory Care", "Home Care (Non-medical)"). */
  careText?: string | null;
  /** True for a claimed/engaged provider (we trust their listing more). */
  isClaimed?: boolean;
  /** Optional real shift needs, when we have them. */
  coverageBuckets?: string[];
  /** Optional persisted "Your ideal caregiver" overrides — applied when present. */
  profile?: OpportunityProfile;
}): Opportunity {
  const text = args.careText || "";
  const entry = TASKS_BY_TYPE.find((t) => t.match.test(text)) ?? TASKS_BY_TYPE[TASKS_BY_TYPE.length - 1];

  const bucketLabels: Record<string, string> = { day: "days", evening: "evenings", overnight: "overnights", weekend: "weekends" };
  const buckets = (args.coverageBuckets ?? []).map((b) => bucketLabels[b] ?? b);
  const when = buckets.length
    ? `Usually ${buckets.length === 1 ? buckets[0] : `${buckets.slice(0, -1).join(", ")} and ${buckets[buckets.length - 1]}`}, arranged with the employer.`
    : "Flexible shifts arranged with the employer, around your class schedule.";

  const profile = args.profile ?? {};
  const hasWage = !!(profile.pay_min && profile.pay_max);
  const isFallback = !args.isClaimed;

  return {
    roleLabel: `Student Caregiver · ${entry.label}`,
    tasks: entry.tasks,
    when: profile.hours_per_week ? `${HOURS_LABELS[profile.hours_per_week]}, arranged with the employer.` : when,
    // Pay shows the employer-set wage when present; otherwise stays honest.
    pay: hasWage ? `$${profile.pay_min}–$${profile.pay_max}/hr` : "Pay is set with the employer.",
    isFallback: isFallback && !hasWage,
    note: isFallback && !hasWage
      ? `This is a typical ${entry.label.toLowerCase()} role. Exact details are confirmed with the employer at your interview.`
      : undefined,
    certifications: profile.certifications?.length ? profile.certifications : undefined,
    skills: profile.skills?.length ? profile.skills : undefined,
    hoursLabel: profile.hours_per_week ? HOURS_LABELS[profile.hours_per_week] : undefined,
  };
}
