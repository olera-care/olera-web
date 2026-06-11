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
import { LogCallOutcomeModal } from "./LogCallOutcomeModal";
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
      <p className="text-sm text-gray-700">
        Outreach plan · {days.length} touch{days.length === 1 ? "" : "es"} across the cadence.
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
        {/* v8.10.33: subtle "coming soon" hints for future Day 0 channels.
            Mail + Fax aren't queued by the cron yet; they're surfaced here
            so admins know they'll eventually fire alongside email + phone. */}
        {day.day === 0 && (
          <>
            <li className="text-xs text-gray-300">
              <span className="mr-1.5">○</span>
              <span>Mail</span>
              <span className="ml-1.5 italic">— coming soon</span>
            </li>
            <li className="text-xs text-gray-300">
              <span className="mr-1.5">○</span>
              <span>Fax</span>
              <span className="ml-1.5 italic">— coming soon</span>
            </li>
          </>
        )}
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

  // No pending task and no sent touchpoint. v8.10.1: distinguish past
  // (skipped — admin canceled, or reply paused the cadence) from future
  // (queues on Day N — task hasn't been created yet but cadence
  // anticipates one). Anchor on the earliest Day-0 email_sent timestamp,
  // not on the stale ctx.outreach.cadence_day column.
  const todayDay = computeTodayDay(ctx);
  const isFuture = day > todayDay;
  return (
    <li className="text-xs text-gray-400">
      <span className="mr-1.5">○</span>
      <span>Email — {isFuture ? `queues on Day ${day}` : "skipped"}</span>
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
  const [showScript, setShowScript] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Already-logged call for this day? v8.10: filtered by payload.cadence_day.
  const callTouchpoint = ctx.touchpoints.find((t) => isCallForDay(t, day));
  const primary = ctx.contacts.find((c) => c.status === "active" && c.phone) ?? null;
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

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

  // No task in the DB for this phone step yet. v8.10: distinguish past vs.
  // future based on today's relationship to the cadence anchor.
  // v8.10.1: anchor on the earliest Day-0 email_sent timestamp (real
  // elapsed time), not on ctx.outreach.cadence_day — that column is
  // set to 0 on row create and never advances.
  // v8.10.3: surface WHY a past day was skipped — either the contact
  // had no phone at schedule time (handleScheduleSequence drops phone
  // steps when has_phone=false), or the cadence was paused by a
  // resolution event (reply / meeting / connected — see
  // supersedePendingFollowupCalls). The step list only renders for
  // outreach_sent / engaged / meeting_scheduled, so partner/closed
  // exits don't surface here.
  if (!task) {
    const todayDay = computeTodayDay(ctx);
    if (day > todayDay) {
      return (
        <li className="text-xs text-gray-400">
          <span className="mr-1.5">○</span>
          <span>Call — queues on Day {day}</span>
        </li>
      );
    }
    const reason = primary?.phone
      ? "cadence paused"
      : "no phone on file";
    return (
      <li className="text-xs text-gray-400">
        <span className="mr-1.5">○</span>
        <span>Call — skipped ({reason})</span>
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

  // Due calls get a prominent green block; phone number is the dial
  // affordance (tel: link), and the primary CTA is "Log the Call" which
  // opens the v8.8 LogCallOutcomeModal (7 outcomes).
  if (isDue && primary?.phone) {
    return (
      <>
        <li className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50/60 p-3" title="Phone call is due. Click the number to dial, then log the outcome.">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                📞 <a href={`tel:${primary.phone}`} className="underline hover:no-underline" title="Tap to dial (mobile)">{primary.phone}</a>
              </p>
              <p className="text-[11px] text-emerald-800">
                {primary.name}{primary.role ? ` · ${primary.role}` : ""} · Day {day}
              </p>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              title="Pick the outcome of the call. The cadence advances after logging."
            >
              Log the Call
            </button>
          </div>
          <button
            onClick={() => setShowScript((s) => !s)}
            className="text-xs text-emerald-900 underline hover:no-underline"
          >
            {showScript ? "Hide script" : "Show script"}
          </button>
          {showScript && (
            <pre className="rounded-md border border-emerald-200 bg-white p-2 text-xs whitespace-pre-wrap text-gray-700">{script.script}</pre>
          )}
        </li>
        {showLogModal && (
          <LogCallOutcomeModal
            organizationName={ctx.outreach.organization_name}
            contactName={primary.name}
            contactPhone={primary.phone}
            stakeholderType={ctx.outreach.stakeholder_type}
            onCancel={() => setShowLogModal(false)}
            onSubmit={async (outcome, notes, partner) => {
              await handleErr(
                action("log_call", {
                  outcome,
                  notes,
                  contact_id: primary.id,
                  cadence_day: day,
                }),
              );
              if (partner) {
                await handleErr(action("mark_partner", { ...partner }));
              }
              setShowLogModal(false);
            }}
          />
        )}
      </>
    );
  }

  // Scheduled-but-not-due call (⏳ row) — no inline log panel anymore;
  // admin can log via the Calls tab when the task fires, or via the
  // green block above when it goes due. Keeps this row purely passive.
  return (
    <li className="text-xs">
      <span className="mr-1.5 text-gray-400">⏳</span>
      <span className="font-medium text-gray-700">Call</span>
      <span className="ml-1.5 text-gray-500">
        Queued for {sched.toLocaleDateString()}
        {primary?.phone && ` · ${primary.phone}`}
      </span>
    </li>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Compute "today's cadence day" by anchoring to the earliest email_sent
 * touchpoint with cadence_day=0. The student_outreach.cadence_day column
 * is set to 0 at row creation and never advanced by the cron, so we can't
 * trust it as a present-time pointer. Real elapsed time since Day 0 IS
 * the cadence position.
 *
 * Returns 0 when no anchor exists (early-stage rows still in research).
 */
function computeTodayDay(ctx: DrawerContext): number {
  let earliestDay0: number | null = null;
  for (const t of ctx.touchpoints) {
    if (t.touchpoint_type !== "email_sent") continue;
    const p = (t.payload ?? {}) as Record<string, unknown>;
    if (p.cadence_day !== 0) continue;
    const ts = new Date(t.created_at).getTime();
    if (earliestDay0 === null || ts < earliestDay0) earliestDay0 = ts;
  }
  if (earliestDay0 === null) return 0;
  return Math.floor((Date.now() - earliestDay0) / 86_400_000);
}

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
  // v8.10: handleLogCall now tags every call touchpoint with cadence_day
  // (read from the task it claims). Untagged legacy touchpoints (pre-v8.10)
  // still match Day 0 as a graceful fallback so existing rows don't lose
  // their Day-0 timeline entry.
  const p = (t.payload ?? {}) as Record<string, unknown>;
  const tagged = p.cadence_day;
  if (typeof tagged === "number") return tagged === day;
  return day === 0;
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
