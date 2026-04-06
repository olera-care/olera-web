"use client";

import ConnectionCardWithRedirect from "@/components/providers/ConnectionCardWithRedirect";
import MobileStickyBottomCTA from "@/components/providers/MobileStickyBottomCTA";
import { useExperiment } from "@/components/providers/ExperimentProvider";

/**
 * Client wrapper that resolves the CTA experiment and renders both
 * desktop (ConnectionCardWithRedirect) and mobile (MobileStickyBottomCTA)
 * CTAs with the assigned variant config.
 *
 * Used by the provider detail page (server component) to inject experiment
 * context without making the page itself a client component.
 */

interface ExperimentCTAsProps {
  // Desktop card placement
  desktop: boolean;
  // Shared connection card props
  providerId: string;
  providerName: string;
  providerSlug: string;
  priceRange: string | null;
  reviewCount: number | undefined;
  phone: string | null;
  acceptedPayments: string[];
  careTypes: string[];
  city?: string | null;
  state?: string | null;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
}

export function ExperimentDesktopCTA(props: Omit<ExperimentCTAsProps, "desktop">) {
  const { config, variantId } = useExperiment();

  return (
    <ConnectionCardWithRedirect
      providerId={props.providerId}
      providerName={props.providerName}
      providerSlug={props.providerSlug}
      priceRange={props.priceRange}
      reviewCount={props.reviewCount}
      phone={props.phone}
      acceptedPayments={props.acceptedPayments}
      careTypes={props.careTypes}
      city={props.city}
      state={props.state}
      responseTime={null}
      providerCategory={props.providerCategory}
      providerCity={props.providerCity}
      providerState={props.providerState}
      variantConfig={config}
      experimentVariantId={variantId}
    />
  );
}

export function ExperimentMobileCTA(props: Omit<ExperimentCTAsProps, "desktop">) {
  const { config, variantId } = useExperiment();

  return (
    <MobileStickyBottomCTA
      providerName={props.providerName}
      priceRange={props.priceRange}
      providerId={props.providerId}
      providerSlug={props.providerSlug}
      reviewCount={props.reviewCount}
      phone={props.phone}
      acceptedPayments={props.acceptedPayments}
      careTypes={props.careTypes}
      providerCategory={props.providerCategory}
      providerCity={props.providerCity}
      providerState={props.providerState}
      variantConfig={config}
      experimentVariantId={variantId}
    />
  );
}
