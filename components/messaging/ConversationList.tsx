"use client";

import Link from "next/link";
import type { Connection, Profile } from "@/lib/types";

export interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

interface ConversationListProps {
  connections: ConnectionWithProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  activeProfileId: string;
  className?: string;
}

/** Deterministic gradient for fallback avatars */
function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #0891b2, #2dd4bf)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
}

function getLastMessage(connection: ConnectionWithProfile): { text: string; timestamp: string } | null {
  const meta = connection.metadata as Record<string, unknown> | undefined;
  const thread = (meta?.thread as ThreadMessage[]) || [];

  if (thread.length > 0) {
    const last = thread[thread.length - 1];
    return {
      text: last.type === "system" ? last.text : last.text,
      timestamp: last.created_at,
    };
  }

  // Fall back to initial message notes
  if (connection.message) {
    try {
      const parsed = JSON.parse(connection.message);
      if (parsed.additional_notes) {
        return { text: parsed.additional_notes, timestamp: connection.created_at };
      }
      if (parsed.care_type) {
        const ct = String(parsed.care_type).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        return { text: `Looking for ${ct}`, timestamp: connection.created_at };
      }
    } catch {
      // ignore
    }
  }

  return { text: "New connection", timestamp: connection.created_at };
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusBadge(status: string, isInbound: boolean) {
  const meta: Record<string, unknown> = {};
  const isWithdrawn = !!meta.withdrawn;
  const isEnded = !!meta.ended;

  if (isEnded || isWithdrawn) return null;

  if (status === "pending") {
    return isInbound
      ? { label: "New", color: "text-amber-700 bg-amber-50" }
      : { label: "Pending", color: "text-blue-700 bg-blue-50" };
  }
  if (status === "accepted") {
    return { label: "Connected", color: "text-emerald-700 bg-emerald-50" };
  }
  return null;
}

export default function ConversationList({
  connections,
  selectedId,
  onSelect,
  loading,
  activeProfileId,
  className = "",
}: ConversationListProps) {
  if (loading) {
    return (
      <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.5} />
                <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" strokeWidth={1.5} />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No conversations yet</p>
            <p className="text-xs text-gray-500 mb-4">Connect with a provider to start messaging</p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse providers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {connections.map((conn) => {
          const isInbound = conn.to_profile_id === activeProfileId;
          const otherProfile = isInbound ? conn.fromProfile : conn.toProfile;
          const name = otherProfile?.display_name || "Unknown";
          const initials = name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
          const lastMsg = getLastMessage(conn);
          const badge = getStatusBadge(conn.status, isInbound);
          const isSelected = conn.id === selectedId;

          return (
            <button
              key={conn.id}
              onClick={() => onSelect(conn.id)}
              className={`w-full text-left flex items-start gap-3 px-5 py-4 border-b border-gray-50 transition-colors ${
                isSelected
                  ? "bg-primary-50/60"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Avatar */}
              {otherProfile?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherProfile.image_url}
                  alt={name}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                  style={{ background: avatarGradient(name) }}
                >
                  {initials}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${isSelected ? "font-bold text-gray-900" : "font-semibold text-gray-900"}`}>
                    {name}
                  </span>
                  {lastMsg && (
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formatRelativeTime(lastMsg.timestamp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {lastMsg && (
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {lastMsg.text}
                    </p>
                  )}
                  {badge && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
