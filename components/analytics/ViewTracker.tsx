"use client";

import { useEffect } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";

interface ViewTrackerProps {
  providerId: string;
}

/**
 * Fire-and-forget page_view event for the public provider page.
 *
 * Lives client-side because the provider page is RSC + ISR (revalidate=3600) —
 * server code doesn't run on cached hits. Client-side mounts on every visit
 * and naturally filters most non-JS-executing bots; server-side bot filter
 * (lib/analytics/bot-filter) is the safety net.
 */
export function ViewTracker({ providerId }: ViewTrackerProps) {
  useEffect(() => {
    if (!providerId) return;
    if (typeof navigator !== "undefined" && (navigator as Navigator & { webdriver?: boolean }).webdriver) {
      return;
    }

    const session_id = getOrCreateSessionId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const path = typeof window !== "undefined" ? window.location.pathname : "";

    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "page_view",
        related_provider_id: providerId,
        session_id,
        metadata: { referrer, path },
      }),
      keepalive: true,
    }).catch(() => {
      // Silent. Never block the page on analytics.
    });
  }, [providerId]);

  return null;
}
