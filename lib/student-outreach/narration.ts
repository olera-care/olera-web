/**
 * Render a touchpoint as a self-explanatory line for the History section.
 *
 * Keeps payload-aware copy in one place so additions are consistent.
 * Returns plain text — the component formats relative time + admin name
 * around it.
 */

import { STATUS_LABELS } from "./types";
import type { Contact, Touchpoint } from "./types";

export interface NarrationContext {
  /** Map of admin user_id → first-name display string. */
  adminFirstNames: Map<string, string>;
  /** Map of contact_id → name, for touchpoints that reference a specific contact. */
  contactsById: Map<string, Contact>;
}

export interface NarratedTouchpoint {
  text: string;
  admin: string | null;
  whenIso: string;
}

export function narrateTouchpoint(t: Touchpoint, ctx: NarrationContext): NarratedTouchpoint {
  const admin = t.created_by ? (ctx.adminFirstNames.get(t.created_by) ?? null) : null;
  const contact = t.contact_id ? ctx.contactsById.get(t.contact_id) : null;
  const contactSuffix = contact ? ` to ${contact.email ?? contact.name}` : "";
  const contactName = contact ? ` (${contact.name})` : "";
  const p = t.payload ?? {};

  let text: string;
  switch (t.touchpoint_type) {
    case "stage_change": {
      const from = String(p.from ?? "?");
      const to = String(p.to ?? "?");
      const fromLabel = labelFor(from);
      const toLabel = labelFor(to);
      const reopen = p.reopen ? " (reopened)" : "";
      text = `Stage: ${fromLabel} → ${toLabel}${reopen}`;
      break;
    }
    case "email_sent": {
      const tmpl = p.template ? ` (${p.template})` : "";
      text = `Email sent${contactSuffix}${contactName}${tmpl}`;
      break;
    }
    case "email_replied":
      text = `Reply received${contactSuffix}${contactName}`;
      break;
    case "email_bounced":
      text = `Email bounced${contactSuffix}`;
      break;

    case "call_no_answer":
      text = `Call: no answer${contactName}`;
      break;
    case "call_voicemail":
      text = `Call: voicemail left${contactName}`;
      break;
    case "call_connected":
      text = `Call connected${contactName}`;
      break;
    case "call_wrong_number":
      text = `Call: wrong number${contactName}`;
      break;

    case "ig_dm_sent":
      text = `Instagram DM sent${contactName}`;
      break;
    case "ig_dm_replied":
      text = `Instagram DM reply received${contactName}`;
      break;
    case "contact_form_submitted":
      text = `Submitted contact form`;
      break;

    case "meeting_scheduled": {
      const at = p.meeting_at ? ` for ${formatDate(String(p.meeting_at))}` : "";
      const kind = p.kind ? ` (${p.kind})` : "";
      text = `Meeting scheduled${at}${kind}`;
      break;
    }
    case "meeting_held":
      text = t.outcome ? `Meeting held — ${t.outcome}` : `Meeting held`;
      break;
    case "meeting_no_show":
      text = `Meeting no-show`;
      break;
    case "meeting_rescheduled": {
      const at = p.meeting_at ? ` to ${formatDate(String(p.meeting_at))}` : "";
      text = `Meeting rescheduled${at}`;
      break;
    }

    case "approval_requested": {
      const what = p.approval_for ? `: ${p.approval_for}` : "";
      const type = p.approval_type ? ` (${p.approval_type})` : "";
      text = `Approval requested${type}${what}`;
      break;
    }
    case "approval_granted": {
      if (p.bulk_professor_unlock) {
        text = `${p.created_count ?? 0} professor row(s) created (${p.permission})`;
      } else if (p.source === "bulk_unlock") {
        text = `Unlocked via dept (${p.permission})`;
      } else {
        const type = p.approval_type ? ` (${p.approval_type})` : "";
        text = `Approval granted${type}`;
      }
      break;
    }
    case "approval_denied":
      text = `Approval denied${p.approval_type ? ` (${p.approval_type})` : ""}`;
      break;
    case "approval_expired":
      text = `Approval expired${p.approval_type ? ` (${p.approval_type})` : ""}`;
      break;

    case "distribution_confirmed": {
      const ev = p.evidence ? ` — evidence: ${p.evidence}` : "";
      text = `Marked as Partner${ev}`;
      break;
    }

    case "contact_added":
      text = p.initial ? `Initial contact added` : `Contact added${contactName}`;
      break;
    case "contact_marked_stale": {
      const newStatus = p.new_status ?? "stale";
      text = `Contact marked ${newStatus}${contactName}`;
      break;
    }
    case "contact_replaced":
      text = `Contact replaced${contactName}`;
      break;

    case "redirect_initiated":
      text = `Redirected to a new stakeholder`;
      break;
    case "note_added": {
      const fields = Array.isArray(p.fields_updated) ? p.fields_updated.join(", ") : "";
      text = fields ? `Notes / research updated (${fields})` : `Note added`;
      break;
    }
    case "snoozed": {
      const until = p.snoozed_until ? ` until ${formatDate(String(p.snoozed_until))}` : "";
      text = `Snoozed${until}`;
      break;
    }
    case "task_cancelled":
      text = `Task cancelled${p.reason ? ` (${p.reason})` : ""}`;
      break;
    case "task_superseded": {
      const reason = p.reason === "stage_change" ? "(stage advanced)" : "";
      text = `Pending task(s) superseded ${reason}`.trim();
      break;
    }
    case "system_seasonal_due":
      text = `Seasonal check-in due`;
      break;

    default:
      text = String(t.touchpoint_type);
  }

  if (t.notes) {
    text = `${text} — “${t.notes}”`;
  }
  return { text, admin, whenIso: t.created_at };
}

function labelFor(status: string): string {
  return (STATUS_LABELS as Record<string, string>)[status] ?? status;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
