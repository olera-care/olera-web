"use client";

/**
 * NextStepCard — drawer keystone, stage-driven operational card.
 *
 * Zone 2 of the unified drawer skeleton. Renders the single most
 * relevant action for the row's current Stage. One component, eight
 * stage branches; no per-entity-kind forks except for the contextual
 * "Make Client" / "Mark Partner" terminal CTAs (deferred to the
 * conversion-action commits).
 *
 * Owns the modal launchers for stage-specific log actions. The
 * existing per-stage modals (PreFlightReviewModal,
 * ReplyClassifierModal, LogMeetingModal, LogCallOutcomeModal) are
 * mounted here so the drawer body just slots in a single component
 * and the next-action machinery follows.
 *
 * Replaces:
 *   - ProviderProspectDrawerBody's bare "Launch outreach" button
 *     (this commit)
 *   - Partner drawer's NextStepPanel (next commit; migration deferred
 *     to keep the diff reviewable)
 *
 * Stage-driven content rules (see §5 of the architecture doc):
 *
 *   prospect       → thin "Pre-Flight in progress" indicator. The
 *                    operational surface (checklist + Visit Website +
 *                    Call to Confirm + Launch Outreach) lives in the
 *                    Research Card below (Phase 2e).
 *   in_outreach    → "Awaiting reply · Day X email next" with Log
 *                    reply / Log call secondary actions
 *   call_due       → phone line + Log call outcome primary CTA
 *   meeting_set    → meeting time + Log meeting outcome primary CTA
 *   follow_up      → custom event copy + Log outcome
 *   bounce_fix     → fix-email-and-resend flow (UI placeholder until
 *                    webhook touchpoint emission lands)
 *   converted      → terminal-positive copy, no CTA
 *   closed         → reopen CTA
 */

import { useState } from "react";
import {
  deriveStage,
  STAGE_DISPLAY,
  type Stage,
} from "@/lib/medjobs/stage";
import {
  formatLongDate,
  formatRelative,
} from "@/lib/student-outreach/formatters";
import type { DrawerContext } from "@/lib/student-outreach/types";
import {
  getEngagementSubState,
  getLatestEngagementStats,
} from "@/lib/student-outreach/engagement-state";
import { logActionSuccessMessage } from "@/lib/student-outreach/log-success-messages";
import { ReplyClassifierModal } from "@/app/admin/student-outreach/ReplyClassifierModal";
import { LogMeetingModal } from "@/app/admin/student-outreach/LogMeetingModal";
import { LogCallOutcomeModal } from "@/app/admin/student-outreach/LogCallOutcomeModal";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import type { TemplateKey } from "@/lib/student-outreach/cadence";
import { useToast } from "@/components/admin/Toast";
import { useRecentMoves } from "@/components/admin/RecentMoves";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

export interface NextStepCardProps {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}

export function NextStepCard({
  ctx,
  action: rawAction,
  setError,
}: NextStepCardProps) {
  // E1 + E2: wrap the action dispatcher so successful Log operations
  // (a) surface a toast naming the consequence and (b) mark the row
  // as recently moved so the destination tab can highlight it.
  // Actions not in the message map (e.g. update_research,
  // update_outreach, update_general_contact) stay silent — those run
  // on blur and would be noisy to toast or highlight.
  const toast = useToast();
  const { markMoved } = useRecentMoves();
  const action: ActionFn = async (actionName, payload) => {
    const result = await rawAction(actionName, payload);
    const message = logActionSuccessMessage(actionName, payload ?? null);
    if (message) {
      toast(message);
      markMoved(ctx.outreach.id);
    }
    return result;
  };

  // Derive stage from the same source-of-truth used by cards + tabs.
  // The drawer hydrates full touchpoints + pending tasks so we get
  // the most accurate stage (including bounce_fix once webhook
  // emission lands).
  const stage = deriveStage({
    outreach: { status: ctx.outreach.status, kind: ctx.outreach.kind ?? null },
    touchpoints: ctx.touchpoints.map((t) => ({
      touchpoint_type: t.touchpoint_type,
      created_at: t.created_at,
      payload: t.payload,
    })),
    pendingTasks: ctx.pending_tasks.map((t) => ({
      task_type: t.task_type,
      due_at: t.due_at,
      status: "pending",
      payload: t.payload,
    })),
    businessProfile: ctx.provider_business_profile
      ? { metadata: ctx.provider_business_profile.metadata ?? null }
      : null,
  });

  const display = STAGE_DISPLAY[stage];

  // v9 final: standalone Make Client / Mark Partner footers removed.
  // Conversion is now an outcome inside the Log modal (call /
  // meeting / reply) — keeps the model consistent: open the row,
  // hit Log, record what happened, system advances state. No
  // separate top-level button drift.

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Next step
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-4">
          <StageBody
            stage={stage}
            ctx={ctx}
            action={action}
            setError={setError}
            stageLabel={display.label}
          />
        </div>
      </div>
    </section>
  );
}

