"use client";

import Link from "next/link";
import { MedJobsTabPage } from "@/components/admin/medjobs/MedJobsTabPage";
import { SOP_PAGES } from "@/components/admin/AdminSidebar";

/**
 * MedJobs Archive — records whose rounds ran out, or that were closed by
 * hand. Revive one to start a fresh set.
 *
 * Its own page rather than a tab, because it is somewhere you go on purpose
 * once in a while, not part of the daily pass. Sharing a tab row with the
 * board put a hundred closed records next to the work.
 *
 * The four role manuals sit at the bottom. They were five links in the
 * sidebar, above the work, and were opened about as often as a filing
 * cabinet — which is what they are. Somewhere you go on purpose is the right
 * place for them, and this is already that page.
 */
export default function MedJobsArchivePage() {
  return (
    <>
      <MedJobsTabPage initialTab="archive" title="MedJobs · Archive" />

      <section className="mt-12 border-t border-gray-200 pt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          The operating model
        </h2>
        <p className="mt-1 max-w-2xl text-[12.5px] text-gray-500">
          System is the whole flow, the architecture and the funnel. The other three are role
          views of it, not separate models.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOP_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-md border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700"
            >
              {page.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
