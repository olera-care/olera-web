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
 *   prospect       → "Launch outreach" CTA, disabled until row is
 *                    launch-ready (caller decides via launchEnabled)
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
import type { CadenceKey } from "@/lib/student-outreach/cadence";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { PreFlightReviewModal } from "@/app/admin/student-outreach/PreFlightReviewModal";
import { ReplyClassifierModal } from "@/app/admin/student-outreach/ReplyClassifierModal";
import { LogMeetingModal } from "@/app/admin/student-outreach/LogMeetingModal";
import { LogCallOutcomeModal } from "@/app/admin/student-outreach/LogCallOutcomeModal";
import { CallForEmailModal } from "@/components/admin/medjobs/CallForEmailModal";
import { ProviderPreFlightModal } from "@/components/admin/medjobs/ProviderPreFlightModal";
import { ContactFormBanner } from "@/components/admin/medjobs/SnapshotCard";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

export interface NextStepCardProps {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  /** Pre-launch only — caller decides whether the launch CTA is
   *  enabled. Provider drawer requires an email; stakeholder drawer
   *  requires research completeness. Defaults to false. */
  launchEnabled?: boolean;
  /** Tooltip / hover text when launch is disabled. */
  launchDisabledReason?: string;
  /** Invoked just before the PreFlight modal opens, so the drawer
   *  body can persist any pending edits (notes, email corrections)
   *  before scheduling the cadence. */
  beforeLaunch?: () => Promise<void>;
}

