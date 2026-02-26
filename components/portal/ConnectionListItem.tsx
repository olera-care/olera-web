"use client";

import type { Connection, Profile } from "@/lib/types";
import { avatarGradient, blurName } from "./ConnectionDetailContent";

export interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

interface ConnectionListItemProps {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  selected: boolean;
  unread?: boolean;
  onSelect: (id: string) => void;
  /** Provider-specific props */
  isProvider?: boolean;
  hasFullAccess?: boolean;
}

export default function ConnectionListItem({
  connection,
  activeProfileId,
  selected,
  unread = false,
  onSelect,
  isProvider = false,
  hasFullAccess = true,
}: ConnectionListItemProps) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");


  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(connection.id)}
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
          {imageUrl && !shouldBlur ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={otherName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
            >
              {shouldBlur ? "?" : initial}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={[
                "text-sm truncate leading-snug",
                unread ? "font-bold text-gray-900" : "font-normal text-gray-500",
              ].join(" ")}
            >
              {shouldBlur ? blurName(otherName) : otherName}
            </h3>
            <span className="text-[11px] text-gray-400 shrink-0">{createdAt}</span>
          </div>
          <p className={[
            "text-xs truncate mt-0.5",
            unread ? "text-gray-600" : "text-gray-400",
          ].join(" ")}>
            {otherLocation}
          </p>
        </div>
      </div>
    </button>
  );
}
