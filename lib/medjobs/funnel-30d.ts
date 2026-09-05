import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Trailing-30-day performance for every stage of the MedJobs operating system.
 *
 * The discipline here is the point: a stage gets an x/y only when both numbers
 * come from dated system events. Where a denominator would have to be invented
 * the stage returns throughput alone, and where neither number exists it
 * returns a gap with the reason. The diagram renders whatever it is given, so
 * a stage that is not measurable says so rather than showing a plausible number.
 *
 * docs/medjobs/FUNNEL_MEASUREMENT_MAP.md is the working: which events populate
 * each number, what is missing, and the smallest change that would fix it.
 */

export const WINDOW_DAYS = 30;

/** Provider rows and university rows are the same table, split by `kind`. */
const UNIVERSITY_KINDS = ["advisor", "student_org", "dept_head", "professor"];

const CALL_TYPES = [
  "call_connected",
  "call_no_answer",
  "call_voicemail",
  "call_wrong_number",
];

/**
 * What kind of question the number answers. They are not all conversion rates,
 * and reading a coverage number as a conversion rate would be wrong: PR1 at 78%
 * means we have worked 78% of our own list, not that 22% of providers declined.
 */
export type MetricKind = "conversion" | "coverage" | "throughput" | "gap";

export interface StageMetric {
  /** Which of the four things this number is. */
  kind: MetricKind;
  /** One sentence saying what the number means, in words, for the tooltip. */
  reads?: string;
  /** x. Null only on a pure gap. */
  x?: number;
  /** y. Absent means throughput with no sound denominator. */
  y?: number;
  /** What x counts, for the tooltip. */
  xLabel?: string;
  /** What y counts, for the tooltip. */
  yLabel?: string;
  /** Set when the stage cannot be measured. Rendered instead of a number. */
  gap?: string;
  /** A caveat worth carrying even though the number is sound. */
  note?: string;
}

export type FunnelMetrics = Record<string, StageMetric>;

export interface FunnelResult {
  /** ISO start of the trailing window. */
  since: string;
  /** ISO end (now). */
  until: string;
  windowDays: number;
  stages: FunnelMetrics;
  /** The two yields that are honest today. */
  yield: {
    commercial: StageMetric;
    placement: StageMetric;
  };
}

type DB = SupabaseClient<any, any, any>;

/** One touchpoint row, reduced to what the counters need. */
interface TP {
  outreach_id: string;
  touchpoint_type: string;
}

/**
 * Every touchpoint in the window, split by the kind of row it belongs to.
 * One query rather than a dozen counts: the window is small and this keeps
 * the derived numbers consistent with each other.
 */
async function loadTouchpoints(db: DB, since: string) {
  const { data: rows, error } = await db
    .from("student_outreach")
    .select("id, kind")
    .limit(100000);
  if (error) throw error;

  const kindOf = new Map<string, string>();
  for (const r of (rows ?? []) as Array<{ id: string; kind: string | null }>) {
    if (r.kind) kindOf.set(r.id, r.kind);
  }

  const { data: tps, error: tpErr } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type")
    .gte("created_at", since)
    .limit(200000);
  if (tpErr) throw tpErr;

  const provider: TP[] = [];
  const university: TP[] = [];
  for (const t of (tps ?? []) as TP[]) {
    const kind = kindOf.get(t.outreach_id);
    if (kind === "provider") provider.push(t);
    else if (kind && UNIVERSITY_KINDS.includes(kind)) university.push(t);
  }
  return { provider, university };
}

/** Distinct rows carrying at least one touchpoint of any of `types`. */
function rowsWith(tps: TP[], types: string[]): number {
  const seen = new Set<string>();
  for (const t of tps) if (types.includes(t.touchpoint_type)) seen.add(t.outreach_id);
  return seen.size;
}

/** Raw event count, for the stages where the event is the unit. */
function events(tps: TP[], type: string): number {
  let n = 0;
  for (const t of tps) if (t.touchpoint_type === type) n += 1;
  return n;
}

