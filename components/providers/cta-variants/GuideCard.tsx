"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type CardState = "initial" | "email_capture" | "submitting" | "success";

interface GuideCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  priceRange?: string | null;
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Desktop CTA card for the "guide" variant.
 * Offers a free PDF guide in exchange for email capture.
 * All state transitions happen inline (no modal/drawer).
 */
export default function GuideCard({
  providerId,
  providerName,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  providerImage,
  priceRange,
  ctaVariant,
  ctaPreviewMode = false,
}: GuideCardProps) {
  const { user, activeProfile } = useAuth();
  const [cardState, setCardState] = useState<CardState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const clickFiredRef = useRef(false);

  // Check if user is logged in
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  // Get pricing unit from category config
  const pricingConfig = providerCategory ? getPricingConfig(providerCategory) : null;
  const priceUnit = pricingConfig?.unit ?? "month";
  const unitLabel = priceUnit === "hour" ? "Hourly" : "Monthly";

  // Location string
  const locationStr = providerCity || "Local";

  // Focus email input when entering email capture state
  useEffect(() => {
    if (cardState === "email_capture" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [cardState]);

  // Fire analytics when "Get the guide" is clicked
  const handleGetGuideClick = useCallback(() => {
    if (!ctaPreviewMode && ctaVariant && !clickFiredRef.current) {
      clickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: providerSlug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "desktop",
            action: "guide_clicked",
          },
        }),
      }).catch(() => {});
    }
    setCardState("email_capture");
  }, [ctaVariant, ctaPreviewMode, providerSlug]);

  // Handle back button (X) in email capture
  const handleBackClick = useCallback(() => {
    setCardState("initial");
    setEmail("");
    setError(null);
    clickFiredRef.current = false;
  }, []);

  // Handle email submission
  const handleSubmit = useCallback(async () => {
    const emailToUse = isLoggedIn ? userEmail : email.trim();

    if (!emailToUse) {
      setError("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      setError("Please enter a valid email");
      return;
    }

    setError(null);
    setCardState("submitting");

    try {
      const res = await fetch("/api/connections/guide-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          provider: {
            id: providerId,
            slug: providerSlug,
            name: providerName,
          },
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setCardState("email_capture");
        return;
      }

      // Set session using Supabase client if tokens returned
      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      // Store PDF URL and trigger download
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        // Auto-download the PDF
        const link = document.createElement("a");
        link.href = data.pdfUrl;
        link.download = "senior-care-checklist.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setCardState("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setCardState("email_capture");
    }
  }, [email, isLoggedIn, userEmail, providerId, providerSlug, providerName]);

  // Handle logged-in "Message provider" click
  const handleMessageProvider = useCallback(() => {
    window.location.href = `/portal/inbox`;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Initial State
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "initial") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Signed-in: Show pricing first */}
          {isLoggedIn && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Est. {unitLabel} · {locationStr}
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {priceRange || "Contact for pricing"}
              </p>
            </div>
          )}

          {/* PDF Illustration + Content */}
          <div className="flex gap-4 mb-5">
            {/* Stylized PDF Preview */}
            <div className="shrink-0 w-[72px] h-[92px] bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              {/* Document lines */}
              <div className="absolute inset-x-3 top-4 space-y-1.5">
                <div className="h-1.5 bg-primary-300/60 rounded-full w-full" />
                <div className="h-1.5 bg-primary-300/40 rounded-full w-4/5" />
                <div className="h-1.5 bg-primary-300/40 rounded-full w-full" />
                <div className="h-1.5 bg-primary-300/30 rounded-full w-3/5" />
              </div>
              {/* Checkmark badge */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* PDF label */}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/80 rounded text-[9px] font-bold text-primary-700 uppercase tracking-wide">
                PDF
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                  Free · For Families
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 leading-snug">
                Get our free checklist
              </h3>
              <p className="text-[14px] text-gray-500 mt-1.5">
                Questions to ask and costs to expect.
              </p>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handleGetGuideClick}
            className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Get the checklist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-3">
            1-page PDF · sent to your email
          </p>

          {/* Signed-in: Additional actions */}
          {isLoggedIn && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleMessageProvider}
                className="flex-1 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Message provider
              </button>
              <button
                onClick={() => {
                  window.location.href = `/portal/saved`;
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Save for later
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Email Capture State
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "email_capture") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Header with back button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Where should we send it?
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                We&apos;ll email the checklist and start the download.
              </p>
            </div>
            <button
              onClick={handleBackClick}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Email input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              ref={emailInputRef}
              type="email"
              value={isLoggedIn ? userEmail : email}
              onChange={(e) => {
                if (!isLoggedIn) {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }
              }}
              disabled={isLoggedIn}
              placeholder="your@email.com"
              className={`w-full px-4 py-3 border rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 mb-3 ${
                error
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-200 focus:ring-gray-900/20 focus:border-gray-900"
              } ${isLoggedIn ? "bg-gray-50 text-gray-500" : ""}`}
            />

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <button
              type="submit"
              className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Send & download
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-3">
            Right to your device, with a backup in your email.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Submitting State
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "submitting") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 py-8">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-8 h-8 animate-spin text-gray-400 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-gray-500">Preparing your checklist...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Success State
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        {/* Success header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Checklist on its way.</h3>
            <p className="text-sm text-gray-500">Downloaded · Also sent to your email.</p>
          </div>
        </div>

        {/* Provider card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Want to ask {providerName.split(" ")[0]} a question?
          </p>

          <div className="flex items-center gap-3">
            {providerImage ? (
              <Image
                src={providerImage}
                alt={providerName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-base font-semibold text-amber-700">
                  {providerName.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{providerName}</p>
              <p className="text-xs text-gray-500">
                {[providerCity, providerState].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleMessageProvider}
          className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
        >
          Open a thread
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Re-download link */}
        {pdfUrl && (
          <p className="text-center text-xs text-gray-400 mt-3">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Download checklist again
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
