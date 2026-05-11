"use client";

/**
 * ProviderProspectDrawerBody — focused drawer body for materialized
 * provider prospect rows (student_outreach with kind='provider'). The
 * stakeholder-side drawer (DrawerBody) assumes "Programs", department,
 * professor-approval flows etc. that don't apply to provider rows. This
 * component replaces it for kind='provider' and gives admins exactly
 * the three things they need to launch outreach:
 *
 *   1. Verify the organization name + catchment context (read-only).
 *   2. Edit research notes (persisted via update_outreach action).
 *   3. Confirm/edit the recipient email, then hit Launch outreach.
 *
 * When status is past 'researched' (outreach already sent), the panel
 * switches to a "Outreach sent" confirmation rather than the launch
 * form. History below records every send.
 */

import { useEffect, useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

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
  const initialEmail = bp?.contact_email ?? "";
  const [email, setEmail] = useState<string>(initialEmail);
  const [notes, setNotes] = useState<string>(outreach.notes ?? "");
  const [sending, setSending] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Re-seed editable state if a refetch lands new context (e.g. after
  // launch advances status and we want the fields to mirror the row).
  useEffect(() => {
    setEmail(bp?.contact_email ?? "");
    setNotes(outreach.notes ?? "");
  }, [outreach.id, bp?.contact_email, outreach.notes]);

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

  const launch = async () => {
    if (!hasEmail) {
      setError("Add a valid email before launching outreach.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Persist notes first if they're unsaved — admin loses them otherwise.
      if (notes !== (outreach.notes ?? "")) {
        await action("update_outreach", { notes });
      }
      await action("launch_provider_outreach", { email: email.trim() });
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
            Auto-populated from the provider directory. Edit before sending
            if you have a better contact.
          </p>
        )}
      </section>

      {alreadySent ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ✓ Outreach has been launched. Replies and follow-ups will surface in
          the Replies tab.
        </section>
      ) : (
        <section className="flex items-center justify-end gap-3">
          <button
            onClick={launch}
            disabled={!hasEmail || sending}
            title={
              hasEmail
                ? "Send the first outreach email now and log the touchpoint."
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
