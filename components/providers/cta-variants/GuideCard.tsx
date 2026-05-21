"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";
import LoggedInFamilyCTA from "@/components/providers/LoggedInFamilyCTA";

type CardState = "initial" | "email_capture" | "submitting" | "enrichment" | "success" | "provider_email_block";

interface GuideCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  careTypes?: string[];
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
  careTypes = [],
  priceRange,
  ctaVariant,
  ctaPreviewMode = false,
}: GuideCardProps) {
  const { user, activeProfile, openAuth } = useAuth();
  const [cardState, setCardState] = useState<CardState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const clickFiredRef = useRef(false);

  // Parallel loading: API runs in background while user fills enrichment
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<{
    connectionId: string;
    pdfUrl: string;
  } | null>(null);
  // undefined = user hasn't submitted, null = user skipped, object = user submitted data
  const [pendingEnrichment, setPendingEnrichment] = useState<{
    careRecipient?: string;
    urgency?: string;
    phone?: string;
    contactPreference?: string;
    careType?: string;
    careNeed?: string;
    paymentMethod?: string;
    name?: string;
    city?: string;
    state?: string;
  } | null | undefined>(undefined);

  // Check if user is logged in
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");
  const accountTypeLabel = activeProfile?.type === "organization"
    ? "provider"
    : (activeProfile?.type === "caregiver" || activeProfile?.type === "student")
    ? "caregiver"
    : "current";

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
    // Reset parallel loading state
    setApiLoading(false);
    setApiResult(null);
    setPendingEnrichment(undefined);
    setEnrichmentSubmitting(false);
  }, []);

  // Handle email submission - show enrichment immediately, API runs in background
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
    // Show enrichment immediately - user fills this while PDF generates
    setCardState("enrichment");
    setApiLoading(true);
    setApiResult(null);
    setPendingEnrichment(undefined);
    setEnrichmentSubmitting(false);

    // Run API in background
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

      // Handle provider email block
      if (!res.ok && data.code === "PROVIDER_EMAIL") {
        setBlockedEmail(emailToUse);
        setCardState("provider_email_block");
        setApiLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setCardState("email_capture");
        setApiLoading(false);
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

      // Store API result
      setApiResult({
        connectionId: data.connectionId,
        pdfUrl: data.pdfUrl,
      });
      setConnectionId(data.connectionId);
      setPdfUrl(data.pdfUrl);
      setApiLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setCardState("email_capture");
      setApiLoading(false);
    }
  }, [email, isLoggedIn, userEmail, providerId, providerSlug, providerName]);

  // Handle enrichment save - works with parallel loading
  const [enrichmentSubmitting, setEnrichmentSubmitting] = useState(false);

  // Complete the flow: save enrichment, download PDF, show success
  const completeFlow = useCallback(async (
    connId: string,
    pdfUrlToUse: string | null,
    enrichmentData?: {
      careRecipient?: string;
      urgency?: string;
      phone?: string;
      contactPreference?: string;
      careType?: string;
      careNeed?: string;
      paymentMethod?: string;
      name?: string;
      city?: string;
      state?: string;
    }
  ) => {
    // Save enrichment if we have any data
    const hasData = enrichmentData?.careRecipient || enrichmentData?.urgency ||
      enrichmentData?.phone || enrichmentData?.contactPreference ||
      enrichmentData?.careType || enrichmentData?.careNeed ||
      enrichmentData?.paymentMethod || enrichmentData?.name ||
      enrichmentData?.city || enrichmentData?.state;

    if (hasData) {
      try {
        await fetch("/api/connections/update-intent", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: connId,
            careRecipient: enrichmentData.careRecipient,
            urgency: enrichmentData.urgency,
            phone: enrichmentData.phone || undefined,
            notifyChannel: enrichmentData.contactPreference || undefined,
            careType: enrichmentData.careType || undefined,
            careNeed: enrichmentData.careNeed || undefined,
            paymentMethod: enrichmentData.paymentMethod || undefined,
            name: enrichmentData.name || undefined,
            city: enrichmentData.city || undefined,
            state: enrichmentData.state || undefined,
          }),
        });
      } catch (err) {
        console.error("[GuideCard] enrichment save error:", err);
      }
    }

    // Download PDF
    if (pdfUrlToUse) {
      const link = document.createElement("a");
      link.href = pdfUrlToUse;
      link.download = "senior-care-checklist.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Stay on page - show success state
    setCardState("success");
    setEnrichmentSubmitting(false);
  }, []);

  const saveEnrichment = useCallback(async (data?: {
    careRecipient?: string;
    urgency?: string;
    phone?: string;
    contactPreference?: string;
    careType?: string;
    careNeed?: string;
    paymentMethod?: string;
    name?: string;
    city?: string;
    state?: string;
  }) => {
    setEnrichmentSubmitting(true);

    // If API is still loading, store enrichment and wait
    if (apiLoading) {
      setPendingEnrichment(data || null);
      return; // Effect will handle completion when API finishes
    }

    // API is done - complete the flow now
    const connId = apiResult?.connectionId || connectionId;
    if (!connId) {
      window.location.href = "/portal/inbox";
      return;
    }

    await completeFlow(connId, apiResult?.pdfUrl || pdfUrl, data);
  }, [apiLoading, apiResult, connectionId, pdfUrl, completeFlow]);

  const skipEnrichment = useCallback(() => {
    setEnrichmentSubmitting(true);

    // If API is still loading, store null enrichment and wait
    if (apiLoading) {
      setPendingEnrichment(null);
      return;
    }

    // API is done - complete the flow
    const connId = apiResult?.connectionId || connectionId;
    if (!connId) {
      window.location.href = "/portal/inbox";
      return;
    }

    completeFlow(connId, apiResult?.pdfUrl || pdfUrl, undefined);
  }, [apiLoading, apiResult, connectionId, pdfUrl, completeFlow]);

  // Effect: When API completes and user has submitted/skipped enrichment, complete the flow
  useEffect(() => {
    // pendingEnrichment !== undefined means user has made a choice (submit or skip)
    if (!apiLoading && apiResult && pendingEnrichment !== undefined && enrichmentSubmitting) {
      completeFlow(apiResult.connectionId, apiResult.pdfUrl, pendingEnrichment || undefined);
    }
  }, [apiLoading, apiResult, pendingEnrichment, enrichmentSubmitting, completeFlow]);

  // Reset from provider email block
  const resetFromProviderEmailBlock = useCallback(() => {
    setBlockedEmail(null);
    setCardState("email_capture");
    setEmail("");
    setError(null);
  }, []);

  // Handle "Open a thread" click in success state (connection already exists)
  const handleOpenThread = useCallback(() => {
    window.location.href = connectionId ? `/portal/inbox?id=${connectionId}` : `/portal/inbox`;
  }, [connectionId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile guard (provider/caregiver/student logged in)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Price section - consistent with regular view */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {locationStr}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {priceRange || "Contact for pricing"}
            </p>
          </div>

          {/* Family account required message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Family account required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This checklist is for families exploring care options. Create a family account to download it.
          </p>
          <button
            onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Family Account
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Use a different email than your {accountTypeLabel} account.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Provider email block (guest entered provider email)
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "provider_email_block") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 py-6 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Provider email detected
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            The email <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account. To download the checklist, please use a different email.
          </p>
          <div className="space-y-2">
            <button
              onClick={resetFromProviderEmailBlock}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Use Different Email
            </button>
            <button
              onClick={() => openAuth({ defaultMode: "sign-in" })}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
            >
              Sign In Instead
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Family accounts require a separate email from provider accounts.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Initial State - Logged-in Family User (streamlined CTA)
  // Uses LoggedInFamilyCTA for consistent [♡] [Request details] layout
  // Skips enrichment, goes directly to inbox
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "initial" && isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <LoggedInFamilyCTA
            providerId={providerId}
            providerName={providerName}
            providerSlug={providerSlug}
            providerCategory={providerCategory}
            providerCity={providerCity}
            providerState={providerState}
            providerImage={providerImage}
            careTypes={careTypes.length > 0 ? careTypes : (providerCategory ? [providerCategory] : [])}
            priceRange={priceRange}
            ctaVariant={ctaVariant || "guide"}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Initial State - Guest (lead with checklist for conversion)
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "initial") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Pricing header */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {locationStr}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {priceRange || "Contact for pricing"}
            </p>
          </div>

          {/* PDF Illustration + Content */}
          <div className="flex gap-4 mb-5">
            {/* Stylized PDF Preview */}
            <div className="shrink-0 w-[72px] h-[92px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              {/* Document lines */}
              <div className="absolute inset-x-3 top-4 space-y-1.5">
                <div className="h-1.5 bg-gray-300/60 rounded-full w-full" />
                <div className="h-1.5 bg-gray-300/40 rounded-full w-4/5" />
                <div className="h-1.5 bg-gray-300/40 rounded-full w-full" />
                <div className="h-1.5 bg-gray-300/30 rounded-full w-3/5" />
              </div>
              {/* Checkmark badge */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* PDF label */}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/80 rounded text-[9px] font-bold text-gray-600 uppercase tracking-wide">
                PDF
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                  Free · For Families
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 leading-snug">
                Get our free checklist
              </h3>
              <p className="text-[14px] text-gray-500 mt-0.5">
                Questions to ask and costs to expect.
              </p>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handleGetGuideClick}
            className="w-full px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Get free checklist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-3">
            1-page PDF · sent to your email
          </p>
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
              className="w-full px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
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
  // RENDER: Enrichment State
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "enrichment") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <EnrichmentState
            providerName={providerName}
            onSave={saveEnrichment}
            onSkip={skipEnrichment}
            saving={enrichmentSubmitting}
            priceRange={priceRange}
            successTitle={`Connected with ${providerName}`}
            successSubtitle="Checklist sent to your email"
            providerCity={providerCity}
            providerState={providerState}
          />
          {/* Re-download link */}
          {pdfUrl && (
            <p className="text-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                Download checklist again
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Success State (fallback - should not normally reach here now)
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

        {/* CTA button - connection already exists from email submission */}
        <button
          onClick={handleOpenThread}
          className="w-full px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
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
