/**
 * Health thresholds for the MedJobs operating system.
 *
 * Two rules govern this file.
 *
 * **Each stage is judged on its own kind of metric.** A conversion stage is
 * judged on its rate, a volume stage on its 30-day throughput, a coverage stage
 * on how much of its own list has been worked. One universal threshold across
 * all of them would be meaningless.
 *
 * **A stage the system cannot measure is not scored.** QUAL, MA4 and MA5 show
 * their structure and a zero, and sit out of the health score, because scoring
 * a site red for instrumentation we have not built yet tells an operator
 * nothing about the site.
 *
 * The numbers below are **initial operating defaults, not observed baselines**.
 * We have no history to fit them to yet. They live in one table on purpose:
 * when real base rates arrive, this is the only file to edit.
 */

export type Health = "green" | "yellow" | "red" | "unscored";

/** What drives a stage's health, so the operator knows why it turned. */
export type Driver = "conversion" | "coverage" | "volume";

export interface Threshold {
  driver: Driver;
  /** At or above this is green. */
  green: number;
  /** At or above this is yellow; below it is red. */
  yellow: number;
  /** Plain-language reason, shown on hover. */
  reads: string;
}

export const THRESHOLDS: Record<string, Threshold> = {
  // Coverage: how much of the list we built have we actually worked.
  PR1: { driver: "coverage", green: 70, yellow: 40, reads: "Share of the provider list worked through pre-flight." },
  ST1: { driver: "coverage", green: 70, yellow: 40, reads: "Share of the generated office list worked through pre-flight." },

  // Outbound conversion. The two sides run different cadences to different
  // audiences, so they carry different bars: providers get 3 emails and 2
  // calls, advising offices 5 emails and 1 meeting-first call.
  "PR-OUT": { driver: "conversion", green: 8, yellow: 3, reads: "Share of contacted providers that booked a meeting." },
  "ST-OUT": { driver: "conversion", green: 15, yellow: 6, reads: "Share of contacted offices that booked a meeting." },

  // Show-up and logging discipline. A booked meeting that does not happen, or
  // happens and is not logged, looks the same here, and both need attention.
  PR2: { driver: "conversion", green: 80, yellow: 60, reads: "Share of booked provider meetings held and logged." },
  ST2: { driver: "conversion", green: 80, yellow: 60, reads: "Share of booked advisor meetings held and logged." },

  // Conversion out of the meeting.
  PR3: { driver: "conversion", green: 40, yellow: 20, reads: "Share of provider meetings that converted to a Client." },
  "ST3-ST7": { driver: "conversion", green: 60, yellow: 30, reads: "Share of advisor meetings that produced confirmed distribution." },

  // Volume: these have no sound denominator, so they are judged on throughput.
  ST8: { driver: "volume", green: 20, yellow: 5, reads: "Student signups in the window." },
  MA1: { driver: "volume", green: 10, yellow: 3, reads: "Providers reached by the candidate-ready broadcast." },

  // Match conversion.
  MA2: { driver: "conversion", green: 60, yellow: 35, reads: "Share of proposed interviews both sides confirmed." },
  MA3: { driver: "conversion", green: 40, yellow: 20, reads: "Share of confirmed interviews that produced an offer." },
};

/** Stage health from its own driver. Returns `unscored` when unmeasurable. */
export function stageHealth(stage: string, x?: number, y?: number): Health {
  const t = THRESHOLDS[stage];
  if (!t || x == null) return "unscored";
  let value: number;
  if (t.driver === "volume") {
    value = x;
  } else {
    if (y == null) return "unscored";
    // No eligible population is not a failure, it is an empty window.
    if (y === 0) return "unscored";
    value = (x / y) * 100;
  }
  if (value >= t.green) return "green";
  if (value >= t.yellow) return "yellow";
  return "red";
}

/** Points a stage contributes to the site score. */
const POINTS: Record<Health, number> = { green: 100, yellow: 60, red: 20, unscored: 0 };

/**
 * How long an active row may sit untouched before it counts as stalled. The
 * outreach cadence runs Day 0 to Day 7, so a fortnight of silence on a row
 * still marked active is a row nobody is working.
 */
export const STALL_DAYS = 14;

export interface SiteScore {
  /** 0 to 100. The mean of the scored stages. */
  score: number;
  status: Health;
  /** How many stages were scored, and how many sat out. */
  scored: number;
  unscored: number;
  /** Share of active rows with no touchpoint in STALL_DAYS. */
  stalledShare: number;
  /** Why the status is what it is, in one line. */
  reads: string;
}

/**
 * Site health: the mean of the scored stages, then capped by staleness.
 *
 * The cap exists because a site can post good conversion rates on a handful of
 * rows while most of its pipeline sits untouched. Rates alone would call that
 * healthy; it is not.
 */
export function siteScore(stages: Array<Health>, stalledShare: number): SiteScore {
  const scored = stages.filter((h) => h !== "unscored");
  const unscored = stages.length - scored.length;
  if (scored.length === 0) {
    return {
      score: 0,
      status: "unscored",
      scored: 0,
      unscored,
      stalledShare,
      reads: "Nothing measurable in this window.",
    };
  }
  const score = Math.round(scored.reduce((a, h) => a + POINTS[h], 0) / scored.length);

  let status: Health = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";
  let reads = `${scored.length} measurable stages average ${score}.`;
  if (stalledShare >= 0.6 && status !== "red") {
    status = "red";
    reads += ` Capped at red: ${Math.round(stalledShare * 100)}% of active rows have had no touchpoint in ${STALL_DAYS} days.`;
  } else if (stalledShare >= 0.4 && status === "green") {
    status = "yellow";
    reads += ` Capped at yellow: ${Math.round(stalledShare * 100)}% of active rows have gone quiet for ${STALL_DAYS} days.`;
  }
  if (unscored > 0) reads += ` ${unscored} stages are not instrumented and sat out.`;
  return { score, status, scored: scored.length, unscored, stalledShare, reads };
}
