"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import EligibilityScreenerModal from "@/components/medjobs/EligibilityScreenerModal";
import HostingInfoModal from "@/components/medjobs/HostingInfoModal";
import DrDuBoseWelcome from "@/components/medjobs/DrDuBoseWelcome";

/**
 * WelcomeBanner — provider banner on the candidate board (Phase B).
 *
 * Two states, keyed on eligibility:
 *  - Not eligible → prompt + run the eligibility screener (auto-opens on
 *    magic-link arrival via `autoOpenScreener`). On finish the page reloads
 *    and the provider becomes eligible.
 *  - Eligible → "you're a fit" + "interview students before you commit" +
 *    a Learn-more modal and a welcome from Dr. DuBose.
 *
 * Replaces the old pilot-activation banner (PilotTermsModal); see
 * docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md.
 */
export default function WelcomeBanner({
  claimConflict,
  isEligible,
  providerProfileId,
  campusName,
  orgName,
  autoOpenScreener,
}: {
  claimConflict: boolean;
  isEligible: boolean;
  providerProfileId?: string;
  campusName?: string | null;
  orgName?: string | null;
  autoOpenScreener?: boolean;
}) {
  const { refreshAccountData } = useAuth();
  const [showScreener, setShowScreener] = useState(
    !!autoOpenScreener && !isEligible && !claimConflict,
  );
  const [showHostingInfo, setShowHostingInfo] = useState(false);

  // On screener completion, refresh auth state in place instead of a full
  // page reload. The screener already wrote the eligibility flag; pulling fresh
  // profiles flips isEligible → true so this banner re-renders to the "You're a
  // fit" state and the modal unmounts, with no white-flash reload. Awaited by
  // the modal so its spinner stays up until the new state is ready. Strip the
  // one-shot query params so a manual refresh doesn't re-open the screener.
  const onScreenerComplete = async () => {
    await refreshAccountData();
    setShowScreener(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    url.searchParams.delete("activate");
    url.searchParams.delete("claim_conflict");
    window.history.replaceState(null, "", url.toString());
  };

  if (claimConflict) {
    return (
      <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:px-6 sm:py-5">
        <h2 className="font-serif text-xl text-gray-900">
          This organization is already linked to another team member.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          You&apos;re signed in and can browse the board freely. To be added to the
          existing team account, email{" "}
          <a href="mailto:logan@olera.care" className="font-medium text-primary-700 hover:underline">
            logan@olera.care
          </a>{" "}
          and we&apos;ll handle it.
        </p>
      </div>
    );
  }

  if (isEligible) {
    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:px-6 sm:py-5">
          <h2 className="font-serif text-xl text-gray-900">You&apos;re a fit.</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            Interview students before you commit. Browse below, meet someone by
            video, and only host when it&apos;s a good fit.
          </p>
          <button
            type="button"
            onClick={() => setShowHostingInfo(true)}
            className="mt-3 rounded-md border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
          >
            Learn more about hosting
          </button>
        </div>
        <DrDuBoseWelcome />
        {showHostingInfo && <HostingInfoModal onClose={() => setShowHostingInfo(false)} />}
      </div>
    );
  }

  // Not eligible → eligibility prompt + screener.
  return (
    <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 px-5 py-4 sm:px-6 sm:py-5">
      <h2 className="font-serif text-xl text-gray-900">Check your eligibility to host</h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-700">
        A quick check (about a minute) to see if {campusName ? `${campusName} ` : ""}student
        caregivers fit your agency. No commitment.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowScreener(true)}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Check eligibility →
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-gray-600">
          Terms
        </Link>
        , including keeping placements on Olera.
      </p>
      {showScreener && (
        <EligibilityScreenerModal
          providerProfileId={providerProfileId}
          campusName={campusName}
          orgName={orgName}
          onClose={() => setShowScreener(false)}
          onComplete={onScreenerComplete}
        />
      )}
    </div>
  );
}
