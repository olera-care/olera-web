"use client";

import { useRouter } from "next/navigation";
import ConnectionCard from "@/components/providers/connection-card";
import type { ConnectionCardProps } from "@/components/providers/connection-card/types";

/**
 * Thin wrapper around ConnectionCard that redirects to the
 * post-connection success page after a new connection is created.
 */
export default function ConnectionCardWithRedirect(
  props: Omit<ConnectionCardProps, "onConnectionCreated">
) {
  const router = useRouter();

  return (
    <ConnectionCard
      {...props}
      onConnectionCreated={(connectionId) => {
        const params = new URLSearchParams({
          name: props.providerName,
          slug: props.providerSlug,
        });
        router.push(`/connected/${connectionId}?${params.toString()}`);
      }}
    />
  );
}
