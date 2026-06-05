"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * PilotTermsModal — the conversion gate. Phase 4+5 Bullet 3 (2026-06-04).
 *
 * Verb-matched title + plain-language intro + 4 reassurance bullets
 * (locked Q13) + agreement-link + PDF-download link + unchecked
 * agreement checkbox (locked Q12) + action-verb-matched continue button
 * (disabled until checkbox checked) + cancel.
 *
 * Modal styling mirrors the admin LogModalShell pattern so the chrome
 * feels consistent across the platform, even though this component lives
 * provider-side. We don't import the admin shell — cleaner separation.
 *
 * Triggered by:
 *   - Welcome banner "Activate the pilot →" CTA (Phase 4+5 Bullet 4)
 *   - Future Invite-to-interview / Save / See-contact action gates
 *     (when those exist; reuse this same modal with different
 *     `actionVerb` prop)
 *
 * On submit:
 *   - POST /api/medjobs/pilot/activate (server runs the atomic state
 *     transition mirroring handleMakeClient with terms_accepted_via=
 *     "self_serve")
 *   - On success: calls onSuccess (caller refreshes / re-renders)
 */
export default function PilotTermsModal({
  outreachId,
  orgName,
  actionVerb,
  onCancel,
  onSuccess,
}: {
  outreachId?: string;
  orgName?: string;
  /** Verb that triggered the modal. Drives the title + continue label
   *  so the modal feels like a natural step in the original action.
   *  Default: "activate the pilot" (the welcome banner CTA). */
  actionVerb?: string;
  onCancel: () => void;
  onSuccess: (result: {
    outreach_id: string;
    business_profile_id: string | null;
    pilot_active_through: string;
  }) => void;
}) {
  const verb = actionVerb || "activate the pilot";
  const verbCapitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/pilot/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outreachId ? { outreach_id: outreachId } : {}),
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Activation failed",
        );
      }
      onSuccess({
        outreach_id: String(body.outreach_id ?? ""),
        business_profile_id: (body.business_profile_id as string | null) ?? null,
        pilot_active_through: String(body.pilot_active_through ?? ""),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const title = `Before you ${verb}`;
  const subtitle = orgName ? orgName : undefined;
  const continueLabel = `Agree and ${verb}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-gray-100 px-6 py-5">
          <h3 className="font-serif text-xl text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="text-sm leading-relaxed text-gray-700">
            One quick agreement so we can {verb}
            {orgName ? ` for ${orgName}` : ""}. Here&apos;s what
            you&apos;re saying yes to:
          </p>
          <ul className="space-y-2.5 text-sm text-gray-700">
            <ReassuranceBullet>
              <span className="font-semibold">Free for 3 months</span> — no
              payment information needed.
            </ReassuranceBullet>
            <ReassuranceBullet>
              <span className="font-semibold">No obligation to hire</span>{" "}
              anyone you review.
            </ReassuranceBullet>
            <ReassuranceBullet>
              <span className="font-semibold">
                Your agency makes all hiring decisions
              </span>{" "}
              — we just connect you with students.
            </ReassuranceBullet>
            <ReassuranceBullet>
              <span className="font-semibold">
                You&apos;re claiming your Olera listing
              </span>{" "}
              — the public profile families see — under your account, so you
              can manage it. It stays visible throughout the pilot.
            </ReassuranceBullet>
          </ul>
          <p className="text-xs leading-relaxed text-gray-500">
            By continuing you accept Olera&apos;s caregiver-hiring pilot terms
            and claim your provider listing in the Olera family directory. Claiming
            doesn&apos;t verify your listing — you can complete verification later.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <Link
              href="/medjobs/pilot-agreement.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              Read the full pilot agreement →
            </Link>
            <a
              href="/medjobs/pilot-agreement.pdf"
              download
              className="font-medium text-primary-700 hover:underline"
            >
              Download as PDF →
            </a>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700">
              I have read and agree to the pilot agreement.
            </span>
          </label>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!agreed || submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Activating…" : continueLabel || verbCapitalized}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ReassuranceBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-primary-600" aria-hidden>
        ✓
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