export function NextStepCard({
  ctx,
  action,
  setError,
  launchEnabled = false,
  launchDisabledReason,
  beforeLaunch,
}: NextStepCardProps) {
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
            launchEnabled={launchEnabled}
            launchDisabledReason={launchDisabledReason}
            beforeLaunch={beforeLaunch}
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
  launchEnabled,
  launchDisabledReason,
  beforeLaunch,
  stageLabel,
}: {
  stage: Stage;
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  launchEnabled: boolean;
  launchDisabledReason?: string;
  beforeLaunch?: () => Promise<void>;
  stageLabel: string;
}) {
  switch (stage) {
    case "prospect":
      return (
        <ProspectBody
          ctx={ctx}
          action={action}
          setError={setError}
          launchEnabled={launchEnabled}
          launchDisabledReason={launchDisabledReason}
          beforeLaunch={beforeLaunch}
        />
      );
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

function ProspectBody({
  ctx,
  action,
  setError,
  launchEnabled,
  launchDisabledReason,
  beforeLaunch,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  launchEnabled: boolean;
  launchDisabledReason?: string;
  beforeLaunch?: () => Promise<void>;
}) {
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [showCallForEmail, setShowCallForEmail] = useState(false);
  const cadenceKey: CadenceKey =
    ctx.outreach.kind === "provider"
      ? "provider"
      : (ctx.outreach.stakeholder_type ?? "student_org");

  // v9 Phase 4: surface research action buttons whenever pre-flight
  // is incomplete. Two shortcuts:
  //   - "Visit website" opens the provider's website in a new tab
  //     (research entry point — admin scans for missing email,
  //     phone, address, contact form, etc.)
  //   - "Call to obtain information" launches the call-and-log
  //     workflow when admin needs to phone the provider for any
  //     missing piece (not just email — the modal logs the call
  //     outcome and admin captures whatever they learned).
  // Both surface on prospect/researched rows whenever the
  // corresponding data is on file. The earlier !launchEnabled gate
  // hid the buttons once the checklist passed, which removed a
  // useful research aid for admins double-checking info right
  // before they hit Launch.
  const isProviderProspect = ctx.outreach.kind === "provider";
  const generalContactSlot =
    ctx.outreach.research_data?.general_contact ?? {};
  // v9 final: effective General Contact phone (override OR bp
  // fallback) — earlier read bp.phone only, so an admin-added
  // phone override never lit up the call button.
  const generalContactPhone =
    generalContactSlot.phone ?? ctx.provider_business_profile?.phone ?? null;
  const generalContactWebsite =
    generalContactSlot.website ??
    ctx.provider_business_profile?.website ??
    null;
  const callAttempts = ctx.touchpoints.filter((t) =>
    [
      "call_no_answer",
      "call_voicemail",
      "call_connected",
      "call_wrong_number",
    ].includes(t.touchpoint_type),
  ).length;
  const showCallForEmailCta =
    isProviderProspect && Boolean(generalContactPhone);
  const showVisitWebsiteCta =
    isProviderProspect && Boolean(generalContactWebsite);

  // v9 final: pre-flight checklist. Three tones:
  //   required    → blocks launch (red ✗ when missing)
  //   recommended → encouraged but non-blocking (amber ⚠ when missing)
  //   optional    → admin's call (gray ○ when missing)
  // Items reference fields in the Provider Profile section below;
  // edits auto-save on blur.
  const gc = ctx.outreach.research_data?.general_contact ?? {};
  const generalEmail = gc.email ?? ctx.provider_business_profile?.email ?? null;
  const generalPhone = gc.phone ?? ctx.provider_business_profile?.phone ?? null;
  const generalWebsite =
    gc.website ?? ctx.provider_business_profile?.website ?? null;
  const street = gc.street ?? ctx.provider_business_profile?.address ?? "";
  const cityVal = gc.city ?? ctx.provider_business_profile?.city ?? "";
  const stateVal = gc.state ?? ctx.provider_business_profile?.state ?? "";
  // v9 final: zip falls back to bp.zip (the directory has a ZIP
  // column the checklist was ignoring) so the row passes the
  // address check when the directory already carries the ZIP.
  const zipVal = gc.zip ?? ctx.provider_business_profile?.zip ?? "";
  const addressComplete = Boolean(
    street.trim() &&
      cityVal.trim() &&
      stateVal.trim() &&
      /^\d{5}(?:-\d{4})?$/.test(zipVal.trim()),
  );
  // v9 final: pre-flight gates on the General Contact ONLY. Provider
  // outreach begins at the organization-level layer; named individuals
  // (Specific Contacts) are supporting context, not the launch
  // requirement. A Specific Contact email or phone alone does NOT
  // unblock launch.
  const hasEmail = Boolean(generalEmail?.includes("@"));
  const hasPhone = Boolean(generalPhone);
  const hasWebsite = Boolean(generalWebsite?.trim());
  const hasFax = Boolean(gc.fax?.trim());
  const hasContactFormUrl = Boolean(gc.contact_form_url?.trim());
  const contactFormResolved = ctx.touchpoints.some(
    (t) => t.touchpoint_type === "contact_form_submitted",
  );
  const hasNotes = Boolean(ctx.outreach.notes?.trim());

  return (
    <>
      <p className="text-sm font-medium text-gray-900">
        Pre-flight checklist
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        Add missing info, then launch outreach.
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        <ChecklistRow
          done={hasWebsite}
          tone="required"
          label="Website"
          hint={
            hasWebsite
              ? "Website on file."
              : "Required. Supports research + outreach validation."
          }
        />
        <ChecklistRow
          done={addressComplete}
          tone="required"
          label="Address"
          hint={
            addressComplete
              ? "Street, city, state, ZIP set — ready for snail mail."
              : "Required. Need street, city, state, and ZIP."
          }
        />
        <ChecklistRow
          done={hasEmail}
          tone="required"
          label="General Contact email"
          hint={
            hasEmail
              ? "General email on file — outreach can launch."
              : "Required. Provider outreach begins at the org-level email."
          }
        />
        <ChecklistRow
          done={hasPhone}
          tone="required"
          label="General Contact phone"
          hint={
            hasPhone
              ? "General phone on file — call tasks queue with email."
              : "Required at the org level. Call cadence runs alongside email."
          }
        />
        <ChecklistRow
          done={!hasContactFormUrl || contactFormResolved}
          tone={hasContactFormUrl && !contactFormResolved ? "required" : "recommended"}
          label="Contact form"
          hint={
            !hasContactFormUrl
              ? "Add the URL if the agency has a contact form — Day 0 picks it up."
              : contactFormResolved
                ? "Outcome logged."
                : "URL on file — pick Submitted / Skipped / Not available below. Required when URL is present."
          }
        />
        <ChecklistRow
          done={hasFax}
          tone="recommended"
          label="Fax"
          hint={
            hasFax
              ? "Fax on file."
              : "Add the fax line if the agency has one (future fax cadence)."
          }
        />
        <ChecklistRow
          done={hasNotes}
          tone="optional"
          label="Research notes"
          hint="Capture agency character + any context worth remembering."
        />
      </ul>
      {/* v9 final: contact-form pre-flight banner. Mounted here so the
          decision lives next to the checklist + launch button — admin
          can't miss it. Hides the moment a contact_form_submitted
          touchpoint lands. Gates Launch when URL is on file. */}
      {hasContactFormUrl && !contactFormResolved && (
        <div className="mt-3">
          <ContactFormBanner
            url={ctx.outreach.research_data?.general_contact?.contact_form_url ?? ""}
            action={action}
            setError={setError}
            campusName={ctx.campus?.name ?? null}
            specificContactName={(() => {
              const first = ctx.contacts.find(
                (c) =>
                  c.status === "active" &&
                  (c.first_name?.trim() || c.last_name?.trim() || c.name?.trim()),
              );
              if (!first) return null;
              const named = [first.first_name, first.last_name]
                .filter(Boolean)
                .join(" ")
                .trim();
              return named || first.name || null;
            })()}
          />
        </div>
      )}
      {showCallForEmailCta && callAttempts > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {callAttempts} call attempt{callAttempts === 1 ? "" : "s"} logged.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {showVisitWebsiteCta && generalContactWebsite && (
          <a
            href={
              generalContactWebsite.startsWith("http")
                ? generalContactWebsite
                : `https://${generalContactWebsite}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            title="Open the provider website in a new tab for pre-flight research."
          >
            🌐 Visit website to obtain information
          </a>
        )}
        {showCallForEmailCta && (
          <button
            onClick={() => setShowCallForEmail(true)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            title="Phone the provider to obtain missing info — email, address details, hours, anything."
          >
            📞 Call to obtain information
          </button>
        )}
        <button
          onClick={async () => {
            if (!launchEnabled) {
              setError(launchDisabledReason ?? "Complete the checklist before launching.");
              return;
            }
            try {
              if (beforeLaunch) await beforeLaunch();
              setShowPreFlight(true);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Failed to prepare launch",
              );
            }
          }}
          disabled={!launchEnabled}
          title={
            launchEnabled
              ? "Open the cadence pre-flight review."
              : launchDisabledReason
          }
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Launch outreach →
        </button>
      </div>

      {showPreFlight && cadenceKey === "provider" && (
        <ProviderPreFlightModal
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          campusSlug={ctx.campus.slug}
          contacts={ctx.contacts}
          generalContact={{
            email:
              ctx.outreach.research_data?.general_contact?.email ??
              ctx.provider_business_profile?.email ??
              null,
            phone:
              ctx.outreach.research_data?.general_contact?.phone ??
              ctx.provider_business_profile?.phone ??
              null,
          }}
          onCancel={() => setShowPreFlight(false)}
          onSubmit={async (payload) => {
            try {
              await action("schedule_sequence", payload);
              setShowPreFlight(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Schedule failed");
              throw e;
            }
          }}
        />
      )}
      {showPreFlight && cadenceKey !== "provider" && (
        <PreFlightReviewModal
          stakeholderType={cadenceKey}
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          contacts={ctx.contacts}
          onCancel={() => setShowPreFlight(false)}
          onSubmit={async (snapshots) => {
            try {
              await action("schedule_sequence", { email_snapshots: snapshots });
              setShowPreFlight(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Schedule failed");
              throw e;
            }
          }}
        />
      )}
      {showCallForEmail && (
        <CallForEmailModal
          organizationName={ctx.outreach.organization_name}
          phone={generalContactPhone}
          action={action}
          onCancel={() => setShowCallForEmail(false)}
          onDone={() => setShowCallForEmail(false)}
          setError={setError}
        />
      )}
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
  // Find the next pending email or call task to surface the "what's
  // queued next" hint. Cheap inline scan — ctx.pending_tasks is small.
  const nextEmail = ctx.pending_tasks
    .filter((t) => t.task_type === "outreach_email_send")
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const lastEmailSent = ctx.touchpoints
    .filter((t) => t.touchpoint_type === "email_sent")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const subline = nextEmail
    ? `Next: Day ${nextEmail.payload?.day ?? "?"} email · due ${formatRelative(nextEmail.due_at)}`
    : lastEmailSent
      ? `Last email sent ${formatRelative(lastEmailSent.created_at)} · cadence complete`
      : "Outreach in flight";

  return (
    <>
      <p className="text-sm text-gray-700">
        Awaiting reply. If you saw a response in your inbox, log it to advance the row.
      </p>
      <p className="mt-1 text-xs text-gray-500">{subline}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogReply(true)}
          title="Log a reply you received in your inbox."
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Log reply
        </button>
      </div>

      {showLogReply && (
        <ReplyClassifierModal
          organizationName={ctx.outreach.organization_name}
          source="email_reply"
          onCancel={() => setShowLogReply(false)}
          onSubmit={async (classification, payload) => {
            try {
              await action("classify_reply", {
                classification,
                notes: payload.notes,
                meeting_at: payload.meeting_at,
              });
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
  const primaryContact =
    ctx.contacts.find((c) => c.is_primary && c.status === "active") ?? null;
  const contactName = primaryContact
    ? [primaryContact.title, primaryContact.first_name, primaryContact.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || primaryContact.name
    : null;

  return (
    <>
      <p className="text-sm text-gray-700">
        Call task is due. Log the outcome to advance the row.
      </p>
      {primaryContact?.phone && (
        <p className="mt-1 text-xs">
          <a
            href={`tel:${primaryContact.phone}`}
            className="font-medium text-emerald-700 hover:underline"
          >
            📞 {primaryContact.phone}
          </a>
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogCall(true)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Log call outcome →
        </button>
      </div>

      {showLogCall && (
        <LogCallOutcomeModal
          organizationName={ctx.outreach.organization_name}
          contactName={contactName}
          contactPhone={primaryContact?.phone ?? null}
          rowKind={ctx.outreach.kind === "provider" ? "provider" : "stakeholder"}
          onCancel={() => setShowLogCall(false)}
          onSubmit={async (outcome, notes) => {
            try {
              await action("log_call_outcome", { outcome, notes });
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowLogMeeting(true)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
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
              } else if (mstatus === "done_followup") {
                await action("mark_meeting_followup", { notes: payload.notes });
              } else if (mstatus === "done_partner" && partner) {
                await action("mark_partner", { ...partner });
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
  const sinceText = acceptedAt
    ? `Since ${formatLongDate(acceptedAt)}`
    : `Marked ${stageLabel.toLowerCase()}`;
  return (
    <>
      <p className="text-sm text-emerald-800">✓ {sinceText}</p>
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

/**
 * v9 final: one row in the pre-flight checklist. Four states:
 *   done                 → green ✓
 *   missing + required   → red ✗ (blocks launch)
 *   missing + recommended → amber ⚠ (encouraged, doesn't block)
 *   missing + optional   → gray ○ (admin's call)
 */
type ChecklistTone = "required" | "recommended" | "optional";

function ChecklistRow({
  done,
  tone,
  label,
  hint,
}: {
  done: boolean;
  tone: ChecklistTone;
  label: string;
  hint: string;
}) {
  const icon = done ? "✓" : tone === "required" ? "✗" : tone === "recommended" ? "⚠" : "○";
  const iconClass = done
    ? "text-emerald-600"
    : tone === "required"
      ? "text-red-600"
      : tone === "recommended"
        ? "text-amber-600"
        : "text-gray-400";
  const badge =
    done || tone === "required"
      ? null
      : tone === "recommended"
        ? "recommended"
        : "optional";
  return (
    <li className="flex items-start gap-2">
      <span className={`shrink-0 font-semibold ${iconClass}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-800">{label}</span>
        {badge && (
          <span className="ml-1 text-[10px] uppercase tracking-wide text-gray-400">
            {badge}
          </span>
        )}
        <span className="ml-2 text-gray-500">{hint}</span>
      </div>
    </li>
  );
}
