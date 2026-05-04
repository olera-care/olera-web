"use client";

/**
 * OutreachStepList — v4 passive status display.
 *
 * Shows the entire scheduled cadence for the row as a vertical list.
 * Email steps are auto-sent by the cron, so they appear as passive
 * status (✓ sent, ⏳ scheduled, ✗ skipped). Phone-call steps still
 * have admin actions (call disposition).
 *
 * For an `outreach_email_send` task that is more than 15 minutes from
 * its due_at, admins can click [Edit] or [Skip] (calls server actions
 * that update or cancel the task respectively).
 */

import { useMemo, useState } from "react";
import { EditPendingEmailModal } from "./EditPendingEmailModal";
import { OUTREACH_DAYS_BY_TYPE, type OutreachDay, type OutreachStep } from "@/lib/student-outreach/cadence";
import { callScript } from "@/lib/student-outreach/templates";
import type { DrawerContext, Task, Touchpoint } from "@/lib/student-outreach/types";

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

interface Props {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}

export function OutreachStepList({ ctx, action, setError }: Props) {
  const days = OUTREACH_DAYS_BY_TYPE[ctx.outreach.stakeholder_type] ?? [];

  // Group: per cadence day, the email task (if any) + phone task (if any).
  const emailTaskByDay = useMemo(
    () => mapTasksByDay(ctx.pending_tasks, "outreach_email_send"),
    [ctx.pending_tasks],
  );
  const phoneTaskByDay = useMemo(
    () => mapTasksByDay(ctx.pending_tasks, "outreach_followup_call"),
    [ctx.pending_tasks],
  );

  const handleErr = (p: Promise<unknown>) =>
    p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  return (
    <div className="space-y-3">
      {/* Got-a-reply banner: the in-drawer twin of the inbox-check panel.
          One click cancels the cadence and moves the row to engaged so
          the Mark-as-Active-Partner CTA is unambiguously available. */}
      <div className="rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-blue-900">
            💬 <strong>Did they reply?</strong> Mark engaged to stop the cadence and move forward
            (e.g. schedule a meeting, mark as Active Partner).
          </p>
          <button
            onClick={() => {
              if (window.confirm("Mark as engaged? This cancels remaining auto-emails.")) {
                handleErr(action("mark_engaged", { notes: "reply received" }));
              }
            }}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Got a reply — Mark Engaged
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Outreach progress · {days.length} cadence day{days.length === 1 ? "" : "s"} · email auto-sends, calls are queued in your tasks.
      </p>
      <ol className="space-y-2">
        {days.map((day) => (
          <DayRow
            key={day.day}
            day={day}
            ctx={ctx}
            emailTask={emailTaskByDay.get(day.day) ?? null}
            phoneTask={phoneTaskByDay.get(day.day) ?? null}
            action={action}
            setError={setError}
          />
        ))}
      </ol>
    </div>
  );
}

