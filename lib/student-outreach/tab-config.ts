/**
 * MedJobs tab configuration — pure data + types shared between
 * the In Basket workflow page (combined dashboard) and the dedicated
 * left-menu pages (focused per-tab views).
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */

import type { ReactNode } from "react";
import type { StakeholderType, TabCounts, TabRow } from "./types";

/**
 * v9.0: TabKey is the discriminator for both In Basket horizontal tabs
 * and dedicated left-menu pages under MedJobs. The set will grow in
 * Phase 1 to include "clients" and "campuses" as primary tabs (currently
 * "campuses" lives at /admin/student-outreach/campuses, "clients" is
 * net-new). For Phase 0 the keys mirror the legacy v8.10 surface.
 */
export type TabKey =
  | "clients"
  | "candidates"
  | "prospects"
  | "calls"
  | "replies"
  | "meetings"
  | "partners"
  | "campuses"
  | "archive"
  | "all"
  | "outbound"
  | "emails_sent"
  | "signups";

export interface TabDef {
  key: TabKey;
  label: string;
  tooltip: string;
}

// v8.10.33: tab row reflects the actual operational pipeline, with
// the two leftmost tabs framing the two upstream funnels:
//   - Candidates: students who signed up / applied (MedJobs / posted
//     candidates).
//   - Prospects: stakeholders being researched and qualified before
//     outreach starts.
// Archive / All / All Archived / Outbound moved into the ⋯ menu
// (MENU_TABS) — secondary surfaces that don't compete with the
// primary workflow.
// v9.0: tab order surfaces the operational arc — Clients (paying side)
// first, then the supply-side workflow (Candidates → Prospects → ... →
// Partners), with Campuses as the territorial primitive at the end.
// Clients + Campuses are scaffolded in v9.0 Phase 1 with placeholder
// content; their full data model + drawer fork lands in Phase 2.
export const TABS: TabDef[] = [
  { key: "clients",    label: "Clients",          tooltip: "Provider clients — agencies in trial or with an active subscription. (Coming in v9.x — Phase 2 wires the data model.)" },
  { key: "candidates", label: "Candidates",       tooltip: "Live student profiles visible to providers on the job board (active + application complete). Subset of all signups." },
  { key: "prospects",  label: "Prospects",        tooltip: "Stakeholders being researched and qualified before outreach starts. v9.0 Phase 2 will fold provider prospects into this tab too." },
  { key: "partners",   label: "Partners",         tooltip: "Stakeholders sharing with students. Click Engage to work pending partner tasks (task board posting, materials, follow-ups)." },
  { key: "meetings",   label: "Meetings",         tooltip: "Stakeholders coordinating a time, or with a meeting on the calendar." },
  { key: "replies",    label: "Replies",          tooltip: "Email replies, callbacks, voicemails. Triage what they said and pick the next step." },
  { key: "calls",      label: "Calls",            tooltip: "Phone calls due today. Tap to dial; log the outcome from the row." },
  { key: "campuses",   label: "Campuses",         tooltip: "Universities and their catchment areas — the operational primitive. Provider prospecting kicks off here; student-stakeholder prospecting unlocks after the first client converts in a campus's catchment." },
];

// Ellipsis menu items — same shape as TABS, surfaced via a ⋯ button at
// the end of the tab row. Each menu view is a hidden top-level tab that
// behaves the same as primary tabs (data viewport + filters + cards) —
// just accessed through the ⋯ for a quieter primary tab row.
export const MENU_TABS: TabDef[] = [
  { key: "all",         label: "All",          tooltip: "Search and filter every stakeholder across all stages." },
  { key: "emails_sent", label: "Emails Sent",  tooltip: "All email-send touchpoints across stakeholders. (Coming soon.)" },
  { key: "outbound",    label: "Outbound",     tooltip: "Aggregated outbound activity log — emails, IG DMs, contact-form sends. Replied threads float to the top. (Coming soon.)" },
  { key: "signups",     label: "Signups",      tooltip: "Every student who entered the funnel — broader acquisition volume (live + incomplete profiles). Candidates ⊂ Signups." },
  { key: "archive",     label: "Archive",      tooltip: "Stale and no-response outreach. Cadence ran out without engagement. They auto-rejoin Replies if they reply or call back later." },
];

