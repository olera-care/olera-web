"use client";

import { useState } from "react";

/**
 * WelcomeBanner — first-arrival banner for cold-provider magic-link clicks.
 * Phase 2+3 Bullet 12 (2026-06-04).
 *
 * Two variants:
 *   - Default: "Welcome to the candidate board. Browse the students; accept
 *     the pilot agreement when you're ready to invite anyone to interview."
 *   - Claim conflict: org is already linked to another team member's account.
 *     Read-only co-tenancy variant explains the state.
 *
 * Suppressed for paid/pilot-active accounts (those don't need the welcome)
 * and for returning visits without `?welcome=1` (the page handles that
 * gating).
 *
 * The "Activate pilot" CTA is a Phase 4+5 hook — for now it triggers the
 * generic auth modal so providers can at least take a next step. When the
 * full T&C modal lands in Phase 4+5, that CTA wires to it.
 */
export default function WelcomeBanner({
  claimConflict,
  isProvider,
  onActivatePilot,
}: {
  claimConflict: boolean;
  isProvider: boolean;
  onActivatePilot: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {claimConflict ? (
            <ClaimConflictCopy />
          ) : (
            <DefaultCopy isProvider={isProvider} />
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss welcome banner"
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!claimConflict && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onActivatePilot}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Activate the pilot →
          </button>
          <p className="text-xs text-gray-500">
            Free for 3 months · No payment info needed
          </p>
        </div>
      )}
    </div>
  );
}

function DefaultCopy({ isProvider: _isProvider }: { isProvider: boolean }) {
  return (
    <>
      <h2 className="font-serif text-xl text-gray-900">
        Welcome to the student caregiver board.
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">
        Browse the students below. When you&apos;re ready to invite anyone to
        interview, accept the pilot agreement — it&apos;s a short, plain-language
        read.
      </p>
    </>
  );
}

function ClaimConflictCopy() {
  return (
    <>
      <h2 className="font-serif text-xl text-gray-900">
        This organization is already linked to another team member.
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">
        You&apos;re signed in and can browse the board freely. If you&apos;d
        like to be added to the existing team account, email{" "}
        <a
          href="mailto:logan@olera.care"
          className="font-medium text-primary-700 hover:underline"
        >
          logan@olera.care
        </a>{" "}
        and we&apos;ll handle the reconciliation.
      </p>
    </>
  );
}
