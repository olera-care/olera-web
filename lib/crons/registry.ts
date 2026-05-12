/**
 * Cron job registry — the source of truth the Automation Console renders.
 *
 * Every scheduled job in vercel.json -> app/api/cron/* should have an entry
 * here. The /admin/automations page reads this list, joins each entry to its
 * cron_runs history and (for email jobs) to email_log / email_events, and
 * renders the human-readable view that doesn't exist otherwise.
 *
 * `schedule` MUST match the corresponding entry in vercel.json. A CI check
 * (scripts/check-cron-registry.js, wired into the build) diffs the two so they
 * can't silently drift.
 *
 * When you add a new cron: add it to vercel.json AND here, and wrap the route
 * handler in withCronRun() from lib/crons/run.ts so it shows up in run history.
 */

export type CronKind =
  | "email" // sends email via Resend; rolls up against email_log
  | "data-refresh" // refreshes data (stats rollups, external API pulls)
  | "maintenance"; // housekeeping / state transitions, no email

export interface CronJob {
  /** Stable id. Matches the route folder name under app/api/cron/ and the cron_runs.job_id value. */
  id: string;
  /** Display name. */
  name: string;
  /** What it does and who it targets. This is the line that makes the dashboard worth having. */
  description: string;
  /** Grouping bucket in the UI. */
  category: string;
  kind: CronKind;
  /** Cron expression — MUST match vercel.json. */
  schedule: string;
  /** Human-readable schedule. */
  humanSchedule: string;
  /** Route path (also where a manual admin trigger hits). */
  path: string;
  /** email_log.email_type value(s) this job sends, for the 30-day rollup. Empty for non-email jobs. */
  emailTypes: string[];
  /**
   * What "working" looks like beyond raw sends — the server-confirmed action
   * downstream of this email. Descriptive for now (Phase 1); auto-computed in a
   * later pass. Omit for non-email jobs.
   */
  successSignal?: string;
}

