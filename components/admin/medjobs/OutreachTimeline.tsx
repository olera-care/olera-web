"use client";

/**
 * OutreachTimeline — unified chronological renderer for the drawer.
 *
 * Zone 4 of the unified drawer skeleton. Single component, single
 * row type, single source of truth for "what's happened + what's
 * coming up" on an outreach row. Replaces:
 *   - HistorySection (past touchpoints, narrated)            absorbed
 *   - OutreachStepList (future cadence steps)                absorbed
 *   - EntityStepBoard's drawer-level use (custom tasks)      absorbed
 *
 * Three data sources, one merged stream:
 *   - touchpoints       (past events: email_sent, call_logged, etc.)
 *   - pending_tasks     (future events: queued emails, calls, custom)
 *   - email_engagement  (per-email_log_id: delivered/opened/clicked/bounced)
 *
 * Sort order: future events first (soonest due_at first), then past
 * events (newest first). Visual separator marks the now-boundary so
 * admin scans top-to-bottom from "what's next" to "what happened".
 *
 * Engagement chips: each email_sent row decorated with a chip cluster
 * from email_engagement[email_log_id]. ✓ delivered · 👁 opened ·
 * 🔗 clicked · ⚠ bounced · ⚠ complained. No counts in MVP — chips
 * read off email_log's denormalized columns (true/false). Per-event
 * drill-down deferred.
 *
 * Custom-event footer: "+ Add" form lets admin queue a manual
 * follow-up via the existing queue_manual_task action. Custom events
 * appear inline in the future-stream — no separate Task Board zone.
 *
 * Mounted by both Provider and Partner drawers. Stage-agnostic — it
 * doesn't care about Stage; it just renders what's there.
 */

import { useMemo, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { narrateTouchpoint } from "@/lib/student-outreach/narration";
import { LogCallOutcomeModal } from "@/app/admin/student-outreach/LogCallOutcomeModal";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

interface Props {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}

interface FutureRow {
  kind: "future";
  key: string;
  whenIso: string;
  icon: string;
  title: string;
  subline: string | null;
  /**
   * v9 Phase 9: optional per-task call action. When present, the
   * timeline row renders an inline Log button that opens
   * LogCallOutcomeModal scoped to this specific task. Other future
   * row types (email queued, custom event) leave this null.
   */
  callTask: {
    taskId: string;
    recipientName: string | null;
    recipientPhone: string | null;
    recipientRole: string | null;
    cadenceDay: number | null;
  } | null;
}

interface PastRow {
  kind: "past";
  key: string;
  whenIso: string;
  icon: string;
  title: string;
  subline: string | null;
  /** When the past event is an email_sent, this carries the
   *  email_log_id so the row can render engagement chips. */
  emailLogId: string | null;
  /** Admin who logged the event (relative to the system). */
  admin: string | null;
}

type TimelineRow = FutureRow | PastRow;

export function OutreachTimeline({ ctx, action, setError }: Props) {
  const adminFirstNames = useMemo(
    () => new Map(Object.entries(ctx.admin_first_names ?? {})),
    [ctx.admin_first_names],
  );
  const contactsById = useMemo(
    () => new Map(ctx.contacts.map((c) => [c.id, c])),
    [ctx.contacts],
  );

  const rows: TimelineRow[] = useMemo(() => {
    const out: TimelineRow[] = [];

    // Past events from touchpoints. narrateTouchpoint handles the
    // copy variants per type; we extract the email_log_id for
    // engagement chip rendering.
    for (const tp of ctx.touchpoints) {
      const n = narrateTouchpoint(tp, { adminFirstNames, contactsById });
      const emailLogId =
        tp.touchpoint_type === "email_sent"
          ? ((tp.payload as Record<string, unknown> | null)?.email_log_id as
              | string
              | undefined) ?? null
          : null;
      out.push({
        kind: "past",
        key: `tp-${tp.id}`,
        whenIso: tp.created_at,
        icon: iconForTouchpoint(tp.touchpoint_type),
        title: n.text,
        subline: tp.notes ?? null,
        emailLogId,
        admin: n.admin ?? null,
      });
    }

    // Future events from pending tasks.
    for (const t of ctx.pending_tasks) {
      if (t.status !== "pending") continue;
      const payload = t.payload as Record<string, unknown> | null;
      const day = typeof payload?.day === "number" ? payload.day : null;
      const recipientName =
        typeof payload?.recipient_name === "string"
          ? (payload.recipient_name as string)
          : null;
      const title = futureTitleFor(t.task_type, day, payload, recipientName);
      const isCallTask = t.task_type === "outreach_followup_call";
      out.push({
        kind: "future",
        key: `task-${t.id}`,
        whenIso: t.due_at,
        icon: iconForTaskType(t.task_type),
        title,
        subline:
          t.task_type === "manual_followup" && payload?.reason === "custom"
            ? (typeof payload.notes === "string" ? payload.notes : null)
            : isCallTask &&
              typeof payload?.recipient_phone === "string" &&
              payload.recipient_phone
              ? `☎ ${payload.recipient_phone}`
              : null,
        callTask: isCallTask
          ? {
              taskId: t.id,
              recipientName,
              recipientPhone:
                typeof payload?.recipient_phone === "string"
                  ? (payload.recipient_phone as string)
                  : null,
              recipientRole:
                typeof payload?.recipient_role === "string"
                  ? (payload.recipient_role as string)
                  : null,
              cadenceDay: day,
            }
          : null,
      });
    }

    // Sort: future ASC by due (soonest first), then past DESC by
    // when (newest first). Single sort with kind tiebreak.
    out.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "future" ? -1 : 1;
      if (a.kind === "future") return a.whenIso.localeCompare(b.whenIso);
      return b.whenIso.localeCompare(a.whenIso);
    });

    return out;
  }, [ctx.touchpoints, ctx.pending_tasks, adminFirstNames, contactsById]);

  // v9 Phase 9: per-task call logging state. When admin clicks Log
  // on a call task row, we open LogCallOutcomeModal scoped to that
  // specific recipient + task_id. The handler dispatches log_call
  // with task_id so markCurrentCallTaskComplete claims THAT task
  // (not the most-overdue auto-pick).
  const [callLogTask, setCallLogTask] = useState<FutureRow["callTask"]>(null);

  const submitCallLog = async (
    outcome: string,
    notes: string,
  ): Promise<void> => {
    if (!callLogTask) return;
    try {
      await action("log_call", {
        outcome,
        notes,
        task_id: callLogTask.taskId,
        cadence_day: callLogTask.cadenceDay ?? undefined,
      });
      setCallLogTask(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log call");
      throw e;
    }
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Timeline
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            No outreach activity yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <TimelineRow
                key={r.key}
                row={r}
                showNowDivider={
                  i > 0 && rows[i - 1].kind === "future" && r.kind === "past"
                }
                engagement={
                  r.kind === "past" && r.emailLogId
                    ? ctx.email_engagement?.[r.emailLogId] ?? null
                    : null
                }
                onLogCall={
                  r.kind === "future" && r.callTask
                    ? () => setCallLogTask(r.callTask)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
        <AddCustomEventFooter ctx={ctx} action={action} setError={setError} />
      </div>

      {callLogTask && (
        <LogCallOutcomeModal
          organizationName={ctx.outreach.organization_name}
          contactName={callLogTask.recipientName}
          contactPhone={callLogTask.recipientPhone}
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setCallLogTask(null)}
          onSubmit={submitCallLog}
        />
      )}
    </section>
  );
}

