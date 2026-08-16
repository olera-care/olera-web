"use client";

import CommsTimeline from "@/components/admin/CommsTimeline";

export default function CareSeekerCommsTimeline({
  seekerId,
  email,
  limit = 50,
}: {
  seekerId: string;
  email?: string | null;
  limit?: number;
}) {
  return (
    <CommsTimeline
      endpoint={seekerId ? `/api/admin/care-seekers/${seekerId}/comms-timeline?limit=${limit}` : ""}
      viewAllEmailsHref={email ? `/admin/emails?search=${encodeURIComponent(email)}` : undefined}
      emptyMessage="No messages or recorded activity yet."
      messageLabel="messages"
    />
  );
}
