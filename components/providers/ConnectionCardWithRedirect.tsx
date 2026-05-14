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

  // TODO Phase 1: wire cta_click_public (cta='contact') at the inner ConnectionCard's
  // form-open / submit-attempt boundaries — that's where the funnel signal lives.
  // Phase 0 covers post-submit via lead_received in /api/connections/* routes.

  return (
    <ConnectionCard
      {...cardProps}
      onConnectionCreated={(connectionId) => {
        // Unified experience: all users go to inbox after connecting
        router.push(`/portal/inbox?id=${connectionId}`);
      }}
    />
  );
}