// ── Row renderer ─────────────────────────────────────────────────────────

function TimelineRow({
  row,
  showNowDivider,
  engagement,
  onLogCall,
}: {
  row: TimelineRow;
  showNowDivider: boolean;
  engagement: NonNullable<DrawerContext["email_engagement"]>[string] | null;
  /** v9 Phase 9: inline Log button for per-task call rows. Optional —
   *  only attached when the row is a future call task. */
  onLogCall?: () => void;
}) {
  const whenLabel =
    row.kind === "future"
      ? formatFuture(row.whenIso)
      : formatPast(row.whenIso);
  // v9 final: only surface the Log CTA when the task is actually due
  // (due_at <= now). Future-scheduled tasks render as queued items
  // without the button — admin shouldn't act early. The Calls tab
  // queue still surfaces due tasks the moment they tip into active.
  const isDueNow =
    row.kind === "future" && new Date(row.whenIso).getTime() <= Date.now();
  const isCallTask = row.kind === "future" && row.callTask != null;
  return (
    <>
      {showNowDivider && (
        <li className="border-y border-gray-100 bg-gray-50 px-4 py-1 text-[10px] uppercase tracking-wide text-gray-400">
          ── now ──
        </li>
      )}
      <li className="px-4 py-2.5 text-sm">
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 text-base leading-5 ${
              row.kind === "future" ? "text-gray-400" : "text-gray-600"
            }`}
            aria-hidden
          >
            {row.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate ${
                row.kind === "future" ? "text-gray-600" : "text-gray-800"
              }`}
            >
              {row.title}
            </p>
            {row.subline && (
              <p className="mt-0.5 truncate text-xs italic text-gray-500">
                {row.subline}
              </p>
            )}
            {engagement && <EngagementChips e={engagement} />}
          </div>
          <div className="shrink-0 whitespace-nowrap text-xs text-gray-400">
            {row.kind === "past" && row.admin && (
              <span className="mr-2 text-gray-500">{row.admin}</span>
            )}
            <span>{whenLabel}</span>
            {isCallTask && isDueNow && onLogCall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogCall();
                }}
                title="Log the outcome of this specific call."
                className="ml-3 rounded-md bg-primary-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-700"
              >
                Log
              </button>
            )}
          </div>
        </div>
      </li>
    </>
  );
}

