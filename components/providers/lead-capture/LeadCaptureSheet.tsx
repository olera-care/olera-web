"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { useLeadCapture } from "./use-lead-capture";
import LeadCaptureForm from "./LeadCaptureForm";
import type { LeadCaptureProps } from "./types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

  // For block states, we use normal modal with title
  const useStandardHeader = hook.isNonFamilyProfile || hook.state === "provider_block";

  const getBlockTitle = () => {
    if (hook.isNonFamilyProfile || hook.state === "provider_block") {
      return "Family account required";
    }
    return undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={useStandardHeader ? getBlockTitle() : undefined}
      hideHeader={!useStandardHeader}
      closeButtonStyle={useStandardHeader ? "default" : "minimal"}
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
            {/* Centered hero section - all entry points */}
            <div className="text-center pt-4 pb-6">
              {/* Hero icon/photo */}
              <div className="relative mx-auto mb-4 w-20 h-20">
                {entryPoint === "message_host" && staff?.image ? (
                  <Image
                    src={staff.image}
                    alt={staff.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : entryPoint === "message_host" && staff ? (
                  <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary-600">
                      {getInitials(staff.name)}
                    </span>
                  </div>
                ) : entryPoint === "custom_quote" ? (
                  <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg className="w-9 h-9 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : entryPoint === "book_consultation" ? (
                  <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg className="w-9 h-9 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg className="w-9 h-9 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title */}
              <p className="text-xl font-semibold text-gray-900">
                {entryPoint === "message_host" && staff
                  ? staff.name
                  : entryPoint === "custom_quote"
                    ? "Get a Custom Quote"
                    : entryPoint === "book_consultation"
                      ? "Book a Consultation"
                      : "Send a Message"}
              </p>

              {/* Subtitle */}
              <p className="text-sm text-gray-500 mt-1">
                {entryPoint === "message_host" && staff
                  ? staff.role
                  : entryPoint === "custom_quote"
                    ? `${providerName} will respond with pricing details`
                    : entryPoint === "book_consultation"
                      ? `Discuss care options with ${providerName}`
                      : `Connect with ${providerName}`}
              </p>
            </div>

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
