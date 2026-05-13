"use client";

/**
 * DangerZone — shared close-out controls for the outreach drawer.
 *
 * Extracted from app/admin/student-outreach/Drawer.tsx so both the
 * Partner and Provider drawers mount the same close-out surface
 * (not_interested · no_response_closed · wrong_contact · DNC).
 * Each button maps to an existing action in the outreach route
 * handler — no per-kind variants needed.
 *
 * Self-suppresses for already-terminal rows: there's nothing to
 * close out, so the section disappears entirely. Closed-state reopen
 * lives in NextStepCard's closed body instead, since reopen is the
 * primary action for closed rows.
 *
 * Inline buttons (not the Drawer.tsx Primary/Secondary/Danger
 * helpers) so this component is self-contained — no transitive
 * dependency on Drawer-internal primitives.
 */

import type { DrawerContext, Status } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

const TERMINAL_STATUSES: Status[] = [
  "not_interested",
  "do_not_contact",
  "wrong_contact",
  "redirected",
  "no_response_closed",
];

export function DangerZone({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}) {
  if (TERMINAL_STATUSES.includes(ctx.outreach.status)) return null;

  const confirm = (msg: string, fn: () => Promise<unknown>) => {
    if (window.confirm(msg))
      fn().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Close out
      </h3>
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <button
          onClick={() =>
            confirm("Mark Not Interested?", () => action("mark_not_interested"))
          }
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Not interested
        </button>
        <button
          onClick={() =>
            confirm("Close as No Response (re-open in 90d)?", () =>
              action("mark_no_response_closed"),
            )
          }
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close: no response
        </button>
        <button
          onClick={() =>
            confirm("Mark all known contacts wrong / unreachable?", () =>
              action("mark_wrong_contact"),
            )
          }
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Wrong contact
        </button>
        <button
          onClick={() =>
            confirm("Mark Do Not Contact (hard stop)?", () => action("mark_dnc"))
          }
          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          DNC (hard stop)
        </button>
      </div>
    </section>
  );
}
