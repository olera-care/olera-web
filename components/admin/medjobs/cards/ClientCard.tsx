"use client";

/**
 * v9.0 Phase 2: ClientCard — provider-facing card variant for the
 * Clients tab. Same chrome as StakeholderCard but the headline is the
 * provider name, the pill encodes pilot/subscribed status, and the
 * primary CTA is "Manage" (opens the provider drawer).
 *
 * Visual distinctions vs StakeholderCard:
 *   - Emerald accent border for active subscriptions
 *   - Amber accent + countdown pill for in-pilot rows
 *   - Pilot ending in <14 days highlighted in red
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { ClientRow } from "@/lib/student-outreach/tab-config";

export function ClientCard({
  row,
  onManage,
}: {
  row: ClientRow;
  onManage: () => void;
}) {
  const subtitleParts = [
    [row.city, row.state].filter(Boolean).join(", ") || null,
    row.email,
  ].filter(Boolean);

  const isUrgent =
    row.status === "in_pilot" &&
    typeof row.days_remaining_in_pilot === "number" &&
    row.days_remaining_in_pilot <= 14;

  const accentClass =
    row.status === "subscribed"
      ? "border-emerald-200"
      : isUrgent
        ? "border-red-200"
        : row.status === "in_pilot"
          ? "border-amber-200"
          : "border-gray-200";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onManage}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onManage();
        }
      }}
      title="Open the management drawer for this client."
      className={`cursor-pointer rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${accentClass}`}
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {row.display_name}
          </p>
          {subtitleParts.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {subtitleParts.join(" · ")}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-gray-400">
            {row.interview_terms_accepted_at
              ? `Pilot started ${formatRelative(row.interview_terms_accepted_at)}`
              : `Subscribed since ${formatRelative(row.created_at)}`}
            {row.credits_used > 0 && ` · ${row.credits_used} interviews scheduled`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusPill row={row} isUrgent={isUrgent} />
            {row.subscription_active && row.status === "in_pilot" && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                Subscribed
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onManage(); }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ row, isUrgent }: { row: ClientRow; isUrgent: boolean }) {
  if (row.status === "subscribed") {
    return (
      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
        Subscribed
      </span>
    );
  }
  if (row.status === "pilot_expired") {
    return (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
        Pilot ended
      </span>
    );
  }
  // in_pilot
  const days = row.days_remaining_in_pilot ?? 0;
  const cls = isUrgent
    ? "bg-red-100 text-red-900"
    : "bg-amber-100 text-amber-900";
  const label =
    days === 1
      ? "Pilot · 1 day left"
      : `Pilot · ${days} days left`;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
