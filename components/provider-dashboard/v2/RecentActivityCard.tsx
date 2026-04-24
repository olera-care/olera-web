"use client";

import Link from "next/link";
import type { ProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";

/**
 * Pillar E — Recent activity inbox.
 *
 * Single merged timeline of everything that's happened on the provider's
 * Olera page: questions received/answered, leads, reviews, page_views.
 * Each row has a clear affordance (navigate, respond, thank).
 *
 * Feed-style pattern rather than dashboard-style — LinkedIn's "who viewed
 * your profile," Stripe's activity stream. Makes the page feel alive.
 */

interface Props {
  data: ProviderDashboardV2Data;
}

type ActivityItem = ProviderDashboardV2Data["recentActivity"][number];

export default function RecentActivityCard({ data }: Props) {
  const items = data.recentActivity.slice(0, 12);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
        <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-3">
          Recent activity
        </p>
        <p className="text-sm text-gray-400">
          No activity in the last 30 days yet. As families interact with your
          page, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 px-6 py-5 mb-6">
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase mb-4">
        Recent activity
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const icon = iconForKind(item.kind);
  const relative = formatRelative(item.timestamp);

  const body = (
    <div className="flex items-start gap-3 py-2 group">
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${icon.bg}`}>
        {icon.svg}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug">
          {item.title}
          <span className="text-gray-400 font-normal"> · {relative}</span>
        </p>
        {item.detail && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug truncate">
            {item.kind === "question" || item.kind === "question_answered"
              ? `"${item.detail}"`
              : item.detail}
          </p>
        )}
      </div>
      {item.actionHref && (
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-2 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      )}
    </div>
  );

  return (
    <li>
      {item.actionHref ? (
        <Link href={item.actionHref} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

function iconForKind(kind: ActivityItem["kind"]): {
  bg: string;
  svg: React.ReactNode;
} {
  if (kind === "question" || kind === "question_answered") {
    return {
      bg: "bg-blue-50",
      svg: (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    };
  }
  if (kind === "lead") {
    return {
      bg: "bg-amber-50",
      svg: (
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    };
  }
  if (kind === "review") {
    return {
      bg: "bg-yellow-50",
      svg: (
        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
    };
  }
  // page_view
  return {
    bg: "bg-emerald-50",
    svg: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  };
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
