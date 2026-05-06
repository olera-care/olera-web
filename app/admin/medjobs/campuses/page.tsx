"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Campuses — list of universities currently in the Student
 * Outreach funnel. Campus is the operational primitive: provider
 * prospecting kicks off when a campus is assigned; student-stakeholder
 * prospecting unlocks once the first client converts in catchment.
 *
 * v9.0 Phase 1: minimal list view (CampusesPlaceholder inside
 * MedJobsTabPage). Phase 2 wires per-campus state and the campus
 * research-needed banner.
 */
export default function MedJobsCampusesPage() {
  return <MedJobsTabPage initialTab="campuses" lockedTab title="MedJobs · Campuses" />;
}
