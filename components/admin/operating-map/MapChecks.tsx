"use client";

import { useState } from "react";
import type { MapCheck } from "@/lib/operating-map/checks";

/**
 * The map's own verdict on whether its numbers hang together.
 *
 * Passing checks stay collapsed to one quiet line — the point is that you can
 * see they ran, not read them every time. A failure opens itself, because a
 * number that contradicts another number is the one thing on this page you
 * must not scroll past.
 */
export default function MapChecks({ checks }: { checks: MapCheck[] }) {
  const [open, setOpen] = useState(false);
  if (!checks.length) return null;

  const failed = checks.filter((c) => !c.ok);
  const expanded = open || failed.length > 0;

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        failed.length
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-gray-200 bg-white text-gray-500"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <span>
          {failed.length
            ? `${failed.length} consistency check${failed.length === 1 ? "" : "s"} failed`
            : `${checks.length} consistency checks passed`}
        </span>
        <span aria-hidden="true" className="text-xs">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-2">
              <span aria-hidden="true">{c.ok ? "✓" : "✕"}</span>
              <span>
                {c.label}
                {c.detail && <span className="font-medium"> — {c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
