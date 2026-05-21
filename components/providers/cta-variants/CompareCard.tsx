"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getPricingConfig } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import LoggedInFamilyCTA from "@/components/providers/LoggedInFamilyCTA";
import EnrichmentState from "@/components/providers/connection-card/EnrichmentState";
import type { CompareProvider } from "@/components/providers/CompareBottomSheet";

type CardState = "initial" | "email_capture" | "submitting" | "enrichment" | "success" | "provider_email_block";

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
 * Handles everything inline: provider selection, email capture, enrichment, success.
 * No overlay/drawer needed.
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
  const { user, activeProfile, openAuth } = useAuth();
  const emailInputRef = useRef<HTMLInputElement>(null);

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
  const categoryLocationStr = [providerCategory, providerCity].filter(Boolean).join(" in ");

  // Focus email input when entering email capture state
  useEffect(() => {
    if (cardState === "email_capture" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [cardState]);

  // Analytics tracking
  const clickFiredRef = useRef(false);

  // Handle "Save X providers" click
  const handleSaveClick = useCallback(() => {
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
            selected_count: selectedCount,
          },
        }),
      }).catch(() => {});
    }
    setCardState("email_capture");
  }, [ctaVariant, ctaPreviewMode, providerSlug, selectedCount]);

  // Handle email form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const emailToUse = email.trim();

    if (!emailToUse) {
      setError("Please enter your email");
      return;
    }

    if (selectedCount === 0) {
      setError("Please select at least one provider");
      return;
    }

    setError(null);
    setCardState("submitting");

    const supabase = createClient();

    try {
      // Check if email belongs to a provider account
      const { data: existingProfile } = await supabase
        .from("business_profiles")
        .select("id, type")
        .eq("email", emailToUse.toLowerCase())
        .single();

      if (existingProfile?.type === "organization") {
        setBlockedEmail(emailToUse);
        setCardState("provider_email_block");
        return;
      }

      // Create connections for all selected providers
      const createdIds: string[] = [];

      for (const provider of selectedProviders) {
        const res = await fetch("/api/connections/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: provider.id,
            providerName: provider.name,
            providerSlug: provider.slug,
            email: emailToUse,
            intentData: {
              careRecipient: null,
              careType: null,
              urgency: null,
            },
            session_id: getOrCreateSessionId(),
            cta_variant: ctaVariant || "compare",
          }),
        });

        const data = await res.json();

        if (res.ok && data.connectionId) {
          createdIds.push(data.connectionId);
        }
      }

      if (createdIds.length === 0) {
        setError("Something went wrong. Please try again.");
        setCardState("email_capture");
        return;
      }

      setConnectionIds(createdIds);

      // Dispatch event for inbox refresh
      window.dispatchEvent(new CustomEvent("olera:connection-created"));

      // Go to enrichment
      setCardState("enrichment");
    } catch (err) {
      console.error("[CompareCard] error:", err);
      setError("Something went wrong. Please try again.");
      setCardState("email_capture");
    }
  }, [email, selectedCount, selectedProviders, ctaVariant]);

  // Handle enrichment save
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
    const hasData = data?.careRecipient || data?.urgency ||
      data?.phone || data?.contactPreference ||
      data?.careType || data?.careNeed ||
      data?.paymentMethod || data?.name ||
      data?.city || data?.state;

    if (connectionIds.length === 0 || !hasData) {
      setCardState("success");
      setEnrichmentSubmitting(false);
      return;
    }

    setEnrichmentSubmitting(true);

    try {
      // Update all connections with enrichment data
      for (const connId of connectionIds) {
        await fetch("/api/connections/update-intent", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: connId,
            careRecipient: data.careRecipient,
            urgency: data.urgency,
            phone: data.phone || undefined,
            notifyChannel: data.contactPreference || undefined,
            careType: data.careType || undefined,
            careNeed: data.careNeed || undefined,
            paymentMethod: data.paymentMethod || undefined,
            name: data.name || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
          }),
        });
      }
    } catch (err) {
      console.error("[CompareCard] enrichment error:", err);
    } finally {
      setCardState("success");
      setEnrichmentSubmitting(false);
    }
  }, [connectionIds]);

  // Handle enrichment skip
  const skipEnrichment = useCallback(() => {
    setCardState("success");
    setEnrichmentSubmitting(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Non-family profile (provider/caregiver/student)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isNonFamilyProfile) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
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
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoggedInFamily) {
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
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <EnrichmentState
            providerName={selectedCount > 1 ? `${selectedCount} providers` : currentProvider.name}
            onSave={saveEnrichment}
            onSkip={skipEnrichment}
            saving={enrichmentSubmitting}
            successTitle={`Saved ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
            successSubtitle="We'll send you a summary to compare"
            providerCity={currentProvider.city}
            providerState={currentProvider.state}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Success state
  // ─────────────────────────────────────────────────────────────────────────────
  if (cardState === "success") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Success header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                Saved {selectedCount} provider{selectedCount !== 1 ? "s" : ""}
              </h3>
              <p className="text-[13px] text-gray-500">
                We&apos;ll send you a summary to compare
              </p>
            </div>
          </div>

          {/* Go to inbox button */}
          <a
            href={connectionIds.length === 1 ? `/portal/inbox?id=${connectionIds[0]}` : "/portal/inbox"}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            Go to inbox
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

          {/* Trust signal */}
          <p className="text-[13px] text-gray-500 text-center mt-3">
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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
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
                setCardState("email_capture");
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
  // RENDER: Initial / Email capture state (combined with provider cards)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
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

        {/* Provider cards - stacked */}
        <div className="space-y-2 mb-4">
          {allProviders.map((provider) => {
            const isCurrentProvider = provider.id === currentProvider.id;
            const isSelected = selectedProviderIds.has(provider.id);
            const locationStr = [provider.city, provider.state].filter(Boolean).join(", ");

            return (
              <div
                key={provider.id}
                className={`relative rounded-xl border-2 p-3 transition-all ${
                  isSelected
                    ? "border-gray-200 bg-white"
                    : "border-gray-100 bg-gray-50/50 opacity-60"
                }`}
              >
                {/* "THIS PAGE" badge */}
                {isCurrentProvider && (
                  <span className="absolute -top-2 left-3 px-1.5 py-0.5 bg-primary-600 text-white text-[9px] font-semibold uppercase tracking-wider rounded">
                    This page
                  </span>
                )}

                {/* Selection toggle */}
                <button
                  type="button"
                  onClick={() => toggleProvider(provider.id)}
                  className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-gray-300 bg-white text-transparent hover:border-gray-400"
                  }`}
                  aria-label={isSelected ? "Remove from comparison" : "Add to comparison"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                {/* Provider info - compact */}
                <div className="flex items-center gap-2.5 pr-6">
                  {provider.image ? (
                    <Image
                      src={provider.image}
                      alt={provider.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-amber-700">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                      {provider.name}
                    </h4>
                    {locationStr && (
                      <p className="text-[11px] text-gray-500">{locationStr}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email capture / Submit section */}
        {cardState === "email_capture" || cardState === "submitting" ? (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={cardState === "submitting"}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 mb-3 disabled:opacity-50 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={cardState === "submitting" || selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
            >
              {cardState === "submitting" ? (
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </>
              )}
            </button>
            <p className="text-[12px] text-gray-500 text-center mt-2">
              We&apos;ll send you a summary to compare
            </p>
          </form>
        ) : (
          /* Initial state - just show the button */
          <>
            {error && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}
            <button
              onClick={handleSaveClick}
              disabled={selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
            >
              {selectedCount === 0
                ? "Select at least one"
                : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <p className="text-[12px] text-gray-500 text-center mt-2">
              We&apos;ll send you a summary to compare
            </p>
          </>
        )}
      </div>
    </div>
  );
}
