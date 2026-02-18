"use client";

import { useRouter } from "next/navigation";
import ConnectionCard from "@/components/providers/connection-card";
import type { ConnectionCardProps } from "@/components/providers/connection-card/types";

/**
 * Thin wrapper around ConnectionCard that redirects to the
 * post-connection success page after a new connection is created.
 */
export default function ConnectionCardWithRedirect(
  props: Omit<ConnectionCardProps, "onConnectionCreated"> & {
    providerCategory?: string | null;
    providerCity?: string | null;
    providerState?: string | null;
  }
) {
  const router = useRouter();
  const { providerCategory, providerCity, providerState, ...cardProps } = props;

  return (
    <ConnectionCard
      {...cardProps}
      onConnectionCreated={(connectionId) => {
        const params = new URLSearchParams({
          name: props.providerName,
          slug: props.providerSlug,
        });
        if (providerCategory) params.set("category", providerCategory);
        if (providerCity) params.set("city", providerCity);
        if (providerState) params.set("state", providerState);
        router.push(`/connected/${connectionId}?${params.toString()}`);
      }}
    />
  );
}
