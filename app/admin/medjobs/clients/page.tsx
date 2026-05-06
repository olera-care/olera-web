"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Clients — provider clients (agencies in trial or paying via
 * Stripe). Phase 1 ships a placeholder; Phase 2 wires the data model
 * (terms-accepted-at + pilot_started_at on business_profiles + the
 * /api/admin/medjobs/clients endpoint), the provider drawer fork, and
 * the Manage CTA with trial countdown / Stripe links.
 */
export default function MedJobsClientsPage() {
  return <MedJobsTabPage initialTab="clients" lockedTab title="MedJobs · Clients" />;
}
