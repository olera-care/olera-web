"use client";

/**
 * "Check for reply to provider" flow — the email-channel twin of
 * CallFollowUpModal. Opens the shared CallOutcomeModal shell with the provider's
 * landed reply (or a "no reply yet" empty state) pulled in up top via
 * <ReplyBlock>, then the outcome cards that carry the whole post-reply funnel:
 *   Interested      → open the Activation launch modal
 *   📅 Book a meeting → mark scheduled + open Calendly in a new tab
 *   ★ Make partner   → capture distribution evidence + mark_partner (partners)
 *   Not interested   → send a closing note + close the row
 *
 * Every outcome reuses an existing backend action (launch_activation,
 * mark_meeting_scheduled, mark_partner, mark_not_interested) — no new enums.
 */

import { useState } from "react";
import {
  CallOutcomeModal,
  type OutcomeChoice,
} from "@/components/admin/medjobs/CallOutcomeModal";
import { ReplyBlock } from "@/components/admin/medjobs/ReplyBlock";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import { MarkPartnerModal } from "@/app/admin/student-outreach/MarkPartnerModal";
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
import { bookingUrlFor } from "@/lib/medjobs/booking-url";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  action: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Reply = { created_at: string; payload: Record<string, unknown> | null } | null;

/** Stakeholder (advisor / dept head / student org) → converts to a Partner. */
function isPartnerRow(ctx: DrawerContext): boolean {
  return ctx.outreach.kind != null && ctx.outreach.kind !== "provider";
}

/**
 * Reply outcomes mirror the call set. "Interested" launches the activation
 * cadence, so it's dropped once that cadence is already running (relaunching
 * would be moot / duplicate) — the same rule ActivationActions applied inline.
 */
function outcomesFor(partner: boolean, activationRunning: boolean): OutcomeChoice[] {
  return [
    ...(activationRunning
      ? []
      : [
          {
            key: "interested",
            label: "Interested",
            blurb: "They want to move forward. Launches the activation sequence.",
            tone: "happy" as const,
          },
        ]),
    {
      key: "meeting_booked",
      label: "📅 Book a meeting",
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
      key: "not_interested",
      label: "Not interested",
      blurb: "Sends a polite closing note and stops outreach.",
      tone: "close",
    },
  ];
}

export function EmailReplyModal({
  ctx,
  action,
  reply,
  activationRunning = false,
  source = "reply",
  onClose,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  /** The latest email_replied touchpoint, or null when awaiting a reply. */
  reply: Reply;
  activationRunning?: boolean;
  source?: "reply" | "phone" | "meeting";
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

  const dispatch = async (outcomeKey: string | null, notes: string | null) => {
    if (outcomeKey === "interested") {
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
      setShowMarkPartner(true);
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
      title="Check for reply"
      subtitle={ctx.outreach.organization_name}
      topBlock={<ReplyBlock reply={reply} />}
      outcomes={outcomesFor(isPartnerRow(ctx), activationRunning)}
      notesPlaceholder="Context for this reply — what they said, the next step."
      submitLabel="Log"
      savingLabel="Saving…"
      onCancel={onClose}
      onSubmit={dispatch}
    />
  );
}
