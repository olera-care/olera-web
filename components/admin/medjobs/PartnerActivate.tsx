"use client";

/**
 * PartnerActivate — "Make a partner" control (partners only).
 *
 * A single admin button that promotes a stakeholder row to an active
 * Recruitment Partner on a verbal/email/meeting commitment, reusing the
 * existing `mark_partner` action (no new enum/action). Surfaced next to
 * "Book a meeting" on the email + call + meeting faces so an admin can
 * promote quickly when a reply or call signals they want in — including
 * while the activation cadence is already running.
 *
 * Extracted from NextStepCard's ActivationActions so the same panel (portal
 * preview + confirmation method + note) renders consistently wherever the
 * button appears. The portal link the partner receives is delivered in their
 * outreach/activation emails; the preview here is for admin transparency.
 */

import { useState } from "react";
import type { DistributionEvidence, DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type ConfirmMethod = "verbal" | "email" | "meeting" | "other";

const ACTIVATE_EVIDENCE: Record<ConfirmMethod, DistributionEvidence> = {
  verbal: "explicit_verbal",
  email: "explicit_email",
  meeting: "explicit_verbal",
  other: "self_reported",
};

const ACTIVATE_LABEL: Record<ConfirmMethod, string> = {
  verbal: "Verbal (call) confirmation",
  email: "Email confirmation",
  meeting: "Confirmed in a meeting",
  other: "Other confirmation",
};

export function PartnerActivate({
  ctx,
  action,
  setError,
  label = "Make a partner",
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (m: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  // Default to verbal — the common case is a phone/email "yes" that the admin
  // is promoting on. No second verification step beyond this note.
  const [confirmMethod, setConfirmMethod] = useState<ConfirmMethod>("verbal");
  const [confirmNote, setConfirmNote] = useState("");

  const openPanel = async () => {
    setOpen(true);
    if (portalLink) return;
    try {
      const res = await fetch(
        `/api/admin/medjobs/partner-portal-link?outreach_id=${ctx.outreach.id}`,
      );
      const d = await res.json();
      if (res.ok && d.url) setPortalLink(d.url as string);
    } catch {
      /* preview link is best-effort */
    }
  };

  const activate = async () => {
    setActivating(true);
    setError(null);
    try {
      const note = [ACTIVATE_LABEL[confirmMethod], confirmNote.trim()]
        .filter(Boolean)
        .join(" — ");
      await action("mark_partner", {
        evidence: ACTIVATE_EVIDENCE[confirmMethod],
        evidence_notes: note,
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to activate");
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        title="They agreed to help — activate them as a Recruitment Partner."
        className="inline-flex items-center gap-1.5 rounded-md border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
      >
        ★ {label}
      </button>

      {open && (
        <div className="mt-1 w-full basis-full rounded-md border border-primary-200 bg-primary-50/50 px-3 py-2.5">
          <p className="text-xs font-semibold text-primary-800">
            Activate {ctx.outreach.organization_name} as a Recruitment Partner
          </p>
          <p className="mt-0.5 text-[11px] text-gray-600">
            They&apos;ll become an active Recruitment Partner with portal access. Here&apos;s what they receive:
          </p>

          {/* Preview of what the partner gets (transparency). The portal link
              is delivered in their outreach/activation emails. */}
          <div className="mt-1.5 rounded border border-gray-200 bg-white px-2.5 py-2 text-[11px] text-gray-700">
            <p><span className="text-gray-400">Subject:</span> You&apos;re a Recruitment Partner for {ctx.campus.name} students</p>
            <p><span className="text-gray-400">From:</span> Graize, on behalf of Dr. Logan DuBose</p>
            <p className="mt-1">
              Thanks for partnering with us! Your portal is where you can share the flyer with students,
              add colleagues, tell us about events, and see your impact.
            </p>
            <p className="mt-1">
              <span className="text-gray-400">Portal link:</span>{" "}
              {portalLink ? (
                <a href={portalLink} target="_blank" rel="noopener noreferrer" className="break-all text-primary-600 hover:underline">{portalLink}</a>
              ) : (
                <span className="text-gray-400">generating…</span>
              )}
            </p>
          </div>

          <p className="mt-2 text-[11px] text-gray-600">How did they confirm?</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-800">
            {(["verbal", "email", "meeting", "other"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`confirm-method-${ctx.outreach.id}`}
                  checked={confirmMethod === m}
                  onChange={() => setConfirmMethod(m)}
                />
                {m === "verbal" ? "Verbal (call)" : m === "email" ? "Email" : m === "meeting" ? "In a meeting" : "Other"}
              </label>
            ))}
          </div>
          <input
            value={confirmNote}
            onChange={(e) => setConfirmNote(e.target.value)}
            placeholder="Optional note (e.g. said yes on the Oct 3 call)"
            className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={activate}
              disabled={activating}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {activating ? "Activating…" : "Activate →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