// v8.10.38: per-tab PulseHeader metric. Each tab points at a server
// metric (drives the time series fetched from /stats) and a label
// (drives the kpiSuffix shown in the header).
export const TAB_STATS: Record<TabKey, { metric: string; label: string }> = {
  // v9.0 Phase 2 Tier 3.6: real time-series metrics now wired in
  // /stats. clients = T&C-acceptance timestamps; campuses = creation
  // timestamps.
  clients:     { metric: "clients",          label: "new clients"          },
  campuses:    { metric: "campuses",         label: "campuses assigned"    },
  // v8.10.42: Candidates ⊂ Signups. Candidates = LIVE provider-facing
  // student profiles (is_active + application_completed). Signups =
  // every student in the funnel (broader acquisition volume).
  candidates:  { metric: "candidates",       label: "live candidates"      },
  prospects:   { metric: "prospects_added",  label: "prospects qualified"  },
  partners:    { metric: "partners_added",   label: "new partners"         },
  // v8.10.44: Meetings tab uses the broader "meetings_activity" metric
  // (scheduled + held + no-show + rescheduled).
  meetings:    { metric: "meetings_activity", label: "meetings"            },
  replies:     { metric: "replies",          label: "replies received"     },
  calls:       { metric: "calls_made",       label: "calls made"           },
  archive:     { metric: "activity",         label: "outreach actions"     },
  // v8.10.41: All-tab uses the multi-series funnel metric.
  all:         { metric: "funnel",           label: "funnel events"        },
  outbound:    { metric: "outbound",         label: "outbound messages"    },
  emails_sent: { metric: "emails_sent",      label: "emails sent"          },
  signups:     { metric: "signups",          label: "student signups"      },
};

// v8.10.47: chart-series picker options. The ⋯ menu lets admin compose
// a custom multi-line chart by checking N of these. Each option maps
// to a server metric + display label + stable color (matches the
// METRIC_REGISTRY in /stats so the same line color follows a category
// across views).
export const CHART_SERIES_OPTIONS: Array<{
  metric: string;
  label: string;
  color: string;
  /** Optional: associated tab key, used to surface the right count
   *  next to the checkbox from existing tabCounts. */
  countKey?: keyof TabCounts;
}> = [
  { metric: "signups",          label: "Signups",     color: "#94a3b8" },
  { metric: "candidates",       label: "Candidates",  color: "#10b981", countKey: "candidates" },
  { metric: "prospects_added",  label: "Prospects",   color: "#3b82f6", countKey: "prospects" },
  { metric: "replies",          label: "Replies",     color: "#f59e0b", countKey: "replies" },
  { metric: "meetings_activity", label: "Meetings",   color: "#8b5cf6", countKey: "meetings" },
  { metric: "partners_added",   label: "Partners",    color: "#ef4444", countKey: "partners" },
  { metric: "calls_made",       label: "Calls",       color: "#0ea5e9", countKey: "calls" },
  { metric: "emails_sent",      label: "Emails Sent", color: "#14b8a6" },
  { metric: "outbound",         label: "Outbound",    color: "#6366f1" },
  { metric: "activity",         label: "All activity",color: "#6b7280", countKey: "archive" },
];

export const TYPE_FILTERS: Array<{ key: StakeholderType | "all"; label: string }> = [
  { key: "all", label: "All types" },
  { key: "student_org", label: "Student Orgs" },
  { key: "advisor", label: "Advisors" },
  { key: "dept_head", label: "Dept Heads" },
  { key: "professor", label: "Professors" },
];

// "Stop outreach" reason → action name map.
export const STOP_OUTREACH_ACTIONS: Record<
  "not_interested" | "no_response_closed" | "wrong_contact" | "do_not_contact",
  string
> = {
  not_interested: "mark_not_interested",
  no_response_closed: "mark_no_response_closed",
  wrong_contact: "mark_wrong_contact",
  do_not_contact: "mark_dnc",
};

export const STOP_OUTREACH_LABELS: Record<keyof typeof STOP_OUTREACH_ACTIONS, string> = {
  not_interested: "Not interested",
  no_response_closed: "No response",
  wrong_contact: "Wrong contact",
  do_not_contact: "Do not contact",
};

export type StopOutreachReason = keyof typeof STOP_OUTREACH_ACTIONS;

