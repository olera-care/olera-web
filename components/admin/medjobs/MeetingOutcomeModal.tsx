"use client";

/**
 * "Log meeting outcome" flow — the meeting-channel twin of CallFollowUpModal /
 * EmailReplyModal. Opens the shared CallOutcomeModal shell with the booked
 * meeting's details pulled in up top (grey box, same style as the call script),
 * then the outcome cards that advance the row after the meeting:
 *   Interested / went well → log the meeting + open the Activation launch modal
 *   ★ Make partner          → log the meeting + capture evidence + mark_partner
 *   No-show / reschedule    → log a no-show; the row stays for you to rebook
 *   Not interested          → send a closing note + close the row
 *
 * Every outcome reuses an existing backend action (log_meeting_held,
 * log_meeting_no_show, launch_activation, mark_partner, mark_not_interested).
 */

import { useState } from "react";
import {
  CallOutcomeModal,
  type OutcomeChoice,
} from "@/components/admin/medjobs/CallOutcomeModal";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import { MarkPartnerModal } from "@/app/admin/student-outreach/MarkPartnerModal";
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
import { formatLongDate } from "@/lib/student-outreach/formatters";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  action: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

function isPartnerRow(ctx: DrawerContext): boolean {
  return ctx.outreach.kind != null && ctx.outreach.kind !== "provider";
}

/** Grey details box mirroring CallScriptBlock — the meeting's time + attendee. */
function MeetingBlock({ ctx, attendee }: { ctx: DrawerContext; attendee: string | null }) {
  const when =
    ctx.meeting_state === "scheduled" && ctx.meeting_at
      ? formatLongDate(ctx.meeting_at)
      : "On the calendar";
  return (
    <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        📅 Booked
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{when}</p>
      {attendee && (
        <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
          Attendee: {attendee}
        </p>
      )}
    </section>
  );
}

function outcomesFor(partner: boolean, activationRunning: boolean): OutcomeChoice[] {
  return [
    {
      key: "interested",
      label: "Interested / went well",
      blurb: activationRunning
        ? "Logs the meeting. The activation cadence keeps running."
        : "Logs the meeting and launches the activation sequence.",
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
      key: "no_show",
      label: "No-show / reschedule",
      blurb: "Logs a no-show; the row stays so you can rebook.",
      tone: "neutral",
    },
    {
      key: "not_interested",
      label: "Not interested",
      blurb: "Sends a polite closing note and stops outreach.",
      tone: "close",
    },
  ];
}

export function MeetingOutcomeModal({
  ctx,
  action,
  activationRunning = false,
  onClose,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  activationRunning?: boolean;
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
    ? [primary.first_name, primary.last_name].filter(Boolean).join(" ").trim() ||
      primary.name
    : dm?.name ?? null;
  const recipientContactId = primary?.id ?? null;
  const recipientFirstName =
    primary?.first_name ??
    (dm?.name ? dm.name.trim().split(/\s+/)[0] : null) ??
    null;
  const recipientLastName = primary?.last_name ?? null;
  const attendee =
    recipientName && recipientEmail
      ? `${recipientName} · ${recipientEmail}`
      : recipientName ?? recipientEmail ?? null;

  const dispatch = async (outcomeKey: string | null, notes: string | null) => {
    if (outcomeKey === "interested") {
      await action("log_meeting_held", { outcome: "held", notes });
      if (activationRunning) {
        onClose();
      } else {
        setShowLaunch(true);
      }
      return;
    }
    if (outcomeKey === "convert_to_partner") {
      await action("log_meeting_held", { outcome: "held", notes });
      setShowMarkPartner(true);
      return;
    }
    if (outcomeKey === "no_show") {
      await action("log_meeting_no_show", { notes });
      onClose();
      return;
    }
    if (outcomeKey === "not_interested") {
      await action("mark_not_interested", {});
      onClose();
      return;
    }
    onClose();
  };

  if (showLaunch) {
    return (
      <CadenceLaunchModal
        cadenceKey="activation"
        isPartner={isPartnerRow(ctx)}
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
              source: "meeting",
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
      title="Log meeting outcome"
      subtitle={ctx.outreach.organization_name}
      topBlock={<MeetingBlock ctx={ctx} attendee={attendee} />}
      outcomes={outcomesFor(isPartnerRow(ctx), activationRunning)}
      allowNotesOnly
      notesPlaceholder="How the meeting went — what was said, the next step."
      submitLabel="Log"
      savingLabel="Saving…"
      onCancel={onClose}
      onSubmit={dispatch}
    />
  );
}
