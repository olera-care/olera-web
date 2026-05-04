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
  | "agreed"
  | "distributed"
  | "active_partner"
  | "not_interested"
  | "no_response_closed"
  | "do_not_contact"
  | "wrong_contact"
  | "redirected";

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
  | "system_seasonal_due";

export type Channel = "email" | "phone" | "ig_dm" | "contact_form" | "meeting" | "system";

export type ApprovalType = "department" | "marketing" | "listserv" | "job_board" | "other";

export type ApprovalStatus = "requested" | "granted" | "denied" | "expired";

export type TaskType =
  | "research_initial"
  | "outreach_day_0"
  | "outreach_multichannel_orgs"
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
  name: string;
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

/** A queue row joins the outreach record with its campus + a slim "next task" view. */
export interface QueueRow extends OutreachRow {
  campus_name: string;
  campus_slug: string;
  next_task: {
    id: string;
    task_type: TaskType;
    due_at: string;
  } | null;
  primary_contact_name: string | null;
  open_approvals: number;
}

/** Counts shown above the tab row. */
export interface TabCounts {
  today: number;
  upcoming: number;
  active: number;
  agreed: number;
  distributed: number;
  partners: number;
  approvals: number;
  blocked: number;
  reengage: number;
  closed: number;
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
}

export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  student_org: "Student Org",
  advisor: "Advisor",
  professor: "Professor",
  dept_head: "Dept Head",
};

export const STATUS_LABELS: Record<Status, string> = {
  prospect: "Prospect",
  researched: "Researched",
  outreach_sent: "Outreach Sent",
  engaged: "Engaged",
  meeting_scheduled: "Meeting Scheduled",
  agreed: "Agreed",
  distributed: "Distributed",
  active_partner: "Active Partner",
  not_interested: "Not Interested",
  no_response_closed: "No Response (Closed)",
  do_not_contact: "Do Not Contact",
  wrong_contact: "Wrong Contact",
  redirected: "Redirected",
};
