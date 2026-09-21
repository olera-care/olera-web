"use client";

import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";

/**
 * MedJobs Universities — every university, what is waiting on each, and the
 * five channels you reach it through. Opening one hands over the work a task
 * at a time rather than showing another list.
 *
 * The route is still /in-basket. Every link, bookmark and deep link in the
 * admin points at it, and renaming a surface is not a reason to break them.
 */
export default function MedJobsUniversitiesPage() {
  return <MedJobsTabPage initialTab="tasks" title="MedJobs · Universities" />;
}
