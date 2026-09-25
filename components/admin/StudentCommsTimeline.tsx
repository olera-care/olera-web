"use client";

import CommsTimeline from "@/components/admin/CommsTimeline";

/**
 * Student-specific wrapper around the shared admin comms timeline.
 * Shows all emails sent to this student with bounce/open/click indicators.
 */
export default function StudentCommsTimeline({
  studentId,
  limit = 50,
  viewAllEmailsHref,
}: {
  studentId: string;
  limit?: number;
  viewAllEmailsHref?: string;
}) {
  return (
    <CommsTimeline
      endpoint={studentId ? `/api/admin/caregivers/${studentId}/comms-timeline?limit=${limit}` : ""}
      viewAllEmailsHref={viewAllEmailsHref}
      emptyMessage="No emails sent to this student yet."
      messageLabel="emails"
    />
  );
}
