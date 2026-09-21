"use client";

/**
 * ArchivedDrawerBody — what an archived row looks like, and how it comes back.
 *
 * A row reaches Archive when its rounds ran out with no reply, or when
 * someone closed it by hand. Nothing here is work: the only action is Revive,
 * which starts a fresh set of rounds and puts the row back in the queue.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

export function ArchivedDrawerBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (msg: string | null) => void;
}) {
  const [reviving, setReviving] = useState(false);

  const rd = ctx.outreach.research_data ?? {};
  const lastSet = typeof rd.round_set === "number" ? rd.round_set : 1;
  const lastSaid = typeof rd.set_context === "string" ? rd.set_context : null;

  const lastContact = [...ctx.touchpoints]
    .filter((t) => t.touchpoint_type === "email_sent" || t.touchpoint_type === "call_connected")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <Block
          label="What this is"
          text={`Archived after set ${lastSet}. No work is queued.`}
        />
        <Block
          label="Why"
          text="The rounds ran out without a reply, or someone closed it by hand."
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            What to do
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">
            Nothing, unless they come back to you. If they do, revive the row and
            it starts a fresh set of rounds.
          </p>
        </div>
        <button
          onClick={async () => {
            setReviving(true);
            setError(null);
            try {
              await action("launch_next_set");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to revive");
            } finally {
              setReviving(false);
            }
          }}
          disabled={reviving}
          className="w-full rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {reviving ? "Reviving…" : "Revive — start a new set of rounds"}
        </button>
      </section>

      {lastSaid && (
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Last thing they said
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
            {lastSaid}
          </p>
        </section>
      )}

      {lastContact && (
        <p className="px-1 text-[12px] text-gray-500">
          Last contacted {new Date(lastContact.created_at).toLocaleDateString()}.
        </p>
      )}
    </div>
  );
}
