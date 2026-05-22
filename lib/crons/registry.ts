/**
 * Cron job registry — the source of truth the Automation Console renders.
 *
 * Every scheduled job in vercel.json -> app/api/cron/* should have an entry
 * here. The /admin/automations list (the cockpit) and /admin/automations/[id]
 * (the deep view) both read this; it joins to cron_runs for run history and to
 * email_log / email_events for the 30-day email rollup.
 *
 * `schedule` MUST match the corresponding entry in vercel.json. A CI check
 * (scripts/check-cron-registry.js, wired into prebuild) diffs the two.
 *
 * When you add a new cron: add it to vercel.json AND here, and wrap the route
 * handler in withCronRun() from lib/crons/run.ts so it shows up in run history.
 */

/** Top-level grouping in the Console — by who the automation touches. Scales to the Loops migration. */
export type CronAudience = "Providers" | "Care seekers" | "MedJobs" | "Students" | "Internal" | "Data & maintenance";

/** What kind of automation it is — shown as a chip; also tells us whether to expect an email rollup. */
export type CronFn = "nudge" | "alert" | "digest" | "outreach" | "refresh" | "maintenance";

export interface CronJob {
  /** Stable id. Matches the route folder name under app/api/cron/ and cron_runs.job_id. */
  id: string;
  /** Display name. */
  name: string;
  /** What it does. One or two sentences. */
  description: string;
  /** Who gets it (or "(no recipients ...)" for data/maintenance jobs). */
  recipientCohort: string;
  audience: CronAudience;
  fn: CronFn;
  /** Cron expression — MUST match vercel.json. */
  schedule: string;
  /** Human-readable schedule. */
  humanSchedule: string;
  /** Route path (also where a manual admin trigger hits). */
  path: string;
  /** email_log.email_type value(s) this job sends, for the 30-day rollup. Empty for non-email jobs. */
  emailTypes: string[];
  /** What "working" looks like beyond raw sends — the server-confirmed action downstream. Descriptive for now. */
  successSignal?: string;
  /** Related admin queue/surface for this automation, if any. */
  relatedAdminPath?: string;
}

/** Email jobs are everything except data refreshes and pure maintenance. */
export function isEmailJob(job: CronJob): boolean {
  return job.fn !== "refresh" && job.fn !== "maintenance";
}

