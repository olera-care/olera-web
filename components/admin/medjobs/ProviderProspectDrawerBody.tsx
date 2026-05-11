"use client";

/**
 * ProviderProspectDrawerBody — focused drawer body for materialized
 * provider prospect rows (student_outreach with kind='provider').
 *
 * v9 unified launch path: this body now calls schedule_sequence with
 * the provider cadence template (Day 0 / 2 / 3 / 5 / 7) instead of the
 * deprecated single-email launch_provider_outreach action. Same engine
 * the Partner Prospect drawer uses — one launch path, two template
 * families. Phone-aware call queueing comes for free because the
 * primary contact is mirrored from business_profiles at materialize
 * time (see /api/admin/medjobs/provider-prospects/materialize).
 *
 * The drawer surface stays minimal for this commit:
 *
 *   1. Org header (read-only) + status pill
 *   2. Research notes textarea (persists on blur)
 *   3. Provider email field (edits the mirrored primary contact)
 *   4. Launch button → schedules the full provider cadence
 *
 * The Snapshot Card + PreFlightReviewModal + NextStepCard + Timeline
 * land in subsequent commits per the build order. This commit's only
 * behavior change: the click of "Launch outreach" now queues a
 * 5-touch cadence instead of firing a single one-off email.
 */

import { useEffect, useMemo, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { defaultSnapshotsFor } from "@/lib/student-outreach/sequencer";

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
  // Email source: prefer the mirrored contact row (the canonical post-
  // materialize source); fall back to business_profile for legacy rows
  // that pre-date the materialize-time mirror.
  const primaryContact = useMemo(
    () => ctx.contacts.find((c) => c.is_primary && c.status === "active"),
    [ctx.contacts],
  );
  const initialEmail = primaryContact?.email ?? bp?.contact_email ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [notes, setNotes] = useState<string>(outreach.notes ?? "");
  const [sending, setSending] = useState(false);
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
  const alreadySent = outreach.status !== "prospect" && outreach.status !== "researched";

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

  // Persist email edits to the primary contact row so the launch path
  // (schedule_sequence → executeEmailTask) reads the corrected address.
  // If no primary contact exists yet (legacy rows pre-mirror), create
  // one. Both branches use the same contact actions that stakeholder
  // rows use — one editor, two surfaces.
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

  const launch = async () => {
    if (!hasEmail) {
      setError("Add a valid email before launching outreach.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Persist unsaved notes / email first — admin loses them otherwise.
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
        } else {
          await action("add_contact", {
            name: orgName,
            email: trimmed,
            is_primary: true,
          });
        }
      }

      // Build the default snapshot list from the 'provider' cadence
      // template. Admin gets the cadence with default copy; a future
      // pre-flight modal will let them edit per-day before launch.
      const snapshots = defaultSnapshotsFor("provider", {
        organization_name: orgName,
        campus_name: campusName ?? "the university",
      });
      await action("schedule_sequence", { email_snapshots: snapshots });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to launch outreach");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
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
          <StatusPill alreadySent={alreadySent} />
        </div>
      </section>

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
          disabled={alreadySent}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
        />
        {!initialEmail && !alreadySent && (
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

      {alreadySent ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ✓ Outreach cadence scheduled. Day 0 email fires immediately;
          follow-ups + call tasks queue per the 5-touch provider cadence.
          Replies surface in the Replies tab.
        </section>
      ) : (
        <section className="flex items-center justify-end gap-3">
          <button
            onClick={launch}
            disabled={!hasEmail || sending}
            title={
              hasEmail
                ? "Schedule the 5-touch provider cadence and fire Day 0 immediately."
                : "Need a valid email address first."
            }
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Launching…" : "Launch outreach"}
          </button>
        </section>
      )}
    </div>
  );
}

function StatusPill({ alreadySent }: { alreadySent: boolean }) {
  const label = alreadySent ? "Outreach sent" : "Ready to email";
  const tone = alreadySent
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
