/**
 * Shared types for the Student Outreach Funnel.
 *
 * Enums mirror CHECK constraints in supabase/migrations/064_student_outreach.sql.
 * Keep them in sync.
 */

export type StakeholderType = "student_org" | "advisor" | "professor" | "dept_head";

export type Status =
  | "prospect"
  | "researched"
  | "outreach_sent"
  | "engaged"
  | "meeting_scheduled"
  | "active_partner"
  | "not_interested"
  | "no_response_closed"
  | "do_not_contact"
  | "wrong_contact"
  | "redirected";

/**
 * Legacy values still accepted by the DB CHECK constraint but no longer
 * produced by application code (migration 065 collapsed them). Used only
 * to render historical rows that haven't been migrated yet.
 */
export type LegacyStatus = "agreed" | "distributed";

export type ContactPermission =
  | "not_yet"
  | "granted_direct"
  | "via_dept"
  | "via_listserv"
  | "denied";

export type DistributionEvidence =
  | "explicit_email"
  | "explicit_verbal"
  | "observed_external"
  | "self_reported";

export type PartnerHealth = "healthy" | "at_risk" | "dormant";

export type ContactStatus = "active" | "stale" | "incorrect" | "no_longer_valid";

export type TouchpointType =
  | "email_sent"
  | "email_replied"
  | "email_bounced"
  | "call_no_answer"
  | "call_voicemail"
  | "call_connected"
  | "call_wrong_number"
  | "ig_dm_sent"
  | "ig_dm_replied"
  | "contact_form_submitted"
  | "meeting_scheduled"
  | "meeting_held"
  | "meeting_no_show"
  | "meeting_rescheduled"
  | "approval_requested"
  | "approval_granted"
  | "approval_denied"
  | "approval_expired"
  | "distribution_confirmed"
  | "contact_added"
  | "contact_marked_stale"
  | "contact_replaced"
  | "redirect_initiated"
  | "stage_change"
  | "note_added"
  | "snoozed"
  | "task_cancelled"
  | "task_superseded"
  | "step_skipped"
  | "system_seasonal_due";

export type Channel = "email" | "phone" | "ig_dm" | "contact_form" | "meeting" | "system";

export type ApprovalType = "department" | "marketing" | "listserv" | "job_board" | "other";

export type ApprovalStatus = "requested" | "granted" | "denied" | "expired";

export type TaskType =
  | "research_initial"
  | "outreach_day_0"
  | "outreach_multichannel_orgs"
  | "outreach_email_send"
  | "outreach_followup_email"
  | "outreach_followup_call"
  | "meeting_held_logging"
  | "agreement_followup"
  | "distribution_confirmation"
  | "move_to_active_partner"
  | "partner_seasonal_checkin"
  | "partner_share_update"
  | "partner_event_coordination"
  | "approval_request_followup"
  | "yearly_leadership_recheck"
  | "manual_followup";

export type TaskStatus = "pending" | "completed" | "cancelled" | "superseded";

export interface ResearchData {
  website?: string;
  official_email?: string;
  phone?: string;
  address?: string;
  semester_calendar?: string;
  meeting_at?: string; // ISO; informational mirror, source of truth is meeting_scheduled touchpoint
  meeting_link?: string;
  meeting_kind?: "phone" | "video" | "in_person";
  notes?: string;
}

