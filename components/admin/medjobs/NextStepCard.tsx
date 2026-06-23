"use client";

/**
 * NextStepCard — drawer keystone, stage-driven operational card.
 *
 * Zone 2 of the unified drawer skeleton. Renders the single most relevant
 * action for the row's current Stage. One component, eight stage branches.
 *
 * One-button-per-next-step model: each face surfaces a SINGLE primary action
 * that opens a channel-appropriate outcome modal, all built on the shared
 * CallOutcomeModal shell (context block on top, outcome cards below):
 *   - Emails   → "Check for reply to provider" → EmailReplyModal (the reply,
 *                or a "no reply yet" empty state, pulled in via <ReplyBlock>).
 *   - Calls    → "Call provider" → CallFollowUpModal (the call script on top).
 *   - Meetings → "Log meeting outcome" → MeetingOutcomeModal (meeting details).
 * The funnel actions (Interested → activation, Book a meeting, Make partner,
 * Not interested) are outcome CARDS inside those modals, not inline buttons —
 * so the next step reads as one obvious move. The cross-channel action is a
 * small secondary link.
 *
 * Stage-driven content rules:
 *
 *   prospect       → thin "Pre-Flight in progress" indicator; the operational
 *                    surface (Visit Website / Call to Confirm / Launch
 *                    Outreach) lives in the Research Card below.
 *   in_outreach    → one-line reply/awaiting status + "Check for reply" (Calls
 *                    tab leads with "Call provider" instead).
 *   call_due       → phone + "Call to follow up" → call outcome modal.
 *   meeting_set    → meeting time + "Log meeting outcome" → meeting modal.
 *   follow_up      → custom event copy.
 *   bounce_fix     → fix-email-and-resend placeholder.
 *   converted      → terminal-positive copy, no CTA.
 *   closed         → reopen CTA.
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
import type { TabKey } from "@/lib/student-outreach/tab-config";
import { logActionSuccessMessage } from "@/lib/student-outreach/log-success-messages";
import { CallFollowUpModal } from "@/components/admin/medjobs/CallFollowUpModal";
import { EmailReplyModal } from "@/components/admin/medjobs/EmailReplyModal";
import { MeetingOutcomeModal } from "@/components/admin/medjobs/MeetingOutcomeModal";
import { SmartleadInboxLink } from "@/components/admin/medjobs/SmartleadInboxLink";
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
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
  /** Which In Basket tab the drawer was opened from. Drives the
   *  awaiting-reply call affordance: Emails ("replies") shows a small link;
   *  Calls + every other tab show a prominent far-left button. */
  activeTab?: TabKey;
}

export function NextStepCard({
  ctx,
  action: rawAction,
  setError,
  activeTab,
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
            activeTab={activeTab}
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
  activeTab,
}: {
  stage: Stage;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  stageLabel: string;
  activeTab?: TabKey;
}) {
  switch (stage) {
    case "prospect":
      return <ProspectBody ctx={ctx} />;
    case "in_outreach":
      return <InOutreachBody ctx={ctx} action={action} setError={setError} activeTab={activeTab} />;
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
      <p className="text-sm font-medium text-gray-900">Pre-Flight</p>
      <p className="mt-0.5 text-xs text-gray-500">
        Finish the card below, then launch.
      </p>
    </>
  );
}

// ── in_outreach ──────────────────────────────────────────────────────────

