import type { Metadata } from "next";
import JobsBoard from "@/components/medjobs/JobsBoard";

export const metadata: Metadata = {
  title: "Find Jobs | Olera",
};

/**
 * The signed-in student's "Find Jobs" board — a campus-catchment job board
 * (cards + map). Protected by the /portal middleware gate. The public
 * landing/marketing surface remains /medjobs/families.
 */
export default function MedjobsJobsPage() {
  return (
    <main className="min-h-screen bg-white">
      <JobsBoard />
    </main>
  );
}
