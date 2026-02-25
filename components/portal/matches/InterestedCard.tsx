"use client";

import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import type { InterestedProvider } from "@/hooks/useInterestedProviders";

interface InterestedCardProps {
  item: InterestedProvider;
  onSelect: (id: string) => void;
  onReconsider?: (id: string) => void;
  isDeclined?: boolean;
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InterestedCard({
  item,
  onSelect,
  onReconsider,
  isDeclined = false,
}: InterestedCardProps) {
  const profile = item.providerProfile;
  const name = profile?.display_name || "Unknown Provider";
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const imageUrl = profile?.image_url;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const viewed = (item.metadata as Record<string, unknown>)?.viewed === true;
  const matchReasons = ((item.metadata as Record<string, unknown>)?.match_reasons as string[]) || [];
  const reachOutNote = (item.metadata as Record<string, unknown>)?.reach_out_note as string | undefined;
  const dateLabel = formatRelativeDate(item.created_at);

  // Provider type / care types
  const careTypes = profile?.care_types || [];
  const description = profile?.description;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDeclined) onSelect(item.id);
      }}
      disabled={isDeclined && !onReconsider}
      className={[
        "w-full text-left bg-white rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-300",
        isDeclined
          ? "border-gray-200/80 opacity-55 cursor-default"
          : "border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 cursor-pointer",
      ].join(" ")}
    >
      {/* ── Card body ── */}
      <div className="p-7">
        {/* Header: avatar + name/location + unread dot + time */}
        <div className="flex items-start gap-4 mb-5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-sm"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white shadow-sm"
              style={{ background: avatarGradient(name) }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              {!isDeclined && !viewed && (
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              )}
              <h3
                className={[
                  "text-lg font-display truncate leading-tight",
                  isDeclined
                    ? "font-medium text-gray-400"
                    : !viewed
                      ? "font-bold text-gray-900"
                      : "font-bold text-gray-900",
                ].join(" ")}
              >
                {name}
              </h3>
            </div>
            {location && (
              <p className={`text-[13px] mt-1 ${isDeclined ? "text-gray-400" : "text-gray-500"}`}>
                {location}
              </p>
            )}
          </div>
          <span className="text-[13px] text-gray-400 tabular-nums shrink-0">
            {dateLabel}
          </span>
        </div>

        {/* ── Reach-out note (the message the provider sent) ── */}
        {reachOutNote && !isDeclined && (
          <div className="border-l-2 border-warm-200 pl-4 mb-5">
            <p className="text-[15px] text-gray-600 leading-relaxed line-clamp-2">
              {reachOutNote}
            </p>
          </div>
        )}

        {/* ── Description fallback if no note ── */}
        {!reachOutNote && description && !isDeclined && (
          <div className="border-l-2 border-warm-200 pl-4 mb-5">
            <p className="text-[15px] text-gray-500 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        )}

        {/* ── Care type tags ── */}
        {careTypes.length > 0 && !isDeclined && (
          <div className="flex flex-wrap gap-2 mb-5">
            {careTypes.slice(0, 4).map((ct) => (
              <span
                key={ct}
                className="text-[13px] font-medium px-3 py-1.5 rounded-full border border-warm-100 text-gray-600 bg-white"
              >
                {ct}
              </span>
            ))}
            {careTypes.length > 4 && (
              <span className="text-[13px] text-gray-400 self-center pl-1">
                +{careTypes.length - 4}
              </span>
            )}
          </div>
        )}

        {/* ── Match reason pills ── */}
        {!isDeclined && matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchReasons.slice(0, 3).map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#F5F4F1] text-gray-700"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* ── Reconsider button (declined only) ── */}
        {isDeclined && onReconsider && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReconsider(item.id);
            }}
            className="mt-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-4 py-2 transition-colors"
          >
            Reconsider
          </button>
        )}
      </div>
    </button>
  );
}
