"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
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
  const { isSaved, toggleSave } = useSavedProviders();

  // Save provider helper
  const providerIsSaved = isSaved(providerSlug);
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");
  const handleSaveProvider = useCallback(() => {
    toggleSave({
      providerId: providerSlug,
      slug: providerSlug,
      name: providerName,
      location: locationStr,
      careTypes: careTypes,
      image: providerImage || null,
    });
  }, [toggleSave, providerSlug, providerName, locationStr, careTypes, providerImage]);

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

  // Short location for initial state display
  const shortLocation = providerCity || "Local";

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
              Est. {unitLabel} · {shortLocation}
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
              Est. {unitLabel} · {shortLocation}
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
  // RENDER: Success State
  // ─────────────────────────────────────────────────────────────────────────────
  const inboxHref = connectionId ? `/portal/inbox?id=${connectionId}` : "/portal/inbox";
  const careLabel = careTypes.length > 0 ? careTypes[0] : providerCategory;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        {/* Success banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl mb-4 border border-emerald-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">
              Connected with {providerName}
            </p>
            <p className="text-[12px] text-gray-500">
              Checklist sent to your email
            </p>
          </div>
        </div>

        {/* Pricing context */}
        {priceRange ? (
          <div className="mb-4">
            {(careLabel || locationStr) && (
              <p className="text-[13px] text-gray-500 font-medium mb-1">
                {careLabel}{locationStr ? ` in ${locationStr}` : ""}
              </p>
            )}
            <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
              {priceRange}
            </p>
            <p className="text-[13px] text-gray-600 font-semibold mt-1.5">
              Area estimate — not this provider&apos;s actual price
            </p>
          </div>
        ) : (
          <div className="mb-4">
            {(careLabel || locationStr) && (
              <p className="text-[13px] text-gray-500 font-medium mb-1">
                {careLabel}{locationStr ? ` in ${locationStr}` : ""}
              </p>
            )}
            <p className="text-[18px] font-bold text-gray-900 leading-snug">
              Contact for pricing
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 mb-4" />

        {/* CTA section header */}
        <p className="text-[15px] font-semibold text-gray-900 mb-3">
          Continue the conversation
        </p>

        {/* Side-by-side buttons: [♡] [Go to inbox] */}
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveProvider}
            className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${
              providerIsSaved
                ? "border-primary-500 bg-primary-50 text-primary-600"
                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500"
            }`}
            aria-label={providerIsSaved ? "Saved" : "Save for later"}
          >
            {providerIsSaved ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>

          {/* Go to inbox button */}
          <Link
            href={inboxHref}
            className="flex-1 py-3 px-4 rounded-xl text-[15px] font-semibold bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Go to inbox
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Re-download link */}
        {pdfUrl && (
          <p className="text-center text-xs text-gray-400 mt-3">
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Download checklist again
            </a>
          </p>
        )}

        {/* Trust signal */}
        <p className="text-[13px] text-gray-600 text-center font-medium mt-3 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          No spam. No sales calls.
        </p>
      </div>
    </div>
  );
}