// ── Stage-specific bodies ────────────────────────────────────────────────

function StageBody({
  stage,
  ctx,
  action,
  setError,
  stageLabel,
}: {
  stage: Stage;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  stageLabel: string;
}) {
  switch (stage) {
    case "prospect":
      return <ProspectBody ctx={ctx} />;
    case "in_outreach":
      return <InOutreachBody ctx={ctx} action={action} setError={setError} />;
    case "call_due":
      return <CallDueBody ctx={ctx} action={action} setError={setError} />;
    case "meeting_set":
      return <MeetingSetBody ctx={ctx} action={action} setError={setError} />;
    case "follow_up":
      return <FollowUpBody ctx={ctx} action={action} setError={setError} />;
    case "bounce_fix":
      return <BounceFixBody />;
    case "converted":
      return <ConvertedBody ctx={ctx} stageLabel={stageLabel} />;
    case "closed":
      return <ClosedBody ctx={ctx} action={action} setError={setError} />;
  }
}

// ── prospect ─────────────────────────────────────────────────────────────

/**
 * v9.x Phase 2e: Pre-Flight surface moved into the Research Card.
 * The NextStepCard's prospect body collapses to a minimal stage
 * indicator — directs admin downward, where the Research Card now
 * carries the Business Name, General Contact, Decision Maker,
 * Verification status, and the Visit Website / Call to Confirm /
 * Launch Outreach action footer.
 *
 * Nothing actionable lives here anymore; the previous
 * checklist + ContactFormBanner + Visit Website / Call to Confirm /
 * Launch Outreach buttons + their three modals all moved to the
 * Research Card (SnapshotCard.tsx, Phases 2b–2d).
 */
function ProspectBody({ ctx: _ctx }: { ctx: DrawerContext }) {
  return (
    <>
      <p className="text-sm font-medium text-gray-900">
        Pre-Flight in progress
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        Complete the Research Card below — Visit Website, collect any missing
        info, Call to Confirm, then Launch Outreach.
      </p>
    </>
  );
}

// ── in_outreach ──────────────────────────────────────────────────────────

function InOutreachBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [showLogReply, setShowLogReply] = useState(false);
  const [schedulingCall, setSchedulingCall] = useState(false);

  // Find the next pending email or call task to surface the "what's
  // queued next" hint. Cheap inline scan — ctx.pending_tasks is small.
  const nextEmail = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_email_send")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const nextCall = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_followup_call")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const lastEmailSent = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // v10 Bullet 6: branch on engagement sub-state. Three branches:
  //   no_engagement       → "Awaiting reply or click" (existing copy)
  //   opened_not_clicked  → "They opened — give them time"
  //   clicked_not_activated → "They clicked — call them" (HIGHLIGHTED;
  //                          adds primary "Schedule call now" action)
  const subState = getEngagementSubState({
    status: ctx.outreach.status,
    touchpoints: ctx.touchpoints,
  });
  const engagement = getLatestEngagementStats({
    status: ctx.outreach.status,
    touchpoints: ctx.touchpoints,
  });

  // v10 Bullet 6 (Pass C5): schedule a manual call task due today as the
  // immediate response to a clicked-not-activated row. Uses the existing
  // queue_manual_task action — no new action surface (G2 discipline).
  const scheduleCallNow = async () => {
    setSchedulingCall(true);
    setError(null);
    try {
      const noteParts: string[] = ["Click follow-up"];
      if (engagement?.clickedCtas[0]) {
        noteParts.push(`(clicked: ${engagement.clickedCtas[0]})`);
      }
      await action("queue_manual_task", {
        task_type: "outreach_followup_call",
        due_at: new Date().toISOString(),
        notes: noteParts.join(" "),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't schedule call");
    } finally {
      setSchedulingCall(false);
    }
  };

  // ── Branch: reply received (HIGHEST PRIORITY) ─────────────────────────
  // A reply outranks open/click signals: show the Email face (the real reply
  // + Interested / Not interested) regardless of the engagement sub-state.
  const latestReply = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_replied")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latestReply) {
    return (
      <>
        <ReplyPreview reply={latestReply} />
        <ActivationActions
          ctx={ctx}
          action={action}
          setError={setError}
          source="reply"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLogReply(true)}
            title="Log a reply you handled in your inbox."
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log reply
          </button>
        </div>
        {showLogReply && (
          <ReplyClassifierModalMount
            ctx={ctx}
            action={action}
            setError={setError}
            onClose={() => setShowLogReply(false)}
          />
        )}
      </>
    );
  }

  // ── Branch: clicked_not_activated (HIGHEST PRIORITY) ──────────────────
  if (subState === "clicked_not_activated" && engagement) {
    const ctaLabel = engagement.clickedCtas[0] ?? "an email link";
    const lastClicked = engagement.lastClickedAt
      ? formatRelative(engagement.lastClickedAt)
      : "recently";
    return (
      <>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
            Clicked
          </span>
          <p className="text-sm font-semibold text-gray-900">
            They clicked — call them.
          </p>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Visited{" "}
          <span className="font-medium text-gray-800">{ctaLabel}</span>{" "}
          {lastClicked}. Haven&apos;t accepted the pilot yet.
        </p>
        {nextCall && (
          <p className="mt-1 text-xs text-gray-500">
            Next scheduled call: {formatRelative(nextCall.due_at)}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={scheduleCallNow}
            disabled={schedulingCall}
            title="Queue a call due today — they're warm, close the loop while it's fresh."
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {schedulingCall ? "Scheduling…" : "Schedule call now →"}
          </button>
          <button
            onClick={() => setShowLogReply(true)}
            title="If they replied via email instead, log it here."
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log reply
          </button>
        </div>
        {showLogReply && (
          <ReplyClassifierModalMount
            ctx={ctx}
            action={action}
            setError={setError}
            onClose={() => setShowLogReply(false)}
          />
        )}
      </>
    );
  }

  // ── Branch: opened_not_clicked (give them time) ────────────────────────
  if (subState === "opened_not_clicked" && engagement) {
    const openLabel = engagement.openCount === 1 ? "Opened once" : `Opened ${engagement.openCount}×`;
    const lastOpened = engagement.lastOpenedAt
      ? formatRelative(engagement.lastOpenedAt)
      : "recently";
    return (
      <>
        <p className="text-sm font-medium text-gray-900">
          They opened — give them time.
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {openLabel} since {lastOpened}. No click yet — the cadence will keep working.
        </p>
        {nextEmail && (
          <p className="mt-1 text-xs text-gray-500">
            Next email: Day {String(nextEmail.payload?.day ?? "?")} ({formatRelative(nextEmail.due_at)})
          </p>
        )}
        {nextCall && (
          <p className="mt-0.5 text-xs text-gray-500">
            Next call: {formatRelative(nextCall.due_at)}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLogReply(true)}
            title="Log a reply you received in your inbox."
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log reply
          </button>
        </div>
        {showLogReply && (
          <ReplyClassifierModalMount
            ctx={ctx}
            action={action}
            setError={setError}
            onClose={() => setShowLogReply(false)}
          />
        )}
      </>
    );
  }

  // ── Branch: no_engagement (existing copy) ──────────────────────────────
  const subline = nextEmail
    ? `Next: Day ${nextEmail.payload?.day ?? "?"} email · due ${formatRelative(nextEmail.due_at)}`
    : lastEmailSent
      ? `Last email sent ${formatRelative(lastEmailSent.created_at)} · cadence complete`
      : "Outreach in flight";

  return (
    <>
      <p className="text-sm text-gray-700">
        Awaiting reply at graize@olera.care.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        When they respond, continue the conversation directly from your inbox and log the outcome here so the team sees it.
      </p>
      <p className="mt-1 text-xs text-gray-500">{subline}</p>
      <ActivationActions ctx={ctx} action={action} setError={setError} source="reply" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogReply(true)}
          title="Log a reply you received in your inbox."
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Log reply
        </button>
      </div>

      {showLogReply && (
        <ReplyClassifierModal
          organizationName={ctx.outreach.organization_name}
          source="email_reply"
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setShowLogReply(false)}
          onSubmit={async (classification, payload, _partner, redirect) => {
            try {
              if (classification === "became_client") {
                // P3: provider reply → direct client conversion. Dispatches
                // the existing make_client action which writes the metadata
                // flag, transitions to active_partner, and unlocks Partner
                // Prospects for catchment Sites.
                await action("make_client", { notes: payload.notes });
              } else if (classification === "redirected" && redirect) {
                // P4: add the new contact + stop the original cadence.
                // Two dispatches so the timeline narrates both events.
                // stop_cadence: true ensures cadence stops for the original
                // recipient even though we're using keep_emailing.
                const derivedName =
                  [redirect.first_name, redirect.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || redirect.email;
                await action("add_contact", {
                  name: derivedName,
                  first_name: redirect.first_name || null,
                  last_name: redirect.last_name || null,
                  email: redirect.email || null,
                });
                await action("classify_reply", {
                  classification: "keep_emailing",
                  notes: payload.notes,
                  stop_cadence: true,
                });
              } else {
                await action("classify_reply", {
                  classification,
                  notes: payload.notes,
                  meeting_at: payload.meeting_at,
                });
              }
              setShowLogReply(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}
    </>
  );
}

// ── call_due ─────────────────────────────────────────────────────────────

/**
 * v9.1 Graize 05.13 audit (Item 5): Calls drawer Next Step
 * restructured so the three actions are unmistakable:
 *   1. CALL pill — names the step the row is on
 *   2. Phone link — one tap to dial
 *   3. Suggested script (collapsible) — sourced from the next
 *      pending outreach_followup_call task's payload, which carries
 *      the resolved script set at PreFlight time
 *   4. Log call outcome button — the action that advances the row
 *
 * The script is shown as a `<details>` so it doesn't dominate the
 * card visually, but is one click away when admin needs it.
 */
function CallDueBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [showLogCall, setShowLogCall] = useState(false);
  // A call-due row may also be one admin opened from the Replies tab
  // (mid_cadence / awaiting_callback / etc.). Surface a secondary
  // "Log reply" affordance so admin can classify a reply without
  // bouncing back to the Replies tab. The Call CTA remains primary
  // since deriveStage already determined a call task is due.
  const [showLogReply, setShowLogReply] = useState(false);
  const primaryContact =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ?? null;
  const contactName = primaryContact
    ? [primaryContact.title, primaryContact.first_name, primaryContact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || primaryContact.name
    : null;

  const nextCallTask = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_followup_call")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const callScript =
    typeof nextCallTask?.payload?.script === "string"
      ? (nextCallTask.payload.script as string)
      : null;
  const callDay =
    typeof nextCallTask?.payload?.day === "number"
      ? (nextCallTask.payload.day as number)
      : null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
          Call
        </span>
        <p className="text-sm font-medium text-gray-900">
          Next step: make the call, use the script, log the outcome.
        </p>
      </div>
      <ActivationActions ctx={ctx} action={action} setError={setError} source="phone" />
      {primaryContact?.phone && (
        <p className="mt-2 text-sm">
          <a
            href={`tel:${primaryContact.phone}`}
            className="font-semibold text-primary-700 hover:underline"
          >
            📞 {primaryContact.phone}
          </a>
          {contactName && (
            <span className="ml-2 text-xs text-gray-500">· {contactName}</span>
          )}
        </p>
      )}
      {callScript && (
        <details className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            {callDay != null ? `Day ${callDay} script` : "Suggested script"}
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-700">
            {callScript}
          </pre>
        </details>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogCall(true)}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Log call outcome →
        </button>
        <button
          onClick={() => setShowLogReply(true)}
          title="They replied by email or voicemail? Log the reply instead."
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Log reply
        </button>
      </div>

      {showLogReply && (
        <ReplyClassifierModal
          organizationName={ctx.outreach.organization_name}
          source="email_reply"
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setShowLogReply(false)}
          onSubmit={async (classification, payload, _partner, redirect) => {
            try {
              if (classification === "became_client") {
                await action("make_client", { notes: payload.notes });
              } else if (classification === "redirected" && redirect) {
                const derivedName =
                  [redirect.first_name, redirect.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || redirect.email;
                await action("add_contact", {
                  name: derivedName,
                  first_name: redirect.first_name || null,
                  last_name: redirect.last_name || null,
                  email: redirect.email || null,
                });
                await action("classify_reply", {
                  classification: "keep_emailing",
                  notes: payload.notes,
                  stop_cadence: true,
                });
              } else {
                await action("classify_reply", {
                  classification,
                  notes: payload.notes,
                  meeting_at: payload.meeting_at,
                });
              }
              setShowLogReply(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}

      {showLogCall && (
        <LogCallOutcomeModal
          organizationName={ctx.outreach.organization_name}
          contactName={contactName}
          contactPhone={primaryContact?.phone ?? null}
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setShowLogCall(false)}
          onSubmit={async (outcome, notes, _partner, meetingAt) => {
            try {
              // R5: terminal admin overrides dispatched as their own
              // actions; everything else flows through log_call_outcome
              // as before.
              if (outcome === "mark_dnc" || outcome === "mark_no_response_closed") {
                await action(outcome, { notes });
              } else if (outcome === "meeting_scheduled") {
                // P1: call-driven meeting commitment dispatches
                // mark_meeting_scheduled directly so the row moves to
                // Meetings as booked with the optional datetime.
                await action("mark_meeting_scheduled", {
                  meeting_at: meetingAt ?? null,
                  notes,
                });
              } else {
                await action("log_call_outcome", { outcome, notes });
              }
              setShowLogCall(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}
    </>
  );
}

// ── meeting_set ──────────────────────────────────────────────────────────

function MeetingSetBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [showLogMeeting, setShowLogMeeting] = useState(false);
  const primaryContact =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ?? null;
  const contactName = primaryContact
    ? [primaryContact.title, primaryContact.first_name, primaryContact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || primaryContact.name
    : null;
  const meetingInitialStatus =
    ctx.meeting_state === "scheduled" ? "booked" : "finding_time";
  const meetingInitialAt = ctx.meeting_at ? ctx.meeting_at.slice(0, 16) : undefined;
  const sublineCopy =
    ctx.meeting_state === "scheduled" && ctx.meeting_at
      ? `📅 Booked · ${formatLongDate(ctx.meeting_at)}`
      : "Finding a time";

  return (
    <>
      <p className="text-sm text-gray-700">
        Meeting workflow active. Log the meeting status to keep the row moving.
      </p>
      <p className="mt-1 text-xs text-gray-500">{sublineCopy}</p>
      <ActivationActions
        ctx={ctx}
        action={action}
        setError={setError}
        source="meeting"
        introTemplate="activation_postmeeting_intro"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogMeeting(true)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Log meeting →
        </button>
      </div>

      {showLogMeeting && (
        <LogMeetingModal
          organizationName={ctx.outreach.organization_name}
          contactName={contactName}
          initialStatus={meetingInitialStatus}
          initialMeetingAt={meetingInitialAt}
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setShowLogMeeting(false)}
          onSubmit={async (mstatus, payload, partner) => {
            try {
              if (mstatus === "booked") {
                await action("mark_meeting_scheduled", {
                  meeting_at: payload.meeting_at,
                  notes: payload.notes,
                });
              } else if (mstatus === "finding_time") {
                await action("flag_wants_meeting", { notes: payload.notes });
              } else if (mstatus === "no_show") {
                // P6: emits the existing meeting_no_show touchpoint
                // (currently unused), then the standard meeting_in_flight
                // note. Row stays in Meetings as in_flight for rescheduling.
                await action("flag_wants_meeting", {
                  notes: payload.notes,
                  no_show: true,
                });
              } else if (mstatus === "done_followup") {
                await action("mark_meeting_followup", { notes: payload.notes });
              } else if (mstatus === "done_partner" && partner) {
                await action("mark_partner", { ...partner });
              } else if (mstatus === "done_client") {
                // P3: post-meeting provider conversion. Dispatches
                // make_client which writes interview_terms_accepted_at
                // on the business_profile and unlocks Partner Prospects.
                await action("make_client", { notes: payload.notes });
              } else if (mstatus === "not_a_fit") {
                // C3: post-meeting decline path. Reuses the existing
                // mark_not_interested action so the row closes,
                // pending tasks are cancelled via tasksToCancelOnExit,
                // and the stage_change touchpoint narrates the close.
                await action("mark_not_interested", { notes: payload.notes });
              }
              setShowLogMeeting(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}
    </>
  );
}

// ── follow_up ────────────────────────────────────────────────────────────

function FollowUpBody({
  ctx,
  action: _action,
  setError: _setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  // Surface the overdue custom event copy. For MVP, the admin opens
  // the timeline to log the outcome — no dedicated modal (custom
  // events are admin-defined and free-form). A "Mark done" affordance
  // lives on the timeline row itself once the OutreachTimeline lands.
  const overdueTask = ctx.pending_tasks
    .filter(
      (t) =>
        t.task_type === "manual_followup" &&
        (t.payload as Record<string, unknown> | null)?.reason === "custom",
    )
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const taskName = overdueTask
    ? String(
        (overdueTask.payload as Record<string, unknown> | null)?.notes ??
          (overdueTask.payload as Record<string, unknown> | null)?.description ??
          "Custom task",
      )
    : "Custom task";

  return (
    <>
      <p className="text-sm text-gray-700">
        ⭐ <span className="font-medium">{taskName}</span> is overdue.
      </p>
      {overdueTask && (
        <p className="mt-1 text-xs text-gray-500">
          Due {formatRelative(overdueTask.due_at)}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-500">
        Log the outcome from the timeline below — custom events log inline.
      </p>
    </>
  );
}

// ── bounce_fix ───────────────────────────────────────────────────────────

function BounceFixBody() {
  // Placeholder until webhook touchpoint emission lands (next commit
  // in the build order). When it does, this stage will be the most
  // urgent post-launch signal — admin enters a corrected email and
  // we re-fire Day 0.
  return (
    <>
      <p className="text-sm text-red-800">
        ⚠ Email bounced. Update the contact and re-launch outreach.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Edit the email in the contact list above, then re-launch from the snapshot.
      </p>
    </>
  );
}

// ── converted ────────────────────────────────────────────────────────────

function ConvertedBody({
  ctx,
  stageLabel,
}: {
  ctx: DrawerContext;
  stageLabel: string;
}) {
  // converted via active_partner status OR business_profile client meta.
  // For providers, the business_profile carries the conversion timestamp
  // (interview_terms_accepted_at). For stakeholders, the outreach row's
  // last_edited_at after the transition is the closest proxy.
  const acceptedAt = ctx.provider_business_profile?.metadata
    ?.interview_terms_accepted_at as string | undefined;
  // v10 Bullet 6: Pilot Active label when the pilot timer is set + future.
  // The terminal state v3 plan calls this out as the "Pilot Active 🎉"
  // headline — Phase 4+5 will set `pilot_active_through` at activation
  // time; until then, fall back to the existing "Since {date}" copy.
  const pilotThroughRaw = ctx.provider_business_profile?.metadata
    ?.pilot_active_through as string | undefined;
  const pilotThrough = pilotThroughRaw ? new Date(pilotThroughRaw) : null;
  const isPilotActive =
    pilotThrough != null && !isNaN(pilotThrough.getTime()) && pilotThrough.getTime() > Date.now();

  if (isPilotActive && pilotThrough && acceptedAt) {
    const daysLeft = Math.max(
      0,
      Math.ceil((pilotThrough.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <>
        <p className="text-sm font-semibold text-primary-800">Pilot Active 🎉</p>
        <p className="mt-0.5 text-xs text-gray-600">
          Activated {formatLongDate(acceptedAt)} · {daysLeft} {daysLeft === 1 ? "day" : "days"} left in the pilot.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Ongoing tasks (seasonal check-ins, job-board posts) surface in the timeline below.
        </p>
      </>
    );
  }

  const sinceText = acceptedAt
    ? `Since ${formatLongDate(acceptedAt)}`
    : `Marked ${stageLabel.toLowerCase()}`;
  return (
    <>
      <p className="text-sm text-primary-800">✓ {sinceText}</p>
      <p className="mt-1 text-xs text-gray-500">
        Ongoing tasks (seasonal check-ins, job-board posts) surface in the timeline below.
      </p>
    </>
  );
}

// ── closed ───────────────────────────────────────────────────────────────

function ClosedBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  const [reopening, setReopening] = useState(false);
  const closedAt = ctx.outreach.last_edited_at
    ? formatLongDate(ctx.outreach.last_edited_at)
    : null;
  const reasonLabel = closedReasonLabel(ctx.outreach.status);

  const reopen = async () => {
    setReopening(true);
    setError(null);
    try {
      await action("reopen", {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reopen failed");
    } finally {
      setReopening(false);
    }
  };

  return (
    <>
      <p className="text-sm text-gray-700">
        Closed{closedAt ? ` ${closedAt}` : ""}
        {reasonLabel ? ` · ${reasonLabel}` : ""}
      </p>
      {ctx.outreach.status !== "do_not_contact" && (
        <div className="mt-3">
          <button
            onClick={reopen}
            disabled={reopening}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {reopening ? "Reopening…" : "Reopen →"}
          </button>
        </div>
      )}
    </>
  );
}

/** v10 Bullet 6: shared ReplyClassifierModal mount used by the
 *  engagement sub-state branches in InOutreachBody. Keeps the modal
 *  dispatch logic single-sourced — same submit handlers as the
 *  no_engagement branch's inline mount. */
function ReplyClassifierModalMount({
  ctx,
  action,
  setError,
  onClose,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  onClose: () => void;
}) {
  return (
    <ReplyClassifierModal
      organizationName={ctx.outreach.organization_name}
      source="email_reply"
      rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
      onCancel={onClose}
      onSubmit={async (classification, payload, _partner, redirect) => {
        try {
          if (classification === "became_client") {
            await action("make_client", { notes: payload.notes });
          } else if (classification === "redirected" && redirect) {
            const derivedName =
              [redirect.first_name, redirect.last_name]
                .filter(Boolean)
                .join(" ")
                .trim() || redirect.email;
            await action("add_contact", {
              name: derivedName,
              first_name: redirect.first_name || null,
              last_name: redirect.last_name || null,
              email: redirect.email || null,
            });
            await action("classify_reply", {
              classification: "keep_emailing",
              notes: payload.notes,
              stop_cadence: true,
            });
          } else {
            await action("classify_reply", {
              classification,
              notes: payload.notes,
              meeting_at: payload.meeting_at,
            });
          }
          onClose();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed");
          throw e;
        }
      }}
    />
  );
}

/**
 * Reply face (Phase 4). Renders the provider's actual incoming reply (captured
 * by the Smartlead webhook into the email_replied touchpoint payload) so the
 * admin answers what they said. Prefers the plain-text preview; falls back to
 * stripping the HTML reply body.
 */
function ReplyPreview({
  reply,
}: {
  reply: { created_at: string; payload: Record<string, unknown> | null };
}) {
  const p = reply.payload ?? {};
  const previewRaw =
    (typeof p.preview_text === "string" && p.preview_text.trim()) ||
    (typeof p.reply_body === "string"
      ? p.reply_body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "");
  const preview = previewRaw ? previewRaw.slice(0, 320) : "";
  const from = typeof p.from_email === "string" ? p.from_email : null;
  return (
    <div className="mb-1 rounded-md border border-gray-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        ✉ They replied{from ? ` · ${from}` : ""}
      </p>
      {preview ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {preview}
          {previewRaw.length > 320 ? "…" : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          Reply received — open your inbox to read the full message.
        </p>
      )}
    </div>
  );
}

/**
 * Activation system (Phase 2). The two buttons that carry the whole
 * post-outreach funnel from any warm signal:
 *   Interested → opens the CadenceLaunchModal (review the activation
 *                emails + calls, then Launch).
 *   Not interested → closes the row.
 *
 * Recipient resolution honors the two-contact model: email prefers the
 * Decision Maker, then the primary active contact, then the General
 * Contact; phone uses the primary active contact (or General Contact).
 * `source` tags where the interest came from; `introTemplate` swaps the
 * Day-0 opener (e.g. the post-meeting flavor).
 */
function ActivationActions({
  ctx,
  action,
  setError,
  source,
  introTemplate,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  source: "reply" | "phone" | "meeting";
  introTemplate?: TemplateKey;
}) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [closing, setClosing] = useState(false);

  const primary =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ??
    ctx.contacts.find((c) => c.status === "active") ??
    null;
  const dm = ctx.outreach.research_data?.decision_maker;
  const gc = ctx.outreach.research_data?.general_contact;

  const recipientEmail =
    (dm && !dm.unavailable && dm.email ? dm.email : null) ??
    primary?.email ??
    gc?.email ??
    null;
  const recipientPhone = primary?.phone ?? gc?.phone ?? null;
  const recipientName = primary
    ? [primary.first_name, primary.last_name].filter(Boolean).join(" ").trim() ||
      primary.name
    : dm?.name ?? null;
  const recipientContactId = primary?.id ?? null;
  const recipientFirstName =
    primary?.first_name ??
    (dm?.name ? dm.name.trim().split(/\s+/)[0] : null) ??
    null;
  const recipientLastName = primary?.last_name ?? null;

  const [stopping, setStopping] = useState(false);

  // Detect a running activation cadence from the timeline: launched with no
  // later stop. Converted rows render ConvertedBody, so this never shows after
  // Trial Active (the conversion cleanup also cancels the cadence's tasks).
  const latestReasonAt = (reason: string): string | null =>
    ctx.touchpoints
      .filter(
        (t) =>
          t.touchpoint_type === "note_added" &&
          (t.payload as Record<string, unknown> | null)?.reason === reason,
      )
      .map((t) => t.created_at)
      .sort()
      .at(-1) ?? null;
  const launchedAt = latestReasonAt("activation_launched");
  const stoppedAt = latestReasonAt("activation_stopped");
  const isRunning = !!launchedAt && (!stoppedAt || stoppedAt < launchedAt);
  const nextActivationCall = ctx.pending_tasks
    .filter(
      (t) =>
        t.task_type === "outreach_followup_call" &&
        (t.payload as Record<string, unknown> | null)?.cadence === "activation",
    )
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];

  const markNotInterested = async () => {
    setClosing(true);
    setError(null);
    try {
      await action("mark_not_interested", {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close");
    } finally {
      setClosing(false);
    }
  };

  const stopActivation = async () => {
    setStopping(true);
    setError(null);
    try {
      await action("stop_activation", {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop");
    } finally {
      setStopping(false);
    }
  };

  if (isRunning) {
    return (
      <div className="mt-3 rounded-md border border-primary-200 bg-primary-50/60 px-3 py-2.5">
        <p className="text-sm font-semibold text-primary-800">
          Activation cadence running
        </p>
        <p className="mt-0.5 text-xs text-gray-600">
          {nextActivationCall
            ? `Next call ${formatRelative(nextActivationCall.due_at)}. `
            : "Follow-ups are queued. "}
          Stops automatically when they accept Terms.
        </p>
        <button
          onClick={stopActivation}
          disabled={stopping}
          className="mt-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {stopping ? "Stopping…" : "Stop activation"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLaunch(true)}
          title="Send the activation link + meeting option and start the follow-up cadence."
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Interested → activation
        </button>
        <button
          onClick={markNotInterested}
          disabled={closing}
          title="Send a polite closing note and stop outreach."
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Not interested → close
        </button>
      </div>
      {showLaunch && (
        <CadenceLaunchModal
          cadenceKey="activation"
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          recipientName={recipientName}
          recipientEmail={recipientEmail}
          introTemplateOverride={introTemplate}
          onCancel={() => setShowLaunch(false)}
          onSubmit={async (payload) => {
            try {
              await action("launch_activation", {
                email_snapshots: payload.email_snapshots,
                call_scripts: payload.call_scripts,
                recipient: {
                  name: recipientName,
                  email: recipientEmail,
                  phone: recipientPhone,
                  contact_id: recipientContactId,
                  first_name: recipientFirstName,
                  last_name: recipientLastName,
                },
                source,
                intro_template: introTemplate ?? null,
              });
              setShowLaunch(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Launch failed");
              throw e;
            }
          }}
        />
      )}
    </>
  );
}

function closedReasonLabel(status: string): string | null {
  switch (status) {
    case "not_interested":
      return "not interested";
    case "no_response_closed":
      return "no response";
    case "do_not_contact":
      return "do not contact";
    case "wrong_contact":
      return "wrong contact";
    case "redirected":
      return "redirected";
    default:
      return null;
  }
}

