"use client";

import { useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * The reader shared by the four SOP pages: System, Admin, Sales and CRM.
 *
 * One embedded PDF with a jump bar above it. The role manuals carry the same
 * navigation inside the PDF as real anchor links, so this bar is a convenience
 * rather than the only way through; on System, where the document has no
 * internal bar, it is the way through.
 */

export interface SopJump {
  /** Short label on the button. */
  label: string;
  /** Page in the built PDF. */
  page: number;
  /** Full section name, shown on hover. */
  title: string;
  /** Start a new group; renders a rule before this button. */
  divide?: boolean;
}

export default function SopReader({
  doc,
  title,
  description,
  jumps,
  openAt,
  note,
}: {
  /** The `doc` key served by /api/admin/medjobs/sop. */
  doc: string;
  title: string;
  description: string;
  jumps: SopJump[];
  /** Page the reader opens on. */
  openAt: number;
  note?: React.ReactNode;
}) {
  const url = `/api/admin/medjobs/sop?doc=${doc}`;
  const [page, setPage] = useState(openAt);

  return (
    <div>
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open in a new tab
          </a>
        }
      />

      {note ? <div className="mb-4">{note}</div> : null}

      <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2">
        {jumps.map((jump) => (
          <span key={jump.label} className="flex items-center gap-1.5">
            {jump.divide ? <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden /> : null}
            <button
              type="button"
              title={jump.title}
              aria-current={page === jump.page ? "page" : undefined}
              onClick={() => setPage(jump.page)}
              className={`rounded-md border px-2 py-1 text-xs font-medium tabular-nums transition-colors ${
                page === jump.page
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {jump.label}
            </button>
          </span>
        ))}
      </div>

      {/* The key remounts the iframe on a jump: a changed hash alone does not
          move an already-loaded PDF viewer. */}
      <iframe
        key={page}
        src={`${url}#page=${page}&view=FitH`}
        title={title}
        className="h-[calc(100vh-22rem)] min-h-[32rem] w-full rounded-lg border border-gray-200 bg-gray-50"
      />
    </div>
  );
}
