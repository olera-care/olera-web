import type { CronJob } from "@/lib/crons/registry";

/**
 * Retired automations remain visible for operational history without counting
 * as live systems. A scheduled job belongs here only after its Vercel schedule
 * has been removed; an event-driven job only after its call sites are retired.
 */
export interface ArchivedAutomation extends CronJob {
  lifecycle: "archived";
  archivedAt: string;
  archiveReason: string;
  replacedBy: string | null;
}

export const ARCHIVED_AUTOMATIONS: ArchivedAutomation[] = [
  {
    id: "lead-response-nudge",
    name: "Lead response nudge",
    description:
      "Legacy weekly reminder that consolidated waiting leads into one provider email.",
    recipientCohort: "Providers with inquiry leads that had gone unopened for at least three days.",
    audience: "Providers",
    fn: "nudge",
    schedule: "retired",
    humanSchedule: "Archived",
    path: "/api/cron/lead-response-nudge",
    emailTypes: ["provider_nudge"],
    successSignal: "Provider opens or responds to a waiting lead.",
    relatedAdminPath: "/admin/connections",
    lifecycle: "archived",
    archivedAt: "2026-06-05",
    archiveReason: "Replaced by a staged Day 1/3/5/7 follow-up sequence with explicit stop conditions.",
    replacedBy: "lead-followup-sequence",
  },
];