// v8.10.39: lightweight row shapes for the menu views that don't share
// the stakeholder shape. Each is fed by a dedicated endpoint and
// rendered with a specialty card.
export interface EmailSentRow {
  id: string;
  outreach_id: string;
  sent_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  cadence_day: number | null;
  template: string | null;
  success: boolean;
  has_reply: boolean;
  organization_name: string;
  stakeholder_type: StakeholderType;
  campus_name: string;
  primary_contact_name: string | null;
}

export interface SignupRow {
  id: string;
  full_name: string;
  university: string | null;
  email: string | null;
  signed_up_at: string;
}

export interface CandidateRow {
  id: string;
  slug: string | null;
  display_name: string;
  city: string | null;
  state: string | null;
  university: string | null;
  program_track: string | null;
  profile_completeness: number | null;
  has_video: boolean;
  certifications_count: number;
  signed_up_at: string;
}

/**
 * v9.0 Phase 3: row shape for the Campuses tab. Fed by
 * /api/admin/medjobs/campuses with derived stage + counts so the UI
 * doesn't need to recompute the catchment join per render.
 */
export interface CampusRow {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  research_complete: boolean;
  stage: "provider_prospecting" | "stakeholder_prospecting" | "active";
  client_count: number;
  stakeholder_count: number;
  last_added_at: string | null;
}

/**
 * v9.0 Phase 2 Tier 3: virtual provider prospects shown in the Prospects
 * tab. Computed at query-time from the campus catchment + materialized
 * outreach records — never stored. Materialization happens when admin
 * clicks Start outreach (Phase 2 Tier 3.5 — pending the stakeholder_type
 * constraint relaxation migration).
 */
export interface ProviderProspectRow {
  /** Synthetic id: `${provider_id}|${campus_id}`. Stable for React keys. */
  id: string;
  provider_id: string;
  provider_name: string;
  city: string | null;
  state: string | null;
  campus_id: string;
  campus_slug: string;
  campus_name: string;
  created_at: string;
}

/**
 * v9.0 Phase 2: provider clients (agencies in pilot or paying via
 * Stripe). Rendered by ClientCard on the Clients tab. Status, dates,
 * and pilot countdown are computed server-side in
 * /api/admin/medjobs/clients so the UI doesn't recompute the 90-day
 * window each render.
 */
export interface ClientRow {
  id: string;
  display_name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_active: boolean;
  interview_terms_accepted_at: string | null;
  credits_used: number;
  status: "in_pilot" | "pilot_expired" | "subscribed";
  pilot_started_at: string | null;
  pilot_ends_at: string | null;
  days_remaining_in_pilot: number | null;
}

export interface OutboundRow {
  outreach_id: string;
  organization_name: string;
  stakeholder_type: StakeholderType;
  campus_name: string;
  primary_contact_name: string | null;
  latest_outbound_at: string;
  latest_outbound_channel: string;
  latest_reply_at: string | null;
  latest_reply_channel: string | null;
  has_pending_reply: boolean;
  outbound_count: number;
}

// Per-row callbacks shared between RowCard and slot builders.
export interface RowCardCallbacks {
  onOpenDrawer: () => void;
  onLogCallOutcome: () => void;
  onClassifyReply: (source: "email_reply" | "callback") => void;
  onMarkPartner: () => void;
  onStopOutreach: (reason: StopOutreachReason) => Promise<void>;
  onLogMeeting: () => void;
  onSendFollowupEmail: () => void;
  /** v9.0 Phase 4: reset attention. Wired to mark_unread action. */
  onMarkUnread: () => Promise<void>;
}

export interface RowSlots {
  pill?: ReactNode;
  footnote?: ReactNode;
  cta?: ReactNode;
  overflowMenu?: ReactNode;
  headlineAccessory?: ReactNode;
}

export interface OverflowItem {
  label: string;
  onClick: () => void;
  tone?: "default" | "celebration";
}

// ── Replies list priority ordering ─────────────────────────────────────
// One unified inbox. Section headers + section subtitle dropped. All
// rows render in a single flat list, sorted by priority so high-touch
// items naturally surface to the top.
export const REPLIES_PRIORITY: Record<string, number> = {
  needs_followup: 0,
  wants_meeting: 1,
  engaged: 2,
  awaiting_callback: 3,
  mid_cadence: 4,
};

export function sortRepliesRows(rows: TabRow[]): TabRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const pa = REPLIES_PRIORITY[a.replies_state ?? ""] ?? 99;
    const pb = REPLIES_PRIORITY[b.replies_state ?? ""] ?? 99;
    return pa - pb;
  });
  return sorted;
}
