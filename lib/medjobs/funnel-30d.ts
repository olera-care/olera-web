import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STALL_DAYS,
  siteScore,
  stageHealth,
  type Health,
  type SiteScore,
} from "@/lib/medjobs/funnel-health";

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

/** Statuses that mean the row is still being worked, so silence on it matters. */
const ACTIVE_STATUSES = [
  "prospect",
  "researched",
  "outreach_sent",
  "engaged",
  "meeting_scheduled",
];

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
  /** Green / yellow / red, from this stage's own driver. */
  health?: Health;
  /** True when the stage is network-wide because it cannot be split by site. */
  networkWide?: boolean;
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

export interface Site {
  id: string;
  slug: string;
  name: string;
  /**
   * The school's mark. `medjobs_universities.logo_url` exists as a column and
   * nothing populates it yet, so this is null for every site today and the UI
   * falls back to a monogram. It fills in the moment logos are loaded.
   */
  logoUrl: string | null;
}

/** The bottom line: what the funnel produced, in outcomes rather than rates. */
export interface Outcomes {
  /** MA4. Placements that reached the billable threshold. */
  billable: number;
  /** MA5. Placements billed. */
  billed: number;
  /** Students who reached a confirmed placement. */
  successfulStudents: number;
  /** Collected, in whole dollars. */
  revenue: number;
  /** Which of the four are real numbers rather than structure awaiting data. */
  instrumented: { billable: boolean; billed: boolean; successfulStudents: boolean; revenue: boolean };
}

