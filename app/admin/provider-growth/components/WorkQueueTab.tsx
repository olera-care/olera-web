"use client";

/**
 * WorkQueueTab - Shows providers needing follow-up action, organized by urgency
 *
 * Sections:
 * - Returned Calls: Voicemails from providers in growth pipeline (highest priority)
 * - Overdue Callbacks: callback_date < today
 * - Due Today: callback_date = today
 * - Needs Retry: voicemail/hung_up/left_message, stale > 2 days
 * - Stale: no activity in 7+ days
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { WorkQueueEntry, WorkQueueResult, ReturnedCallEntry } from "@/lib/provider-growth/queries";

interface WorkQueueTabProps {
  onProviderClick: (trackingId: string) => void;
  refreshKey?: number;
}

export function WorkQueueTab({ onProviderClick, refreshKey = 0 }: WorkQueueTabProps) {
  const [data, setData] = useState<WorkQueueResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["returnedCalls", "overdueCallbacks", "dueToday", "needsRetry", "stale"])
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
      {/* Returned Calls - Highest Priority */}
      {data.returnedCalls && data.returnedCalls.length > 0 && (
        <div className="bg-white rounded-xl border border-teal-200">
          {/* Section header */}
          <button
            onClick={() => toggleSection("returnedCalls")}
            className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 rounded-t-xl border-b border-teal-200"
          >
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span className="font-medium text-teal-700">Returned Calls</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                {data.returnedCalls.length}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has("returnedCalls") ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Section content */}
          {expandedSections.has("returnedCalls") && (
            <ul className="divide-y divide-gray-100">
              {data.returnedCalls.map((entry) => (
                <ReturnedCallRow
                  key={entry.thread_id}
                  entry={entry}
                  onClick={() => onProviderClick(entry.tracking_id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

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
                      onClick={() => onProviderClick(entry.tracking_id)}
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
          {(entry.phone || entry.email) && (
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
          )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Returned Call Row (Voicemail from Growth Provider)
// ─────────────────────────────────────────────────────────────────────────────

interface ReturnedCallRowProps {
  entry: ReturnedCallEntry;
  onClick: () => void;
}

function ReturnedCallRow({ entry, onClick }: ReturnedCallRowProps) {
  const location = [entry.city, entry.state].filter(Boolean).join(", ");
  const hasAudio = entry.audio_message_id && entry.audio_attachment_id;

  // Build audio URL for playback
  const audioUrl = hasAudio
    ? `/api/admin/support-email/${encodeURIComponent(entry.thread_id)}/attachments/${encodeURIComponent(entry.audio_message_id!)}/` +
      `${encodeURIComponent(entry.audio_attachment_id!)}`
    : null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Provider info */}
        <div className="min-w-0 flex-1">
          {/* Line 1: Name + stage badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClick}
              className="truncate text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors text-left"
            >
              {entry.display_name || "Unnamed Provider"}
            </button>
            <StageBadge stage={entry.pipeline_stage} isConverted={entry.is_converted} />
          </div>

          {/* Line 2: Location + phone */}
          {(location || entry.phone) && (
            <p className="mt-0.5 text-xs text-gray-500">
              {location && <span>{location}</span>}
              {location && entry.phone && <span className="text-gray-400"> · </span>}
              {entry.phone && (
                <a
                  href={`tel:${entry.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {entry.phone}
                </a>
              )}
            </p>
          )}

          {/* Line 3: Voicemail summary */}
          {entry.voicemail_summary && (
            <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
              {entry.voicemail_summary}
            </p>
          )}

          {/* Audio player */}
          {audioUrl && (
            <div className="mt-2 flex items-center gap-2">
              <audio
                controls
                preload="metadata"
                className="h-8 min-w-0 flex-1 max-w-xs"
                src={audioUrl}
                onClick={(e) => e.stopPropagation()}
              >
                Your browser does not support audio playback.
              </audio>
              {entry.audio_filename && (
                <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                  {entry.audio_filename}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Time info */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-700">
            Returned call
          </span>
          <span className="text-xs text-gray-400">
            {timeAgo(entry.voicemail_at)}
          </span>
          {entry.callback_number && (
            <a
              href={`tel:${entry.callback_number}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              {entry.callback_number}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
