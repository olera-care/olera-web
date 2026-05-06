"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs In Basket — combined workflow dashboard with 8 entity-keyed
 * primary tabs in priority order (Clients · Candidates · Prospects ·
 * Partners · Meetings · Replies · Calls · Sites). Smart-hide drops
 * empty tabs; the active tab anchors the bar. Default tab is Prospects
 * (the operational entrypoint).
 *
 * v9.0 Phase 1: replaces /admin/student-outreach as the workflow entry.
 * v9.0 Phase 7: tabs renamed (Campuses → Sites) + reorder to triage
 * priority; the ⋯ overflow menu (Archive, All, Emails Sent, Outbound,
 * Signups) stays for secondary surfaces.
 */
export default function MedJobsInBasketPage() {
  return <MedJobsTabPage initialTab="prospects" title="MedJobs · In Basket" />;
}
