"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import {
  getPricingForProviderSync,
  formatPricingRange,
} from "@/lib/pricing-ranges";

interface LoggedInFamilyCTAProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
  careTypes?: string[];
  priceRange?: string | null;
  /** CTA variant for analytics */
  ctaVariant?: string | null;
}

/**
 * Streamlined CTA for logged-in family users (single provider).
 *
 * Layout: [♡ Save] [Request details →]
 * - Shows pricing context (actual price, Medicare coverage, or "Contact for pricing")
 * - Skips enrichment entirely (they're already converted)
 * - Goes directly to inbox after creating connection
 * - Consistent across Legacy and Guide variants
 *
 * NOTE: For Compare variant, use the Compare components directly -
 * they handle multi-provider selection and have their own logged-in flow.
 */
export default function LoggedInFamilyCTA({
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
}: LoggedInFamilyCTAProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedProviders();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userEmail = user?.email || "";
  const providerIsSaved = isSaved(providerId);

  // Resolve pricing from care types
  const pricing = getPricingForProviderSync(careTypes);
  const estimateRange = priceRange || (pricing.range ? formatPricingRange(pricing.range) : null);
  const careLabel = pricing.careTypeLabel || providerCategory || (careTypes.length > 0 ? careTypes[0] : null);
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");

  // Handle save toggle
  const handleSave = useCallback(() => {
    toggleSave({
      providerId,
      slug: providerSlug,
      name: providerName,
      location: locationStr,
      careTypes: careTypes,
      image: providerImage || null,
    });
  }, [toggleSave, providerId, providerSlug, providerName, locationStr, careTypes, providerImage]);

  // Handle request details click - create connection and go to inbox
  const handleRequestDetails = useCallback(async () => {
    if (!userEmail || submitting) return;

    setSubmitting(true);
    setError(null);

    // Fire analytics event for A/B testing attribution
    if (ctaVariant) {
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
            action: "direct_request",
            logged_in: true,
          },
        }),
      }).catch(() => {});
    }

    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          providerSlug,
          intentData: {
            careRecipient: null,
            careType: null,
            urgency: null,
          },
          session_id: getOrCreateSessionId(),
          cta_variant: ctaVariant || "legacy",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[LoggedInFamilyCTA] request failed:", data.error);
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // Dispatch event for inbox refresh
      window.dispatchEvent(new CustomEvent("olera:connection-created"));

      // Go directly to inbox with this connection
      if (data.connectionId) {
        router.push(`/portal/inbox?id=${data.connectionId}`);
      } else {
        router.push("/portal/inbox");
      }
    } catch (err) {
      console.error("[LoggedInFamilyCTA] error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }, [userEmail, submitting, providerId, providerName, providerSlug, ctaVariant, router]);

  return (
    <div>
      {/* Pricing context - always shown */}
      {pricing.medicareCoverage === "full" ? (
        /* Medicare-covered care types (Home Health): lead with coverage, not price */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[18px] font-bold text-primary-700 leading-snug">
            Medicare / Medicaid may cover
          </p>
          {pricing.medicareNote && (
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              {pricing.medicareNote}
            </p>
          )}
        </div>
      ) : pricing.medicareCoverage === "partial" && estimateRange ? (
        /* Partial Medicare (Nursing Homes): show price + Medicare note */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
            {estimateRange}
          </p>
          <p className="text-[13px] text-gray-600 font-semibold mt-1.5">
            Area estimate — not this provider&apos;s actual price
          </p>
          {pricing.medicareNote && (
            <p className="text-[12px] text-primary-700 font-medium mt-2">
              {pricing.medicareNote}
            </p>
          )}
        </div>
      ) : estimateRange && !pricing.isHospice ? (
        /* Standard care types: show price estimate */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none">
            {estimateRange}
          </p>
          <p className="text-[13px] text-gray-600 font-semibold mt-1.5">
            Area estimate — not this provider&apos;s actual price
          </p>
        </div>
      ) : pricing.isHospice ? (
        /* Hospice: covered by insurance */
        <div className="mb-4">
          {(careLabel || locationStr) && (
            <p className="text-[13px] text-gray-500 font-medium mb-1">
              {careLabel}{locationStr ? ` in ${locationStr}` : ""}
            </p>
          )}
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Hospice is typically covered by Medicare, Medicaid, or insurance at no cost to families.
          </p>
        </div>
      ) : (
        /* No pricing data: show "Contact for pricing" */
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
        {pricing.medicareCoverage ? "Check coverage & availability" : "Get actual pricing & availability"}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {/* Side-by-side buttons: [♡] [Request details] */}
      <div className="flex items-center gap-2">
        {/* Save button (left, smaller) */}
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${
            providerIsSaved
              ? "border-primary-500 bg-primary-50 text-primary-600"
              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-500"
          } disabled:opacity-50`}
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

        {/* Primary CTA (right, takes remaining space) */}
        <button
          type="button"
          onClick={handleRequestDetails}
          disabled={submitting}
          className="flex-1 py-3 px-4 rounded-xl text-[15px] font-semibold bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:opacity-70 disabled:cursor-default transition-all duration-200 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              Request details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Trust signal */}
      <p className="text-[13px] text-gray-600 text-center font-medium mt-3 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        No spam. No sales calls.
      </p>
    </div>
  );
}
