"use client";

/**
 * ProviderMakeClient — "Make client" control (providers only).
 *
 * The provider-funnel parallel to PartnerActivate. A single admin button that
 * converts a provider row to a Client on a verbal/email/meeting commitment,
 * reusing the existing `make_client` action (no new enum/action). Surfaced next
 * to "Book a meeting" on the awaiting-reply faces so an admin can convert
 * quickly when a reply or call signals they're ready to interview and hire —
 * including while the activation cadence is already running.
 *
 * make_client writes business_profiles.metadata.interview_terms_accepted_at,
 * transitions the row to active_partner (deriveStage maps that to 'converted'
 * for providers), unlocks catchment Partner Prospects, and cancels remaining
 * tasks via the stage transition. A light confirm step guards the click since
 * the conversion is operationally significant.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

export function ProviderMakeClient({
  ctx,
  action,
  setError,
  label = "Make client",
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const convert = async () => {
    setConverting(true);
    setError(null);
    try {
      await action("make_client", {});
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to make client");
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="They agreed to interview and hire — convert them to a Client."
        className="inline-flex items-center gap-1.5 rounded-md border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
      >
        ★ {label}
      </button>

      {open && (
        <div className="mt-1 w-full basis-full rounded-md border border-primary-200 bg-primary-50/50 px-3 py-2.5">
          <p className="text-xs font-semibold text-primary-800">
            Convert {ctx.outreach.organization_name} to a Client
          </p>
          <p className="mt-0.5 text-[11px] text-gray-600">
            They&apos;ve accepted the interview terms and are ready to hire student
            caregivers. This stops outreach and unlocks Partner Prospects for the
            catchment.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={convert}
              disabled={converting}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {converting ? "Converting…" : "Make client →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