function DayRow({
  day,
  ctx,
  emailTask,
  phoneTask,
  action,
  setError,
}: {
  day: OutreachDay;
  ctx: DrawerContext;
  emailTask: Task | null;
  phoneTask: Task | null;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  return (
    <li className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-sm font-medium text-gray-900">{day.title}</p>
      <ul className="mt-2 space-y-1.5">
        {day.steps.map((step) => (
          <StepRow
            key={`${day.day}-${step.id}`}
            day={day.day}
            step={step}
            task={step.channel === "email" ? emailTask : step.channel === "phone" ? phoneTask : null}
            ctx={ctx}
            action={action}
            setError={setError}
          />
        ))}
      </ul>
    </li>
  );
}

function StepRow({
  day,
  step,
  task,
  ctx,
  action,
  setError,
}: {
  day: number;
  step: OutreachStep;
  task: Task | null;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  if (step.channel === "email") {
    return <EmailStepRow day={day} task={task} ctx={ctx} action={action} setError={setError} />;
  }
  if (step.channel === "phone") {
    return <PhoneStepRow day={day} task={task} ctx={ctx} action={action} setError={setError} />;
  }
  return null;
}

// ── Email step (passive status + edit/skip on upcoming) ────────────────

function EmailStepRow({
  day,
  task,
  ctx,
  action,
  setError,
}: {
  day: number;
  task: Task | null;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const sentTouchpoints = useMemo(
    () => ctx.touchpoints.filter((t) => isEmailSentForDay(t, day)),
    [ctx.touchpoints, day],
  );
  const sent = sentTouchpoints.length > 0;
  const successCount = sentTouchpoints.filter((t) => (t.payload as Record<string, unknown>)?.success === true).length;
  const failureCount = sentTouchpoints.length - successCount;

  // Edit/Skip allowed if pending AND due_at is at least 15 min in future.
  const editable = useMemo(() => {
    if (!task || task.status !== "pending") return false;
    return new Date(task.due_at).getTime() - Date.now() >= 15 * 60 * 1000;
  }, [task]);

  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  if (sent) {
    return (
      <li className="flex items-start justify-between gap-2 text-xs">
        <span className="flex-1">
          <span className="mr-1.5 text-emerald-600">✓</span>
          <span className="font-medium text-gray-700">Email</span>
          <span className="ml-1.5 text-gray-500">
            Sent {successCount}/{sentTouchpoints.length}
            {failureCount > 0 && (
              <span className="ml-1 text-amber-700">({failureCount} failed)</span>
            )}
            {" · "}
            {formatRelative(sentTouchpoints[0].created_at)}
          </span>
        </span>
      </li>
    );
  }

  if (task) {
    const sched = new Date(task.due_at);
    return (
      <li className="space-y-1 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="flex-1">
            <span className="mr-1.5 text-gray-400">⏳</span>
            <span className="font-medium text-gray-700">Email</span>
            <span className="ml-1.5 text-gray-500">Auto-sends {sched.toLocaleString()}</span>
          </span>
          {editable && (
            <span className="flex shrink-0 gap-1">
              <button
                onClick={() => setShowEdit(true)}
                className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Skip this email? It won't send.")) {
                    handleErr(action("skip_pending_email", { task_id: task.id }));
                  }
                }}
                className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
              >
                Skip
              </button>
            </span>
          )}
          {!editable && task.status === "pending" && (
            <span className="shrink-0 text-[11px] italic text-gray-400">Sending soon — locked</span>
          )}
        </div>
        {showEdit && (
          <EditPendingEmailModal
            task={task}
            onCancel={() => setShowEdit(false)}
            onSubmit={async (payload) => {
              try {
                await action("edit_pending_email", { task_id: task.id, ...payload });
                setShowEdit(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Save failed");
                throw e;
              }
            }}
          />
        )}
      </li>
    );
  }

  // No pending task and no sent touchpoint — either skipped or not yet scheduled.
  return (
    <li className="text-xs text-gray-400">
      <span className="mr-1.5">○</span>
      <span>Email — not scheduled</span>
    </li>
  );
}

// ── Phone step (manual call disposition) ────────────────────────────────

function PhoneStepRow({
  day,
  task,
  ctx,
  action,
  setError,
}: {
  day: number;
  task: Task | null;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [notes, setNotes] = useState("");

  // Already-logged call for this day?
  const callTouchpoint = ctx.touchpoints.find((t) => isCallForDay(t, day));
  const primary = ctx.contacts.find((c) => c.status === "active" && c.phone) ?? null;
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  const log = (disposition: string) => {
    handleErr(action("log_call", { disposition, contact_id: primary?.id ?? null, notes }));
    setShowPanel(false);
    setNotes("");
  };

  if (callTouchpoint) {
    return (
      <li className="text-xs">
        <span className="mr-1.5 text-emerald-600">✓</span>
        <span className="font-medium text-gray-700">Call</span>
        <span className="ml-1.5 text-gray-500">
          {humanCall(callTouchpoint.touchpoint_type)} · {formatRelative(callTouchpoint.created_at)}
        </span>
      </li>
    );
  }

  if (!task) {
    return (
      <li className="text-xs text-gray-400">
        <span className="mr-1.5">○</span>
        <span>Call — not scheduled</span>
      </li>
    );
  }

  const sched = new Date(task.due_at);
  const isDue = sched.getTime() <= Date.now();
  const script = callScript(
    {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      campus_name: ctx.campus.name,
    },
    day,
  );

  return (
    <li className="space-y-1 text-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1">
          <span className="mr-1.5 text-gray-400">{isDue ? "▶" : "⏳"}</span>
          <span className="font-medium text-gray-700">Call</span>
          <span className="ml-1.5 text-gray-500">
            {isDue ? "Due now" : `Queued for ${sched.toLocaleDateString()}`}
            {primary?.phone && ` · ${primary.phone}`}
          </span>
        </span>
        <button
          onClick={() => setShowPanel((s) => !s)}
          className="shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50"
        >
          {showPanel ? "Hide" : "Log call"}
        </button>
      </div>
      {showPanel && (
        <div className="rounded-md border border-gray-100 bg-gray-50 p-2 text-xs">
          <pre className="mb-2 whitespace-pre-wrap text-gray-700">{script.script}</pre>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => log("no_answer")} className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50">No answer</button>
            <button onClick={() => log("voicemail")} className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50">Voicemail</button>
            <button onClick={() => log("connected")} className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700">Connected</button>
            <button onClick={() => log("wrong_number")} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100">Wrong number</button>
          </div>
        </div>
      )}
    </li>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function mapTasksByDay(tasks: Task[], taskType: string): Map<number, Task> {
  const out = new Map<number, Task>();
  for (const t of tasks) {
    if (t.task_type !== taskType) continue;
    const day = (t.payload as Record<string, unknown>)?.day;
    if (typeof day === "number" && !out.has(day)) out.set(day, t);
  }
  return out;
}

function isEmailSentForDay(t: Touchpoint, day: number): boolean {
  if (t.touchpoint_type !== "email_sent") return false;
  const p = (t.payload ?? {}) as Record<string, unknown>;
  return p.cadence_day === day;
}

function isCallForDay(t: Touchpoint, day: number): boolean {
  if (!["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"].includes(t.touchpoint_type)) return false;
  const p = (t.payload ?? {}) as Record<string, unknown>;
  // Calls don't currently tag day in payload (calls are admin-driven). For
  // v4 MVP we accept that any call touchpoint stops further call rendering.
  // A more precise mapping by day can come later.
  void day;
  return true;
}

function humanCall(type: string): string {
  switch (type) {
    case "call_no_answer": return "no answer";
    case "call_voicemail": return "voicemail";
    case "call_connected": return "connected";
    case "call_wrong_number": return "wrong number";
    default: return type;
  }
}

function formatRelative(iso: string): string {
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
