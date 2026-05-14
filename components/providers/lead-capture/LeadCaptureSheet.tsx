"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useLeadCapture } from "./use-lead-capture";
import LeadCaptureHeader from "./LeadCaptureHeader";
import LeadCaptureForm from "./LeadCaptureForm";
import type { LeadCaptureProps } from "./types";

export default function LeadCaptureSheet({
  providerId,
  providerName,
  providerSlug,
  entryPoint,
  staff,
  isOpen,
  onClose,
  onSuccess,
  providerCity,
  providerState,
  providerCategory,
}: LeadCaptureProps) {
  const hook = useLeadCapture({
    providerId,
    providerName,
    providerSlug,
    entryPoint,
    providerCity,
    providerState,
    providerCategory,
    onSuccess,
    onClose,
  });

  // Form key to remount form when modal opens (resets form state)
  const [formKey, setFormKey] = useState(0);

  // Reset state when modal opens
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      hook.resetState();
      setFormKey((k) => k + 1); // Remount form to reset local state
    }
    wasOpen.current = isOpen;
  }, [isOpen, hook.resetState]);

  // Dynamic title based on entry point and state
  const getTitle = () => {
    if (hook.isNonFamilyProfile) {
      return "Family account required";
    }

    if (hook.state === "provider_block") {
      return "Family account required";
    }

    switch (entryPoint) {
      case "message_host":
        return staff ? `Message ${staff.name.split(" ")[0]}` : "Send a Message";
      case "custom_quote":
        return "Get a Custom Quote";
      case "book_consultation":
        return "Book a Consultation";
      default:
        return "Connect";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="lg"
    >
      {/* Non-family profile block */}
      {hook.isNonFamilyProfile && (
        <div className="py-4 text-center animate-step-in">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4 px-2">
            Care consultation requests can only be sent from a family account.
            Create one to connect with {providerName}.
          </p>
          <button
            onClick={hook.openFamilyAuth}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Family Account
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Use a different email than your {hook.accountTypeLabel} account.
          </p>
        </div>
      )}

      {/* Provider email block (guest tried with provider email) */}
      {!hook.isNonFamilyProfile && hook.state === "provider_block" && (
        <div className="py-4 text-center animate-step-in">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{hook.blockedEmail}</span> is linked to a
            provider account.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Use a different email to connect as a care seeker.
          </p>
          <button
            onClick={hook.resetFromProviderBlock}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Use Different Email
          </button>
        </div>
      )}

      {/* Main form */}
      {!hook.isNonFamilyProfile &&
        hook.state !== "provider_block" &&
        hook.state !== "success" && (
          <div className="animate-step-in">
            <LeadCaptureHeader
              entryPoint={entryPoint}
              staff={staff}
              providerName={providerName}
            />
            <LeadCaptureForm
              key={formKey}
              isLoggedIn={hook.isLoggedIn}
              userEmail={hook.userEmail}
              userName={hook.userName}
              userPhone={hook.userPhone}
              onSubmit={hook.submitForm}
              submitting={hook.state === "submitting"}
              error={hook.error}
            />
          </div>
        )}
    </Modal>
  );
}
