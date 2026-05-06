"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Calls — phone calls due today. Tap to dial; log the outcome.
 * v9.0 Phase 2 adds provider call rows alongside stakeholder rows.
 */
export default function MedJobsCallsPage() {
  return <MedJobsTabPage initialTab="calls" lockedTab title="MedJobs · Calls" />;
}
