"use client";

/**
 * ProviderProspectDrawerBody — drawer body for materialized provider
 * prospect rows (student_outreach with kind='provider').
 *
 * v9 unified drawer skeleton:
 *
 *   Zone 1 · Header           always — name + identity meta
 *   Zone 2 · NextStepCard     always — stage-driven CTA
 *   Zone 3 · SnapshotCard     pre-launch: prominent;
 *                             post-launch: collapsed into More Details
 *   Zone 4 · OutreachTimeline always — past + future + engagement
 *   Zone 5 · More Details     collapsed — Snapshot (post-launch) +
 *                             Danger Zone
 *
 * Stage-driven collapse rule (per architecture spec §4): once
 * outreach launches, the Snapshot card moves out of the prominent
 * position and into the More Details collapse. Header + Next Step +
 * Timeline carry the operational focus; Snapshot is reference data
 * the admin only needs when they're correcting contact info post-
 * launch (e.g. after a bounce or new email surface).
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { NextStepCard } from "@/components/admin/medjobs/NextStepCard";
import { OutreachTimeline } from "@/components/admin/medjobs/OutreachTimeline";
import { ProviderSnapshotCard } from "@/components/admin/medjobs/SnapshotCard";
import { DangerZone } from "@/components/admin/medjobs/DangerZone";

interface Props {
  ctx: DrawerContext;
  action: (
    actionName: string,
    payload?: Record<string, unknown>,
  ) => Promise<DrawerContext>;
  setError: (msg: string | null) => void;
}

export function ProviderProspectDrawerBody({ ctx, action, setError }: Props) {
  const { outreach } = ctx;
  const [showMore, setShowMore] = useState(false);

  const isPreLaunch =
    outreach.status === "prospect" || outreach.status === "researched";

  // Email gate for the Next Step Card's launch CTA. Provider rows
  // can launch from either:
  //   1. The effective General Contact email (research_data.
  //      general_contact.email override OR business_profiles.email
  //      fallback). This is the org-level inbox — PreFlight wraps
  //      it as a synthetic recipient.
  //   2. Any active Specific Contact with a valid email (Owner,
  //      Hiring Manager, etc.).
  // Either source is sufficient — having both is common.
  const generalContactEmail =
    ctx.outreach.research_data?.general_contact?.email ??
    ctx.provider_business_profile?.email ??
    null;
  const hasEmail =
    ctx.contacts.some(
      (c) => c.status === "active" && Boolean(c.email?.includes("@")),
    ) || Boolean(generalContactEmail?.includes("@"));

  return (
    <div className="space-y-6">
      {/* The drawer's own panel header already carries the org name +
          "Texas A&M University · Provider" subtitle. Skipping the
          redundant inner Provider Prospect box — location + catchment
          live in the General Contact section below, and the campus is
          already in the panel header. */}

      {/* Zone 2 · Next Step */}
      <NextStepCard
        ctx={ctx}
        action={action}
        setError={setError}
        launchEnabled={hasEmail}
        launchDisabledReason={
          hasEmail
            ? undefined
            : "Add a valid email in the snapshot below before launching outreach."
        }
      />

      {/* Zone 3 · Snapshot — prominent pre-launch only. Post-launch
          the snapshot lives inside More Details. */}
      {isPreLaunch && (
        <ProviderSnapshotCard ctx={ctx} action={action} setError={setError} />
      )}

      {/* Zone 4 · Timeline */}
      <OutreachTimeline ctx={ctx} action={action} setError={setError} />

      {/* Zone 5 · More Details collapse. Post-launch: snapshot here.
          Pre-launch and post-launch alike: Danger Zone here. */}
      <div>
        <button
          onClick={() => setShowMore((s) => !s)}
          className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <span>{showMore ? "Hide details" : "More details"}</span>
          <span className="text-gray-400" aria-hidden>
            {showMore ? "▴" : "▾"}
          </span>
        </button>
        {showMore && (
          <div className="mt-4 space-y-6">
            {!isPreLaunch && (
              <ProviderSnapshotCard
                ctx={ctx}
                action={action}
                setError={setError}
              />
            )}
            <DangerZone ctx={ctx} action={action} setError={setError} />
          </div>
        )}
      </div>
    </div>
  );
}
