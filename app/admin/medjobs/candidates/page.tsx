"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Candidates — focused view of LIVE provider-facing student
 * profiles (Candidates ⊂ Signups). Same data as the Candidates tab in
 * In Basket; the dedicated page is for admins who want a clean
 * marketplace-supply view without the rest of the workflow tabs.
 */
export default function MedJobsCandidatesPage() {
  return <MedJobsTabPage initialTab="candidates" lockedTab title="MedJobs · Candidates" />;
}
