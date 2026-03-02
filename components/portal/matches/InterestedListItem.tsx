"use client";

import Image from "next/image";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import type { InterestedProvider } from "@/hooks/useInterestedProviders";

interface InterestedListItemProps {
  item: InterestedProvider;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function InterestedListItem({
  item,
  selected,
  onSelect,
}: InterestedListItemProps) {
  const profile = item.providerProfile;
  const name = profile?.display_name || "Unknown Provider";
  const imageUrl = profile?.image_url;
  const initial = name.charAt(0).toUpperCase();
  const viewed = (item.metadata as Record<string, unknown>)?.viewed === true;

  const careTypes = profile?.care_types || [];
  const typeLabel = careTypes[0] || "Care Provider";

  const createdAt = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={[
        "w-full text-left transition-colors cursor-pointer",
        "px-4 py-3.5 border-b border-gray-100 border-l-2",
        selected
          ? "bg-primary-50/60 border-l-primary-600"
          : "bg-white hover:bg-gray-50/80 border-l-transparent",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={40}
              height={40}
              sizes="40px"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: avatarGradient(name) }}
            >
              {initial}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {!viewed && (
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              )}
              <h3
                className={[
                  "text-sm truncate leading-snug",
                  !viewed
                    ? "font-bold text-gray-900"
                    : "font-normal text-gray-500",
                ].join(" ")}
              >
                {name}
              </h3>
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">
              {createdAt}
            </span>
          </div>
          <p
            className={[
              "text-xs truncate mt-0.5",
              !viewed ? "text-gray-600" : "text-gray-400",
            ].join(" ")}
          >
            {typeLabel}
          </p>
        </div>
      </div>
    </button>
  );
}
