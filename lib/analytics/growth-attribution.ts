import { classifyOrganicPage } from "@/lib/analytics/content-pages";
import { getOrCreateSessionId, getOrCreateVisitId } from "@/lib/analytics/session";
import { isPreviewMode } from "@/lib/analytics/preview-mode";

export type GrowthClientEvent =
  | "page_landed"
  | "cta_visible"
  | "cta_engaged"
  | "lead_started"
  | "contact_intent";

interface TrackGrowthEventInput {
  eventType: GrowthClientEvent;
  pagePath?: string;
  ctaId?: string;
  ctaSurface?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Shared client entry point for first-party growth attribution. It deliberately
 * stays fire-and-forget: measurement must never delay a family seeking care.
 */
export function trackGrowthEvent(input: TrackGrowthEventInput): void {
  if (typeof window === "undefined" || isPreviewMode()) return;
  const pagePath = input.pagePath || window.location.pathname;
  const pageCategory = classifyOrganicPage(pagePath);
  if (!pageCategory) return;

  const sp = new URLSearchParams(window.location.search);
  fetch("/api/activity/track-growth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymous_id: getOrCreateSessionId(),
      visit_id: getOrCreateVisitId(),
      event_type: input.eventType,
      page_path: pagePath,
      page_category: pageCategory,
      cta_id: input.ctaId || null,
      cta_surface: input.ctaSurface || null,
      metadata: {
        ...(input.metadata || {}),
        ...(input.eventType === "page_landed" ? {
          referrer: document.referrer,
          utm_source: sp.get("utm_source") || null,
          utm_medium: sp.get("utm_medium") || null,
          utm_campaign: sp.get("utm_campaign") || null,
          gclid: sp.has("gclid"),
        } : {}),
      },
    }),
    keepalive: true,
  }).catch(() => {});
}
