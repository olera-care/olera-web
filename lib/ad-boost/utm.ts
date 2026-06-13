/**
 * Read UTM attribution params from the current page URL (client-only).
 *
 * Used to attribute Door B (benefits) conversions back to a managed-ads
 * campaign — a paid Ad Boost link lands families on
 * `/provider/<slug>?utm_source=olera_managed&utm_campaign=<tag>`, and we thread
 * these through to the `benefits_completed` event metadata.
 *
 * Reads `window.location.search` directly (not `useSearchParams`) so it can be
 * called from a submit handler deep inside a server-rendered page without
 * forcing a Suspense boundary / client-side-rendering bailout.
 */
export function readUtmParams(): { utmSource?: string; utmCampaign?: string } {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    utmSource: sp.get("utm_source") || undefined,
    utmCampaign: sp.get("utm_campaign") || undefined,
  };
}
