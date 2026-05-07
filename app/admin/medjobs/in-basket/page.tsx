"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs In Basket — the smart operational priority workspace. 8
 * entity-keyed tabs in priority order (Clients · Partners ·
 * Candidates · Meetings · Replies · Calls · Prospects · Sites).
 * Smart-hide drops empty tabs; the active tab anchors the bar.
 *
 * The In Basket emphasizes active operational work — what needs
 * attention today. Dedicated sidebar pages (Clients, Sites,
 * Replies, etc.) act as full operational repositories where admins
 * can also see closed/completed history.
 *
 * Default tab is Clients — the highest-value relationship surface.
 * Admin lands there and works right-to-left through the priority
 * order; cold backlogs (Prospects, Sites) live at the end and stay
 * smart-hidden unless they have active work.
 */
export default function MedJobsInBasketPage() {
  return <MedJobsTabPage initialTab="clients" title="MedJobs · In Basket" />;
}
