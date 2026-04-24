"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar E — Recent activity (Wispr-style snippet feed).
 *
 * Borderless typographic feed: timestamp left, content first, actor below.
 * Modeled on Wispr Flow's dashboard activity stream — no icon circles per
 * row, no chevron arrows, no `bg-blue-50` color-coded badges. The snippets
 * themselves carry the signal.
 *
 * Why content-first: the question text ("How do you handle medical
 * emergencies?") is what the provider actually wants to read. The wrapper
 * sentence ("Anonymous asked a question") is meta — it belongs in a quieter
 * line below, not as the headline of every row.
 *
 * Pulse row removed: views are surfaced in the sidebar summary now. No more
 * "N families viewed your page" duplicating the sidebar number.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

type ActivityItem = ProviderDashboardV2Data["recentActivity"][number];

const DEFAULT_VISIBLE = 4;

export default function RecentActivityCard({ data }: Props) {
  const events = data.recentActivity;
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) {
    return (
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-4">
          Recent activity
        </p>
        <p className="text-sm text-gray-400">
          Nothing yet. As families interact with your page, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  const visibleEvents = expanded ? events : events.slice(0, DEFAULT_VISIBLE);
  const hasMore = events.length > DEFAULT_VISIBLE;

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-5">
        Recent activity
      </p>
      <ul className="space-y-5">
        {visibleEvents.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          {expanded ? "Show less" : `Show all ${events.length}`}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const time = formatRelative(item.timestamp);
  const { primary, meta } = formatRow(item);

  const body = (
    <div className="flex items-baseline gap-4 group">
      <time className="text-xs text-gray-400 tabular-nums w-10 shrink-0 pt-0.5 leading-snug">
        {time}
      </time>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-gray-900 leading-snug group-hover:text-gray-700 transition-colors">
          {primary}
        </p>
        {meta && (
          <p className="text-xs text-gray-500 mt-1 leading-snug">
            {meta}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <li>
      {item.actionHref ? (
        <Link href={item.actionHref} className="block -mx-2 px-2 py-1 rounded transition-colors">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/**
 * Pull the primary content forward. The wrapper sentence ("X asked a
 * question") goes into the quieter meta line, so the user reads what
 * actually matters first.
 */
function formatRow(item: ActivityItem): { primary: string; meta: string | null } {
  if (item.kind === "question" || item.kind === "question_answered") {
    // When detail (the question text) is present, it's the headline and the
    // asker becomes the quiet meta. When detail is missing, item.title
    // already carries the asker ("Anonymous asked a question") — repeating
    // the name in meta would double up, so leave meta empty.
    if (item.detail) {
      return { primary: `“${item.detail}”`, meta: item.actorName ?? "Anonymous" };
    }
    return { primary: item.title, meta: null };
  }

  if (item.kind === "lead") {
    if (item.detail) {
      return { primary: item.detail, meta: "New family inquiry" };
    }
    return { primary: "New family inquiry", meta: null };
  }

  if (item.kind === "review") {
    if (item.detail) {
      return { primary: `“${item.detail}”`, meta: item.actorName ?? "Verified review" };
    }
    return { primary: item.title, meta: null };
  }

  return { primary: item.title, meta: null };
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "now";
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