// ── Engagement chips ─────────────────────────────────────────────────────

function EngagementChips({
  e,
}: {
  e: NonNullable<DrawerContext["email_engagement"]>[string];
}) {
  const chips: Array<{ label: string; tone: string }> = [];
  if (e.delivered_at) chips.push({ label: "✓ delivered", tone: "emerald" });
  if (e.first_opened_at) chips.push({ label: "👁 opened", tone: "blue" });
  if (e.first_clicked_at) chips.push({ label: "🔗 clicked", tone: "blue" });
  if (e.bounced_at)
    chips.push({ label: "⚠ bounced", tone: "red" });
  if (e.complained_at)
    chips.push({ label: "⚠ complained", tone: "red" });
  if (chips.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TONE_CLASSES[c.tone]}`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-primary-50 text-primary-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
};

// ── Custom event footer ──────────────────────────────────────────────────

function AddCustomEventFooter({
  ctx: _ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  // Default due_at: tomorrow at noon. Matches the operational rhythm
  // of "I owe a follow-up tomorrow" without forcing the admin to pick.
  const defaultDueAt = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const submit = async () => {
    const t = title.trim();
    if (!t) {
      setError("Add a title for the custom event.");
      return;
    }
    const dueIso = (dueAt || defaultDueAt) + ":00.000Z";
    setSaving(true);
    setError(null);
    try {
      await action("queue_manual_task", {
        task_type: "manual_followup",
        due_at: new Date(dueAt || defaultDueAt).toISOString(),
        notes: t,
      });
      setTitle("");
      setDueAt("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add event");
    } finally {
      setSaving(false);
    }
    void dueIso; // silence unused
  };

  if (!open) {
    return (
      <div className="border-t border-gray-100 px-4 py-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-primary-700 hover:underline"
        >
          + Add custom event
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-gray-100 px-4 py-3">
      <input
        type="text"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Send proposal PDF · Call back when free"
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={dueAt || defaultDueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs"
        />
        <button
          onClick={submit}
          disabled={saving || !title.trim()}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTitle("");
            setDueAt("");
          }}
          className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function iconForTouchpoint(type: string): string {
  if (type.startsWith("email_")) return "✉";
  if (type.startsWith("call_")) return "☎";
  if (type.startsWith("meeting_")) return "📅";
  if (type === "post_meeting_followup") return "📝";
  if (type === "note_added") return "📝";
  if (type.startsWith("contact_")) return "👤";
  if (type.startsWith("approval_")) return "🔐";
  if (type === "redirect_initiated") return "↗";
  if (type === "stage_change") return "↗";
  if (type === "snoozed") return "💤";
  return "•";
}

function iconForTaskType(type: string): string {
  if (type === "outreach_email_send" || type === "outreach_followup_email")
    return "✉";
  if (type === "outreach_followup_call" || type === "outreach_day_0") return "☎";
  if (type === "manual_followup") return "⭐";
  if (type === "partner_share_update") return "📣";
  if (type === "partner_seasonal_checkin") return "🌱";
  if (type === "yearly_leadership_recheck") return "🔁";
  if (type === "approval_request_followup") return "🔐";
  return "•";
}

function futureTitleFor(
  taskType: string,
  day: number | null,
  payload: Record<string, unknown> | null,
  recipientName?: string | null,
): string {
  const dayLabel = day != null ? `Day ${day} ` : "";
  const recipientSuffix = recipientName ? ` to ${recipientName}` : "";
  switch (taskType) {
    case "outreach_email_send":
      return `${dayLabel}email queued${recipientSuffix}`;
    case "outreach_followup_email":
      return `${dayLabel}follow-up email queued${recipientSuffix}`;
    case "outreach_followup_call":
      return recipientName
        ? `${dayLabel}call to ${recipientName}`
        : `${dayLabel}call queued`;
    case "outreach_day_0":
      return "Day 0 outreach queued";
    case "manual_followup": {
      const summary =
        typeof payload?.notes === "string"
          ? payload.notes
          : typeof payload?.description === "string"
            ? payload.description
            : "Custom event";
      return summary;
    }
    case "partner_share_update":
      return "Share update due";
    case "partner_seasonal_checkin":
      return "Seasonal check-in";
    case "yearly_leadership_recheck":
      return "Yearly leadership recheck";
    case "approval_request_followup":
      return "Approval follow-up";
    default:
      return taskType.replace(/_/g, " ");
  }
}

function formatPast(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatFuture(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) {
    const days = Math.round(-ms / 86_400_000);
    return days >= 1 ? `${days}d overdue` : "due now";
  }
  const min = Math.round(ms / 60_000);
  if (min < 60) return `in ${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `in ${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 60) return `in ${d}d`;
  return new Date(iso).toLocaleDateString();
}
