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
  const initial = name.charAt(0).toUpperCase();
  const viewed = (item.metadata as Record<string, unknown>)?.viewed === true;
  const matchReasons = ((item.metadata as Record<string, unknown>)?.match_reasons as string[]) || [];
  const dateLabel = formatRelativeDate(item.created_at);

  // Determine provider type label
  const careTypes = profile?.care_types || [];
  const typeLabel = careTypes[0] || (profile?.category
    ? String(profile.category).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
    : "Care Provider");

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDeclined) onSelect(item.id);
      }}
      disabled={isDeclined && !onReconsider}
      className={[
        "w-full text-left rounded-xl bg-white border p-5 transition-all duration-200",
        isDeclined
          ? "border-gray-100 opacity-60 cursor-default"
          : "border-gray-100 hover:border-gray-200 cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: avatarGradient(name) }}
            >
              {initial}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Date row */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={[
              "text-xs",
              isDeclined ? "text-gray-400" : "text-gray-400",
            ].join(" ")}>
              {typeLabel}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{dateLabel}</span>
          </div>

          {/* Name + unread dot */}
          <div className="flex items-center gap-1.5">
            {!isDeclined && !viewed && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
            <h3
              className={[
                "text-sm truncate",
                isDeclined
                  ? "font-normal text-gray-400"
                  : !viewed
                    ? "font-bold text-gray-900"
                    : "font-medium text-gray-700",
              ].join(" ")}
            >
              {name}
            </h3>
          </div>

          {/* Location */}
          <p className={[
            "text-xs mt-0.5 truncate",
            isDeclined ? "text-gray-400" : "text-gray-500",
          ].join(" ")}>
            {location}
          </p>

          {/* Match reason pills (pending only) */}
          {!isDeclined && matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matchReasons.slice(0, 2).map((reason) => (
                <span
                  key={reason}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Reconsider button (declined only) */}
          {isDeclined && onReconsider && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReconsider(item.id);
              }}
              className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
            >
              Reconsider
            </button>
          )}
        </div>
      </div>
    </button>
  );
}
