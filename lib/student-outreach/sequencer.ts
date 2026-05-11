/**
 * Server-only: schedule the full outreach cadence for a stakeholder.
 *
 * Called from the `schedule_sequence` API action when admin clicks
 * "Schedule sequence" in the pre-flight review. Given the stakeholder's
 * type and the admin's edited subject/body for each cadence day,
 * this:
 *
 *   1. Inserts an `outreach_email_send` task per email day (snapshot
 *      of subject + body lives in task.payload). Day-0 task is queued
 *      with due_at = now so the inline executor (or next cron tick)
 *      picks it up immediately.
 *   2. Inserts an `outreach_followup_call` task per phone day.
 *   3. Transitions stage prospect/researched → outreach_sent.
 *   4. Sets cadence_day = 0 on the row.
 *
 * The cron pipeline owns the actual sending. The optional inline send
 * for Day 0 is invoked by the API action AFTER the sequencer returns.
 */

import {
  OUTREACH_DAYS_BY_TYPE,
  type CadenceKey,
  type OutreachDay,
  type TemplateKey,
} from "./cadence";
import { onStageEnter } from "./state-machine";
import { getTemplate } from "./templates";
import type { Contact, StakeholderType } from "./types";

const DAY_MS = 86_400_000;

export interface EmailSnapshot {
  /** Cadence day the snapshot is for. */
  day: number;
  template: TemplateKey;
  subject: string;
  body: string;
}

/**
 * v9 Phase 9 per-recipient mode. Each recipient is one contact who
 * will receive their own personalized email tasks (one per cadence
 * email day) and/or call tasks (one per call day). Channels are
 * independent — a contact with only a phone gets call tasks; only
 * email gets email tasks; both gets both.
 *
 * variant drives which email body the recipient receives:
 *   "general" → general-inbox copy ("Hello," with optional team
 *               reference). Used for role=General Office contacts.
 *   "named"   → personalized copy ("Hi {first_name},"). Used for
 *               every other active contact with an explicit name.
 *
 * Call tasks denormalize the recipient's name + phone + role onto
 * the task payload so the Calls tab and drawer can render the
 * task without a contact join at read time.
 */
export interface RecipientPlan {
  contact_id: string;
  variant: "general" | "named";
  channels: { email: boolean; phone: boolean };
  recipient_name: string;
  recipient_first_name: string | null;
  recipient_phone: string | null;
  recipient_role: string | null;
}

/** v9 Phase 9: per-day call script set at PreFlight. */
export interface CallScript {
  day: number;
  script: string;
}

export interface SequencerInput {
  outreach_id: string;
  /**
   * Cadence template key. For stakeholder rows this is the row's
   * stakeholder_type; for provider rows (kind='provider') callers pass
   * the literal 'provider'. One launch path, two template families.
   */
  stakeholder_type: CadenceKey;
  /**
   * Legacy single-snapshot mode: one snapshot per email day, sent
   * to all active contacts with email. Used by stakeholder paths
   * that haven't migrated to per-recipient yet.
   */
  email_snapshots?: EmailSnapshot[];
  user_id: string;
  /**
   * v8.8: phone tasks are only queued when at least one active contact has
   * a phone number. Decided at schedule time by the API action; if false,
   * planSequence skips every phone step in the cadence.
   * Only honored in legacy mode (recipients absent).
   */
  has_phone?: boolean;
  /**
   * v9 Phase 9 per-recipient mode. When present, planSequence
   * generates one task per (day, recipient) instead of one task per
   * day. Each email task gets a personalized snapshot (variant
   * selected + first-name substituted for named recipients). Each
   * call task carries the day's script + denormalized recipient
   * info for the Calls tab / drawer to render directly.
   */
  recipients?: RecipientPlan[];
  /**
   * v9 Phase 9: per-variant email snapshots. Provider templates
   * split into general + named bodies; the snapshot builder fills
   * both at PreFlight time. Required when recipients is set;
   * missing variants for a day cause that day's emails to skip.
   */
  email_snapshots_by_variant?: {
    general?: EmailSnapshot[];
    named?: EmailSnapshot[];
  };
  /** v9 Phase 9: per-day call scripts set at PreFlight. */
  call_scripts?: CallScript[];
}

