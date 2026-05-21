"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";

export interface CompareProvider {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  services?: string[];
  highlights?: string[];
}

interface CompareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: CompareProvider;
  similarProviders: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

type FooterState = "initial" | "email_capture" | "submitting" | "enrichment" | "success" | "provider_email_block" | "family_required";

/**
 * Mobile comparison bottom sheet with vertical stacked cards.
 * Pre-populates all 3 providers immediately for quick comparison.
 * Users can remove providers they don't want before saving.
 */
export default function CompareBottomSheet({
  isOpen,
  onClose,
  currentProvider,
  similarProviders,
  ctaVariant,
  ctaPreviewMode = false,
}: CompareBottomSheetProps) {
  const router = useRouter();
  const { user, activeProfile, openAuth } = useAuth();
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

  const [mounted, setMounted] = useState(false);
  const [footerState, setFooterState] = useState<FooterState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [enrichmentSubmitting, setEnrichmentSubmitting] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const saveClickFiredRef = useRef(false);

  // Show all providers immediately (pre-populated comparison)
  const [showSimilar, setShowSimilar] = useState(true);

  // All providers: current first, then similar
  // Memoized to prevent unnecessary callback recreations
  const allProviders = useMemo(
    () => [currentProvider, ...similarProviders.slice(0, 2)],
    [currentProvider, similarProviders]
  );

  // Providers to display (filtered by showSimilar state)
  const displayProviders = showSimilar ? allProviders : [currentProvider];
  const hasSimilarProviders = similarProviders.length > 0;

  // Track which providers are selected for saving (all selected by default)
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(
    () => new Set(allProviders.map((p) => p.id))
  );

  // Get selected providers for saving
  // When collapsed, only save the current provider (regardless of selectedProviderIds)
  // When expanded, use the full selection logic
  const selectedProviders = showSimilar
    ? allProviders.filter((p) => selectedProviderIds.has(p.id))
    : [currentProvider];
  const selectedCount = selectedProviders.length;

  // Toggle provider selection
  const toggleProvider = (providerId: string) => {
    setSelectedProviderIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Location string
  const locationStr = [currentProvider.city, currentProvider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [currentProvider.category, locationStr].filter(Boolean).join(" · ");

  // Handle escape key (disabled during submitting/enrichment)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && footerState !== "submitting" && footerState !== "enrichment") {
        onClose();
      }
    },
    [onClose, footerState]
  );

  // Mount tracking for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when sheet opens (not when auth state changes mid-flow)
  // Store handleKeyDown in a ref to avoid re-running this effect when footerState changes
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  // Track if sheet was already open to prevent reset on auth state changes
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => handleKeyDownRef.current(e);

    if (isOpen) {
      // Only reset state when sheet OPENS (not when auth state changes mid-flow)
      if (!wasOpenRef.current) {
        // Show family required state if logged in as provider/caregiver/student
        setFooterState(isNonFamilyProfile ? "family_required" : "initial");
        setSelectedProviderIds(new Set(allProviders.map((p) => p.id)));
        setShowSimilar(true);
        setEmail("");
        setError(null);
        setBlockedEmail(null);
        saveClickFiredRef.current = false;
      }
      wasOpenRef.current = true;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", keyHandler);
    } else {
      wasOpenRef.current = false;
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen, isNonFamilyProfile, allProviders]); // allProviders added since it's used inside

  // Close sheet when viewport switches to desktop (above md breakpoint)
  // This prevents scroll lock from persisting when sheet is hidden via CSS
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Switched to desktop - close the mobile sheet
        onClose();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen, onClose]);

  // Focus email input when entering email capture state
  useEffect(() => {
    if (footerState === "email_capture" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [footerState]);

  // Handle save button click with tracking (once per sheet session)
  const handleSaveClick = useCallback(() => {
    if (!ctaPreviewMode && ctaVariant && !saveClickFiredRef.current) {
      saveClickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: currentProvider.slug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "save_comparison_clicked",
          },
        }),
      }).catch(() => {});
    }
    setFooterState("email_capture");
  }, [ctaVariant, ctaPreviewMode, currentProvider.slug]);

  // Handle logged-in family user submit (skip email capture AND enrichment, go directly to inbox)
  const handleLoggedInSubmit = useCallback(async () => {
    if (!userEmail) return;

    // Track click event
    if (!ctaPreviewMode && ctaVariant && !saveClickFiredRef.current) {
      saveClickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "user",
          related_provider_id: currentProvider.slug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "save_comparison_clicked",
            logged_in: true,
          },
        }),
      }).catch(() => {});
    }

    setFooterState("submitting");

    try {
      const response = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          providers: selectedProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
          isLoggedIn: true,
        }),
      });

      const data = await response.json();

      // Handle provider email block (shouldn't happen for logged-in users, but safety check)
      if (!response.ok && data.code === "PROVIDER_EMAIL") {
        setBlockedEmail(userEmail);
        setFooterState("provider_email_block");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setFooterState("initial");
        return;
      }

      // Dispatch event for inbox refresh
      window.dispatchEvent(new CustomEvent("olera:connection-created"));

      // Logged-in family users skip enrichment, go directly to inbox
      const firstConnectionId = data.connectionIds?.[0];
      router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("initial");
    }
  }, [userEmail, ctaVariant, ctaPreviewMode, currentProvider.slug, selectedProviders, router]);

  // Handle email submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setFooterState("submitting");

    try {
      const response = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          providers: selectedProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await response.json();

      // Handle provider email block
      if (!response.ok && data.code === "PROVIDER_EMAIL") {
        setBlockedEmail(email.trim());
        setFooterState("provider_email_block");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setFooterState("email_capture");
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

      // Store connection IDs for enrichment
      if (data.connectionIds?.length > 0) {
        setConnectionIds(data.connectionIds);
      }

      // Go to enrichment instead of success
      setFooterState("enrichment");
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("email_capture");
    }
  };

  // Handle enrichment save - update ALL connections with same intent data
  const saveEnrichment = useCallback(async (data?: {
    careRecipient?: string;
    urgency?: string;
    phone?: string;
    contactPreference?: string;
  }) => {
    const firstConnectionId = connectionIds[0];

    if (!connectionIds.length || (!data?.careRecipient && !data?.urgency && !data?.phone && !data?.contactPreference)) {
      // No data to save, just redirect
      router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
      return;
    }

    setEnrichmentSubmitting(true);
    try {
      // Update all connections with the same intent data
      await Promise.all(
        connectionIds.map((connId) =>
          fetch("/api/connections/update-intent", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectionId: connId,
              careRecipient: data.careRecipient,
              urgency: data.urgency,
              phone: data.phone || undefined,
              notifyChannel: data.contactPreference || undefined,
            }),
          })
        )
      );
    } catch (err) {
      console.error("[CompareBottomSheet] enrichment save error:", err);
    }

    router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
  }, [connectionIds, router]);

  const skipEnrichment = useCallback(() => {
    const firstConnectionId = connectionIds[0];
    router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
  }, [connectionIds, router]);

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={footerState === "submitting" || footerState === "enrichment" ? undefined : onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{
          minHeight: showSimilar ? undefined : "65dvh",
          maxHeight: "95dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Enrichment state - clean full-sheet view */}
        {footerState === "enrichment" ? (
          <div className="flex-1 flex flex-col justify-center px-5 py-6">
            <EnrichmentState
              providerName={selectedCount > 1 ? `${selectedCount} providers` : currentProvider.name}
              onSave={saveEnrichment}
              onSkip={skipEnrichment}
              saving={enrichmentSubmitting}
              successTitle={`Saved ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
              successSubtitle="We'll send you a summary to compare"
            />
          </div>
        ) : (
          <>
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={footerState === "submitting"}
              className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors z-10 disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="px-5 pb-4 shrink-0 border-b border-gray-100">
              <h2 className="text-[22px] font-bold text-gray-900 leading-tight pr-10">
                Compare {allProviders.length} provider{allProviders.length !== 1 ? "s" : ""}
              </h2>
              <p className="text-[15px] text-gray-500 mt-1">
                {categoryLocationStr}
              </p>
            </div>

            {/* Vertically stacked provider cards */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-6 space-y-4">
                {displayProviders.map((provider) => {
                  const isCurrentProvider = provider.id === currentProvider.id;
                  return (
                    <CompareCard
                      key={provider.id}
                      provider={provider}
                      isCurrentProvider={isCurrentProvider}
                      isSelected={selectedProviderIds.has(provider.id)}
                      onToggle={() => toggleProvider(provider.id)}
                      showToggle={showSimilar}
                    />
                  );
                })}

              </div>
            </div>

            {/* Footer - State Machine */}
            <div className="px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          {footerState === "initial" && (
            <>
              {/* Save button is primary - all providers shown immediately */}
              {isLoggedIn ? (
                <>
                  {error && (
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleLoggedInSubmit}
                    disabled={selectedCount === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    {selectedCount === 0
                      ? "Select at least one"
                      : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Saving as {userEmail}
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={selectedCount === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    {selectedCount === 0
                      ? "Select at least one"
                      : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Save now, message when ready
                  </p>
                </>
              )}
            </>
          )}

          {/* Logged-in user submitting state */}
          {isLoggedIn && footerState === "submitting" && (
            <div className="py-2">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-xl text-[15px] font-semibold opacity-70"
              >
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Saving as {userEmail}
              </p>
            </div>
          )}

          {/* Non-logged-in user email capture / submitting state */}
          {!isLoggedIn && (footerState === "email_capture" || footerState === "submitting") && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  Save {selectedCount} provider{selectedCount !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-gray-500">We&apos;ll send you a summary to compare.</p>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={footerState === "submitting"}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50"
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={footerState === "submitting"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-70"
                >
                  {footerState === "submitting" ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save {selectedCount} provider{selectedCount !== 1 ? "s" : ""}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {footerState === "family_required" && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Family account required</h3>
              <p className="text-sm text-gray-600 mb-4">
                Care comparison requests can only be sent from a family account.
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

          {footerState === "provider_email_block" && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Provider email detected</h3>
              <p className="text-sm text-gray-600 mb-4">
                The email <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setBlockedEmail(null);
                    setFooterState("email_capture");
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
          </>
        )}
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface CompareCardProps {
  provider: CompareProvider;
  isCurrentProvider: boolean;
  isSelected: boolean;
  onToggle: () => void;
  showToggle?: boolean;
}

function CompareCard({ provider, isCurrentProvider, isSelected, onToggle, showToggle = true }: CompareCardProps) {
  const locationStr = [provider.city, provider.state].filter(Boolean).join(", ");
  const hasRating = provider.rating != null && provider.reviewCount != null && provider.reviewCount > 0;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-gray-200 bg-white"
          : "border-gray-100 bg-gray-50/50 opacity-60"
      }`}
    >
      {/* "THIS PAGE" badge - positioned on border */}
      {isCurrentProvider && (
        <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-primary-600 text-white text-[10px] font-semibold uppercase tracking-wider rounded">
          This page
        </span>
      )}

      {/* Selection toggle - circular checkbox in top right */}
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "border-primary-500 bg-primary-500 text-white"
              : "border-gray-300 bg-white text-transparent hover:border-gray-400"
          }`}
          aria-label={isSelected ? "Remove from comparison" : "Add to comparison"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}

      {/* Provider info - compact layout */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {provider.image ? (
          <Image
            src={provider.image}
            alt={provider.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-amber-700">
              {provider.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-1">
            {provider.name}
          </h3>
          {locationStr && (
            <p className="text-[13px] text-gray-500 mt-0.5">{locationStr}</p>
          )}

          {/* Rating - simple text */}
          {hasRating ? (
            <p className="text-[13px] text-gray-600 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">{provider.rating?.toFixed(1)}</span>
              <span className="text-gray-400">· {provider.reviewCount}</span>
            </p>
          ) : (
            <p className="text-[13px] text-gray-400 italic mt-1">No reviews yet</p>
          )}

          {/* Price - simple text */}
          <p className="text-[13px] font-semibold text-gray-900 mt-0.5">
            {provider.priceRange || "Contact for pricing"}
          </p>
        </div>
      </div>
    </div>
  );
}

