"use client";

/**
 * The "Call to follow up" flow, shared by every cadence-call surface (call
 * drawer, timeline call task, dept-head intro call). Wraps <CallOutcomeModal>
 * (Config B) + dispatch + the activation-launch handoff, so all three behave
 * identically:
 *   Interested      → log connected + open the Activation launch modal
 *   📅 Meeting booked → mark scheduled + open Calendly in a new tab
 *   No answer / Voicemail / Not interested → log_call_outcome
 *   Note only        → log "logged" (resolves the call, no status change)
 * Any log resolves the current call task; the cadence queues the next call.
 */

import { useState } from "react";
import {
  CallOutcomeModal,
  type OutcomeChoice,
} from "@/components/admin/medjobs/CallOutcomeModal";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import { MarkPartnerModal } from "@/app/admin/student-outreach/MarkPartnerModal";
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
import { bookingUrlFor } from "@/lib/medjobs/booking-url";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  action: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

/** Whether the row is a stakeholder (advisor / dept head / student org) that
 *  converts to a Partner, vs a provider that converts to a Client. */
function isPartnerRow(ctx: DrawerContext): boolean {
  return ctx.outreach.kind != null && ctx.outreach.kind !== "provider";
}

/**
 * Outcomes are state- and row-kind-aware:
 *  - "outreach" mode (cold cadence or a row awaiting reply to it): the positive
 *    lead is "Interested", which launches the activation cadence.
 *  - "activation" mode (warm cadence already running): "Interested" is moot, so
 *    the positive lead is "Confirmed / spoke", which just logs the call and
 *    lets the activation cadence keep running.
 * Both modes offer the row-appropriate conversion (Make partner / Make client)
 * and the standard meeting / no-answer / voicemail / not-interested outcomes.
 */
function outcomesFor(
  mode: "outreach" | "activation",
  partner: boolean,
): OutcomeChoice[] {
  const lead: OutcomeChoice =
    mode === "activation"
      ? {
          key: "confirmed",
          label: "Confirmed / spoke",
          blurb: "Logs the call. The activation cadence keeps running.",
          tone: "happy",
        }
      : {
          key: "interested",
          label: "Interested",
          blurb: "They want to move forward. Launches the activation sequence.",
          tone: "happy",
        };
  // Provider conversion is SELF-SERVE ONLY now (they accept the pilot terms
  // themselves via /api/medjobs/pilot/activate). Admins no longer convert a
  // provider from a call — so the "Make client" outcome is offered only for
  // stakeholder rows (→ Partner). A provider call logs the call; the provider
  // converts on their own from the candidate board / magic-link landing.
  return [
    lead,
    {
      key: "meeting_booked",
      label: "📅 Meeting booked",
      blurb: "Opens the Calendly booking page and marks a meeting scheduled.",
      tone: "happy",
    },
    ...(partner
      ? [
          {
            key: "convert_to_partner",
            label: "★ Make partner",
            blurb:
              "They committed to share the program with students. Marks them a Partner and stops outreach.",
            tone: "happy" as const,
          },
        ]
      : []),
    {
      key: "no_answer",
      label: "No answer",
      blurb: "Marks this call done; the next cadence call stays scheduled.",
      tone: "neutral",
    },
    {
      key: "voicemail",
      label: "Voicemail",
      blurb: "Left a message; the next cadence call stays scheduled.",
      tone: "neutral",
    },
    {
      key: "not_interested",
      label: "Not interested",
      blurb: "Closes the row and cancels remaining outreach.",
      tone: "close",
    },
  ];
}

const OUTCOME_ACTION: Record<string, string> = {
  confirmed: "logged",
  no_answer: "no_answer",
  voicemail: "voicemail",
  not_interested: "connected_not_interested",
};

export function CallFollowUpModal({
  ctx,
  action,
  script,
  scriptLabel,
  source = "phone",
  mode = "outreach",
  taskId,
  cadenceDay,
  onClose,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  script: string | null;
  scriptLabel: string;
  source?: "reply" | "phone" | "meeting";
  /** "activation" when the row is awaiting reply to a running activation
   *  cadence — swaps "Interested" for "Confirmed / spoke". Defaults to the
   *  cold-outreach outcome set. */
  mode?: "outreach" | "activation";
  /** When opened from a specific timeline call-task row, scopes the log to
   *  that task instead of the most-overdue auto-pick. */
  taskId?: string | null;
  cadenceDay?: number | null;
  onClose: () => void;
  setError: (m: string | null) => void;
}) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [showMarkPartner, setShowMarkPartner] = useState(false);

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
    ? [primary.title, primary.first_name, primary.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || primary.name
    : dm?.name ?? null;
  const recipientContactId = primary?.id ?? null;
  const recipientFirstName =
    primary?.first_name ??
    (dm?.name ? dm.name.trim().split(/\s+/)[0] : null) ??
    null;
  const recipientLastName = primary?.last_name ?? null;

  const taskScope: Record<string, unknown> = {};
  if (taskId) taskScope.task_id = taskId;
  if (cadenceDay != null) taskScope.cadence_day = cadenceDay;

  const dispatch = async (outcomeKey: string | null, notes: string | null) => {
    if (outcomeKey === "interested") {
      await action("log_call_outcome", {
        outcome: "connected_engaged",
        notes,
        ...taskScope,
      });
      setShowLaunch(true);
      return;
    }
    if (outcomeKey === "meeting_booked") {
      await action("mark_meeting_scheduled", { notes });
      window.open(bookingUrlFor(ctx), "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    if (outcomeKey === "convert_to_partner") {
      // Stakeholder conversion: log the call now, then chain into
      // MarkPartnerModal to capture distribution evidence and issue
      // mark_partner (which transitions to active_partner + cancels tasks).
      await action("log_call_outcome", {
        outcome: "convert_to_partner",
        notes,
        ...taskScope,
      });
      setShowMarkPartner(true);
      return;
    }
    await action("log_call_outcome", {
      outcome: outcomeKey ? OUTCOME_ACTION[outcomeKey] ?? "logged" : "logged",
      notes,
      ...taskScope,
    });
    onClose();
  };

  if (showLaunch) {
    return (
      <CadenceLaunchModal
        cadenceKey="activation"
        isPartner={ctx.outreach.kind != null && ctx.outreach.kind !== "provider"}
        partnerStakeholderType={ctx.outreach.stakeholder_type}
        organizationName={ctx.outreach.organization_name}
        campusName={ctx.campus.name}
        recipientName={recipientName}
        recipientEmail={recipientEmail}
        smartleadLinkage={linkageFromResearchData(ctx.outreach.research_data)}
        onCancel={onClose}
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
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Launch failed");
            throw e;
          }
        }}
      />
    );
  }

  if (showMarkPartner) {
    return (
      <MarkPartnerModal
        organizationName={ctx.outreach.organization_name}
        onCancel={onClose}
        onConfirm={async (payload) => {
          try {
            await action("mark_partner", {
              evidence: payload.evidence,
              evidence_notes: payload.evidence_notes,
            });
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to mark partner");
            throw e;
          }
        }}
      />
    );
  }

  return (
    <CallOutcomeModal
      title="Log call"
      subtitle={
        <>
          {ctx.outreach.organization_name}
          {recipientPhone && ` · ${recipientPhone}`}
        </>
      }
      scriptLabel={scriptLabel}
      script={script}
      outcomes={outcomesFor(mode, isPartnerRow(ctx))}
      allowNotesOnly
      onCancel={onClose}
      onSubmit={dispatch}
    />
  );
}
