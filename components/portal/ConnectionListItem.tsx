"use client";

import type { Connection, Profile } from "@/lib/types";
import {
  getFamilyDisplayStatus,
  getProviderDisplayStatus,
  FAMILY_STATUS_CONFIG,
  PROVIDER_STATUS_CONFIG,
} from "@/lib/connection-utils";
import { avatarGradient, blurName, parseMessage } from "./ConnectionDetailContent";

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

  const parsedMsg = parseMessage(connection.message);
  const careTypeLabel =
    parsedMsg?.careType ||
    connection.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  // Get status config based on role
  const statusConfig = isProvider
    ? PROVIDER_STATUS_CONFIG[getProviderDisplayStatus(connection, isInbound)]
    : FAMILY_STATUS_CONFIG[getFamilyDisplayStatus(connection)];

  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  // Thread preview: last message text
  const thread = (connection.metadata as Record<string, unknown>)?.thread as
    | { text: string; type?: string }[]
    | undefined;
  const lastMsg = thread?.length ? thread[thread.length - 1] : null;
  const preview =
    lastMsg?.type === "system"
      ? lastMsg.text
      : lastMsg?.text
      ? lastMsg.text.length > 60
        ? lastMsg.text.slice(0, 60) + "..."
        : lastMsg.text
      : parsedMsg?.notes
      ? parsedMsg.notes.length > 60
        ? parsedMsg.notes.slice(0, 60) + "..."
        : parsedMsg.notes
      : careTypeLabel;

  return (
    <button
      type="button"
      onClick={() => onSelect(connection.id)}
      className={[
        "w-full text-left transition-colors cursor-pointer",
        "px-4 py-3 border-b border-gray-100",
        selected
          ? "bg-primary-50/60"
          : "bg-white hover:bg-gray-50/80",
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
          {unread && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={[
                "text-sm truncate leading-snug",
                unread ? "font-bold text-gray-900" : "font-semibold text-gray-900",
              ].join(" ")}
            >
              {shouldBlur ? blurName(otherName) : otherName}
            </h3>
            <span className="text-[11px] text-gray-400 shrink-0">{createdAt}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={[
              "text-xs truncate",
              unread ? "text-gray-600" : "text-gray-400",
            ].join(" ")}>
              {preview}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${statusConfig.bg} ${statusConfig.color}`}
            >
              <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
