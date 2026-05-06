"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Replies — unified inbox triage queue. Email replies, callbacks,
 * voicemails. v9.0 Phase 2 will surface provider replies here too.
 */
export default function MedJobsRepliesPage() {
  return <MedJobsTabPage initialTab="replies" lockedTab title="MedJobs · Replies" />;
}
