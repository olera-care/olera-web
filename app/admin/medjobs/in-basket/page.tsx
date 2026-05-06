"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs In Basket — combined workflow dashboard with 8 entity-keyed
 * primary tabs in hot-first priority order (Replies · Meetings ·
 * Calls · Partners · Candidates · Clients · Prospects · Sites).
 * Smart-hide drops empty tabs; the active tab anchors the bar.
 *
 * Default tab is Replies — the hottest queue. Admin lands on the
 * most time-sensitive triage surface and works left-to-right by
 * operational urgency. Cold backlogs (Prospects, Sites) live at the
 * end so they don't compete with same-day work.
 *
 * v9.0 Phase 1: replaces /admin/student-outreach as the workflow entry.
 * v9.0 Phase 7 Commit J: tab order flipped to hot-first.
 */
export default function MedJobsInBasketPage() {
  return <MedJobsTabPage initialTab="replies" title="MedJobs · In Basket" />;
}
