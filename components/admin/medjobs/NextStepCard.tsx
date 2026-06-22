"use client";

/**
 * NextStepCard — drawer keystone, stage-driven operational card.
 *
 * Zone 2 of the unified drawer skeleton. Renders the single most relevant
 * action for the row's current Stage. One component, eight stage branches.
 *
 * Activation-system model (the simplified post-outreach workflow): the whole
 * funnel runs through two buttons — **Interested → activation** (opens the
 * CadenceLaunchModal) and **Not interested → close** — surfaced by the shared
 * `ActivationActions` component on the Email / Call / Meeting faces. When a
 * cadence is running, ActivationActions shows its status + a Stop control. The
 * old per-stage outcome modals (ReplyClassifierModal / LogCallOutcomeModal /
 * LogMeetingModal) are no longer used here.
 *
 * Stage-driven content rules:
 *
 *   prospect       → thin "Pre-Flight in progress" indicator; the operational
 *                    surface (Visit Website / Call to Confirm / Launch
 *                    Outreach) lives in the Research Card below.
 *   in_outreach    → awaiting reply, or the landed reply (ReplyPreview);
 *                    Interested / Not interested.
 *   call_due       → phone + script + Interested / Not interested + Couldn't reach.
 *   meeting_set    → meeting time + Interested (post-meeting activation) / Not
 *                    interested.
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
import { logActionSuccessMessage } from "@/lib/student-outreach/log-success-messages";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import { CallFollowUpModal } from "@/components/admin/medjobs/CallFollowUpModal";
import { bookingUrlFor } from "@/lib/medjobs/booking-url";
import { SmartleadInboxLink } from "@/components/admin/medjobs/SmartleadInboxLink";
import { PartnerActivate } from "@/components/admin/medjobs/PartnerActivate";
import { ProviderMakeClient } from "@/components/admin/medjobs/ProviderMakeClient";
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
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
}) {
  // What's queued next, for the awaiting-reply subline.
  const nextEmail = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_email_send")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const lastEmailSent = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // A landed reply is the headline (the Email face); otherwise we're awaiting
  // one. Either way the only actions are Interested / Not interested (in
  // ActivationActions), which also surfaces a running activation cadence.
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

  return (
    <>
      {/* Headline on the left; the manual-reply Smartlead escape hatch pinned
          to the card's top-right corner. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {latestReply ? (
            <ReplyPreview reply={latestReply} />
          ) : (
            <>
              <p className="text-sm text-gray-700">{headline}</p>
              <p className="mt-1 text-xs text-gray-500">{subline}</p>
            </>
          )}
        </div>
        <span className="shrink-0">
          <SmartleadInboxLink linkage={linkageFromResearchData(ctx.outreach.research_data)} />
        </span>
      </div>
      <ActivationActions
        ctx={ctx}
        action={action}
        setError={setError}
        source="reply"
        trailing={
          <>
            <button
              onClick={() => setShowConfirmCall(true)}
              title="Call this row now and log the outcome against the call script."
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              ☎ Call to confirm
            </button>
            <BookMeetingLink ctx={ctx} inline />
            {isPartnerRow(ctx) ? (
              <PartnerActivate ctx={ctx} action={action} setError={setError} />
            ) : (
              <ProviderMakeClient ctx={ctx} action={action} setError={setError} />
            )}
          </>
        }
      />
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
  const sublineCopy =
    ctx.meeting_state === "scheduled" && ctx.meeting_at
      ? `📅 Booked · ${formatLongDate(ctx.meeting_at)}`
      : "On the calendar";

  return (
    <>
      <p className="text-sm font-medium text-gray-900">{sublineCopy}</p>
      <ActivationActions
        ctx={ctx}
        action={action}
        setError={setError}
        source="meeting"
        trailing={
          isPartnerRow(ctx) ? (
            <PartnerActivate ctx={ctx} action={action} setError={setError} />
          ) : null
        }
      />
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
  // Show the PROVIDER's address (the lead email Smartlead captured as
  // recipient_email), not from_email — Smartlead's reply payload puts our own
  // campaign sender in from_email, so that would mislabel the reply as coming
  // from us. Fall back to from_email only if the lead email is missing.
  const from =
    (typeof p.recipient_email === "string" && p.recipient_email.trim()) ||
    (typeof p.from_email === "string" && p.from_email.trim()) ||
    null;
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

/** "Book a meeting" — opens this provider's tagged Calendly link in a new tab.
 *  Surfaced on the reply + call faces, the two moments an admin naturally books
 *  on a provider's behalf. */
function BookMeetingLink({ ctx, inline = false }: { ctx: DrawerContext; inline?: boolean }) {
  return (
    <a
      href={bookingUrlFor(ctx)}
      target="_blank"
      rel="noopener noreferrer"
      title="Opens this provider's Calendly link (tagged to this row) so the booking files here automatically."
      className={`${inline ? "" : "mt-2 "}inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50`}
    >
      📅 Book a meeting
    </a>
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
 * `source` tags where the interest came from (audit only — the activation
 * cadence sends one canonical opener regardless of source).
 */
function ActivationActions({
  ctx,
  action,
  setError,
  source,
  trailing,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  source: "reply" | "phone" | "meeting";
  /** Extra buttons (Book a meeting / Make a partner) rendered in the SAME
   *  horizontal row as Interested / Not interested, so the whole face shows
   *  one row of actions rather than a 2x2 stack. */
  trailing?: React.ReactNode;
}) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [closing, setClosing] = useState(false);

  // Partner activation ("Make a partner") moved next to Book a meeting on the
  // email/call/meeting faces via the shared PartnerActivate component, so it's
  // available both before AND after the activation cadence launches. Providers
  // never see it.

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

  // A running activation cadence is now reflected in the headline copy
  // ("Awaiting reply to activation cadence") rather than a heavy green box,
  // and the off-switch lives in the drawer's overflow menu (Stop all
  // outreach). Once running, the Interested/Not-interested decision is moot,
  // so this face shows just the trailing actions (Book a meeting / Make a
  // partner).
  const isRunning = isActivationRunning(ctx);

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

  if (isRunning) {
    return trailing ? (
      <div className="mt-3 flex flex-wrap items-center gap-2">{trailing}</div>
    ) : null;
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLaunch(true)}
          title="Send the activation link + meeting option and start the follow-up cadence."
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Interested
        </button>
        <button
          onClick={markNotInterested}
          disabled={closing}
          title="Send a polite closing note and stop outreach."
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Not interested
        </button>
        {trailing}
      </div>
      {showLaunch && (
        <CadenceLaunchModal
          cadenceKey="activation"
          isPartner={ctx.outreach.kind != null && ctx.outreach.kind !== "provider"}
          partnerStakeholderType={ctx.outreach.stakeholder_type}
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          recipientName={recipientName}
          recipientEmail={recipientEmail}
          smartleadLinkage={linkageFromResearchData(ctx.outreach.research_data)}
          onCancel={() => setShowLaunch(false)}
          onSubmit={async (payload) => {
            try {
              await action("launch_activation", {
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

