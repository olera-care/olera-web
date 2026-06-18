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
}

export function buildOpportunity(args: {
  /** Free text describing the care type/category (e.g. "Memory Care", "Home Care (Non-medical)"). */
  careText?: string | null;
  /** True for a claimed/engaged provider (we trust their listing more). */
  isClaimed?: boolean;
  /** Optional real shift needs, when we have them. */
  coverageBuckets?: string[];
}): Opportunity {
  const text = args.careText || "";
  const entry = TASKS_BY_TYPE.find((t) => t.match.test(text)) ?? TASKS_BY_TYPE[TASKS_BY_TYPE.length - 1];

  const bucketLabels: Record<string, string> = { day: "days", evening: "evenings", overnight: "overnights", weekend: "weekends" };
  const buckets = (args.coverageBuckets ?? []).map((b) => bucketLabels[b] ?? b);
  const when = buckets.length
    ? `Usually ${buckets.length === 1 ? buckets[0] : `${buckets.slice(0, -1).join(", ")} and ${buckets[buckets.length - 1]}`}, arranged with the employer.`
    : "Flexible shifts arranged with the employer, around your class schedule.";

  const isFallback = !args.isClaimed;

  return {
    roleLabel: `Student Caregiver · ${entry.label}`,
    tasks: entry.tasks,
    when,
    pay: "Pay is set with the employer.",
    isFallback,
    note: isFallback
      ? `This is a typical ${entry.label.toLowerCase()} role. Exact details are confirmed with the employer at your interview.`
      : undefined,
  };
}
