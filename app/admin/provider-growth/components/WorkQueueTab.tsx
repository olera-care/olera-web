"use client";

/**
 * WorkQueueTab - Shows providers needing follow-up action, organized by urgency
 *
 * Sections:
 * - Overdue Callbacks: callback_date < today
 * - Due Today: callback_date = today
 * - Needs Retry: voicemail/hung_up/left_message, stale > 2 days
 * - Stale: no activity in 7+ days
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { WorkQueueEntry, WorkQueueResult } from "@/lib/provider-growth/queries";

interface WorkQueueTabProps {
  onProviderClick: (trackingId: string, businessProfileId: string) => void;
  refreshKey?: number;
}

export function WorkQueueTab({ onProviderClick, refreshKey = 0 }: WorkQueueTabProps) {
  const [data, setData] = useState<WorkQueueResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overdueCallbacks", "dueToday", "needsRetry", "stale"])
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/provider-growth/work-queue");
      if (!res.ok) {
        throw new Error("Failed to fetch work queue");
      }
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (e) {
      console.error("Error fetching work queue:", e);
      setError("Failed to load work queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Loading work queue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-gray-900 font-medium">All caught up!</p>
        <p className="text-gray-500 text-sm mt-1">No providers need follow-up right now.</p>
      </div>
    );
  }

  const sections = [
    {
      id: "overdueCallbacks",
      label: "Overdue Callbacks",
      icon: "🔴",
      entries: data.overdueCallbacks,
      emptyMessage: "No overdue callbacks",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
    },
    {
      id: "dueToday",
      label: "Due Today",
      icon: "📅",
      entries: data.dueToday,
      emptyMessage: "No callbacks due today",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
    },
    {
      id: "needsRetry",
      label: "Needs Retry",
      icon: "📞",
      entries: data.needsRetry,
      emptyMessage: "No providers need retry",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
    },
    {
      id: "stale",
      label: "Stale",
      icon: "⏳",
      entries: data.stale,
      emptyMessage: "No stale providers",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-600",
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`bg-white rounded-xl border ${section.entries.length > 0 ? section.borderColor : "border-gray-200"}`}
        >
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center justify-between px-4 py-3 ${
              section.entries.length > 0 ? section.bgColor : "bg-gray-50"
            } rounded-t-xl border-b ${section.borderColor}`}
          >
            <div className="flex items-center gap-2">
              <span>{section.icon}</span>
              <span className={`font-medium ${section.entries.length > 0 ? section.textColor : "text-gray-500"}`}>
                {section.label}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  section.entries.length > 0
                    ? `${section.bgColor} ${section.textColor}`
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {section.entries.length}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has(section.id) ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Section content */}
          {expandedSections.has(section.id) && (
            <div>
              {section.entries.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">{section.emptyMessage}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {section.entries.map((entry) => (
                    <WorkQueueRow
                      key={entry.tracking_id}
                      entry={entry}
                      onClick={() => onProviderClick(entry.tracking_id, entry.business_profile_id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface WorkQueueRowProps {
  entry: WorkQueueEntry;
  onClick: () => void;
}

function WorkQueueRow({ entry, onClick }: WorkQueueRowProps) {
  const location = [entry.city, entry.state].filter(Boolean).join(", ");

  return (
    <div
      onClick={onClick}
      className="group px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Provider info */}
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + stage badge */}
          <div className="flex items-center gap-2">
            {entry.slug ? (
              <Link
                href={`/admin/directory/${entry.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
              >
                {entry.display_name || "Unnamed Provider"}
              </Link>
            ) : (
              <span className="truncate text-sm font-medium text-gray-900">
                {entry.display_name || "Unnamed Provider"}
              </span>
            )}
            <StageBadge stage={entry.pipeline_stage} isConverted={entry.is_converted} />
          </div>

          {/* Line 2: Location */}
          {location && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{location}</p>
          )}

          {/* Line 3: Contact info */}
          <p className="mt-0.5 text-xs text-gray-500">
            {entry.phone && (
              <a
                href={`tel:${entry.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {entry.phone}
              </a>
            )}
            {entry.phone && entry.email && <span className="text-gray-400"> · </span>}
            {entry.email && <span>{entry.email}</span>}
          </p>
        </div>

        {/* Right: Queue reason info */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <QueueReasonBadge entry={entry} />
          {entry.last_activity_outcome && (
            <span className="text-xs text-gray-400">
              Last: {getOutcomeLabel(entry.last_activity_outcome)}
            </span>
          )}
          {entry.last_activity_at && (
            <span className="text-xs text-gray-400">
              {timeAgo(entry.last_activity_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StageBadge({ stage, isConverted }: { stage: string; isConverted: boolean }) {
  if (isConverted) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
        Converted
      </span>
    );
  }

  const stageLabels: Record<string, string> = {
    new_claim: "Claimed",
    pitched: "Pitched",
    no_show: "No-show",
  };

  const stageColors: Record<string, string> = {
    new_claim: "bg-blue-100 text-blue-700",
    pitched: "bg-purple-100 text-purple-700",
    no_show: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${stageColors[stage] || "bg-gray-100 text-gray-600"}`}>
      {stageLabels[stage] || stage}
    </span>
  );
}

function QueueReasonBadge({ entry }: { entry: WorkQueueEntry }) {
  if (entry.queue_reason === "overdue_callback" || entry.queue_reason === "due_today") {
    const isOverdue = entry.queue_reason === "overdue_callback";
    const callbackDate = entry.callback_date ? formatCallbackDate(entry.callback_date) : "—";

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        Callback: {callbackDate}
      </span>
    );
  }

  if (entry.queue_reason === "needs_retry") {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
        Needs retry
      </span>
    );
  }

  if (entry.queue_reason === "stale") {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
        No activity 7+ days
      </span>
    );
  }

  return null;
}

function getOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    voicemail: "Voicemail",
    hung_up: "Hung up",
    callback_requested: "Callback requested",
    left_message: "Left message",
    note: "Note",
    interested: "Interested",
    not_interested: "Not interested",
    no_show: "No-show",
  };
  return labels[outcome] || outcome;
}

function formatCallbackDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00"); // Add time to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
