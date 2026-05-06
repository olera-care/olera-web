"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Meetings — stakeholders coordinating a time or with a meeting
 * on the calendar. Log Meeting closes the row out of this tab.
 */
export default function MedJobsMeetingsPage() {
  return <MedJobsTabPage initialTab="meetings" lockedTab title="MedJobs · Meetings" />;
}
