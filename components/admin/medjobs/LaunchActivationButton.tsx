"use client";

/**
 * "Launch activation" — a manual entry point that fires the warm activation
 * cadence directly, skipping (or short-circuiting) the cold outreach sequence.
 *
 * Sibling of "Launch outreach": where that opens the cold Pre-Flight and runs
 * schedule_sequence, this opens the same Activation launch modal the warm
 * "Interested" outcomes use (CadenceLaunchModal → launch_activation) so the
 * admin can start activation the moment they know a provider is worth going
 * warm on — from a prospect they've researched, or mid-cold-cadence.
 *
 * Recipient derivation mirrors CallFollowUpModal exactly (primary active
 * contact → decision maker → general contact) so the target matches the rest
 * of the drawer. Reused in two placements: the pre-launch Research footer and
 * the in-outreach NextStepCard.
 */

import { useState } from "react";
import { CadenceLaunchModal } from "@/app/admin/student-outreach/CadenceLaunchModal";
import { linkageFromResearchData } from "@/lib/medjobs/smartlead-inbox";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  action: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

export function LaunchActivationButton({
  ctx,
  action,
  setError,
  source = "manual",
  label = "Launch activation →",
  className = "rounded-md border border-primary-600 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50",
  disabled = false,
  disabledReason,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
  /** Recorded on the activation_launched touchpoint (e.g. "manual",
   *  "manual_prelaunch", "manual_in_outreach"). */
  source?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [showLaunch, setShowLaunch] = useState(false);

  // Single-recipient derivation — same precedence as CallFollowUpModal so the
  // activation target matches whoever the drawer treats as the lead.
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

  const isPartner = ctx.outreach.kind != null && ctx.outreach.kind !== "provider";

  if (showLaunch) {
    return (
      <CadenceLaunchModal
        cadenceKey="activation"
        isPartner={isPartner}
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
            setError(e instanceof Error ? e.message : "Failed to launch activation");
            throw e;
          }
        }}
      />
    );
  }

  return (
    <button
      onClick={() => {
        if (disabled) {
          setError(disabledReason ?? "Can't launch activation yet.");
          return;
        }
        if (!recipientEmail) {
          setError(
            "No email recipient on file. Add a General Contact or Decision Maker email before launching activation.",
          );
          return;
        }
        setShowLaunch(true);
      }}
      disabled={disabled}
      title={
        disabled
          ? disabledReason
          : "Skip cold outreach and start the activation sequence now."
      }
      className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