export interface QueuedTask {
  task_type: "outreach_email_send" | "outreach_followup_call";
  due_at: Date;
  payload: Record<string, unknown>;
}

/**
 * Pure: compute the list of tasks to queue. The API action does the
 * actual DB writes so we keep this testable.
 *
 * Two modes:
 *   Legacy   — input.recipients absent. One email task per email
 *              day (sent to all active contacts with email at
 *              execute time); one call task per call day (gated on
 *              input.has_phone).
 *   Per-recipient — input.recipients present. One email task per
 *              (day, email-eligible recipient) with personalized
 *              snapshot baked in; one call task per (day, call-
 *              eligible recipient) with the day's script and
 *              denormalized recipient context for the Calls tab.
 *
 * Both modes coexist so stakeholder rows (still on legacy) and
 * provider rows (per-recipient) can both call this function
 * without forking.
 */
export function planSequence(input: SequencerInput, now: Date = new Date()): QueuedTask[] {
  const days = OUTREACH_DAYS_BY_TYPE[input.stakeholder_type];
  const tasks: QueuedTask[] = [];

  // v9 Phase 9: per-recipient expansion mode.
  if (input.recipients && input.recipients.length > 0) {
    const generalByDay = new Map(
      (input.email_snapshots_by_variant?.general ?? []).map((s) => [s.day, s]),
    );
    const namedByDay = new Map(
      (input.email_snapshots_by_variant?.named ?? []).map((s) => [s.day, s]),
    );
    const scriptsByDay = new Map(
      (input.call_scripts ?? []).map((s) => [s.day, s.script]),
    );

    for (const day of days) {
      for (const step of day.steps) {
        const dueAt = new Date(now.getTime() + day.day * DAY_MS);
        if (step.channel === "email") {
          for (const r of input.recipients) {
            if (!r.channels.email) continue;
            const snap =
              r.variant === "general"
                ? generalByDay.get(day.day)
                : namedByDay.get(day.day);
            if (!snap) continue;
            // Per-recipient first-name substitution. The general
            // variant's body already has the team greeting composed
            // at PreFlight time (or admin-edited). The named
            // variant's body uses {first_name} which we substitute
            // here; if no first_name, fall back to recipient_name.
            const personalizedBody =
              r.variant === "named"
                ? snap.body.replace(
                    /\{first_name\}/g,
                    r.recipient_first_name || r.recipient_name || "there",
                  )
                : snap.body;
            tasks.push({
              task_type: "outreach_email_send",
              due_at: dueAt,
              payload: {
                day: day.day,
                template: snap.template,
                subject: snap.subject,
                body: personalizedBody,
                variant: r.variant,
                recipient_contact_id: r.contact_id,
              },
            });
          }
        } else if (step.channel === "phone") {
          const script = scriptsByDay.get(day.day) ?? step.label ?? "Follow-up call";
          for (const r of input.recipients) {
            if (!r.channels.phone) continue;
            if (!r.recipient_phone) continue;
            tasks.push({
              task_type: "outreach_followup_call",
              due_at: dueAt,
              payload: {
                day: day.day,
                label: step.label ?? "Follow-up call",
                script,
                recipient_contact_id: r.contact_id,
                recipient_name: r.recipient_name,
                recipient_phone: r.recipient_phone,
                recipient_role: r.recipient_role,
              },
            });
          }
        }
      }
    }
    return tasks;
  }

  // Legacy mode (stakeholder paths haven't migrated).
  const snapshotByDay = new Map(
    (input.email_snapshots ?? []).map((s) => [s.day, s]),
  );
  for (const day of days) {
    for (const step of day.steps) {
      const dueAt = new Date(now.getTime() + day.day * DAY_MS);
      if (step.channel === "email") {
        const snap = snapshotByDay.get(day.day);
        if (!snap) continue;
        tasks.push({
          task_type: "outreach_email_send",
          due_at: dueAt,
          payload: {
            day: day.day,
            template: snap.template,
            subject: snap.subject,
            body: snap.body,
          },
        });
      } else if (step.channel === "phone") {
        if (input.has_phone === false) continue;
        tasks.push({
          task_type: "outreach_followup_call",
          due_at: dueAt,
          payload: {
            day: day.day,
            label: step.label ?? "Follow-up call",
          },
        });
      }
    }
  }

  return tasks;
}