export interface Campus {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  city: string | null;
  notes: string | null;
  is_active: boolean;
  research_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutreachRow {
  id: string;
  campus_id: string;
  stakeholder_type: StakeholderType;
  organization_name: string;
  department: string | null;
  programs: string[];
  status: Status;
  contact_permission: ContactPermission;
  permission_dependency_id: string | null;
  research_data: ResearchData;
  cadence_day: number;
  snoozed_until: string | null;
  distribution_evidence: DistributionEvidence | null;
  distribution_evidence_notes: string | null;
  reopen_at: string | null;
  partner_health: PartnerHealth | null;
  notes: string | null;
  redirected_to_id: string | null;
  referred_from_id: string | null;
  created_by: string | null;
  created_at: string;
  last_edited_by: string | null;
  last_edited_at: string;
}

export interface Contact {
  id: string;
  outreach_id: string;
  /** Legacy full-name field. Kept for backward compatibility — new code
   *  reads/writes first_name + last_name and the server derives `name`. */
  name: string;
  first_name: string | null;
  last_name: string | null;
  /** Optional formal title (e.g. "Dr.", "Prof."). Drives the {salutation}
   *  variable in email templates for dept_head + professor stakeholders. */
  title: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  contact_form_url: string | null;
  is_primary: boolean;
  status: ContactStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  last_edited_by: string | null;
  last_edited_at: string;
}

export interface Touchpoint {
  id: string;
  outreach_id: string;
  contact_id: string | null;
  touchpoint_type: TouchpointType;
  channel: Channel | null;
  outcome: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  outreach_id: string;
  approval_type: ApprovalType;
  approval_for: string;
  approval_from: string | null;
  status: ApprovalStatus;
  next_followup_at: string | null;
  requested_at: string;
  resolved_at: string | null;
  notes: string | null;
  created_by: string | null;
  last_updated_by: string | null;
  last_updated_at: string;
}

export interface Task {
  id: string;
  outreach_id: string;
  approval_id: string | null;
  task_type: TaskType;
  due_at: string;
  status: TaskStatus;
  payload: Record<string, unknown>;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * v8 Replies tab sub-state. Derived server-side in the queue endpoint
 * and rendered as one of seven state cards. Single source of truth for
 * "what action does the row need next?" — UI is dumb.
 *
 * Precedence (when a row matches multiple): needs_followup > booked >
 * wants_meeting > awaiting_callback > stale > engaged > mid_cadence.
 */
export type RepliesState =
  | "mid_cadence"
  | "engaged"
  | "wants_meeting"
  | "booked"
  | "needs_followup"
  | "awaiting_callback"
  | "stale";

/** Reason for an awaiting-callback state — surfaces in the row card copy. */
export type AwaitingCallbackKind = "voicemail" | "promised";

/**
 * v7/v8 TabRow — what the queue endpoint returns per row, enriched with
 * indicators that drive the per-tab UI (custom task star, stale flag,
 * meeting state, post-meeting follow-up notes, due-call shortcut,
 * v8 replies sub-state, awaiting-callback details).
 */
export interface TabRow extends OutreachRow {
  campus_name: string;
  campus_slug: string;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_role: string | null;
  has_custom_task: boolean;
  custom_task_summary: string | null;
  /** Days since last email_sent (no reply since). Only populated for Replies tab. */
  stale_days: number | null;
  meeting_state: "none" | "in_flight" | "scheduled";
  meeting_at: string | null;
  followup_notes: string | null;
  followup_author: string | null;
  followup_at: string | null;
  last_activity_at: string | null;
  /** Calls tab only: the due call task to surface "Tap to dial" UX. */
  due_call_task: { id: string; due_at: string } | null;
  /** v8 Replies tab only: which state card to render. Null otherwise. */
  replies_state: RepliesState | null;
  /** v8: when the awaiting-callback state began (for "N days ago" copy). */
  awaiting_callback_at: string | null;
  /** v8: voicemail vs. they-said-they'd-call-back. */
  awaiting_callback_kind: AwaitingCallbackKind | null;
  /** v8: humanized next-scheduled-action label (Partners tab today). */
  next_step_label: string | null;
  /** v8.7: stakeholder has a pending 'Post to job board' task. */
  has_pending_job_board_task: boolean;
}

/** Legacy alias kept while cleaning up old call sites. */
export type QueueRow = TabRow;

/**
 * v8.4 campus card shown at the top of the Research tab. Acts as a
 * bulk-input entry point. Stakeholder rows still appear below it in the
 * tab — campus cards don't replace the rows, they augment them.
 */
export interface ResearchCampusCard {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  city: string | null;
  /** Stakeholders still in research stage (prospect + researched). */
  research_stakeholder_count: number;
  /** Most recent stakeholder created_at across this campus, regardless of status. */
  last_added_at: string | null;
}

/** v7 tab counts — one number per tab in the new workflow. */
export interface TabCounts {
  research: number;
  calls: number;
  replies: number;
  meetings: number;
  partners: number;
  all: number;
}

/** What the drawer needs to render every section. */
export interface DrawerContext {
  outreach: OutreachRow;
  campus: Campus;
  contacts: Contact[];
  touchpoints: Touchpoint[];
  approvals: Approval[];
  pending_tasks: Task[];
  referred_from: Pick<OutreachRow, "id" | "organization_name" | "stakeholder_type"> | null;
  redirected_to: Pick<OutreachRow, "id" | "organization_name" | "stakeholder_type"> | null;
  permission_dependency: Pick<OutreachRow, "id" | "organization_name" | "stakeholder_type" | "status"> | null;
  /** user_id → first-name display string. Used by history narration. */
  admin_first_names: Record<string, string>;
  /** v8.3 — server-derived state used by the NextStepPanel guidance. */
  replies_state: RepliesState | null;
  meeting_state: "none" | "in_flight" | "scheduled";
  meeting_at: string | null;
  followup_notes: string | null;
  awaiting_callback_at: string | null;
  awaiting_callback_kind: AwaitingCallbackKind | null;
}

export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  student_org: "Student Org",
  advisor: "Advisor",
  professor: "Professor",
  dept_head: "Dept Head",
};

export const STATUS_LABELS: Record<Status | LegacyStatus, string> = {
  prospect: "Prospect",
  researched: "Researched",
  outreach_sent: "Outreach Sent",
  engaged: "Interested",
  meeting_scheduled: "Meeting Scheduled",
  active_partner: "Active Partner",
  not_interested: "Not Interested",
  no_response_closed: "No Response (Closed)",
  do_not_contact: "Do Not Contact",
  wrong_contact: "Wrong Contact",
  redirected: "Redirected",
  // Legacy — only present on un-migrated historical rows.
  agreed: "Active Partner",
  distributed: "Active Partner",
};

/**
 * Simplified labels admins see in lists / pills. We collapse the
 * granular state machine into 4 buckets so admins don't have to learn
 * 11 stage names. The granular STATUS_LABELS are still used for history
 * narration where the precise transition matters.
 */
export type StatusGroup = "research" | "in_progress" | "active_partner" | "closed";

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  research: "Research",
  in_progress: "In Progress",
  active_partner: "Active Partner",
  closed: "Closed",
};