export const CRON_REGISTRY: CronJob[] = [
  // ── Provider lifecycle ─────────────────────────────────────────────
  {
    id: "weekly-provider-digest",
    name: "Weekly provider digest",
    description:
      "Demand email to every provider with a live unanswered question (and any provider with recent page-view/lead/question activity). Leads with the newest unanswered question + a one-click answer link; page views / area demand are a personalization line. Recipients ordered by freshest question, then views.",
    category: "Provider lifecycle",
    kind: "email",
    schedule: "0 13 * * 1",
    humanSchedule: "Mondays, 13:00 UTC (~8–9 AM ET)",
    path: "/api/cron/weekly-provider-digest",
    emailTypes: ["weekly_analytics_digest"],
    successSignal: "Provider lands on the answer flow and answers a question (see /admin/questions).",
  },
  {
    id: "verification-reminders",
    name: "Verification reminders",
    description:
      "Reminds providers who claimed a listing but haven't finished verification: a 7-day nudge, then a 21-day final notice (claim revoked at 30 days).",
    category: "Provider lifecycle",
    kind: "email",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9–10 AM ET)",
    path: "/api/cron/verification-reminders",
    emailTypes: ["verification_reminder_7d", "verification_reminder_21d"],
    successSignal: "Provider completes verification.",
  },

  // ── Care seeker lifecycle ──────────────────────────────────────────
  {
    id: "family-nudges",
    name: "Family lifecycle nudges",
    description:
      "Five-email priority waterfall for care-seeker profiles: Go-Live reminder (complete but not live, 24h+), Profile-incomplete (missing care types/location, 3d+), Provider-recommendation (complete, zero connections, 5d+), Dormant re-engagement (zero connections, 14d+), Post-connection follow-up. One email per family per run.",
    category: "Care seeker lifecycle",
    kind: "email",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10–11 AM ET)",
    path: "/api/cron/family-nudges",
    emailTypes: [
      "go_live_reminder",
      "family_profile_incomplete",
      "provider_recommendation",
      "dormant_reengagement",
      "post_connection_followup",
    ],
    successSignal: "Family completes/lives their profile or initiates a connection.",
  },

  // ── Matches & messaging ────────────────────────────────────────────
  {
    id: "matches-nudge",
    name: "Matches nudge",
    description:
      "Two jobs in one run — F3: nudges families with 2+ initiated conversations, one quiet 48h+, Matches not yet active (once only). P1: nudges providers who signed up 48h+ ago with an incomplete profile.",
    category: "Matches & messaging",
    kind: "email",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9–10 AM ET)",
    path: "/api/cron/matches-nudge",
    emailTypes: ["matches_nudge", "provider_incomplete_profile"],
    successSignal: "Family activates Matches / provider completes their profile.",
  },
  {
    id: "matches-unread",
    name: "Matches unread-message alerts",
    description:
      "Hourly check for unread messages in Matches conversations (request type, provider-initiated) unread for 1h+ — alerts the recipient ('New message from …'). F4/P3.",
    category: "Matches & messaging",
    kind: "email",
    schedule: "0 * * * *",
    humanSchedule: "Hourly, on the hour",
    path: "/api/cron/matches-unread",
    // NOTE: emits via the new-message email helper; also tagged unread_reminder
    // in some paths. Refine this list if the rollup looks short.
    emailTypes: ["new_message", "unread_reminder"],
    successSignal: "Recipient opens the thread and replies.",
  },
  {
    id: "unread-reminders",
    name: "Unread connection-message reminders",
    description:
      "Every 6 hours: finds connections with unread messages older than 24h (last message not from the recipient, no reply since) and sends the recipient a reminder.",
    category: "Matches & messaging",
    kind: "email",
    schedule: "0 */6 * * *",
    humanSchedule: "Every 6 hours",
    path: "/api/cron/unread-reminders",
    emailTypes: ["unread_reminder"],
    successSignal: "Recipient replies in the thread.",
  },

  // ── MedJobs (student talent marketplace) ───────────────────────────
  {
    id: "medjobs-digest",
    name: "MedJobs weekly candidate digest",
    description:
      "Weekly digest to MedJobs provider clients of new student candidates from the past week.",
    category: "MedJobs",
    kind: "email",
    schedule: "0 13 * * 1",
    humanSchedule: "Mondays, 13:00 UTC (~8 AM CT)",
    path: "/api/cron/medjobs-digest",
    emailTypes: ["new_candidate_alert"],
    successSignal: "Provider opens a candidate / books an interview.",
  },
  {
    id: "medjobs-nudge",
    name: "MedJobs student nudges",
    description:
      "Activation cadence for newly-signed-up students — Day 1 / Day 3 / Day 5 nudges to complete their profile.",
    category: "MedJobs",
    kind: "email",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10 AM CT)",
    path: "/api/cron/medjobs-nudge",
    emailTypes: ["profile_incomplete_nudge", "student_activation"],
    successSignal: "Student completes their profile.",
  },

  // ── Provider outreach (staffing pilot) ─────────────────────────────
  {
    id: "staffing-send-email2",
    name: "Staffing outreach — follow-up email",
    description:
      "Hourly: sends Email 2 (follow-up) to providers in the staffing outreach sequence whose Email 1 went out 3+ days ago.",
    category: "Provider outreach",
    kind: "email",
    schedule: "0 * * * *",
    humanSchedule: "Hourly, on the hour",
    path: "/api/cron/staffing-send-email2",
    // sends via the staffing-outreach helper; email_type set there. Refine if rollup looks short.
    emailTypes: [],
    successSignal: "Provider replies / books a call.",
  },
  {
    id: "staffing-sequence-check",
    name: "Staffing outreach — sequence advance",
    description:
      "Hourly: auto-transitions providers from 'sequencing' to 'needs_call' once their email sequence is complete, so non-responders move to the manual-calling queue.",
    category: "Provider outreach",
    kind: "maintenance",
    schedule: "30 * * * *",
    humanSchedule: "Hourly, at :30",
    path: "/api/cron/staffing-sequence-check",
    emailTypes: [],
  },

  // ── Student outreach (campus recruiting) ───────────────────────────
  {
    id: "student-outreach-send",
    name: "Student outreach — scheduled sends",
    description:
      "Every 15 minutes: scans for due student-outreach email tasks (campus stakeholder sequences) and sends them. Also triggerable manually with the cron secret.",
    category: "Student outreach",
    kind: "email",
    schedule: "*/15 * * * *",
    humanSchedule: "Every 15 minutes",
    path: "/api/cron/student-outreach-send",
    // email_type set in the outreach-send helper. Refine if rollup looks short.
    emailTypes: [],
    successSignal: "Stakeholder replies / a campus partnership advances.",
  },

  // ── Internal reporting ─────────────────────────────────────────────
  {
    id: "daily-digest",
    name: "Daily leadership digest",
    description:
      "Internal only: a 24h snapshot to Slack #notifications and ADMIN_NOTIFICATION_EMAIL — care-seeker + provider activity, with a 'Needs attention' block for anomalies. Metric semantics mirror /api/admin/analytics/summary.",
    category: "Internal reporting",
    kind: "email",
    schedule: "0 13 * * *",
    humanSchedule: "Daily, 13:00 UTC (~8 AM CT)",
    path: "/api/cron/daily-digest",
    emailTypes: ["daily_digest"],
  },

  // ── Data & maintenance ─────────────────────────────────────────────
  {
    id: "aggregate-provider-views",
    name: "Provider view stats rollup",
    description:
      "Nightly: rolls up the prior UTC day's page_view events from provider_activity into provider_page_view_stats (per-provider/day) and city_category_view_benchmarks (peer cohort aggregates). Feeds the provider analytics surfaces and the weekly digest's demand line.",
    category: "Data & maintenance",
    kind: "data-refresh",
    schedule: "0 8 * * *",
    humanSchedule: "Daily, 08:00 UTC (~3 AM ET)",
    path: "/api/cron/aggregate-provider-views",
    emailTypes: [],
  },
  {
    id: "google-reviews",
    name: "Google reviews refresh",
    description:
      "Monthly tiered refresh of Google review data: Tier 1 claimed/verified (>30d stale), Tier 2 recently-viewed (>30d stale), Tier 3 long tail (>90d stale or never synced).",
    category: "Data & maintenance",
    kind: "data-refresh",
    schedule: "0 3 1 * *",
    humanSchedule: "Monthly, the 1st at 03:00 UTC",
    path: "/api/cron/google-reviews",
    emailTypes: [],
  },
  {
    id: "cms-refresh",
    name: "CMS quality data refresh",
    description:
      "Quarterly: pulls the latest Medicare quality data and re-matches it against all providers (runs after the CMS quarterly releases).",
    category: "Data & maintenance",
    kind: "data-refresh",
    schedule: "0 6 15 1,4,7,10 *",
    humanSchedule: "Quarterly — the 15th of Jan/Apr/Jul/Oct at 06:00 UTC",
    path: "/api/cron/cms-refresh",
    emailTypes: [],
  },
  {
    id: "cleanup",
    name: "Housekeeping cleanup",
    description:
      "Daily: deletes expired verification codes (>1h old) and stale draft connections (pending, no thread activity for 30 days).",
    category: "Data & maintenance",
    kind: "maintenance",
    schedule: "0 4 * * *",
    humanSchedule: "Daily, 04:00 UTC",
    path: "/api/cron/cleanup",
    emailTypes: [],
  },
];

export function getCronJob(id: string): CronJob | undefined {
  return CRON_REGISTRY.find((j) => j.id === id);
}

/** All distinct categories, in registry order. */
export function cronCategories(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const j of CRON_REGISTRY) {
    if (!seen.has(j.category)) {
      seen.add(j.category);
      out.push(j.category);
    }
  }
  return out;
}
