"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Archive — records whose rounds ran out, or that were closed by
 * hand. Revive one to start a fresh set.
 *
 * Its own page rather than a tab, because it is somewhere you go on purpose
 * once in a while, not part of the daily pass. Sharing a tab row with the
 * board put a hundred closed records next to the work.
 */
export default function MedJobsArchivePage() {
  return <MedJobsTabPage initialTab="archive" title="MedJobs · Archive" />;
}
