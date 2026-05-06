"use client";

/**
 * v9.0 Phase 5: stub. Real implementation in Phase 5 Commit 3 — the
 * full operational audit log: every touchpoint + row across every
 * state, with filter chips for action type, channel, status, and
 * date range. Quick filters surface the legacy Emails Sent /
 * Outbound / Signups / Archive views as pre-filtered slices.
 */
export default function AllTasksPage() {
  return (
    <div className="px-1">
      <h1 className="text-2xl font-semibold text-gray-900">MedJobs · All Tasks</h1>
      <p className="mt-1 text-sm text-gray-500">
        Full operational repository — read, unread, done, archived. Coming in this phase.
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-400">
        Audit feed + filter chips land in Phase 5 Commit 3.
      </div>
    </div>
  );
}
