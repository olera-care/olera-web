"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs In Basket — the smart operational priority workspace. The primary
 * bar groups upstream work by audience (Providers · Partners), each folding
 * its prospecting + active-entity work into one sectioned tab, alongside the
 * cross-cutting action queues (Calls · Emails · Meetings).
 *
 * The In Basket emphasizes active operational work — what needs attention
 * today. Dedicated pages (reached via Operations) act as full operational
 * repositories where admins can also see closed/completed history.
 *
 * Default tab is Providers; auto-pivot moves to the first audience/queue with
 * work when Providers is empty.
 */
export default function MedJobsInBasketPage() {
  return <MedJobsTabPage initialTab="providers" title="MedJobs · In Basket" />;
}
