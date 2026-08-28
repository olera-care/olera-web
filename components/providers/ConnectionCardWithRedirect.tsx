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

  // Funnel tracking (was "TODO Phase 1", closed 2026-08-28):
  //   form_engaged  -> cta_engaged   first keystroke in the inquiry form
  //   form_submitted -> lead_started  submit
  //   lead_received  -> lead_created  post-submit, in /api/connections/*
  //
  // The original TODO asked for a "form-open" boundary. There isn't one on
  // desktop: this card renders InquiryForm inline and already open, so an
  // "opened" event would fire on every render and measure nothing. First
  // keystroke is the earliest observable intent, and is what mobile's
  // sheet_opened actually stands in for. See use-connection-card.ts.

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
