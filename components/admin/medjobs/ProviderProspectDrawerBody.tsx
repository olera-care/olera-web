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

  // v9 final: pre-flight gate. ALL required items must be true to
  // enable Launch:
  //   - website (operationally critical: contact form discovery,
  //     verification, research, outreach validation, automation)
  //   - email (general OR specific contact)
  //   - phone (general OR specific contact)
  //   - structured address: street + city + state + valid ZIP
  // Recommended items (contact form, fax) appear in the checklist
  // but do NOT block launch — admin can ship without them.
  // v9.1 Graize 05.13 audit (Item 1): launch gate respects explicit
  // deletion. undefined → fall back to business_profile; null → honor
  // the admin's removal and treat as missing (which gates launch).
  // Same fix shipped in NextStepCard so the checklist + launch gate
  // stay in sync.
  const gc = ctx.outreach.research_data?.general_contact ?? {};
  const generalEmail =
    gc.email !== undefined ? gc.email : ctx.provider_business_profile?.email ?? null;
  const generalPhone =
    gc.phone !== undefined ? gc.phone : ctx.provider_business_profile?.phone ?? null;

  const hasEmail = Boolean(generalEmail?.includes("@"));
  const hasPhone = Boolean(generalPhone);

  // v9 final: pre-flight gate. Required in every case:
  //   - General Contact email (org-level outreach lane)
  //   - General Contact phone (call cadence)
  // Required only when a contact_form_url is on file:
  //   - admin must mark Submitted / Skipped / Not available
  // Recommended (non-blocking): Website, Address, Contact form URL, Fax.
  // Address demoted to recommended — snail mail is a future channel,
  // shouldn't block email/phone outreach.
  const contactFormUrl = gc.contact_form_url ?? "";
  const contactFormResolved =
    !contactFormUrl ||
    ctx.touchpoints.some((t) => t.touchpoint_type === "contact_form_submitted");

  const launchEnabled = hasEmail && hasPhone && contactFormResolved;
  const launchDisabledReason = !hasEmail
    ? "Add a General Contact email — a Specific Contact email is not enough."
    : !hasPhone
      ? "Add a General Contact phone — a Specific Contact phone is not enough."
      : !contactFormResolved
        ? "Resolve the contact form (Submitted / Skipped / Not available) before launching."
        : undefined;

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
        launchEnabled={launchEnabled}
        launchDisabledReason={launchDisabledReason}
      />

      {/* Zone 3 · Snapshot — prominent pre-launch only. Carries the
          General Contact + Specific Contacts + research notes the
          admin works through to complete pre-flight. Post-launch
          the snapshot lives inside More Details. */}
      {isPreLaunch && (
        <ProviderSnapshotCard ctx={ctx} action={action} setError={setError} />
      )}

      {/* Zone 4 · Outreach Timeline (touchpoints + Day 0 activities).
          Sits AFTER the snapshot so admin works through pre-flight
          first, then sees history below. The drawer flow reads:
          (1) what to do next → (2) general info + contacts →
          (3) specific contacts → (4) what's happened on the row. */}
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
