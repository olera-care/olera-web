"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Partners — campus stakeholders actively distributing student
 * profiles. Click Engage to open the drawer for partner-management work.
 */
export default function MedJobsPartnersPage() {
  return <MedJobsTabPage initialTab="partners" lockedTab title="MedJobs · Partners" />;
}