function InOutreachBody({
  ctx,
  action,
  setError,
  activeTab,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  activeTab?: TabKey;
}) {
  // What's queued next, for the awaiting-reply subline.
  const nextEmail = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_email_send")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const lastEmailSent = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // A landed reply drives the one-line status (and is pulled into the reply
  // modal); otherwise we're awaiting one. The outcome cards live in the modal.
  const latestReply = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_replied")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // Which cadence are we awaiting a reply to — the cold outreach drip or the
  // warm activation cadence? Drives the headline copy (replaces the old green
  // "Activation cadence running" box).
  const activationRunning = isActivationRunning(ctx);
  const nextActivationCall = ctx.pending_tasks
    .filter(
      (t) =>
        t.task_type === "outreach_followup_call" &&
        (t.payload as Record<string, unknown> | null)?.cadence === "activation",
    )
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  // Cold-cadence call (not an activation call) — its script seeds the
  // "Call to confirm" modal when we're awaiting an outreach reply.
  const nextColdCall = ctx.pending_tasks
    .filter(
      (t) =>
        t.task_type === "outreach_followup_call" &&
        (t.payload as Record<string, unknown> | null)?.cadence !== "activation",
    )
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];

  // "Call to confirm": let the admin proactively call an awaiting-reply row and
  // log the outcome against the right script, without waiting for a call to be
  // due. Script + outcome set follow the cadence we're awaiting.
  const [showConfirmCall, setShowConfirmCall] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const confirmCallTask = activationRunning ? nextActivationCall : nextColdCall;
  const confirmScript =
    typeof confirmCallTask?.payload?.script === "string"
      ? (confirmCallTask.payload.script as string)
      : null;
  const confirmDay =
    typeof confirmCallTask?.payload?.day === "number"
      ? (confirmCallTask.payload.day as number)
      : null;
  const confirmScriptLabel = activationRunning
    ? "Activation call script"
    : confirmDay != null
      ? `Day ${confirmDay} script`
      : "Call script";

  const headline = `Awaiting reply to ${activationRunning ? "activation" : "outreach"} cadence`;
  const subline = activationRunning
    ? nextActivationCall
      ? `Next call ${formatRelative(nextActivationCall.due_at)}`
      : "Follow-ups queued"
    : nextEmail
      ? `Next: Day ${nextEmail.payload?.day ?? "?"} email · due ${formatRelative(nextEmail.due_at)}`
      : lastEmailSent
        ? `Last email sent ${formatRelative(lastEmailSent.created_at)} · cadence complete`
        : "Outreach in flight";

  // One next-step button per tab, with the cross-channel action demoted to a
  // small secondary link (escape hatch). Calls tab leads with "Call provider"
  // → the call outcome modal; every other tab (Emails, Providers, Partners,
  // Meetings) leads with "Check for reply" → the email outcome modal, since an
  // in-outreach row is fundamentally awaiting a reply. Labels are row-kind
  // aware (provider vs partner contact).
  const isCallsTab = activeTab === "calls";
  const partner = isPartnerRow(ctx);
  const callLabel = partner ? "Call contact" : "Call provider";
  const replyLabel = partner ? "Check for reply to contact" : "Check for reply to provider";
  const callTitle = "Call this contact now and log the outcome against the call script.";
  const replyTitle = "Pull in their reply and log the outcome.";

  // On the Calls tab the status should answer "when's the next call?" — the
  // outreach-cadence call we're nudging with — not the next email. Falls back
  // to the email/outreach status when no call is queued.
  const callSubline = confirmCallTask
    ? `Next call${confirmDay != null ? ` · Day ${confirmDay}` : ""} · ${formatRelative(confirmCallTask.due_at)}`
    : subline;

  // The provider's address on the landed reply, for the one-line status.
  const replyFrom = latestReply
    ? ((): string | null => {
        const p = latestReply.payload ?? {};
        return (
          (typeof p.recipient_email === "string" && p.recipient_email.trim()) ||
          (typeof p.from_email === "string" && p.from_email.trim()) ||
          null
        );
      })()
    : null;

  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700";
  const linkBtn =
    "inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline";

  return (
    <>
      {/* One-line status on the left; the Smartlead escape hatch pinned to the
          card's top-right corner. The full reply now lives inside the modal. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {latestReply ? (
            <p className="truncate text-sm text-gray-700">
              ✉ They replied{replyFrom ? ` · ${replyFrom}` : ""}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700">{headline}</p>
              <p className="mt-1 text-xs text-gray-500">
                {isCallsTab ? callSubline : subline}
              </p>
            </>
          )}
        </div>
        <SmartleadInboxLink
          linkage={linkageFromResearchData(ctx.outreach.research_data)}
          label="Smartlead"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isCallsTab ? (
          <>
            <button onClick={() => setShowConfirmCall(true)} title={callTitle} className={primaryBtn}>
              ☎ {callLabel}
            </button>
            <button onClick={() => setShowReply(true)} title={replyTitle} className={linkBtn}>
              ✉ {replyLabel}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setShowReply(true)} title={replyTitle} className={primaryBtn}>
              ✉ {replyLabel}
            </button>
            <button onClick={() => setShowConfirmCall(true)} title={callTitle} className={linkBtn}>
              ☎ {callLabel}
            </button>
          </>
        )}
      </div>

      {showConfirmCall && (
        <CallFollowUpModal
          ctx={ctx}
          action={action}
          script={confirmScript}
          scriptLabel={confirmScriptLabel}
          mode={activationRunning ? "activation" : "outreach"}
          source="reply"
          onClose={() => setShowConfirmCall(false)}
          setError={setError}
        />
      )}
      {showReply && (
        <EmailReplyModal
          ctx={ctx}
          action={action}
          reply={latestReply ?? null}
          activationRunning={activationRunning}
          source="reply"
          onClose={() => setShowReply(false)}
          setError={setError}
        />
      )}
    </>
  );
}

/** Stakeholder (non-provider) row → can be promoted to a Recruitment Partner. */
function isPartnerRow(ctx: DrawerContext): boolean {
  return ctx.outreach.kind != null && ctx.outreach.kind !== "provider";
}

/**
 * Is an activation cadence currently running? Derived from the timeline:
 * a launch with no later stop. A hard "stop all outreach" (outreach_stopped)
 * counts as a stop too, so the drawer stops reading as activation-in-flight.
 */
function isActivationRunning(ctx: DrawerContext): boolean {
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
  const stoppedAt =
    [latestReasonAt("activation_stopped"), latestReasonAt("outreach_stopped")]
      .filter((d): d is string => d != null)
      .sort()
      .at(-1) ?? null;
  return !!launchedAt && (!stoppedAt || stoppedAt < launchedAt);
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
  const [showFollowUp, setShowFollowUp] = useState(false);

  const primaryContact =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ??
    ctx.contacts.find((c) => c.status === "active") ??
    null;
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
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900">Next step: call to follow up</p>
      {primaryContact?.phone && (
        <p className="mt-1 text-sm">
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
      <div className="mt-3">
        <button
          onClick={() => setShowFollowUp(true)}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          ☎ Call to follow up
        </button>
      </div>
      {showFollowUp && (
        <CallFollowUpModal
          ctx={ctx}
          action={action}
          script={callScript}
          scriptLabel={callDay != null ? `Day ${callDay} script` : "Call script"}
          onClose={() => setShowFollowUp(false)}
          setError={setError}
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
  const [showOutcome, setShowOutcome] = useState(false);
  const activationRunning = isActivationRunning(ctx);
  const sublineCopy =
    ctx.meeting_state === "scheduled" && ctx.meeting_at
      ? `📅 Booked · ${formatLongDate(ctx.meeting_at)}`
      : "On the calendar";

  return (
    <>
      <p className="text-sm font-medium text-gray-900">{sublineCopy}</p>
      <div className="mt-3">
        <button
          onClick={() => setShowOutcome(true)}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Log meeting outcome
        </button>
      </div>
      {showOutcome && (
        <MeetingOutcomeModal
          ctx={ctx}
          action={action}
          activationRunning={activationRunning}
          onClose={() => setShowOutcome(false)}
          setError={setError}
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
      </>
    );
  }

  const sinceText = acceptedAt
    ? `Since ${formatLongDate(acceptedAt)}`
    : `Marked ${stageLabel.toLowerCase()}`;
  return <p className="text-sm text-primary-800">✓ {sinceText}</p>;
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

