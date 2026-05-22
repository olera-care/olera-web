"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";
import LoggedInFamilyCTA from "@/components/providers/LoggedInFamilyCTA";

interface GuideBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  careTypes?: string[];
  priceRange?: string | null;
  ctaVariant?: string | null;
  /** Start directly in enrichment mode (for logged-in users) */
  startInEnrichment?: boolean;
  /** Pre-set connectionId (for logged-in users who already created connection) */
  initialConnectionId?: string | null;
}

type SheetState = "email_capture" | "submitting" | "enrichment" | "success" | "provider_email_block" | "family_required" | "logged_in_family";

/**
 * Mobile bottom sheet for the guide CTA.
 * States: email_capture → submitting → success
 * User stays on page after success (no redirect).
 */
export default function GuideBottomSheet({
  isOpen,
  onClose,
  providerId,
  providerName,
  providerSlug,
  providerCity,
  providerState,
  providerImage,
  careTypes = [],
  priceRange,
  ctaVariant,
  startInEnrichment = false,
  initialConnectionId = null,
}: GuideBottomSheetProps) {
  const { user, activeProfile, openAuth, refreshAccountData } = useAuth();
  const { isSaved, toggleSave } = useSavedProviders();
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  // Save provider helper
  const providerIsSaved = isSaved(providerSlug);
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");
  const handleSaveProvider = useCallback(() => {
    toggleSave({
      providerId: providerSlug,
      slug: providerSlug,
      name: providerName,
      location: locationStr,
      careTypes: careTypes || [],
      image: providerImage || null,
    });
  }, [toggleSave, providerSlug, providerName, locationStr, careTypes, providerImage]);

  // Non-family profile guard (provider, caregiver, student accounts cannot use family CTAs)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");
  const accountTypeLabel = activeProfile?.type === "organization"
    ? "provider"
    : (activeProfile?.type === "caregiver" || activeProfile?.type === "student")
    ? "caregiver"
    : "current";

  const [mounted, setMounted] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("email_capture");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Parallel loading: API runs in background while user fills enrichment
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<{
    connectionId: string;
    pdfUrl: string;
    accessToken?: string;
    refreshToken?: string;
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

  // Handle escape key (disabled during submitting/enrichment)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && sheetState !== "submitting" && sheetState !== "enrichment") {
        onClose();
      }
    },
    [onClose, sheetState]
  );

  // Mount tracking for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when sheet opens/closes
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  // Track if sheet was already open to prevent reset on auth state changes
  const wasOpenRef = useRef(false);

  // Track mid-flow states that should NEVER be interrupted by auth state changes
  // This is more reliable than wasOpenRef because it explicitly protects specific states
  const isMidFlow = sheetState === "submitting" || sheetState === "enrichment" || sheetState === "success";

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => handleKeyDownRef.current(e);

    if (isOpen) {
      // Only reset state when sheet OPENS (not when auth state changes mid-flow)
      // CRITICAL: Never reset if user is mid-flow (submitting, enrichment, or success)
      if (!wasOpenRef.current && !isMidFlow) {
        // Determine starting state
        if (startInEnrichment && initialConnectionId) {
          // Logged-in user who already created connection - go straight to enrichment
          setSheetState("enrichment");
          setConnectionId(initialConnectionId);
        } else if (isNonFamilyProfile) {
          // Show family required state if logged in as provider/caregiver/student
          setSheetState("family_required");
        } else if (isLoggedIn) {
          // Logged-in family user: show streamlined CTA (skips enrichment)
          setSheetState("logged_in_family");
        } else {
          setSheetState("email_capture");
        }
        setEmail("");
        setError(null);
        setPdfUrl(null);
        setBlockedEmail(null);
        // Reset parallel loading state
        setApiLoading(false);
        setApiResult(null);
        setPendingEnrichment(undefined);
        setEnrichmentSubmitting(false);
      }
      wasOpenRef.current = true;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", keyHandler);
    } else {
      // Only reset wasOpenRef if we're NOT mid-flow
      // This prevents issues if sheet closes briefly during auth transitions
      if (!isMidFlow) {
        wasOpenRef.current = false;
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen, isLoggedIn, isNonFamilyProfile, startInEnrichment, initialConnectionId, isMidFlow]);

  // Close sheet when viewport switches to desktop
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        onClose();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen, onClose]);

  // Focus email input when sheet opens
  useEffect(() => {
    if (isOpen && sheetState === "email_capture" && emailInputRef.current) {
      // Small delay to ensure sheet animation has started
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sheetState]);

  // Handle email submit - show enrichment immediately, API runs in background
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailToUse = isLoggedIn ? userEmail : email.trim();

    if (!emailToUse) {
      setError("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Show enrichment immediately - user fills this while PDF generates
    setSheetState("enrichment");
    setApiLoading(true);
    setApiResult(null);
    setPendingEnrichment(undefined);
    setEnrichmentSubmitting(false);

    // Run API in background
    try {
      const response = await fetch("/api/connections/guide-save", {
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

      const data = await response.json();

      // Handle provider email block
      if (!response.ok && data.code === "PROVIDER_EMAIL") {
        setBlockedEmail(emailToUse);
        setSheetState("provider_email_block");
        setApiLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSheetState("email_capture");
        setApiLoading(false);
        return;
      }

      // Set session if tokens returned
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
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setConnectionId(data.connectionId);
      setPdfUrl(data.pdfUrl);
      setApiLoading(false);

      // If user already submitted enrichment while we were loading, process it now
      // (This is handled in the enrichment save callback)
    } catch {
      setError("Something went wrong. Please try again.");
      setSheetState("email_capture");
      setApiLoading(false);
    }
  };

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
        // Refresh auth context so inbox has updated profile data
        await refreshAccountData?.();
      } catch (err) {
        console.error("[GuideBottomSheet] enrichment save error:", err);
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
    setSheetState("success");
    setEnrichmentSubmitting(false);
  }, [refreshAccountData]);

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
      // Shouldn't happen, but fallback to inbox
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

  // Handle "Open a thread" click
  const handleMessageProvider = useCallback(() => {
    window.location.href = connectionId ? `/portal/inbox?id=${connectionId}` : `/portal/inbox`;
  }, [connectionId]);

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={sheetState === "submitting" || sheetState === "enrichment" ? undefined : onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{
          maxHeight: "85dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button - hidden during enrichment and success (users can tap outside to close) */}
        {sheetState !== "enrichment" && sheetState !== "success" && (
          <button
            onClick={onClose}
            disabled={sheetState === "submitting"}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors z-10 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="px-5 pb-5 flex-1 overflow-y-auto">
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Email Capture State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "email_capture" && (
            <>
              {/* Header */}
              <div className="mb-5 pr-8">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                    Free · For Families
                  </span>
                </div>
                <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                  Where should we send it?
                </h2>
                <p className="text-[15px] text-gray-500 mt-1">
                  We&apos;ll email the checklist and start the download.
                </p>
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit}>
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
                  className={`w-full px-4 py-3.5 border rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 mb-3 ${
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
                  className="w-full px-5 py-3.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Send & download
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Right to your device, with a backup in your email.
                </p>
              </form>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Logged-in Family User State (streamlined CTA) */}
          {/* Uses LoggedInFamilyCTA for consistent [♡] [Request details] layout */}
          {/* Skips enrichment, goes directly to inbox */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "logged_in_family" && (
            <LoggedInFamilyCTA
              providerId={providerId}
              providerName={providerName}
              providerSlug={providerSlug}
              providerCity={providerCity}
              providerState={providerState}
              providerImage={providerImage}
              careTypes={careTypes}
              priceRange={priceRange}
              ctaVariant={ctaVariant || "guide"}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Enrichment State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "enrichment" && (
            <>
              <EnrichmentState
                providerName={providerName}
                providerId={providerSlug}
                onSave={saveEnrichment}
                onSkip={skipEnrichment}
                saving={enrichmentSubmitting}
                successTitle={`Connected with ${providerName}`}
                successSubtitle="Checklist sent to your email"
                providerCity={providerCity}
                providerState={providerState}
                ctaVariant="guide"
                ctaSurface="mobile"
              />
              {/* Re-download link */}
              {pdfUrl && (
                <p className="text-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Download checklist again
                  </a>
                </p>
              )}
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Success State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "success" && (
            <>
              {/* Success header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">Connected with {providerName}</h2>
                  <p className="text-[13px] text-gray-500">Checklist downloaded · Sent to email</p>
                </div>
              </div>

              {/* Action buttons: Save + Go to inbox */}
              <div className="flex items-center gap-2">
                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSaveProvider}
                  className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all ${
                    providerIsSaved
                      ? "border-primary-500 bg-primary-50 text-primary-600"
                      : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500"
                  }`}
                  aria-label={providerIsSaved ? "Saved" : "Save for later"}
                >
                  {providerIsSaved ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
                {/* Go to inbox button */}
                <Link
                  href={connectionId ? `/portal/inbox?id=${connectionId}` : "/portal/inbox"}
                  className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[16px] font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Go to inbox
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>

              {/* Re-download link */}
              {pdfUrl && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Download checklist again
                  </a>
                </p>
              )}
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Family Required State (logged in as provider/caregiver/student) */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "family_required" && (
            <div className="py-6 text-center">
              <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Family account required
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                This checklist is for families exploring care options. Create a family account to download it.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuth({ defaultMode: "sign-up", intent: "family" });
                }}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Create Family Account
              </button>
              <p className="text-xs text-gray-400 mt-3">
                Use a different email than your {accountTypeLabel} account.
              </p>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Provider Email Block State (guest entered provider email) */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "provider_email_block" && (
            <div className="py-6 text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Provider email detected
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                The email <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account. To download the checklist, please use a different email.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setBlockedEmail(null);
                    setSheetState("email_capture");
                    setEmail("");
                  }}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Use Different Email
                </button>
                <button
                  onClick={() => {
                    onClose();
                    openAuth({ defaultMode: "sign-in" });
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
                >
                  Sign In Instead
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Family accounts require a separate email from provider accounts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}
