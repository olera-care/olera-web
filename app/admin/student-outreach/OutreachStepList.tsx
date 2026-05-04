"use client";

/**
 * OutreachStepList — the v3 vertical step checklist for `researched`
 * and `outreach_sent` stages.
 *
 * Replaces the v2 button-tray UX with one ordered, sequential list:
 *   each step is either ✓ done, ▶ active (with inline action),
 *   ✗ skipped, or ○ upcoming. The required step gates the
 *   "Move to next day" button.
 */

import { useMemo, useState } from "react";
import { EmailSendModal } from "./EmailSendModal";
import {
  currentCadenceDay,
  nextCadenceDay,
  type OutreachDay,
  type OutreachStep,
  type StepId,
} from "@/lib/student-outreach/cadence";
import { callScript, getTemplate } from "@/lib/student-outreach/templates";
import type { DrawerContext, Touchpoint } from "@/lib/student-outreach/types";

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

interface Props {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}

type StepState = "done" | "skipped" | "active" | "upcoming";

export function OutreachStepList({ ctx, action, setError }: Props) {
  const type = ctx.outreach.stakeholder_type;
  const day =
    ctx.outreach.status === "researched"
      ? ctx.outreach.cadence_day // 0 by default for researched (entered via state machine)
      : ctx.outreach.cadence_day;

  const dayDef = currentCadenceDay(type, day) ?? currentCadenceDay(type, 0);
  if (!dayDef) {
    return (
      <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
        No cadence defined for day {day}. Use Status overrides to advance.
      </p>
    );
  }

  return (
    <DayList
      day={dayDef}
      ctx={ctx}
      action={action}
      setError={setError}
    />
  );
}

// ── DayList: the rendered checklist + advance button ────────────────────

