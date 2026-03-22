"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ManagePageCTAProps {
  providerSlug: string;
  providerName: string;
  providerId: string;
}

export default function ManagePageCTA({
  providerSlug,
  providerName,
  providerId,
}: ManagePageCTAProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleGetStarted = useCallback(() => {
    setOpen(false);
    router.push(`/provider/${providerSlug}/onboard`);
  }, [router, providerSlug]);

  const handleRemoval = useCallback(() => {
    setOpen(false);
    router.push(
      `/for-providers/removal-request/${providerSlug}?provider_name=${encodeURIComponent(providerName)}&provider_id=${encodeURIComponent(providerId)}`
    );
  }, [router, providerSlug, providerName, providerId]);

  return (
    <>
      {/* Inline CTA trigger */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="text-gray-500">Is this your business?</span>
        <button
          onClick={() => setOpen(true)}
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Manage this page <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            style={{ animation: "fade-in 150ms ease-out" }}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modal-enter 200ms ease-out" }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              Manage this page
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Update your details, respond to inquiries, and stand out to families.
            </p>

            {/* Primary CTA */}
            <button
              onClick={handleGetStarted}
              className="w-full mt-6 px-5 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
            >
              Get started
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Secondary: Removal */}
            <button
              onClick={handleRemoval}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Request to hide or remove page
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
