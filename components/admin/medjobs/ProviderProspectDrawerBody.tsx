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

  const orgName =
    ctx.provider_business_profile?.display_name || outreach.organization_name;
  const location =
    [
      ctx.provider_business_profile?.city,
      ctx.provider_business_profile?.state,
    ]
      .filter(Boolean)
      .join(", ") || null;
  const campusName = ctx.campus?.name ?? null;

  const isPreLaunch =
    outreach.status === "prospect" || outreach.status === "researched";

  // Email gate for the Next Step Card's launch CTA. Provider snapshots
  // can hold multiple contacts (Owner, Hiring Manager, General Inbox);
  // any active contact with a valid email enables launch — the cadence
  // pipeline sends to all of them. Business_profile fallback retained
  // for legacy rows whose contacts haven't been mirrored yet.
  const hasEmail =
    ctx.contacts.some(
      (c) => c.status === "active" && Boolean(c.email?.includes("@")),
    ) || Boolean(ctx.provider_business_profile?.email?.includes("@"));

  return (
    <div className="space-y-6">
      {/* Zone 1 · Header */}
      <section className="rounded-lg border border-gray-200 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Provider Prospect
            </p>
            <h3 className="mt-0.5 truncate text-base font-semibold text-gray-900">
              {orgName}
            </h3>
            {(location || campusName) && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {[location, campusName ? `${campusName} catchment` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
      </section>

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