export const STATUS_GROUP_TOOLTIPS: Record<StatusGroup, string> = {
  research: "Still gathering info. Add contacts and programs, then start outreach.",
  in_progress: "Outreach is running. Wait for replies, work the queued tasks.",
  active_partner: "They're sharing with students. Maintain the relationship.",
  closed: "No further outreach. Reopen if circumstances change.",
};

export function statusGroup(status: Status | LegacyStatus): StatusGroup {
  switch (status) {
    case "prospect":
    case "researched":
      return "research";
    case "outreach_sent":
    case "engaged":
    case "meeting_scheduled":
      return "in_progress";
    case "active_partner":
    case "agreed":
    case "distributed":
      return "active_partner";
    case "not_interested":
    case "no_response_closed":
    case "do_not_contact":
    case "wrong_contact":
    case "redirected":
      return "closed";
  }
}

/**
 * Tab membership rules. Keep this list as the single source of truth for
 * which statuses fall into which tab.
 */
export const IN_PROGRESS_STATUSES: Status[] = [
  "prospect",
  "researched",
  "outreach_sent",
  "engaged",
  "meeting_scheduled",
];

export const PARTNERED_STATUSES: Status[] = ["active_partner"];

export const CLOSED_STATUSES: Status[] = [
  "not_interested",
  "no_response_closed",
  "do_not_contact",
  "wrong_contact",
  "redirected",
];

/** Stages from which "Mark as Partner" should be visible as a CTA. */
export const PARTNER_CTA_STAGES: Status[] = ["outreach_sent", "engaged", "meeting_scheduled"];
