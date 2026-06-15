"use client";

import { useState } from "react";
import Link from "next/link";
import PilotTermsModal from "@/components/medjobs/PilotTermsModal";

// The banner has no dismiss affordance — it persists until the provider
// activates the pilot (the page hides it once pilot-active).

/**
 * WelcomeBanner — first-arrival banner for cold-provider magic-link clicks.
 * Phase 2+3 Bullet 12 (2026-06-04). Phase 4+5 Bullet 4 (2026-06-04): wires
 * the "Activate the pilot →" CTA to PilotTermsModal — the conversion gate.
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
 */
export default function WelcomeBanner({
  claimConflict,
  isProvider,
  outreachId,
  autoOpen,
}: {
  claimConflict: boolean;
  isProvider: boolean;
  /** Threaded from the magic-link landing so activation targets the right
   *  org deterministically (decision: org-owned). */
  outreachId?: string;
  /** From `?activate=1` (activation-cadence links). Lands the provider with
   *  the Terms modal already open, one tap from Trial Active. */
  autoOpen?: boolean;
}) {
  const [showTermsModal, setShowTermsModal] = useState(!!autoOpen && !claimConflict);

  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0">
        {claimConflict ? <ClaimConflictCopy /> : <DefaultCopy isProvider={isProvider} />}
      </div>

      {!claimConflict && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Join as a partner →
          </button>
          <p className="text-xs text-gray-500">
            Free for 3 months · No payment info needed
          </p>
        </div>
      )}

      {!claimConflict && (
        <p className="mt-2 text-[11px] text-gray-400">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>,
          including keeping placements on Olera.
        </p>
      )}

      {showTermsModal && (
        <PilotTermsModal
          outreachId={outreachId}
          onCancel={() => setShowTermsModal(false)}
          onSuccess={() => {
            setShowTermsModal(false);
            // Force a full refresh so the candidate board re-evaluates
            // medjobsAccessActive (now true) and renders full mode.
            // Strip ?welcome=1 from the URL so the banner doesn't
            // re-appear after the reload.
            const url = new URL(window.location.href);
            url.searchParams.delete("welcome");
            url.searchParams.delete("claim_conflict");
            window.location.assign(url.toString());
          }}
        />
      )}
    </div>
  );
}

function DefaultCopy({ isProvider: _isProvider }: { isProvider: boolean }) {
  return (
    <>
      <h2 className="font-serif text-xl text-gray-900">
        Welcome to the pre-health intern board.
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">
        Browse the interns below. When you&apos;re ready to invite anyone to
        interview, accept the partner agreement — it&apos;s a short, plain-language
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
