"use client";

import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * MedJobs · SOP — the implementation matrix, readable inside the admin panel.
 *
 * Every stage from PR1 to MA5 in three layers: what the user does and what the
 * technology does, the human procedure behind it, and what the system records
 * and hands on. The index jumps the embedded reader to a stage rather than
 * making anyone scroll thirty-nine pages to find one.
 *
 * The PDF comes from /api/admin/medjobs/sop, which is admin-guarded, so this
 * page shows nothing to a signed-out visitor.
 */

const SOP_URL = "/api/admin/medjobs/sop";

interface Stage {
  code: string;
  title: string;
  page: number;
}

/** Page numbers are positions in the built PDF. Rebuilding the matrix can move
 *  them: docs/medjobs/matrix-src/README.md says how to re-derive them. */
const PROVIDER: Stage[] = [
  { code: "PR1", title: "Target list built and pre-flight complete", page: 3 },
  { code: "PR-OUT", title: "Outbound work", page: 7 },
  { code: "PR2", title: "Provider meeting held", page: 11 },
  { code: "PR3", title: "Client success", page: 13 },
];
const UNIVERSITY: Stage[] = [
  { code: "ST1", title: "Target advisors", page: 15 },
  { code: "ST-OUT", title: "University outbound", page: 18 },
  { code: "ST2", title: "Advisor meeting held", page: 22 },
  { code: "ST3–ST7", title: "University activation", page: 23 },
  { code: "ST8", title: "Student application submitted", page: 25 },
];
const PORTAL: Stage[] = [
  { code: "QUAL", title: "Portal vets the application", page: 31 },
  { code: "MA1", title: "Candidate intro", page: 32 },
  { code: "MA2", title: "Interview held", page: 33 },
  { code: "MA3", title: "Hire confirmed", page: 35 },
  { code: "MA4", title: "Six or more shifts worked, confirmed", page: 36 },
  { code: "MA5", title: "Bill issued and collected", page: 37 },
];

const GROUPS: { heading: string; note: string; stages: Stage[] }[] = [
  { heading: "Provider side", note: "Prospect to meeting to client success", stages: PROVIDER },
  { heading: "University side", note: "Access to distribution to applications", stages: UNIVERSITY },
  { heading: "Portal", note: "Vet, match, confirm value, bill", stages: PORTAL },
];

export default function MedJobsSopPage() {
  const [page, setPage] = useState(1);

  return (
    <div>
      <AdminPageHeader
        title="SOP"
        description="MedJobs 2.0 Master Implementation Matrix. Every stage in three layers: user journey and technology, the human procedure, and the system handoff."
        actions={
          <a
            href={SOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open in a new tab
          </a>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.heading} className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">{group.heading}</h2>
            <p className="mb-3 text-xs text-gray-500">{group.note}</p>
            <ul className="space-y-1">
              {group.stages.map((stage) => (
                <li key={stage.code}>
                  <button
                    type="button"
                    onClick={() => setPage(stage.page)}
                    className={`w-full rounded px-2 py-1 text-left text-sm transition-colors ${
                      page === stage.page
                        ? "bg-emerald-50 text-emerald-900"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-900">{stage.code}</span>{" "}
                    <span className="text-gray-600">{stage.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPage(1)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Front page
        </button>
        <button
          type="button"
          onClick={() => setPage(39)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Deferred build list
        </button>
        <p className="text-xs text-gray-500">
          Anything the matrix describes that does not work that way yet is named
          as such and collected in the deferred list.
        </p>
      </div>

      {/* The key remounts the iframe on a jump: a changed hash alone does not
          move an already-loaded PDF viewer. */}
      <iframe
        key={page}
        src={`${SOP_URL}#page=${page}&view=FitH`}
        title="MedJobs 2.0 Master Implementation Matrix"
        className="h-[calc(100vh-22rem)] min-h-[32rem] w-full rounded-lg border border-gray-200 bg-gray-50"
      />
    </div>
  );
}