async function countRowsCreated(db: DB, since: string, kinds: string[] | "provider") {
  let q = db
    .from("student_outreach")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  q = kinds === "provider" ? q.eq("kind", "provider") : q.in("kind", kinds);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/** Providers whose terms acceptance — the Client conversion — falls in window. */
async function countClients(db: DB, since: string) {
  const { data, error } = await db
    .from("business_profiles")
    .select("metadata")
    .eq("type", "provider")
    .not("metadata->>interview_terms_accepted_at", "is", null)
    .limit(50000);
  if (error) throw error;
  let n = 0;
  for (const r of (data ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const at = r.metadata?.interview_terms_accepted_at;
    if (typeof at === "string" && at >= since) n += 1;
  }
  return n;
}

export async function loadFunnel30d(db: DB): Promise<FunnelResult> {
  const until = new Date();
  const since = new Date(until.getTime() - WINDOW_DAYS * 86_400_000).toISOString();

  const [{ provider, university }, providersAdded, officesAdded, clients] =
    await Promise.all([
      loadTouchpoints(db, since),
      countRowsCreated(db, since, "provider"),
      countRowsCreated(db, since, UNIVERSITY_KINDS),
      countClients(db, since),
    ]);

  // Student signups. Dated and reliable; go-live is not (see G-a).
  const { count: signups } = await db
    .from("business_profiles")
    .select("id", { count: "exact", head: true })
    .eq("type", "student")
    .gte("created_at", since);

  // The built half of the QUAL broadcast: catchment providers told a candidate
  // is ready. Fires on a student's first go-live only.
  const { data: readyMail } = await db
    .from("email_log")
    .select("recipient")
    .eq("email_type", "medjobs_candidate_ready")
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(50000);
  const readySends = (readyMail ?? []).length;
  const readyProviders = new Set(
    (readyMail ?? [])
      .map((r: { recipient: string | null }) => r.recipient?.trim().toLowerCase())
      .filter(Boolean),
  ).size;

  const [{ count: proposed }, { count: confirmed }, { count: offers }] = await Promise.all([
    db.from("interviews").select("id", { count: "exact", head: true }).gte("created_at", since),
    db
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .not("confirmed_time", "is", null)
      .gte("confirmed_time", since),
    db.from("medjobs_placements").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const pWorked = rowsWith(provider, ["email_sent", ...CALL_TYPES]);
  const pPreflight = rowsWith(provider, CALL_TYPES);
  const pBooked = rowsWith(provider, ["meeting_scheduled"]);
  const pHeld = events(provider, "meeting_held");
  const pScheduled = events(provider, "meeting_scheduled");

  const uWorked = rowsWith(university, ["email_sent", ...CALL_TYPES]);
  const uPreflight = rowsWith(university, CALL_TYPES);
  const uBooked = rowsWith(university, ["meeting_scheduled"]);
  const uHeld = events(university, "meeting_held");
  const uScheduled = events(university, "meeting_scheduled");
  const activated = events(university, "distribution_confirmed");

  const cohortNote =
    "Event-based, not cohort-based: a meeting booked late in the window is held outside it.";

  const stages: FunnelMetrics = {
    PR1: {
      kind: "coverage",
      reads: "How much of our own list we have worked, not a conversion rate. A low number means the team is behind on pre-flight, not that providers said no.",
      x: pPreflight,
      y: providersAdded,
      xLabel: "providers with a pre-flight call logged",
      yLabel: "providers materialised onto the list",
      note: "Catchment size is computed on read and never stored, so the list can only be counted once a provider is materialised.",
    },
    "PR-OUT": {
      kind: "conversion",
      reads: "Of the providers we actually contacted, the share that booked a meeting. This is the top-of-funnel conversion rate.",
      x: pBooked,
      y: pWorked,
      xLabel: "providers that booked a meeting",
      yLabel: "providers emailed or called",
    },
    PR2: {
      kind: "conversion",
      reads: "Of the provider meetings booked, the share that happened and were logged. A low number is no-shows or unlogged meetings, not lost demand.",
      x: pHeld,
      y: pScheduled,
      xLabel: "meetings held",
      yLabel: "meetings booked",
      note: cohortNote,
    },
    PR3: {
      kind: "conversion",
      reads: "Of the provider meetings held, the share that converted to a Client. This is the commercial close rate.",
      x: clients,
      y: pHeld,
      xLabel: "providers that accepted terms",
      yLabel: "provider meetings held",
      note: "Terms acceptance is the only instrumented part of PR3. Profile updated, setup meeting held and staffing need recorded have no fields (B5).",
    },
    ST1: {
      kind: "coverage",
      reads: "How much of the generated office list we have worked, not a conversion rate. The university-side twin of PR1.",
      x: uPreflight,
      y: officesAdded,
      xLabel: "offices with a pre-flight call logged",
      yLabel: "offices generated as prospects",
    },
    "ST-OUT": {
      kind: "conversion",
      reads: "Of the advising offices we actually contacted, the share that booked a meeting.",
      x: uBooked,
      y: uWorked,
      xLabel: "offices that booked a meeting",
      yLabel: "offices emailed or called",
    },
    ST2: {
      kind: "conversion",
      reads: "Of the advisor meetings booked, the share that happened and were logged.",
      x: uHeld,
      y: uScheduled,
      xLabel: "meetings held",
      yLabel: "meetings booked",
      note: cohortNote,
    },
    "ST3-ST7": {
      kind: "conversion",
      reads: "Of the advisor meetings held, the share that produced confirmed distribution. Whether a channel plan turned into a live channel.",
      x: activated,
      y: uHeld,
      xLabel: "distribution confirmed",
      yLabel: "advisor meetings held",
      note: "Stage level only. Which of the five channels went live is not modelled (B9, B12).",
    },
    ST8: {
      kind: "throughput",
      reads: "A count, not a rate. New students entering the funnel in the window.",
      x: signups ?? 0,
      xLabel: "student signups",
      note: "Throughput only. Go-live is not dated, so signup to live cannot be windowed (G-a).",
    },
    QUAL: {
      kind: "gap",
      gap: "No qualification step exists. Going live is the qualification event, so a rate has no distinct numerator (B19).",
    },
    MA1: {
      kind: "throughput",
      reads: "A count, not a rate. Distinct providers reached by the candidate-ready broadcast.",
      x: readyProviders,
      xLabel: `providers told a candidate is ready (${readySends} sends)`,
      note: "Throughput only. The denominator needs a dated go-live (G-a); the profile PDF itself is B20.",
    },
    MA2: {
      kind: "conversion",
      reads: "Of the interviews proposed, the share both sides confirmed. Read it as scheduling friction, not as attendance.",
      x: confirmed ?? 0,
      y: proposed ?? 0,
      xLabel: "interviews confirmed",
      yLabel: "interviews proposed",
      note: "Measures confirmation, not attendance. Nothing sets completed or no_show (B23).",
    },
    MA3: {
      kind: "conversion",
      reads: "Of the interviews confirmed, the share that produced a placement offer.",
      x: offers ?? 0,
      y: confirmed ?? 0,
      xLabel: "placement offers made",
      yLabel: "interviews confirmed",
      note: "The acceptance that constitutes the hire has no dated transition (G-h).",
    },
    MA4: {
      kind: "gap",
      gap: "No shift concept exists in the product. The placement threshold is 120 hours, not six shifts (B28).",
    },
    MA5: {
      kind: "gap",
      gap: "Payment fields exist on the placement and are never written (B29).",
    },
  };

  return {
    since,
    until: until.toISOString(),
    windowDays: WINDOW_DAYS,
    stages,
    yield: {
      commercial: {
        kind: "conversion",
        reads: "Of every provider meeting held, the share that became a paying-relationship Client.",
        x: clients,
        y: pHeld,
        xLabel: "providers converted to Client",
        yLabel: "provider meetings held",
      },
      placement: {
        kind: "conversion",
        reads: "Of every provider meeting held, the share that has produced a placement offer.",
        x: offers ?? 0,
        y: pHeld,
        xLabel: "placement offers made",
        yLabel: "provider meetings held",
        note: "Revenue yield needs MA4 and MA5 instrumented; neither is.",
      },
    },
  };
}
