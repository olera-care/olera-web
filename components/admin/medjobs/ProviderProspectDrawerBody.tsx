"use client";

/**
 * ProviderProspectDrawerBody — drawer body for materialized provider
 * prospect rows (student_outreach with kind='provider').
 *
 * v9 architecture: composes the shared zone components (Header, Next
 * Step Card, Snapshot — TBD, Timeline — TBD, More Details — TBD)
 * with provider-kind-specific content where applicable. The Partner
 * drawer (DrawerBody) will migrate to the same shared zones in a
 * follow-up commit so both bodies stay in lock-step.
 *
 * This commit mounts:
 *
 *   1. Org header (read-only) + canonical stage pill
 *   2. Research notes textarea (persists on blur)
 *   3. Provider email field (writes to mirrored primary contact)
 *   4. NextStepCard — stage-driven operational card replacing the
 *      bare "Launch outreach" button. The launch action now opens
 *      the PreFlightReviewModal with the provider cadence so admin
 *      reviews/edits the 3 emails before scheduling.
 *
 * Post-launch stages (in_outreach / call_due / meeting_set / etc.)
 * all flow through NextStepCard's stage-specific bodies and modals.
 * The previous "✓ Outreach launched" static banner is gone — replaced
 * by live operational guidance.
 */

import { useEffect, useMemo, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { NextStepCard } from "@/components/admin/medjobs/NextStepCard";

interface Props {
  ctx: DrawerContext;
  // Mirrors the ActionFn in Drawer.tsx — async, returns the refreshed
  // ctx. We don't consume the return value here, but accepting the
  // DrawerContext shape keeps the type system happy at the call site.
  action: (
    actionName: string,
    payload?: Record<string, unknown>,
  ) => Promise<DrawerContext>;
  setError: (msg: string | null) => void;
}

export function ProviderProspectDrawerBody({ ctx, action, setError }: Props) {
  const { outreach, provider_business_profile: bp } = ctx;
  const primaryContact = useMemo(
    () => ctx.contacts.find((c) => c.is_primary && c.status === "active"),
    [ctx.contacts],
  );
  const initialEmail = primaryContact?.email ?? bp?.contact_email ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [notes, setNotes] = useState<string>(outreach.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    setEmail(primaryContact?.email ?? bp?.contact_email ?? "");
    setNotes(outreach.notes ?? "");
  }, [outreach.id, primaryContact?.email, bp?.contact_email, outreach.notes]);

  const orgName = bp?.display_name || outreach.organization_name;
  const location =
    [bp?.city, bp?.state].filter(Boolean).join(", ") || null;
  const campusName = ctx.campus?.name ?? null;

  const hasEmail = email.trim().includes("@");
  const isPreLaunch =
    outreach.status === "prospect" || outreach.status === "researched";

  const saveNotes = async () => {
    if (notes === (outreach.notes ?? "")) return;
    setSavingNotes(true);
    setError(null);
    try {
      await action("update_outreach", { notes });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Email writes flow to the primary contact row — the same source the
  // unified cadence pipeline reads at send time. Mirrors stakeholder
  // contact-edit UX.
  const saveEmail = async () => {
    const trimmed = email.trim();
    if (trimmed === (primaryContact?.email ?? bp?.contact_email ?? "")) return;
    setSavingEmail(true);
    setError(null);
    try {
      if (primaryContact) {
        await action("update_contact", {
          contact_id: primaryContact.id,
          email: trimmed || null,
        });
      } else if (trimmed) {
        await action("add_contact", {
          name: orgName,
          email: trimmed,
          is_primary: true,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save email");
    } finally {
      setSavingEmail(false);
    }
  };

  // Pre-launch hand-off to NextStepCard: persist any pending edits
  // (notes + email) before the PreFlight modal opens, so the cadence
  // scheduling reads from the latest data.
  const beforeLaunch = async () => {
    if (notes !== (outreach.notes ?? "")) {
      await action("update_outreach", { notes });
    }
    const trimmed = email.trim();
    if (trimmed !== (primaryContact?.email ?? bp?.contact_email ?? "")) {
      if (primaryContact) {
        await action("update_contact", {
          contact_id: primaryContact.id,
          email: trimmed || null,
        });
      } else if (trimmed) {
        await action("add_contact", {
          name: orgName,
          email: trimmed,
          is_primary: true,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone 1 · Header — identity + stage. Stage pill comes from
          the canonical StageDisplay below; identity is provider-
          specific (org name, city, catchment campus). */}
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

      {/* Zone 2 · Next Step — the operational keystone. Stage-driven
          copy + CTA. Owns the modal launchers for log actions and the
          PreFlight modal for the pre-launch cadence review. */}
      <NextStepCard
        ctx={ctx}
        action={action}
        setError={setError}
        launchEnabled={hasEmail}
        launchDisabledReason={
          hasEmail
            ? undefined
            : "Add a valid email below before launching outreach."
        }
        beforeLaunch={beforeLaunch}
      />

      {/* Zone 3 · Snapshot (pre-launch only) — research notes + email.
          Post-launch this content moves into the More Details collapse
          per the architecture spec; for this commit the Snapshot stays
          visible across all stages until the SnapshotCard component
          lands and handles the collapse rule. */}
      <section>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Research notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Anything you've learned about this provider — service lines, hiring contact, recent activity, why they'd fit the campus pipeline."
          rows={4}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          {savingNotes ? "Saving…" : "Saved on blur"}
        </p>
      </section>

      <section>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Provider email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={saveEmail}
          placeholder={
            initialEmail
              ? initialEmail
              : "Need to find provider email — paste hiring contact here"
          }
          disabled={!isPreLaunch}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
        />
        {!initialEmail && isPreLaunch && (
          <p className="mt-1 text-[11px] text-amber-700">
            ⚠ No email on file. Track down the hiring contact and paste it here
            before launching outreach.
          </p>
        )}
        {initialEmail && (
          <p className="mt-1 text-[11px] text-gray-500">
            {savingEmail
              ? "Saving…"
              : "Saved on blur. Edits update the primary contact for the cadence."}
          </p>
        )}
      </section>
    </div>
  );
}
