"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { useConnectionCard } from "@/components/providers/connection-card/use-connection-card";
import PhoneButton from "@/components/providers/connection-card/PhoneButton";
import Pill from "@/components/providers/connection-card/Pill";
import StepIndicator from "@/components/providers/connection-card/StepIndicator";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";
import {
  RECIPIENT_OPTIONS,
  URGENCY_OPTIONS,
  RECIPIENT_LABELS,
  URGENCY_LABELS,
} from "@/components/providers/connection-card/constants";
import { getOrCreateSessionId } from "@/lib/analytics/session";

// ── Mobile email form for new CTA (email-only, no intent questions) ──
function MobileEmailForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (email: string) => void;
  submitting?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(() => {
    setError("");
    if (honeypot) return; // Bot trap
    const val = email.trim().toLowerCase();
    if (!val) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError("Please enter a valid email address.");
      return;
    }
    onSubmit(val);
  }, [email, honeypot, onSubmit]);

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !submitting) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Your email address"
        autoComplete="email"
        className={`w-full px-3.5 py-3 border rounded-xl text-[15px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 ${
          error ? "border-red-300" : "border-gray-300"
        }`}
      />
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={submitting || !email.trim()}
        className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-[10px] text-base font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Checking..." : "Check cost & availability"}
      </button>
    </>
  );
}

// ── Mobile email capture form (inline to avoid circular imports) ──
interface MobileEmailCaptureFormProps {
  onSubmit: (email: string) => void;
  submitting?: boolean;
  error?: string;
}

