"use client";

import CommsTimeline from "@/components/admin/CommsTimeline";

/**
 * Provider-specific wrapper around the shared admin comms timeline. The API
 * resolves slug/business-profile ID variants before merging email and activity.
 */
export default function ProviderCommsTimeline({
  providerId,
  limit = 50,
  viewAllEmailsHref,
}: {
  providerId: string;
  limit?: number;
  viewAllEmailsHref?: string;
}) {
  return (
    <CommsTimeline
      endpoint={providerId ? `/api/admin/directory/${providerId}/comms-timeline?limit=${limit}` : ""}
      viewAllEmailsHref={viewAllEmailsHref}
      debugSource={{
        label: "ID variant",
        titlePrefix: "Matched email_log + provider_activity rows under",
      }}
    />
  );
}