/**
 * v9 Phase 9 helper: derive default call scripts for a cadence. The
 * PreFlight modal seeds these for admin edit; tasks carry the
 * resolved script through to log time.
 */
export function defaultCallScriptsFor(type: CadenceKey): CallScript[] {
  const days = OUTREACH_DAYS_BY_TYPE[type];
  const result: CallScript[] = [];
  for (const day of days) {
    if (!day.steps.some((s) => s.channel === "phone")) continue;
    result.push({ day: day.day, script: defaultCallScriptForDay(type, day.day) });
  }
  return result;
}

function defaultCallScriptForDay(type: CadenceKey, day: number): string {
  // Provider cadence default scripts. Stakeholder paths use the
  // generic fallback for now (admin edits in PreFlight if useful).
  if (type === "provider") {
    if (day === 0) {
      return "Intro call paired with Day 0 email. Ask for the hiring manager or whoever handles caregiver recruiting. If voicemail, leave a brief message referencing the email and a call-back ask. If receptionist answers and won't transfer, ask for the best direct contact (name + email + extension) to follow up.";
    }
    if (day === 2) {
      return "Day 2 follow-up call. Reference Day 0 email + call. Gauge interest in a short intro conversation. If voicemail again, mention you've emailed and are following up.";
    }
    if (day === 5) {
      return "Day 5 follow-up call. Final cadence call before switching to email-only. If you reach anyone, briefly recap the pitch and ask for a 15-min intro on the calendar.";
    }
  }
  return `Day ${day} follow-up call. Reference prior outreach + ask for a 15-min intro.`;
}

/**
 * Helper: build the default snapshot list from templates so the
 * pre-flight modal has something to display before admin edits.
 *
 * Provider rows pass `contacts` so the multi-contact team greeting
 * is composed at snapshot-build time (providerSalutation in
 * templates.ts). Stakeholder rows ignore the field — their per-
 * recipient {salutation} placeholder substitutes at send time.
 */
export function defaultSnapshotsFor(
  type: CadenceKey,
  ctx: {
    organization_name: string;
    campus_name: string;
    admin_first_name?: string;
    contacts?: Contact[];
  },
): EmailSnapshot[] {
  const days = OUTREACH_DAYS_BY_TYPE[type];
  const result: EmailSnapshot[] = [];
  // Templates branch on a StakeholderType for salutation; provider
  // rows borrow student_org's first-name salutation pattern (informal,
  // no Dr./Prof. honorific). All other variables are kind-agnostic.
  const templateStakeholderType: StakeholderType =
    type === "provider" ? "student_org" : type;
  for (const day of days) {
    for (const step of day.steps) {
      if (step.channel !== "email" || !step.template) continue;
      const tpl = getTemplate(step.template, {
        stakeholder_type: templateStakeholderType,
        organization_name: ctx.organization_name,
        campus_name: ctx.campus_name,
        admin_first_name: ctx.admin_first_name,
        contacts: ctx.contacts,
      });
      result.push({
        day: day.day,
        template: step.template,
        subject: tpl.subject,
        body: tpl.body,
      });
    }
  }
  return result;
}

/** Used by tests + UI to know the cadence structure for a given type. */
export function describeCadence(type: CadenceKey): OutreachDay[] {
  return OUTREACH_DAYS_BY_TYPE[type];
}

/** Used by API action: side effects of stage entry to outreach_sent. */
export function outreachSentEntryEffect() {
  return onStageEnter("outreach_sent", {
    stakeholderType: "student_org", // type doesn't matter — entry is a no-op in v4
    now: new Date(),
  });
}
