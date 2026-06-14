/**
 * Fire-and-forget provider activity tracker — POSTs to /api/activity/track,
 * which writes a `provider_activity` row and (for flagged event types) pings
 * Slack. Mirrors the local `trackMatchesEvent` in the matches page, but is
 * importable so the reworked provider surfaces (managed-ads funnel, Your Market)
 * instrument consistently.
 *
 * `event_type` must be in the PROVIDER_EVENT_TYPES allowlist in the track route
 * AND the provider_activity CHECK constraint, or the insert silently fails
 * (see feedback_event_allowlist_needs_db_migration).
 */
export function trackProviderEvent(
  providerId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): void {
  if (!providerId) return;
  fetch("/api/activity/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // keepalive so the POST survives the navigation that a CTA click triggers
    // (these events fire as the provider clicks a Link toward another route).
    keepalive: true,
    body: JSON.stringify({
      actor_type: "provider",
      provider_id: providerId,
      event_type: eventType,
      metadata,
    }),
  }).catch(() => {
    // Fire-and-forget — never block the UI on instrumentation.
  });
}
