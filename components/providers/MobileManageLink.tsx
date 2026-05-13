"use client";

import { useState } from "react";
import ManageListingModal from "./ManageListingModal";

interface MobileManageLinkProps {
  providerName: string;
  providerSlug: string;
  providerId: string;
  sourceProviderId?: string | null;
  providerEmail?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
}

export function MobileManageLink({
  providerName,
  providerSlug,
  providerId,
  sourceProviderId,
  providerEmail,
  providerCity,
  providerState,
}: MobileManageLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-semibold text-primary-600 hover:text-primary-700"
      >
        Manage this page &rarr;
      </button>
      <ManageListingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        providerName={providerName}
        providerSlug={providerSlug}
        providerId={providerId}
        sourceProviderId={sourceProviderId}
        providerEmail={providerEmail}
        providerCity={providerCity}
        providerState={providerState}
      />
    </>
  );
}