export const CRON_REGISTRY: CronJob[] = [
  // ── Providers ──────────────────────────────────────────────────────
  {
    id: "weekly-provider-digest",
    name: "Weekly provider digest",
    description:
      "Demand email leading with a provider's newest unanswered question + a one-click answer link; page views / area demand are a personalization line. Recipients ordered by freshest question, then views.",
    recipientCohort:
      "Every provider with a live unanswered question, plus any provider with recent page-view / lead / question activity (~2,700; ~1,300 with an email on file). The Monday cron uses limit=2000 (covers the full reachable pool); a ?limit=N on a manual fire overrides it.",
    audience: "Providers",
    fn: "digest",
    schedule: "0 13 * * 1",
    humanSchedule: "Mondays, 13:00 UTC (~8–9 AM ET)",
    path: "/api/cron/weekly-provider-digest",
    emailTypes: ["weekly_analytics_digest"],
    successSignal: "Provider lands on the answer flow and answers a question (see /admin/questions).",
    relatedAdminPath: "/admin/questions",
  },
  {
    id: "verification-reminders",
    name: "Verification reminders",
    description: "Nudges providers who claimed a listing but haven't finished verification: a 7-day reminder, then a 21-day final notice (claim revoked at 30 days).",
    recipientCohort: "Claimed-but-unverified providers — at 7 days post-claim, then again at 21 days.",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9–10 AM ET)",
    path: "/api/cron/verification-reminders",
    emailTypes: ["verification_reminder_7d", "verification_reminder_21d"],
    successSignal: "Provider completes verification.",
    relatedAdminPath: "/admin/verification",
  },
  {
    id: "staffing-send-email2",
    name: "Staffing outreach — follow-up email",
    description: "Sends Email 2 (follow-up) to providers in the staffing-outreach sequence whose Email 1 went out 3+ days ago.",
    recipientCohort: "Providers in the staffing-outreach sequence with email1_sent_at > 3 days ago and no email2 yet.",
    audience: "Providers",
    fn: "outreach",
    schedule: "0 * * * *",
    humanSchedule: "Hourly, on the hour",
    path: "/api/cron/staffing-send-email2",
    // sent via the staffing-outreach helper — email_type set there. Refine if the rollup reads short.
    emailTypes: [],
    successSignal: "Provider replies / books a call.",
    relatedAdminPath: "/admin/staffing-outreach",
  },
  {
    id: "staffing-sequence-check",
    name: "Staffing outreach — sequence advance",
    description: "Auto-transitions providers from 'sequencing' to 'needs_call' once their email sequence is complete, so non-responders move to the manual-calling queue.",
    recipientCohort: "(No recipients — a state-transition job.)",
    audience: "Providers",
    fn: "maintenance",
    schedule: "30 * * * *",
    humanSchedule: "Hourly, at :30",
    path: "/api/cron/staffing-sequence-check",
    emailTypes: [],
    relatedAdminPath: "/admin/staffing-outreach",
  },
  {
    id: "lead-response-nudge",
    name: "Lead response nudge",
    description:
      "Weekly nudge to providers who haven't responded to leads. Targets connections 3+ days old where provider has not replied and was not nudged in the last 7 days. Sends one consolidated email per provider.",
    recipientCohort: "Providers with unanswered leads (3+ days old, not nudged in 7 days).",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 14 * * 4",
    humanSchedule: "Thursdays, 14:00 UTC (~9 AM ET)",
    path: "/api/cron/lead-response-nudge",
    emailTypes: ["provider_nudge"],
    successSignal: "Provider responds to the lead.",
    relatedAdminPath: "/admin/analytics",
  },
  {
    id: "lead-family-nudge",
    name: "Lead family nudge",
    description:
      "Twice-weekly nudge to families with active leads who need to complete or publish their profile. One email per family per run.",
    recipientCohort: "Families with leads 2+ days old whose profile is incomplete (<60%) or not published.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 16 * * 2,5",
    humanSchedule: "Tuesdays & Fridays, 16:00 UTC (~11 AM ET)",
    path: "/api/cron/lead-family-nudge",
    emailTypes: ["family_nudge", "go_live_reminder"],
    successSignal: "Family completes or publishes their profile.",
    relatedAdminPath: "/admin/analytics",
  },

  // ── Care seekers ───────────────────────────────────────────────────
  {
    id: "family-nudges",
    name: "Family lifecycle nudges",
    description:
      "Five-email priority waterfall for care-seeker profiles: Go-Live reminder (complete but not live, 24h+), Profile-incomplete (missing care types/location, 3d+), Provider-recommendation (complete, zero connections, 5d+), Dormant re-engagement (zero connections, 14d+), Post-connection follow-up. One email per family per run.",
    recipientCohort: "Care-seeker profiles 24h+ old that match one of the five lifecycle states above — one email per family per run.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10–11 AM ET)",
    path: "/api/cron/family-nudges",
    emailTypes: ["go_live_reminder", "family_profile_incomplete", "provider_recommendation", "dormant_reengagement", "post_connection_followup"],
    successSignal: "Family completes/lives their profile or initiates a connection.",
    relatedAdminPath: "/admin/care-seekers",
  },
  {
    id: "matches-nudge",
    name: "Matches nudge",
    description: "Two jobs per run — F3: nudges families with 2+ initiated conversations one of which is quiet 48h+, Matches not yet active (once only). P1: nudges providers 48h+ post-signup with an incomplete profile.",
    recipientCohort: "Families with a quiet conversation and Matches inactive (F3); providers 48h+ post-signup with an incomplete profile (P1).",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9–10 AM ET)",
    path: "/api/cron/matches-nudge",
    emailTypes: ["matches_nudge", "provider_incomplete_profile"],
    successSignal: "Family activates Matches / provider completes their profile.",
    relatedAdminPath: "/admin/matches",
  },
  {
    id: "matches-unread",
    name: "Matches unread-message alerts",
    description: "Hourly check for unread messages in Matches conversations (request type, provider-initiated) unread for 1h+ — alerts the recipient ('New message from …'). F4/P3.",
    recipientCohort: "Whoever has an unread message in a Matches conversation that's sat 1h+.",
    audience: "Care seekers",
    fn: "alert",
    schedule: "0 * * * *",
    humanSchedule: "Hourly, on the hour",
    path: "/api/cron/matches-unread",
    emailTypes: ["new_message", "unread_reminder"],
    successSignal: "Recipient opens the thread and replies.",
    relatedAdminPath: "/admin/matches",
  },
  {
    id: "unread-reminders",
    name: "Unread connection-message reminders",
    description: "Every 6 hours: finds connection threads with an unread message older than 24h (last message not from the recipient, no reply since) and reminds the recipient.",
    recipientCohort: "Whoever has an unread message in a connection thread that's sat 24h+.",
    audience: "Care seekers",
    fn: "alert",
    schedule: "0 */6 * * *",
    humanSchedule: "Every 6 hours",
    path: "/api/cron/unread-reminders",
    emailTypes: ["unread_reminder"],
    successSignal: "Recipient replies in the thread.",
    relatedAdminPath: "/admin/leads",
  },

  // ── MedJobs (student talent marketplace) ───────────────────────────
  {
    id: "medjobs-digest",
    name: "MedJobs weekly candidate digest",
    description: "Weekly roundup to MedJobs provider clients of new student candidates from the past week.",
    recipientCohort: "MedJobs provider clients.",
    audience: "MedJobs",
    fn: "digest",
    schedule: "0 13 * * 1",
    humanSchedule: "Mondays, 13:00 UTC (~8 AM CT)",
    path: "/api/cron/medjobs-digest",
    emailTypes: ["new_candidate_alert"],
    successSignal: "Provider opens a candidate / books an interview.",
    relatedAdminPath: "/admin/medjobs/candidates",
  },
  {
    id: "medjobs-nudge",
    name: "MedJobs student nudges",
    description: "Activation cadence for newly-signed-up MedJobs students — Day 1 / Day 3 / Day 5 nudges to complete their profile.",
    recipientCohort: "MedJobs students with an incomplete profile, at Day 1 / 3 / 5 post-signup.",
    audience: "MedJobs",
    fn: "nudge",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10 AM CT)",
    path: "/api/cron/medjobs-nudge",
    emailTypes: ["profile_incomplete_nudge", "student_activation"],
    successSignal: "Student completes their profile.",
    relatedAdminPath: "/admin/medjobs/candidates",
  },

  // ── Students (campus recruiting) ───────────────────────────────────
  {
    id: "student-outreach-send",
    name: "Student outreach — scheduled sends",
    description: "Every 15 minutes: scans for due student-outreach email tasks (campus stakeholder sequences) and sends them. Also triggerable manually with the cron secret.",
    recipientCohort: "Campus stakeholders with a due step in their outreach sequence.",
    audience: "Students",
    fn: "outreach",
    schedule: "*/15 * * * *",
    humanSchedule: "Every 15 minutes",
    path: "/api/cron/student-outreach-send",
    // email_type set in the outreach-send helper. Refine if the rollup reads short.
    emailTypes: [],
    successSignal: "Stakeholder replies / a campus partnership advances.",
    relatedAdminPath: "/admin/student-outreach/campuses",
  },

  // ── Internal ───────────────────────────────────────────────────────
  {
    id: "daily-digest",
    name: "Daily leadership digest",
    description: "Internal only: a 24h snapshot to Slack #notifications and ADMIN_NOTIFICATION_EMAIL — care-seeker + provider activity, with a 'Needs attention' block for anomalies. Metric semantics mirror /api/admin/analytics/summary.",
    recipientCohort: "Internal only — Slack #notifications + ADMIN_NOTIFICATION_EMAIL.",
    audience: "Internal",
    fn: "digest",
    schedule: "0 13 * * *",
    humanSchedule: "Daily, 13:00 UTC (~8 AM CT)",
    path: "/api/cron/daily-digest",
    emailTypes: ["daily_digest"],
    relatedAdminPath: "/admin/analytics",
  },

  // ── Data & maintenance ─────────────────────────────────────────────
  {
    id: "aggregate-provider-views",
    name: "Provider view stats rollup",
    description: "Nightly: rolls up the prior UTC day's page_view events from provider_activity into provider_page_view_stats (per-provider/day) and city_category_view_benchmarks (peer cohort aggregates). Feeds the provider analytics surfaces and the weekly digest's demand line.",
    recipientCohort: "(No recipients — a data rollup job.)",
    audience: "Data & maintenance",
    fn: "refresh",
    schedule: "0 8 * * *",
    humanSchedule: "Daily, 08:00 UTC (~3 AM ET)",
    path: "/api/cron/aggregate-provider-views",
    emailTypes: [],
    relatedAdminPath: "/admin/analytics",
  },
  {
    id: "google-reviews",
    name: "Google reviews refresh",
    description: "Monthly tiered refresh of Google review data: Tier 1 claimed/verified (>30d stale), Tier 2 recently-viewed (>30d stale), Tier 3 long tail (>90d stale or never synced).",
    recipientCohort: "(No recipients — a data refresh job.)",
    audience: "Data & maintenance",
    fn: "refresh",
    schedule: "0 3 1 * *",
    humanSchedule: "Monthly, the 1st at 03:00 UTC",
    path: "/api/cron/google-reviews",
    emailTypes: [],
    relatedAdminPath: "/admin/directory",
  },
  {
    id: "cms-refresh",
    name: "CMS quality data refresh",
    description: "Quarterly: pulls the latest Medicare quality data and re-matches it against all providers (runs after the CMS quarterly releases).",
    recipientCohort: "(No recipients — a data refresh job.)",
    audience: "Data & maintenance",
    fn: "refresh",
    schedule: "0 6 15 1,4,7,10 *",
    humanSchedule: "Quarterly — the 15th of Jan/Apr/Jul/Oct at 06:00 UTC",
    path: "/api/cron/cms-refresh",
    emailTypes: [],
    relatedAdminPath: "/admin/directory",
  },
  {
    id: "cleanup",
    name: "Housekeeping cleanup",
    description: "Daily: deletes expired verification codes (>1h old) and stale draft connections (pending, no thread activity for 30 days).",
    recipientCohort: "(No recipients — a cleanup job.)",
    audience: "Data & maintenance",
    fn: "maintenance",
    schedule: "0 4 * * *",
    humanSchedule: "Daily, 04:00 UTC",
    path: "/api/cron/cleanup",
    emailTypes: [],
  },
];

export function getCronJob(id: string): CronJob | undefined {
  return CRON_REGISTRY.find((j) => j.id === id);
}

const AUDIENCE_ORDER: CronAudience[] = ["Providers", "Care seekers", "MedJobs", "Students", "Internal", "Data & maintenance"];

/** Audiences present in the registry, in canonical display order. */
export function cronAudiences(): CronAudience[] {
  const present = new Set(CRON_REGISTRY.map((j) => j.audience));
  return AUDIENCE_ORDER.filter((a) => present.has(a));
}
