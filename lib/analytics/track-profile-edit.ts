import type { SectionId } from "@/components/provider-dashboard/edit-modals/types";

/**
 * Fire-and-forget event when a provider successfully saves an edit to a
 * profile section. Feeds the "Edited profile" column on the Provider Web
 * Email Funnel at /admin/analytics, and gives us a leading indicator for
 * whether dashboard nudges convert into platform activation.
 *
 * `keepalive: true` ensures the POST survives if the user navigates away
 * immediately after save. No await — render stays responsive.
 */
export function trackProfileEdit(providerSlug: string, section: SectionId): void {
  try {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        actor_type: "provider",
        provider_id: providerSlug,
        event_type: "provider_profile_edited",
        metadata: { section },
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* fire-and-forget */
  }
}
