"use client";

import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * MedJobs · SOP — the implementation matrix, readable inside the admin panel.
 *
 * Every stage from PR1 to MA5 in three layers: what the user does and what the
 * technology does, the procedure behind it, and what the system records and
 * hands on. Two ways in: the titled index above, and a jump bar sitting on the
 * reader so a step is one click away from the system map you just read.
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

/** The system map — every stage, both sides and the portal, on one page. It is
 *  what the jump bar is for: read the map, then go straight to a step. */
const SYSTEM_PAGE = 2;
const DEFERRED_PAGE = 39;

const GROUPS: { heading: string; note: string; stages: Stage[] }[] = [
  { heading: "Provider side", note: "Prospect to meeting to client success", stages: PROVIDER },
  { heading: "University side", note: "Access to distribution to applications", stages: UNIVERSITY },
  { heading: "Portal", note: "Vet, match, confirm value, bill", stages: PORTAL },
];

export default function MedJobsSopPage() {
  // Open on the system map rather than the title page: the index above already
  // does what a table of contents does, and the map is what the jump bar is for.
  const [page, setPage] = useState(SYSTEM_PAGE);

  return (
    <div>
      <AdminPageHeader
        title="SOP"
        description="MedJobs 2.0 Master Implementation Matrix. Every stage in three layers: user journey and technology, the procedure, and the system handoff."
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

      {/* Jump bar. The index above carries the titles; this sits on the reader
          so a step is one click from the system map, without scrolling back up.
          Codes only, in document order, with the two sides and the portal kept
          apart by a rule. */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Jump label="System" page={SYSTEM_PAGE} current={page} onJump={setPage}
              title="The whole flow on one page" />
        {GROUPS.map((group) => (
          <span key={group.heading} className="flex flex-wrap items-center gap-1.5">
            <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden />
            {group.stages.map((stage) => (
              <Jump key={stage.code} label={stage.code} page={stage.page}
                    current={page} onJump={setPage} title={stage.title} />
            ))}
          </span>
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden />
        <Jump label="Deferred" page={DEFERRED_PAGE} current={page} onJump={setPage}
              title="Everything the matrix describes that does not work that way yet" />
      </div>

      <p className="mb-3 text-xs text-gray-500">
        Anything the matrix describes that does not work that way yet is named as
        such and collected in the deferred list.
      </p>

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

/** One chip in the jump bar. The title attribute carries the stage name, which
 *  the bar has no room for. */
function Jump({
  label,
  page,
  current,
  onJump,
  title,
}: {
  label: string;
  page: number;
  current: number;
  onJump: (page: number) => void;
  title: string;
}) {
  const active = current === page;
  return (
    <button
      type="button"
      title={title}
      aria-current={active ? "page" : undefined}
      onClick={() => onJump(page)}
      className={`rounded-md border px-2 py-1 text-xs font-medium tabular-nums transition-colors ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
