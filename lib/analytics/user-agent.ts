/**
 * Coarse device bucket for a request's User-Agent.
 *
 * Deliberately coarse and never stored alongside the raw UA — analytics rows
 * keep `ua_class` only, so device mix is readable without retaining a
 * fingerprintable string. Shared by /api/activity/track (provider + anonymous
 * events) and /api/activity/track-page-event (content page views) so both
 * write the same four values.
 */
export function classifyUserAgent(
  ua: string | null,
): "mobile" | "tablet" | "desktop" | "other" {
  if (!ua) return "other";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|iPhone|Android/i.test(ua)) return "mobile";
  if (/Mozilla|Chrome|Safari|Firefox|Edg/i.test(ua)) return "desktop";
  return "other";
}