function DayList({
  day,
  ctx,
  action,
  setError,
}: {
  day: OutreachDay;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const stepStates = useMemo(
    () => computeStepStates(day, ctx.touchpoints),
    [day, ctx.touchpoints],
  );

  const requiredSteps = day.steps.filter((s) => s.required);
  const allRequiredDone = requiredSteps.every(
    (s) => stepStates[s.id] === "done",
  );

  const next = nextCadenceDay(ctx.outreach.stakeholder_type, day.day);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">{day.title}</p>

      <ol className="space-y-2">
        {day.steps.map((step, idx) => {
          const state: StepState = stepStates[step.id] ?? "upcoming";
          return (
            <StepRow
              key={step.id}
              step={step}
              state={state}
              isCurrent={isStepActive(step, stepStates, day.steps, idx)}
              day={day.day}
              ctx={ctx}
              action={action}
              setError={setError}
            />
          );
        })}
      </ol>

      {ctx.outreach.status === "outreach_sent" && (
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
          {allRequiredDone ? (
            next ? (
              <button
                onClick={() => action("advance_to_next_day").catch((e) => setError(e instanceof Error ? e.message : "Advance failed"))}
                className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                ✓ Required complete — Move to {next.title} →
              </button>
            ) : (
              <p className="text-center text-xs text-gray-600">
                Cadence cycle complete. Close as No Response if cold, or Mark as Active Partner if they've committed.
              </p>
            )
          ) : (
            <p className="text-center text-xs text-gray-500">
              Complete the required step{requiredSteps.length > 1 ? "s" : ""} above to advance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── StepRow ─────────────────────────────────────────────────────────────

function StepRow({
  step,
  state,
  isCurrent,
  day,
  ctx,
  action,
  setError,
}: {
  step: OutreachStep;
  state: StepState;
  isCurrent: boolean;
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const expanded = isCurrent && state === "active";
  return (
    <li
      className={`rounded-md border p-3 ${
        state === "done"
          ? "border-emerald-100 bg-emerald-50/40"
          : state === "skipped"
          ? "border-gray-100 bg-gray-50 opacity-70"
          : isCurrent
          ? "border-gray-300 bg-white shadow-sm"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            <span className="mr-2" aria-hidden>{stateGlyph(state, isCurrent)}</span>
            {stepLabel(step)}
            {!step.required && (
              <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
            )}
          </p>
          <p className="mt-0.5 ml-6 text-xs text-gray-500">
            {state === "done" ? doneSummary(step, ctx.touchpoints, day) :
             state === "skipped" ? "Skipped" :
             channelHint(step)}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="ml-6 mt-3">
          <StepActionPanel
            step={step}
            day={day}
            ctx={ctx}
            action={action}
            setError={setError}
          />
        </div>
      )}
    </li>
  );
}

// ── Action panels per step type ─────────────────────────────────────────

function StepActionPanel({
  step,
  day,
  ctx,
  action,
  setError,
}: {
  step: OutreachStep;
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  if (step.id === "email") return <EmailStepPanel step={step} day={day} ctx={ctx} action={action} setError={setError} />;
  if (step.id === "ig_dm") return <IgStepPanel day={day} ctx={ctx} action={action} setError={setError} />;
  if (step.id === "contact_form") return <FormStepPanel day={day} ctx={ctx} action={action} setError={setError} />;
  if (step.id === "phone") return <PhoneStepPanel day={day} ctx={ctx} action={action} setError={setError} />;
  return null;
}

// ── Email step ──────────────────────────────────────────────────────────

function EmailStepPanel({
  step,
  day,
  ctx,
  action,
  setError,
}: {
  step: OutreachStep;
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const eligible = ctx.contacts.filter((c) => c.status === "active" && c.email);

  const draft = useMemo(() => {
    const tplKey = step.template ?? "intro";
    return getTemplate(tplKey, {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      campus_name: ctx.campus.name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.template, ctx.outreach.stakeholder_type, ctx.outreach.organization_name, ctx.campus.name]);

  if (eligible.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-700">
          No active contacts with email yet. Add a contact above before sending.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">
        Sending to {eligible.length} contact{eligible.length === 1 ? "" : "s"} (you'll pick exactly who in the modal).
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Open send dialog →
        </button>
      </div>
      {showModal && (
        <EmailSendModal
          contacts={ctx.contacts}
          draft={draft}
          cadenceDay={day}
          stepId={step.id}
          template={step.template ?? "intro"}
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          onCancel={() => setShowModal(false)}
          onSubmit={async (payload) => {
            try {
              await action("send_outreach_email", payload);
              setShowModal(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Send failed");
              throw e;
            }
          }}
        />
      )}
    </div>
  );
}

// ── IG DM step ──────────────────────────────────────────────────────────

function IgStepPanel({
  day,
  ctx,
  action,
  setError,
}: {
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const igContacts = ctx.contacts.filter((c) => c.status === "active" && c.instagram);
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  if (igContacts.length === 0) {
    return (
      <div className="space-y-2 text-xs text-gray-700">
        <p className="text-amber-700">
          No officer has an Instagram handle on file. Add one in the Contacts section, or skip this step.
        </p>
        <SkipButton day={day} stepId="ig_dm" action={action} setError={setError}>
          Skip this step
        </SkipButton>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-gray-600">Officers with Instagram:</p>
      <ul className="space-y-1">
        {igContacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded border border-gray-100 bg-white px-2 py-1 text-xs">
            <span>
              <strong className="text-gray-900">{c.instagram}</strong>{" "}
              <span className="text-gray-500">({c.name})</span>
            </span>
            <a
              href={igUrl(c.instagram!)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600">Suggested DM:</p>
      <pre className="whitespace-pre-wrap rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs text-gray-700">
{`Hi! Just sent your org an email about a paid clinical experience opportunity for ${ctx.campus.name} pre-health students. Wanted to make sure it didn't get buried — happy to share details if useful!`}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleErr(action("mark_step_done", { cadence_day: day, step_id: "ig_dm" }))}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          ✓ I sent the DM
        </button>
        <SkipButton day={day} stepId="ig_dm" action={action} setError={setError}>Skip</SkipButton>
      </div>
    </div>
  );
}

function igUrl(handle: string): string {
  const h = handle.replace(/^@/, "").trim();
  return `https://instagram.com/${h}`;
}

// ── Contact form step ───────────────────────────────────────────────────

function FormStepPanel({
  day,
  ctx,
  action,
  setError,
}: {
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const formContact = ctx.contacts.find((c) => c.status === "active" && c.contact_form_url);
  const url = formContact?.contact_form_url ?? "";
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  if (!url) {
    return (
      <div className="space-y-2 text-xs text-gray-700">
        <p className="text-amber-700">
          No contact-form URL on file. Add one to a contact in the Contacts section, or skip.
        </p>
        <SkipButton day={day} stepId="contact_form" action={action} setError={setError}>
          Skip this step
        </SkipButton>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-gray-600">
        Submit the form below — paste the same intro text we used in the email.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-block rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-gray-50"
      >
        Open form ↗
      </a>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => handleErr(action("mark_step_done", { cadence_day: day, step_id: "contact_form" }))}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          ✓ I submitted the form
        </button>
        <SkipButton day={day} stepId="contact_form" action={action} setError={setError}>Skip</SkipButton>
      </div>
    </div>
  );
}

// ── Phone step ──────────────────────────────────────────────────────────

function PhoneStepPanel({
  day,
  ctx,
  action,
  setError,
}: {
  day: number;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const primary = ctx.contacts.find((c) => c.status === "active" && c.phone) ?? null;
  const [notes, setNotes] = useState("");
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Failed"));

  const script = callScript(
    {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      campus_name: ctx.campus.name,
    },
    day,
  );

  const log = (disposition: string) =>
    handleErr(action("log_call", { disposition, contact_id: primary?.id ?? null, notes }));

  if (!primary) {
    return (
      <div className="space-y-2 text-xs text-gray-700">
        <p className="text-amber-700">No active contact with a phone number on file.</p>
        <SkipButton day={day} stepId="phone" action={action} setError={setError}>
          Skip this step
        </SkipButton>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-gray-600">
        Call: <a href={`tel:${primary.phone}`} className="font-medium text-blue-600 hover:underline">{primary.phone}</a> ({primary.name})
      </p>
      <pre className="whitespace-pre-wrap rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs text-gray-700">
{script.script}
      </pre>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => log("no_answer")} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">No answer</button>
        <button onClick={() => log("voicemail")} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Voicemail</button>
        <button onClick={() => log("connected")} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Connected</button>
        <button onClick={() => log("wrong_number")} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">Wrong number</button>
      </div>
    </div>
  );
}

function SkipButton({
  day,
  stepId,
  action,
  setError,
  children,
}: {
  day: number;
  stepId: StepId;
  action: ActionFn;
  setError: (e: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() =>
        action("mark_step_skipped", { cadence_day: day, step_id: stepId })
          .catch((e) => setError(e instanceof Error ? e.message : "Skip failed"))
      }
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function computeStepStates(
  day: OutreachDay,
  touchpoints: Touchpoint[],
): Record<string, StepState> {
  const out: Record<string, StepState> = {};
  for (const step of day.steps) {
    out[step.id] = stepStateFor(step, day.day, touchpoints);
  }
  return out;
}

function stepStateFor(
  step: OutreachStep,
  day: number,
  touchpoints: Touchpoint[],
): StepState {
  // Touchpoints tagged with this day + step_id mark completion or skip.
  for (const t of touchpoints) {
    const p = (t.payload ?? {}) as Record<string, unknown>;
    if (p.cadence_day !== day) continue;
    if (t.touchpoint_type === "step_skipped" && p.step_id === step.id) {
      return "skipped";
    }
    if (p.step_id === step.id && matchesStepType(step, t)) {
      // For email: any successful send marks it done.
      if (step.id === "email") {
        if (p.success === true || t.outcome === "sent") return "done";
        // If only failures recorded, leave as active so admin can retry.
      } else {
        return "done";
      }
    }
  }
  return "active"; // step is active by default — until completed/skipped
}

function matchesStepType(step: OutreachStep, t: Touchpoint): boolean {
  switch (step.id) {
    case "email": return t.touchpoint_type === "email_sent";
    case "ig_dm": return t.touchpoint_type === "ig_dm_sent";
    case "contact_form": return t.touchpoint_type === "contact_form_submitted";
    case "phone": return ["call_no_answer", "call_voicemail", "call_connected", "call_wrong_number"].includes(t.touchpoint_type);
  }
}

function isStepActive(
  step: OutreachStep,
  states: Record<string, StepState>,
  steps: OutreachStep[],
  idx: number,
): boolean {
  // Active = the first step whose state is 'active' (not done/skipped).
  for (let i = 0; i < steps.length; i++) {
    const s = states[steps[i].id];
    if (s === "active") return i === idx;
  }
  return false;
}

function stepLabel(step: OutreachStep): string {
  if (step.label) return step.label;
  switch (step.id) {
    case "email": return "Send email";
    case "ig_dm": return "Send Instagram DM";
    case "contact_form": return "Submit contact form";
    case "phone": return "Make phone call";
  }
}

function channelHint(step: OutreachStep): string {
  switch (step.id) {
    case "email": return "Personalized email per recipient · PDF flyer attached automatically";
    case "ig_dm": return "Direct message via Instagram";
    case "contact_form": return "Submit through the org's website contact form";
    case "phone": return "Call the office line";
  }
}

function stateGlyph(state: StepState, isCurrent: boolean): string {
  if (state === "done") return "✓";
  if (state === "skipped") return "—";
  if (isCurrent) return "▶";
  return "○";
}

function doneSummary(step: OutreachStep, touchpoints: Touchpoint[], day: number): string {
  // Build a short "completed" summary for this step+day.
  const matches = touchpoints.filter((t) => {
    const p = (t.payload ?? {}) as Record<string, unknown>;
    return p.cadence_day === day && p.step_id === step.id;
  });
  if (matches.length === 0) return "Done";
  if (step.id === "email") {
    const ok = matches.filter((m) => (m.payload as Record<string, unknown>)?.success === true || m.outcome === "sent").length;
    const fail = matches.length - ok;
    const at = matches[matches.length - 1].created_at;
    return `Sent · ${ok}${fail ? ` (${fail} failed)` : ""} · ${formatRelative(at)}`;
  }
  return `Done · ${formatRelative(matches[matches.length - 1].created_at)}`;
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