export interface FunnelResult {
  /** Null for ALL SITES. */
  site: Site | null;
  sites: Site[];
  health: SiteScore;
  outcomes: Outcomes;
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
async function loadTouchpoints(db: DB, since: string, campusId: string | null) {
  let q = db.from("student_outreach").select("id, kind, campus_id, status").limit(100000);
  if (campusId) q = q.eq("campus_id", campusId);
  const { data: rows, error } = await q;
  if (error) throw error;

  const kindOf = new Map<string, string>();
  const active = new Set<string>();
  for (const r of (rows ?? []) as Array<{
    id: string;
    kind: string | null;
    status: string | null;
  }>) {
    if (!r.kind) continue;
    kindOf.set(r.id, r.kind);
    if (r.status && ACTIVE_STATUSES.includes(r.status)) active.add(r.id);
  }

  // Two windows off one query: the 30-day counts, and the longer look-back that
  // says whether an active row has gone quiet.
  const stallSince = new Date(Date.now() - STALL_DAYS * 86_400_000).toISOString();
  const earliest = since < stallSince ? since : stallSince;
  const { data: tps, error: tpErr } = await db
    .from("student_outreach_touchpoints")
    .select("outreach_id, touchpoint_type, created_at")
    .gte("created_at", earliest)
    .limit(200000);
  if (tpErr) throw tpErr;

  const provider: TP[] = [];
  const university: TP[] = [];
  const touchedRecently = new Set<string>();
  for (const t of (tps ?? []) as Array<TP & { created_at: string }>) {
    const kind = kindOf.get(t.outreach_id);
    if (!kind) continue;
    if (t.created_at >= stallSince) touchedRecently.add(t.outreach_id);
    if (t.created_at < since) continue;
    if (kind === "provider") provider.push(t);
    else if (UNIVERSITY_KINDS.includes(kind)) university.push(t);
  }

  let stalled = 0;
  for (const id of active) if (!touchedRecently.has(id)) stalled += 1;
  const stalledShare = active.size > 0 ? stalled / active.size : 0;

  return { provider, university, stalledShare, activeRows: active.size };
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

async function countRowsCreated(
  db: DB,
  since: string,
  kinds: string[] | "provider",
  campusId: string | null,
) {
  let q = db
    .from("student_outreach")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  q = kinds === "provider" ? q.eq("kind", "provider") : q.in("kind", kinds);
  if (campusId) q = q.eq("campus_id", campusId);
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

export async function loadFunnel30d(db: DB, siteSlug?: string | null): Promise<FunnelResult> {
  const until = new Date();
  const since = new Date(until.getTime() - WINDOW_DAYS * 86_400_000).toISOString();

  // The site list drives both the filter and the navigator, so it is always
  // loaded even when no filter is applied.
  const [{ data: campusRows }, { data: uniRows }] = await Promise.all([
    db.from("student_outreach_campuses").select("id, slug, name").eq("is_active", true).order("name"),
    db.from("medjobs_universities").select("slug, name, logo_url"),
  ]);
  // The two registries drift on slug, so match on name first, as the
  // campus-university bridge does, and fall back to slug.
  const byName = new Map<string, string | null>();
  const bySlug = new Map<string, string | null>();
  for (const u of (uniRows ?? []) as Array<{ slug: string; name: string; logo_url: string | null }>) {
    byName.set(u.name.trim().toLowerCase(), u.logo_url);
    bySlug.set(u.slug, u.logo_url);
  }
  const sites: Site[] = ((campusRows ?? []) as Array<{ id: string; slug: string; name: string }>).map(
    (c) => ({
      ...c,
      logoUrl: byName.get(c.name.trim().toLowerCase()) ?? bySlug.get(c.slug) ?? null,
    }),
  );
  const site = siteSlug ? (sites.find((c) => c.slug === siteSlug) ?? null) : null;
  const campusId = site?.id ?? null;
  // Asking for a site that does not exist must not silently return the network.
  if (siteSlug && !site) throw new Error(`Unknown site: ${siteSlug}`);

  const [{ provider, university, stalledShare }, providersAdded, officesAdded, clients] =
    await Promise.all([
      loadTouchpoints(db, since, campusId),
      countRowsCreated(db, since, "provider", campusId),
      countRowsCreated(db, since, UNIVERSITY_KINDS, campusId),
      campusId ? Promise.resolve(null) : countClients(db, since),
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

  // Five stages have no campus link anywhere in the schema: the Client flag
  // lives on business_profiles, the candidate-ready broadcast on email_log, and
  // interviews and placements point at profiles rather than a site. Under a
  // site filter they stay network-wide, say so, and sit out that site's score
  // rather than being quietly attributed to it.
  const wide = campusId ? { networkWide: true } : {};
  const wideNote = campusId
    ? " Network-wide: this stage has no campus link, so it cannot be narrowed to one site."
    : "";

  const stages: FunnelMetrics = {
    PR1: {
      kind: "coverage",
      reads:
        "How much of our own list we have worked, not a conversion rate. A low number means the team is behind on pre-flight, not that providers said no.",
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
      ...wide,
      x: clients ?? undefined,
      y: pHeld,
      xLabel: "providers that accepted terms",
      yLabel: "provider meetings held",
      note:
        "Terms acceptance is the only instrumented part of PR3. Profile updated, setup meeting held and staffing need recorded have no fields (B5)." +
        wideNote,
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
      ...wide,
      x: signups ?? 0,
      xLabel: "student signups",
      note:
        "Throughput only. Go-live is not dated, so signup to live cannot be windowed (G-a)." + wideNote,
    },
    QUAL: {
      kind: "gap",
      gap: "No qualification step exists. Going live is the qualification event, so a rate has no distinct numerator (B19).",
    },
    MA1: {
      kind: "throughput",
      reads: "A count, not a rate. Distinct providers reached by the candidate-ready broadcast.",
      ...wide,
      x: readyProviders,
      xLabel: `providers told a candidate is ready (${readySends} sends)`,
      note: "Throughput only. The denominator needs a dated go-live (G-a); the profile PDF itself is B20." + wideNote,
    },
    MA2: {
      kind: "conversion",
      reads: "Of the interviews proposed, the share both sides confirmed. Read it as scheduling friction, not as attendance.",
      ...wide,
      x: confirmed ?? 0,
      y: proposed ?? 0,
      xLabel: "interviews confirmed",
      yLabel: "interviews proposed",
      note: "Measures confirmation, not attendance. Nothing sets completed or no_show (B23)." + wideNote,
    },
    MA3: {
      kind: "conversion",
      reads: "Of the interviews confirmed, the share that produced a placement offer.",
      ...wide,
      x: offers ?? 0,
      y: confirmed ?? 0,
      xLabel: "placement offers made",
      yLabel: "interviews confirmed",
      note: "The acceptance that constitutes the hire has no dated transition (G-h)." + wideNote,
    },
    MA4: {
      kind: "throughput",
      reads: "Number billable: placements that reached the billing threshold. Structure only until a shift count exists.",
      x: 0,
      xLabel: "billable",
      gap: "No shift concept exists in the product. The placement threshold is 120 hours, not six shifts (B28). The count is structure, not data.",
    },
    MA5: {
      kind: "throughput",
      reads: "Number billed: invoices raised against a billable placement. Structure only until payment is written.",
      x: 0,
      xLabel: "billed",
      gap: "Payment fields exist on the placement and are never written (B29). The count is structure, not data.",
    },
  };

  // Health per stage, then the site score from the stages that could be scored.
  // A network-wide stage under a site filter is not that site's to answer for.
  const scorable: Health[] = [];
  for (const [key, m] of Object.entries(stages)) {
    const skip = m.gap || (campusId && m.networkWide);
    m.health = skip ? "unscored" : stageHealth(key, m.x, m.y);
    scorable.push(m.health);
  }
  const health = siteScore(scorable, stalledShare);

  const outcomes: Outcomes = {
    billable: 0,
    billed: 0,
    successfulStudents: 0,
    revenue: 0,
    // Every one of the four waits on instrumentation. Declared here so the
    // shape is settled and only the numbers change when it lands.
    instrumented: { billable: false, billed: false, successfulStudents: false, revenue: false },
  };

  return {
    site,
    sites,
    health,
    outcomes,
    since,
    until: until.toISOString(),
    windowDays: WINDOW_DAYS,
    stages,
    yield: {
      commercial: {
        kind: "conversion",
        reads: "Of every provider meeting held, the share that became a paying-relationship Client.",
        ...wide,
        x: clients ?? undefined,
        y: pHeld,
        xLabel: "providers converted to Client",
        yLabel: "provider meetings held",
      },
      placement: {
        kind: "conversion",
        reads: "Of every provider meeting held, the share that has produced a placement offer.",
        ...wide,
        x: offers ?? 0,
        y: pHeld,
        xLabel: "placement offers made",
        yLabel: "provider meetings held",
        note: "Revenue yield needs MA4 and MA5 instrumented; neither is." + wideNote,
      },
    },
  };
}
