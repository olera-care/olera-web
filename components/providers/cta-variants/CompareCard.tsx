"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import LoggedInFamilyCTA from "@/components/providers/LoggedInFamilyCTA";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";
import type { CompareProvider } from "@/components/providers/CompareBottomSheet";

// Phase 1: initial → Phase 2: selection (providers only) → Phase 3: email_capture → submitting → enrichment → success
// Matches mobile flow: button click reveals email input (reduces bounce rate)
type CardState = "initial" | "selection" | "email_capture" | "submitting" | "enrichment" | "enrichment_error" | "success" | "provider_email_block";

interface CompareCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerPhone?: string | null;
  providerImage?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  services?: string[];
  highlights?: string[];
  similarProviders?: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Desktop CTA card for the "compare" variant.
 *
 * Two-phase flow (matching mobile drawer pattern):
 * - Phase 1 (initial): Pricing + provider avatars + "Compare now" button
 * - Phase 2 (selection): Provider cards with checkboxes + email input + "Save & compare" button
 *
 * This preserves analytics semantics:
 * - View = card renders (Phase 1)
 * - Click = button click in Phase 1 → Phase 2
 * - Engaged = toggle checkboxes / enter email in Phase 2
 * - Converted = successful submit
 */
export default function CompareCard({
  providerId,
  providerName,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  providerPhone,
  providerImage,
  priceRange,
  rating,
  reviewCount,
  services,
  highlights,
  similarProviders = [],
  ctaVariant,
  ctaPreviewMode = false,
}: CompareCardProps) {
  const { user, activeProfile, openAuth, refreshAccountData } = useAuth();
  const { isSaved, toggleSave } = useSavedProviders();
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Save provider helper
  const providerIsSaved = isSaved(providerSlug);
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");
  const handleSaveProvider = useCallback(() => {
    toggleSave({
      providerId: providerSlug,
      slug: providerSlug,
      name: providerName,
      location: locationStr,
      careTypes: services || [],
      image: providerImage || null,
    });
  }, [toggleSave, providerSlug, providerName, locationStr, services, providerImage]);

  // Auth state
  const isLoggedIn = !!user && !!activeProfile;
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");
  const isLoggedInFamily = isLoggedIn && !isNonFamilyProfile;
  const accountTypeLabel = activeProfile?.type === "organization"
    ? "provider"
    : (activeProfile?.type === "caregiver" || activeProfile?.type === "student")
    ? "caregiver"
    : "current";

  // Card state
  const [cardState, setCardState] = useState<CardState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [connectionIds, setConnectionIds] = useState<string[]>([]);
  const [enrichmentSubmitting, setEnrichmentSubmitting] = useState(false);

  // Optimistic enrichment: store pending save data while showing enrichment immediately
  const [pendingSaveData, setPendingSaveData] = useState<{
    email: string;
    providers: { id: string; slug: string; name: string }[];
    sessionId: string;
    ctaVariant: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Build current provider object
  const currentProvider: CompareProvider = useMemo(() => ({
    id: providerId,
    slug: providerSlug,
    name: providerName,
    image: providerImage,
    category: providerCategory,
    city: providerCity,
    state: providerState,
    rating,
    reviewCount,
    priceRange,
    services,
    highlights,
  }), [providerId, providerSlug, providerName, providerImage, providerCategory, providerCity, providerState, rating, reviewCount, priceRange, services, highlights]);

  // All providers for comparison
  const allProviders = useMemo(
    () => [currentProvider, ...similarProviders.slice(0, 2)],
    [currentProvider, similarProviders]
  );

  // Track selected providers (all selected by default)
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(
    () => new Set(allProviders.map((p) => p.id))
  );

  const selectedProviders = allProviders.filter((p) => selectedProviderIds.has(p.id));
  const selectedCount = selectedProviders.length;

  // Toggle provider selection
  const toggleProvider = useCallback((providerId: string) => {
    setSelectedProviderIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  }, []);

  // Pricing config
  const pricingConfig = providerCategory ? getPricingConfig(providerCategory) : null;
  const priceUnit = pricingConfig?.unit ?? "month";
  const unitLabel = priceUnit === "hour" ? "Hourly" : "Monthly";

  // Focus email input when entering email_capture state
  useEffect(() => {
    if (cardState === "email_capture" && emailInputRef.current) {
      // Small delay to let the UI render
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [cardState]);

  // Analytics tracking ref
  const clickFiredRef = useRef(false);

  // Phase 1 → Phase 2: "Compare now" click (tracks "click" event)
  const handleCompareClick = useCallback(() => {
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
            action: "compare_clicked",
            provider_count: allProviders.length,
          },
        }),
      }).catch(() => {});
    }
    setCardState("selection");
  }, [ctaVariant, ctaPreviewMode, providerSlug, allProviders.length]);

  // Back button handler - go back to initial from selection/email_capture
  const handleBack = useCallback(() => {
    if (cardState === "email_capture") {
      // If email input is showing, hide it first (go back to selection-only view)
      setCardState("selection");
      setEmail("");
      setError(null);
    } else {
      setCardState("initial");
    }
  }, [cardState]);

  // Selection → email capture (click "Save X providers" button)
  const handleSaveClick = useCallback(() => {
    if (selectedCount === 0) {
      setError("Please select at least one provider");
      return;
    }
    setError(null);
    setCardState("email_capture");
  }, [selectedCount]);

  // Handle email form submission - OPTIMISTIC: show enrichment immediately
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const emailToUse = email.trim();

    if (!emailToUse) {
      setError("Please enter your email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      setError("Please enter a valid email address");
      return;
    }

    if (selectedCount === 0) {
      setError("Please select at least one provider");
      return;
    }

    setError(null);
    setSaveError(null);

    // OPTIMISTIC: Immediately show enrichment while save happens when user completes
    // This eliminates the loading spinner and fixes the race condition with session establishment
    const saveData = {
      email: emailToUse,
      providers: selectedProviders.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
      })),
      sessionId: getOrCreateSessionId(),
      ctaVariant: ctaVariant || "compare",
    };
    setPendingSaveData(saveData);
    setCardState("enrichment"); // Show enrichment immediately - no waiting!
  }, [email, selectedCount, selectedProviders, ctaVariant]);

  // Handle enrichment save - performs the actual save API call + enrichment update
  // This is called when user completes enrichment questions (or skips)
  const saveEnrichment = useCallback(async (enrichmentData?: {
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
    setSaveError(null);

    // If we have pending save data, we need to create the connections first
    if (pendingSaveData) {
      try {
        const response = await fetch("/api/connections/compare-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingSaveData),
        });

        const data = await response.json();

        // Handle provider email block
        if (!response.ok && data.code === "PROVIDER_EMAIL") {
          setBlockedEmail(pendingSaveData.email);
          setPendingSaveData(null);
          setCardState("provider_email_block");
          setEnrichmentSubmitting(false);
          return;
        }

        if (!response.ok) {
          setSaveError(data.error || "Something went wrong. Please try again.");
          setEnrichmentSubmitting(false);
          return;
        }

        // Defensive check: API succeeded but no connections created
        // This shouldn't happen, but if it does, show error rather than "Saved 0 providers"
        if (!data.connectionIds?.length) {
          setSaveError("No connections were created. Please try again.");
          setEnrichmentSubmitting(false);
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

        // Store connection IDs
        setConnectionIds(data.connectionIds);

        // Now update connections with enrichment data if we have any
        const hasEnrichmentData = enrichmentData?.careRecipient || enrichmentData?.urgency ||
          enrichmentData?.phone || enrichmentData?.contactPreference ||
          enrichmentData?.careType || enrichmentData?.careNeed ||
          enrichmentData?.paymentMethod || enrichmentData?.name ||
          enrichmentData?.city || enrichmentData?.state;

        if (hasEnrichmentData) {
          try {
            await Promise.all(
              data.connectionIds.map((connId: string) =>
                fetch("/api/connections/update-intent", {
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
                })
              )
            );
          } catch (err) {
            console.error("[CompareCard] enrichment update error:", err);
            // Don't fail the whole flow for enrichment errors
          }
        }

        // Dispatch event for inbox refresh
        window.dispatchEvent(new CustomEvent("olera:connection-created"));

        // Clear pending data
        setPendingSaveData(null);

        // Refresh auth context (non-blocking)
        try {
          await refreshAccountData?.();
        } catch {
          // Ignore refresh errors
        }

        // Show success
        setCardState("success");
        setEnrichmentSubmitting(false);
      } catch (err) {
        console.error("[CompareCard] save error:", err);
        setSaveError("Something went wrong. Please try again.");
        setEnrichmentSubmitting(false);
      }
    } else if (connectionIds.length > 0) {
      // Already saved, just update enrichment
      const hasEnrichmentData = enrichmentData?.careRecipient || enrichmentData?.urgency ||
        enrichmentData?.phone || enrichmentData?.contactPreference ||
        enrichmentData?.careType || enrichmentData?.careNeed ||
        enrichmentData?.paymentMethod || enrichmentData?.name ||
        enrichmentData?.city || enrichmentData?.state;

      if (hasEnrichmentData) {
        try {
          await Promise.all(
            connectionIds.map((connId) =>
              fetch("/api/connections/update-intent", {
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
              })
            )
          );
          // Refresh auth context (non-blocking)
          try {
            await refreshAccountData?.();
          } catch {
            // Ignore refresh errors
          }
        } catch (err) {
          console.error("[CompareCard] enrichment save error:", err);
        }
      }

      setCardState("success");
      setEnrichmentSubmitting(false);
    } else {
      // No pending data and no connections - this is an error state
      // Don't show "Saved 0 providers" - show error instead
      setSaveError("Something went wrong. Please try again.");
      setEnrichmentSubmitting(false);
    }
  }, [connectionIds, pendingSaveData, refreshAccountData]);

  // Skip enrichment - still needs to perform the save if pending
  const skipEnrichment = useCallback(async () => {
    if (pendingSaveData) {
      // Need to perform the save even when skipping enrichment
      setEnrichmentSubmitting(true);
      setSaveError(null);

      try {
        const response = await fetch("/api/connections/compare-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingSaveData),
        });

        const data = await response.json();

        // Handle provider email block
        if (!response.ok && data.code === "PROVIDER_EMAIL") {
          setBlockedEmail(pendingSaveData.email);
          setPendingSaveData(null);
          setCardState("provider_email_block");
          setEnrichmentSubmitting(false);
          return;
        }

        if (!response.ok) {
          setSaveError(data.error || "Something went wrong. Please try again.");
          setEnrichmentSubmitting(false);
          return;
        }

        // Defensive check: API succeeded but no connections created
        if (!data.connectionIds?.length) {
          setSaveError("No connections were created. Please try again.");
          setEnrichmentSubmitting(false);
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

        // Store connection IDs
        setConnectionIds(data.connectionIds);

        // Dispatch event for inbox refresh
        window.dispatchEvent(new CustomEvent("olera:connection-created"));

        // Clear pending data
        setPendingSaveData(null);

        // Show success
        setCardState("success");
        setEnrichmentSubmitting(false);
      } catch (err) {
        console.error("[CompareCard] skip save error:", err);
        setSaveError("Something went wrong. Please try again.");
        setEnrichmentSubmitting(false);
      }
    } else if (connectionIds.length > 0) {
      // Already saved, just go to success
      setCardState("success");
      setEnrichmentSubmitting(false);
    } else {
      // No pending data AND no connections - this is an error state
      setSaveError("Something went wrong. Please try again.");
      setEnrichmentSubmitting(false);
    }
  }, [pendingSaveData, connectionIds]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile (provider/caregiver/student)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {providerCity || "Local"}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {priceRange || "Contact for pricing"}
            </p>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Family account required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Care comparison requests can only be sent from a family account.
          </p>
          <button
            onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            Create Family Account
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Use a different email than your {accountTypeLabel} account.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Logged-in family user — show LoggedInFamilyCTA directly
  // BUT: If we're mid-flow (enrichment/success), stay in that flow - don't switch!
  // This prevents the flash when session is established after email submission.
  // ─────────────────────────────────────────────────────────────────────────────
  const isMidFlow = cardState === "email_capture" || cardState === "submitting" || cardState === "enrichment" || cardState === "enrichment_error" || cardState === "success" || cardState === "provider_email_block";
  if (isLoggedInFamily && !isMidFlow) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <LoggedInFamilyCTA
            providerId={providerId}
            providerName={providerName}
            providerSlug={providerSlug}
            providerCategory={providerCategory}
            providerCity={providerCity}
            providerState={providerState}
            providerImage={providerImage}
            careTypes={services}
            priceRange={priceRange}
            ctaVariant={ctaVariant || "compare"}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Enrichment state
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "enrichment") {
    // Use selectedCount when save is pending, connectionIds.length after save
    const providerCountDisplay = pendingSaveData ? selectedCount : (connectionIds.length || selectedCount);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {saveError ? (
            /* Error state - save failed during enrichment */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Couldn&apos;t save providers
              </h3>
              <p className="text-sm text-gray-600 mb-4">{saveError}</p>
              <button
                onClick={() => {
                  setSaveError(null);
                  saveEnrichment();
                }}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  setSaveError(null);
                  setPendingSaveData(null);
                  setCardState("email_capture");
                }}
                className="w-full py-3 px-4 mt-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
              >
                Go back
              </button>
            </div>
          ) : (
            <EnrichmentState
              providerName={providerCountDisplay > 1 ? `${providerCountDisplay} providers` : currentProvider.name}
              onSave={saveEnrichment}
              onSkip={skipEnrichment}
              saving={enrichmentSubmitting}
              successTitle={`Saved ${providerCountDisplay} provider${providerCountDisplay !== 1 ? "s" : ""}`}
              successSubtitle="We'll send you a summary to compare"
              providerCity={currentProvider.city}
              providerState={currentProvider.state}
            />
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Enrichment error state (retry option)
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "enrichment_error") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Couldn&apos;t save your details
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your providers were saved, but we couldn&apos;t save your profile details. You can add them later in your inbox.
          </p>
          <div className="space-y-2">
            <Link
              href={connectionIds.length === 1 ? `/portal/inbox?id=${connectionIds[0]}` : "/portal/inbox"}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go to inbox
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <button
              onClick={() => setCardState("enrichment")}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Success state
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "success") {
    const savedCount = connectionIds.length;
    const inboxHref = savedCount === 1 ? `/portal/inbox?id=${connectionIds[0]}` : "/portal/inbox";
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Success banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl mb-4 border border-emerald-100">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-gray-900">
              Saved {savedCount} provider{savedCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Pricing context */}
          {priceRange ? (
            <div className="mb-4">
              {(providerCategory || locationStr) && (
                <p className="text-[13px] text-gray-500 font-medium mb-1">
                  {providerCategory}{locationStr ? ` in ${locationStr}` : ""}
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
              {(providerCategory || locationStr) && (
                <p className="text-[13px] text-gray-500 font-medium mb-1">
                  {providerCategory}{locationStr ? ` in ${locationStr}` : ""}
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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Provider email block
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "provider_email_block") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Provider email detected
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            The email <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setBlockedEmail(null);
                setCardState("selection");
                setEmail("");
              }}
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
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Phase 1 - Initial state (pricing + avatars + "Compare now" button)
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "initial") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Price section */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Est. {unitLabel} · {providerCity || "Local"}
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {priceRange || "Contact for pricing"}
            </p>
          </div>

          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">Quick Comparison</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-4">
            Compare {allProviders.length} providers
          </h3>

          {/* Provider avatars preview */}
          <div className="flex items-center mb-4">
            <div className="flex -space-x-3">
              {allProviders.map((provider, idx) => (
                <div
                  key={provider.id}
                  className="relative"
                  style={{ zIndex: allProviders.length - idx }}
                >
                  {provider.image ? (
                    <Image
                      src={provider.image}
                      alt={provider.name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white bg-gray-100"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border-2 border-white">
                      <span className="text-sm font-semibold text-amber-700">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="ml-3 text-[13px] text-gray-600 line-clamp-1">
              {allProviders.length} local provider{allProviders.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Compare button */}
          <button
            onClick={handleCompareClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            Compare now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <p className="text-[12px] text-gray-500 text-center mt-2">
            See side-by-side details
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Phase 2 - Selection + Email capture (combined view like mobile)
  // Provider cards always visible, email input appears inline when needed
  // ─────────────────────────────────────────────────────────────────────────────
  const showEmailInput = cardState === "email_capture" || cardState === "submitting";
  const isSubmitting = cardState === "submitting";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        {/* Back button */}
        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3 -ml-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-3">
          Compare {allProviders.length} provider{allProviders.length !== 1 ? "s" : ""}
        </h3>

        {/* Provider cards - always visible */}
        <div className="space-y-3 mb-4">
          {allProviders.map((provider) => {
            const isCurrentProvider = provider.id === currentProvider.id;
            const isSelected = selectedProviderIds.has(provider.id);
            const providerLocationStr = [provider.city, provider.state].filter(Boolean).join(", ");
            const hasRating = provider.rating != null && provider.reviewCount != null && provider.reviewCount > 0;

            return (
              <div
                key={provider.id}
                onClick={isSubmitting ? undefined : () => toggleProvider(provider.id)}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  isSubmitting
                    ? "cursor-not-allowed opacity-60"
                    : isSelected
                      ? "cursor-pointer border-gray-200 bg-white"
                      : "cursor-pointer border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-80"
                }`}
              >
                {/* "THIS PAGE" badge */}
                {isCurrentProvider && (
                  <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-primary-600 text-white text-[10px] font-semibold uppercase tracking-wider rounded">
                    This page
                  </span>
                )}

                {/* Selection toggle - circular checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSubmitting) toggleProvider(provider.id);
                  }}
                  disabled={isSubmitting}
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed ${
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

                {/* Provider info */}
                <div className="flex items-start gap-3 pr-8">
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
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-1">
                      {provider.name}
                    </h4>
                    {providerLocationStr && (
                      <p className="text-[13px] text-gray-500 mt-0.5">{providerLocationStr}</p>
                    )}
                    {/* Rating + Price row - horizontal */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {hasRating ? (
                        <span className="text-[13px] text-gray-600 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-semibold">{provider.rating?.toFixed(1)}</span>
                          <span className="text-gray-400">· {provider.reviewCount}</span>
                        </span>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">No reviews yet</span>
                      )}
                      <span className="text-gray-300">·</span>
                      <span className="text-[13px] font-semibold text-gray-900">
                        {provider.priceRange || "Contact for pricing"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email input - revealed after clicking save button */}
        {showEmailInput && (
          <div className="mb-3 animate-fade-in">
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        {/* Save button - changes behavior based on state */}
        {showEmailInput ? (
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white rounded-xl text-[15px] font-semibold transition-colors"
            >
              {isSubmitting ? (
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
          </form>
        ) : (
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={selectedCount === 0}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            {selectedCount === 0
              ? "Select at least one"
              : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}

        <p className="text-[12px] text-gray-500 text-center mt-2">
          {showEmailInput ? "We'll send you a summary to compare" : "Save now, message when ready"}
        </p>
      </div>
    </div>
  );
}