function MobileEmailCaptureForm({
  onSubmit,
  submitting,
  error,
}: MobileEmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [localError, setLocalError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = useCallback(() => {
    setLocalError("");

    // Honeypot check — if filled, silently "succeed" but don't submit
    if (honeypot) {
      return;
    }

    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    onSubmit(email.trim().toLowerCase());
  }, [email, honeypot, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !submitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, submitting]
  );

  const canSubmit = email.trim().length > 0 && !submitting;
  const displayError = error || localError;

  return (
    <>
      <div className="mb-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Email address"
          autoComplete="email"
          autoFocus
          className={`w-full px-4 py-3 border rounded-[10px] text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all ${
            displayError ? "border-red-300" : "border-gray-200"
          }`}
        />
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        {displayError && (
          <p className="text-xs text-red-600 mt-1.5" role="alert">
            {displayError}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        We&apos;ll email you a link.
      </p>
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3.5 border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
          canSubmit
            ? "bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700"
            : "bg-gray-100 text-gray-400 cursor-default"
        }`}
      >
        {submitting && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitting ? "Connecting..." : "Connect"}
      </button>
    </>
  );
}

interface MobileStickyBottomCTAProps {
  providerName: string;
  priceRange: string | null;
  /** Pricing tier (3 = Medicare/Medicaid) */
  pricingTier?: number | null;
  /** Pricing disclaimer text for tooltip */
  pricingDisclaimer?: string | null;
  // ConnectionCard props
  providerId: string;
  providerSlug: string;
  reviewCount: number | undefined;
  phone: string | null;
  acceptedPayments: string[];
  careTypes: string[];
  // Redirect props
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  // CTA variant for A/B testing
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
  ctaPreviewMode?: boolean;
}

// TODO Phase 1: wire cta_click_public for the Connect button (cta='contact'),
// PhoneButton reveal (cta='phone'), and Share affordances on this surface.
// Phase 0 only covers Save (in components/providers/SaveButton.tsx) and post-submit
// lead_received via /api/connections/* — this component's intermediate clicks are deferred.

export default function MobileStickyBottomCTA({
  providerName,
  priceRange,
  pricingTier,
  pricingDisclaimer,
  providerId,
  providerSlug,
  reviewCount,
  phone,
  acceptedPayments,
  careTypes,
  providerCategory,
  providerCity,
  providerState,
  ctaVariant,
  ctaSurface = "mobile",
  ctaPreviewMode = false,
}: MobileStickyBottomCTAProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);

  // ── Redirect after connection ──
  const handleConnectionCreated = useCallback(
    (connectionId: string) => {
      setSheetOpen(false);
      const params = new URLSearchParams({
        name: providerName,
        slug: providerSlug,
      });
      if (providerCategory) params.set("category", providerCategory);
      if (providerCity) params.set("city", providerCity);
      if (providerState) params.set("state", providerState);
      router.push(`/connected/${connectionId}?${params.toString()}`);
    },
    [providerName, providerSlug, providerCategory, providerCity, providerState, router]
  );

  // ── Connection state machine (pre-loads on mount, persists across sheet open/close) ──
  const hook = useConnectionCard({
    providerId,
    providerName,
    providerSlug,
    priceRange,
    reviewCount,
    phone,
    acceptedPayments,
    careTypes,
    responseTime: null,
    onConnectionCreated: handleConnectionCreated,
    ctaVariant,
    ctaSurface,
    ctaPreviewMode,
  });

  // Suppress when an input is focused — keyboard is open and the sticky
  // bar would collide with native chrome. Re-uses the same focusin/focusout
  // pattern as MobileUXPrimitives.useKeyboardOpen.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    function isTypable(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT") {
        const type = (target as HTMLInputElement).type;
        return type !== "checkbox" && type !== "radio" && type !== "button" && type !== "submit";
      }
      return tag === "TEXTAREA" || target.isContentEditable;
    }
    function onFocusIn(e: FocusEvent) {
      if (isTypable(e.target)) setKeyboardOpen(true);
    }
    function onFocusOut() {
      requestAnimationFrame(() => {
        if (!isTypable(document.activeElement)) setKeyboardOpen(false);
      });
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Pricing tooltip ref and outside-click handler
  const tooltipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showPricingTooltip) return;

    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (tooltipButtonRef.current && !tooltipButtonRef.current.contains(e.target as Node)) {
        setShowPricingTooltip(false);
      }
    };
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showPricingTooltip]);

  // Close tooltip when sticky bar hides (benefits in view or keyboard open)
  useEffect(() => {
    if (keyboardOpen && showPricingTooltip) {
      setShowPricingTooltip(false);
    }
  }, [keyboardOpen, showPricingTooltip]);

  // Fire cta_variant_clicked when sheet opens (only once per open)
  const sheetClickFiredRef = useRef(false);
  const fireSheetOpenEvent = useCallback(() => {
    if (!ctaVariant || sheetClickFiredRef.current) return;
    // Don't fire in preview mode (contaminates A/B data)
    if (ctaPreviewMode) return;
    sheetClickFiredRef.current = true;
    // Anonymous event format
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
          surface: "mobile",
          action: "sheet_opened",
        },
      }),
    }).catch(() => {});
  }, [ctaVariant, providerSlug, ctaPreviewMode]);

  // Allow other components (e.g. ScrollToConnectionCard) to open the sheet
  useEffect(() => {
    const openSheet = () => {
      fireSheetOpenEvent();
      setSheetOpen(true);
    };
    window.addEventListener("open-connection-sheet", openSheet);
    return () => window.removeEventListener("open-connection-sheet", openSheet);
  }, [fireSheetOpenEvent]);

  // ── Dynamic Modal title ──
  const sheetTitle = (() => {
    switch (hook.cardState) {
      case "loading":
        return "What does this cost?";
      case "default":
        return "What does this cost?";
      case "intent":
        return hook.intentStep === 0
          ? "Who needs care?"
          : "When do you need care?";
      case "email_capture":
        return "How can we reach you?";
      case "enrichment":
        return undefined;
      case "connected":
        return undefined;
      case "returning":
        return "What does this cost?";
    }
  })();

  // ── Dynamic back button ──
  const sheetOnBack = (() => {
    if (hook.cardState === "intent") {
      if (hook.intentStep === 0) return () => hook.resetFlow();
      if (hook.intentStep === 1) return () => hook.setIntentStep(0);
    }
    if (hook.cardState === "email_capture") {
      return () => hook.editFromEmailCapture();
    }
    return undefined;
  })();

  // ── Dynamic footer (sticky actions) ──
  const canConnect = hook.intentData.urgency !== null && !hook.submitting;

  const sheetFooter = (() => {
    switch (hook.cardState) {
      case "loading":
        return undefined;

      case "enrichment":
        return undefined;

      case "default":
        return (
          <div className="space-y-2.5">
            {hook.userEmail ? (
              /* Logged-in: one-click */
              <>
                <p className="text-[13px] text-gray-500 text-center">
                  Signed in as {hook.userEmail}
                </p>
                <button
                  onClick={() => hook.submitInquiryForm({ email: hook.userEmail })}
                  disabled={hook.submitting}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-[10px] text-base font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {hook.submitting && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {hook.submitting ? "Checking..." : "Check cost & availability"}
                </button>
              </>
            ) : (
              /* Guest: email-only form in footer */
              <MobileEmailForm
                onSubmit={(email) => hook.submitInquiryForm({ email })}
                submitting={hook.submitting}
              />
            )}
            {hook.error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {hook.error}
              </p>
            )}
            <p className="text-[12px] text-gray-500 text-center font-medium">
              No spam. No sales calls.
            </p>
          </div>
        );

      case "intent":
        return (
          <div className="space-y-2">
            {hook.error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {hook.error}
              </p>
            )}
            <button
              onClick={hook.connect}
              disabled={!canConnect}
              className={`w-full py-3.5 rounded-[10px] text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                canConnect
                  ? "bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700"
                  : "bg-gray-100 text-gray-400 cursor-default"
              }`}
            >
              {hook.submitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {hook.submitting ? "Connecting..." : "Connect"}
            </button>
          </div>
        );

      case "email_capture":
        // Footer is included in the email capture content itself
        return undefined;

      case "connected": {
        const inboxHref = hook.connectionId
          ? `/portal/inbox?id=${hook.connectionId}`
          : "/portal/inbox";
        return (
          <div className="space-y-2.5">
            <PhoneButton phone={phone} revealed onReveal={() => {}} />
            <Link
              href={inboxHref}
              className="block w-full py-3 bg-primary-600 hover:bg-primary-500 rounded-[10px] text-sm font-semibold text-white text-center transition-colors"
            >
              Message
            </Link>
          </div>
        );
      }

      case "returning":
        return (
          <div className="space-y-2.5">
            {hook.error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {hook.error}
              </p>
            )}
            <button
              onClick={hook.connect}
              disabled={hook.submitting}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-[10px] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {hook.submitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {hook.submitting ? "Connecting..." : "Connect"}
            </button>
            <PhoneButton phone={phone} revealed onReveal={() => {}} />
          </div>
        );
    }
  })();

  // ── Derived labels for returning state ──
  const recipientLabel = hook.intentData.careRecipient
    ? RECIPIENT_LABELS[hook.intentData.careRecipient] ||
      hook.intentData.careRecipient
    : "";
  const urgencyLabel = hook.intentData.urgency
    ? URGENCY_LABELS[hook.intentData.urgency] || hook.intentData.urgency
    : "";

  // ── Connected state date ──
  const dateStr = hook.pendingRequestDate
    ? new Date(hook.pendingRequestDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "recently";

  // Parse price display - single line format
  const getPriceDisplay = () => {
    // Medicare/Medicaid tier (tier 3) without explicit pricing
    if (pricingTier === 3 && !priceRange) {
      return "Medicare/Medicaid may cover";
    }
    if (!priceRange) {
      return "Contact for pricing";
    }
    const isHourly = priceRange.includes("/hr");
    const isMonthly = priceRange.includes("/mo");

    if (isHourly) {
      return `${priceRange} estimated`;
    }
    if (isMonthly) {
      return `${priceRange} estimated`;
    }
    // Default case (no unit specified)
    return `${priceRange} estimated`;
  };

  const priceDisplay = getPriceDisplay();

  return (
    <>
      {/*
       * Document-flow spacer — keeps page content from being permanently
       * hidden behind the fixed sticky bar on mobile.
       */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
      />

      {/* ── Sticky bottom bar (always visible) ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          !keyboardOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-5 pt-3 pb-4">
            {/* Pricing info - single line */}
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-[16px] font-semibold text-gray-900">
                {priceDisplay}
              </p>
              {pricingDisclaimer && (
                <button
                  ref={tooltipButtonRef}
                  type="button"
                  onClick={() => setShowPricingTooltip((prev) => !prev)}
                  className="p-1 -m-1 flex items-center justify-center text-gray-400 hover:text-gray-500 active:text-gray-600 transition-colors"
                  aria-label="Pricing info"
                  aria-expanded={showPricingTooltip}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Full-width CTA button */}
            <button
              onClick={() => {
                fireSheetOpenEvent();
                setSheetOpen(true);
              }}
              className="w-full py-4 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[16px] font-semibold transition-colors"
            >
              Check cost & availability
            </button>
          </div>
        </div>
      </div>

      {/* ── Pricing tooltip portal ── */}
      {showPricingTooltip &&
        pricingDisclaimer &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed left-4 right-4 z-[100] md:hidden"
            style={{ bottom: "calc(140px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-xl px-4 py-3 shadow-xl leading-relaxed">
              <p>{pricingDisclaimer}</p>
            </div>
          </div>,
          document.body
        )}

      {/* ── Connection bottom sheet ── */}
      <Modal
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={hook.isNonFamilyProfile ? "Family account required" : sheetTitle}
        onBack={hook.isNonFamilyProfile ? undefined : sheetOnBack}
        footer={hook.isNonFamilyProfile ? undefined : sheetFooter}
        size="lg"
      >
        {/* ── Non-family profile block ── */}
        {hook.isNonFamilyProfile && (
          <div className="py-4 text-center animate-step-in">
            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4 px-2">
              Care consultation requests can only be sent from a family account. Create one to connect with {providerName}.
            </p>
            <button
              onClick={() => {
                setSheetOpen(false);
                hook.openAuth({ defaultMode: "sign-up", intent: "family" });
              }}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Create Family Account
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Use a different email than your {hook.accountTypeLabel} account.
            </p>
          </div>
        )}

        {/* ── Loading ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "loading" && (
          <div className="py-4 animate-step-in">
            <div className="animate-pulse space-y-3">
              <div className="h-11 bg-gray-100 rounded-[10px]" />
              <div className="h-10 bg-gray-100 rounded-[10px]" />
            </div>
          </div>
        )}


        {/* ── Intent step 0: Who needs care? ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "intent" && hook.intentStep === 0 && (
          <div className="py-2 animate-step-in">
            <StepIndicator current={0} total={hook.totalSteps} />
            <div className="flex flex-col gap-1.5">
              {RECIPIENT_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  selected={hook.intentData.careRecipient === opt.value}
                  onClick={() => hook.selectRecipient(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Intent step 1: When do you need care? ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "intent" && hook.intentStep === 1 && (
          <div className="py-2 animate-step-in">
            <StepIndicator current={1} total={hook.totalSteps} />
            <div className="grid grid-cols-2 gap-1.5">
              {URGENCY_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  selected={hook.intentData.urgency === opt.value}
                  onClick={() => hook.selectUrgency(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Email capture (guest flow) ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "email_capture" && (
          <div className="py-2 animate-step-in">
            <StepIndicator current={2} total={3} />
            {/* Summary chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipientLabel && (
                <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  {recipientLabel}
                </span>
              )}
              {urgencyLabel && (
                <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  {urgencyLabel}
                </span>
              )}
            </div>
            <MobileEmailCaptureForm
              onSubmit={hook.submitGuestRequest}
              submitting={hook.submitting}
              error={hook.error}
            />
          </div>
        )}

        {/* ── Enrichment: post-submission questions ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "enrichment" && (
          <div className="py-4 animate-step-in">
            <EnrichmentState
              providerName={providerName}
              onSave={hook.saveEnrichment}
              onSkip={hook.skipEnrichment}
              saving={hook.submitting}
              careTypes={careTypes}
              priceRange={priceRange}
            />
          </div>
        )}

        {/* ── Connected: success banner ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "connected" && (
          <div className="py-4 animate-step-in">
            <div className="flex items-center gap-3 px-4 py-4 bg-emerald-50 rounded-[10px] border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Connected &middot; {dateStr}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Returning: intent summary ── */}
        {!hook.isNonFamilyProfile && hook.cardState === "returning" && (
          <div className="py-2 animate-step-in">
            <div className="px-3.5 py-3.5 bg-gray-50 rounded-[10px] border border-gray-100">
              <p className="text-sm font-semibold text-gray-800">
                {recipientLabel}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {urgencyLabel}
              </p>
              <button
                onClick={hook.editFromReturning}
                className="text-xs text-primary-600 font-medium mt-2 underline decoration-primary-600/25 underline-offset-2 hover:decoration-primary-600/50 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                Edit details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
