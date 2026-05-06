"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Prospects — focused stakeholder-research view. Phase 2 will
 * fold provider prospects (kind='provider') and the "Campus research
 * needed" banner into this same page.
 */
export default function MedJobsProspectsPage() {
  return <MedJobsTabPage initialTab="prospects" lockedTab title="MedJobs · Prospects" />;
}
