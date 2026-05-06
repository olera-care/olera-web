"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs In Basket — combined workflow dashboard with all 8 primary
 * tabs (Clients, Candidates, Prospects, Partners, Meetings, Replies,
 * Calls, Campuses) plus the ⋯ overflow menu (Archive, All, Emails Sent,
 * Outbound, Signups). Default tab is Prospects (operational entrypoint).
 *
 * v9.0 Phase 1: replaces /admin/student-outreach as the workflow entry.
 */
export default function MedJobsInBasketPage() {
  return <MedJobsTabPage initialTab="prospects" title="MedJobs · In Basket" />;
}
