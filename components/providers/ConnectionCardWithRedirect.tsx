"use client";

import { useRouter } from "next/navigation";
import ConnectionCard from "@/components/providers/connection-card";
import type { ConnectionCardProps } from "@/components/providers/connection-card/types";
import type { VariantConfig } from "@/lib/experiments";

/**
 * Thin wrapper around ConnectionCard that redirects to the
 * post-connection success page after a new connection is created.
 */
export default function ConnectionCardWithRedirect(
  props: Omit<ConnectionCardProps, "onConnectionCreated"> & {
    providerCategory?: string | null;
    providerCity?: string | null;
    providerState?: string | null;
    variantConfig?: VariantConfig;
    experimentVariantId?: string;
  }
) {
  const router = useRouter();
  const { providerCategory, providerCity, providerState, ...cardProps } = props;

  return (
    <ConnectionCard
      {...cardProps}
      onConnectionCreated={(connectionId) => {
        // Unified experience: all users go to /welcome after connecting
        router.push(`/welcome?connection=${connectionId}&provider=${props.providerSlug}`);
      }}
    />
  );
}
