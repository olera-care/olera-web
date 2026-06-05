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
    id: "provider-welcome",
    name: "Provider welcome",
    description: "24h follow-up welcome email to newly verified providers. Warm onboarding with tips on getting leads and completing their profile.",
    recipientCohort: "Providers verified 23–25 hours ago who haven't received the welcome email yet.",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 * * * *",
    humanSchedule: "Hourly, on the hour",
    path: "/api/cron/provider-welcome",
    emailTypes: ["provider_welcome"],
    successSignal: "Provider returns to their dashboard.",
    relatedAdminPath: "/admin/verification",
  },
  {
    id: "provider-dormant",
    name: "Provider dormant re-engagement",
    description: "Re-engagement email to providers inactive for 30+ days. Shows new families in their area and encourages them to return.",
    recipientCohort: "Verified providers with no activity in 30+ days who haven't received this email in the last 60 days.",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10–11 AM ET)",
    path: "/api/cron/provider-dormant",
    emailTypes: ["dormant_reengagement"],
    successSignal: "Provider returns and logs in.",
    relatedAdminPath: "/admin/analytics",
  },
  {
    id: "provider-anniversary",
    name: "Provider anniversary & milestones",
    description: "Celebrates provider anniversaries (1+ years on platform) and connection milestones (10, 50, 100 connections).",
    recipientCohort: "Verified providers with an anniversary today OR who just hit a connection milestone.",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9–10 AM ET)",
    path: "/api/cron/provider-anniversary",
    emailTypes: ["provider_anniversary", "provider_milestone"],
    successSignal: "Provider feels appreciated and engaged.",
    relatedAdminPath: "/admin/analytics",
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
  // NOTE: lead-response-nudge has been replaced by lead-followup-sequence.
  // The old cron code remains at app/api/cron/lead-response-nudge/route.ts for rollback.
  {
    id: "lead-followup-sequence",
    name: "Lead follow-up sequence",
    description:
      "Multi-stage follow-up for unanswered leads. Day 1/3/6/10 emails; Day 14 marks as Stuck. Stops on engagement (lead_opened event). Replaces lead-response-nudge with staged cadence.",
    recipientCohort: "Providers with unviewed leads 1+ days old, not yet at final stage.",
    audience: "Providers",
    fn: "nudge",
    schedule: "0 14 * * *",
    humanSchedule: "Daily, 14:00 UTC (~9 AM ET)",
    path: "/api/cron/lead-followup-sequence",
    emailTypes: ["provider_followup_day1", "provider_followup_day3", "provider_followup_day6", "provider_followup_day10"],
    successSignal: "Provider opens the lead or responds.",
    relatedAdminPath: "/admin/connections",
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
  {
    id: "matches-family-nudge",
    name: "Matches family response nudge",
    description:
      "Daily nudge to families who haven't responded to provider reach-outs via Matches. Targets pending connections 3+ days old where family hasn't accepted or replied.",
    recipientCohort: "Families with pending provider reach-outs 3+ days old, not nudged in last 7 days.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10 AM ET)",
    path: "/api/cron/matches-family-nudge",
    emailTypes: ["family_reach_out_nudge"],
    successSignal: "Family accepts or responds to the provider reach-out.",
    relatedAdminPath: "/admin/matches",
  },
  {
    id: "conversation-stale",
    name: "Stale conversation nudge",
    description:
      "Daily nudge to both parties when a conversation has gone quiet for 5+ days after it started (2+ human messages exchanged). Encourages follow-up.",
    recipientCohort: "Both providers and families with stale conversations (5+ days since last message), not nudged in 14 days.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 16 * * *",
    humanSchedule: "Daily, 16:00 UTC (~11 AM ET)",
    path: "/api/cron/conversation-stale",
    emailTypes: ["stale_conversation"],
    successSignal: "One or both parties resume the conversation.",
    relatedAdminPath: "/admin/leads",
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
  {
    id: "family-provider-silent",
    name: "Provider silent — alternative providers",
    description: "Daily: sends Email #4 when provider has been silent for ~4 days. Recommends responsive alternative providers nearby. Stops if family connects elsewhere.",
    recipientCohort: "Families with 4-day-old connections where provider hasn't responded and family hasn't connected elsewhere.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 15 * * *",
    humanSchedule: "Daily, 15:00 UTC (~10 AM ET)",
    path: "/api/cron/family-provider-silent",
    emailTypes: ["family_provider_silent"],
    successSignal: "Family reaches out to one of the recommended providers.",
    relatedAdminPath: "/admin/leads",
  },
  {
    id: "family-never-engaged",
    name: "Family never engaged — gentle re-engagement",
    description: "Daily: sends Email #5 when family never sent a message after 5+ days. Guide-first value offer with zero pressure. Family-level intelligence — ONE email per family even with multiple connections.",
    recipientCohort: "Families with 5-day-old connections who have NEVER sent a message in ANY connection.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 16 * * *",
    humanSchedule: "Daily, 16:00 UTC (~11 AM ET)",
    path: "/api/cron/family-never-engaged",
    emailTypes: ["family_never_engaged"],
    successSignal: "Family downloads the guide or returns to their inbox.",
    relatedAdminPath: "/admin/leads",
  },
  {
    id: "provider-still-silent",
    name: "Provider STILL silent — trust recovery",
    description: "Daily: sends Email #6 when provider STILL hasn't responded after 7+ days. Trust recovery email — acknowledges failure, actively intervenes with responsive alternatives + personal support fallback. Family-level intelligence.",
    recipientCohort: "Families with 7-day-old connections where family engaged but provider STILL hasn't responded, and family has no active conversations elsewhere.",
    audience: "Care seekers",
    fn: "nudge",
    schedule: "0 17 * * *",
    humanSchedule: "Daily, 17:00 UTC (~12 PM ET)",
    path: "/api/cron/provider-still-silent",
    emailTypes: ["provider_still_silent"],
    successSignal: "Family reaches out to recommended responsive provider or contacts support.",
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
    description: "Daily: deletes expired verification codes (>1h old). Note: stale connection deletion was removed to preserve leads for re-engagement.",
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
