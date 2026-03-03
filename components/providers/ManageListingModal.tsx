"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ClaimState } from "@/lib/types";

type ModalView = "choice";


interface ManageListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  providerSlug: string;
  providerId: string;
  /** The olera-providers.provider_id (needed for claim verification). Falls back to providerId. */
  sourceProviderId?: string | null;
  /** The provider's current claim state */
  claimState?: ClaimState;
  /** The account_id of the claiming user (for ownership check) */
  claimAccountId?: string | null;
}

/** Trigger button + modal combo for use in server components */
export function ManagePageButton({
  providerName,
  providerSlug,
  providerId,
  sourceProviderId,
  claimState,
  claimAccountId,
}: Omit<ManageListingModalProps, "isOpen" | "onClose">) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
      >
        Manage this page
      </button>
      <ManageListingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        providerName={providerName}
        providerSlug={providerSlug}
        providerId={providerId}
        sourceProviderId={sourceProviderId}
        claimState={claimState}
        claimAccountId={claimAccountId}
      />
    </>
  );
}

export default function ManageListingModal({
  isOpen,
  onClose,
  providerName,
  providerSlug,
  providerId,
  sourceProviderId,
  claimState,
  claimAccountId,
}: ManageListingModalProps) {
  const router = useRouter();
  const { account } = useAuth();
  const [view, setView] = useState<ModalView>("choice");

  // Ownership detection
  const isClaimed = claimState === "claimed";
  const isOwner = isClaimed && !!account && !!claimAccountId && account.id === claimAccountId;

  // Scroll modal body to top when view changes
  const viewContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scrollable = viewContentRef.current?.closest(".overflow-y-auto");
    if (scrollable) scrollable.scrollTop = 0;
  }, [view]);

  function handleClose() {
    onClose();
    setTimeout(() => setView("choice"), 200);
  }

  function handleClaimClick() {
    // Navigate to the claim verification page — no auth modal
    const claimId = sourceProviderId || providerId;
    handleClose();
    router.push(`/for-providers/claim/${providerSlug}?provider_id=${claimId}`);
  }

  function handleDisputeClick() {
    const claimId = sourceProviderId || providerId;
    handleClose();
    router.push(`/for-providers/claim/${providerSlug}?provider_id=${claimId}`);
  }

  // Navigate to the dedicated removal request page
  function handleRemovalClick() {
    handleClose();
    const params = new URLSearchParams({
      provider_name: providerName,
      provider_id: sourceProviderId || providerId,
    });
    router.push(`/for-providers/removal-request/${providerSlug}?${params.toString()}`);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage listing"
      size="2xl"
    >
      <div ref={viewContentRef}>
      {/* ── Choice Screen ── */}
      {view === "choice" && (
        <div className="pt-2 pb-4">
          {/* CASE 1: Claimed + Owner → Go to Dashboard */}
          {isOwner && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-primary-900 mb-0.5">
                    You manage this listing
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This listing is linked to your account. Update info, respond to families, and manage your presence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { handleClose(); router.push("/provider"); }}
                className="w-full py-3 bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* CASE 2: Claimed + NOT Owner → Info + Dispute */}
          {isClaimed && !isOwner && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                    This listing has been claimed
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Someone has already verified ownership of <strong>{providerName}</strong>. If you believe this is incorrect, you can dispute the claim.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisputeClick}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Dispute this claim
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* CASE 3: Unclaimed → Claim card */}
          {!isClaimed && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-primary-900 mb-0.5">
                    Claim this listing
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Manage your page, respond to families, and update your info
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClaimClick}
                className="w-full py-3 bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Get started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Separator + removal link — navigates to dedicated page */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleRemovalClick}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Request to hide or remove this page
            </button>
          </div>
        </div>
      )}
      </div>
    </Modal>
  );
}
