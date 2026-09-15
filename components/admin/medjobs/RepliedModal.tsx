"use client";

/**
 * "They replied, and I responded" — the one way out of the follow-up loop.
 *
 * Replies arrive in the operator's own inbox now, so nothing here knows a
 * provider answered until someone says so. This records what they said and
 * what happens next:
 *
 *   Meeting scheduled     → rounds stop, row moves to Meetings
 *   Another set of rounds → a fresh set of 7, two business days apart
 *   Archive               → rounds stop, row moves to Archive
 *
 * What they said is carried forward and shown at the top of the drawer on
 * the next set, so whoever picks the row up has the context.
 */

import { useState } from "react";
import type { DrawerContext } from "@/lib/student-outreach/types";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Next = "meeting" | "another_set" | "archive";

const CHOICES: { key: Next; label: string; blurb: string }[] = [
  {
    key: "meeting",
    label: "Meeting scheduled",
    blurb: "Rounds stop. The row moves to Meetings.",
  },
  {
    key: "another_set",
    label: "Another set of rounds",
    blurb: "Seven more rounds, two business days apart, until there is a meeting.",
  },
  {
    key: "archive",
    label: "Archive",
    blurb: "Rounds stop. Revive it from Archive if they come back.",
  },
];

export function RepliedModal({
  ctx,
  action,
  onClose,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  onClose: () => void;
  setError: (msg: string | null) => void;
}) {
  const [said, setSaid] = useState("");
  const [choice, setChoice] = useState<Next | null>(null);
  const [meetingAt, setMeetingAt] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = choice != null && said.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Record the reply first, so the text is on the row whichever branch
      // follows and survives a failure in the second call.
      await action("log_email_replied", { notes: said.trim() });

      if (choice === "meeting") {
        await action("mark_meeting_scheduled", {
          meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null,
          notes: said.trim(),
        });
      } else if (choice === "another_set") {
        await action("launch_next_set", { context_notes: said.trim() });
      } else {
        await action("archive", { notes: said.trim() });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            They replied, and I responded
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {ctx.outreach.organization_name}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              What they said
            </label>
            <textarea
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              rows={4}
              placeholder="Paste their reply, or summarise it."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              What happens now
            </p>
            <div className="mt-1.5 space-y-1.5">
              {CHOICES.map((c) => (
                <div key={c.key}>
                  <button
                    type="button"
                    onClick={() => setChoice(c.key)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      choice === c.key
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{c.blurb}</p>
                  </button>
                  {c.key === "meeting" && choice === "meeting" && (
                    <input
                      type="datetime-local"
                      value={meetingAt}
                      onChange={(e) => setMeetingAt(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-[13px] text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSave || saving}
            title={
              canSave
                ? undefined
                : "Add what they said and pick what happens now."
            }
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
