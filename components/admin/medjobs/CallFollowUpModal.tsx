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
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
import { bookingUrlFor } from "@/lib/medjobs/booking-url";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  action: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

const OUTCOMES: OutcomeChoice[] = [
  {
    key: "interested",
    label: "Interested",
    blurb: "They want to move forward. Launches the activation sequence.",
    tone: "happy",
  },
  {
    key: "meeting_booked",
    label: "📅 Meeting booked",
    blurb: "Opens the Calendly booking page and marks a meeting scheduled.",
    tone: "happy",
  },
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

const OUTCOME_ACTION: Record<string, string> = {
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
  /** When opened from a specific timeline call-task row, scopes the log to
   *  that task instead of the most-overdue auto-pick. */
  taskId?: string | null;
  cadenceDay?: number | null;
  onClose: () => void;
  setError: (m: string | null) => void;
}) {
  const [showLaunch, setShowLaunch] = useState(false);

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
      outcomes={OUTCOMES}
      allowNotesOnly
      onCancel={onClose}
      onSubmit={dispatch}
    />
  );
}
