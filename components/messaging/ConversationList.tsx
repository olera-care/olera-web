"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

type FilterTab = "all" | "pending" | "connected" | "past";

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "connected", label: "Connected" },
  { key: "past", label: "Past" },
];

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

function filterConnections(connections: ConnectionWithProfile[], filter: FilterTab): ConnectionWithProfile[] {
  if (filter === "all") return connections;
  if (filter === "pending") return connections.filter((c) => c.status === "pending");
  if (filter === "connected") return connections.filter((c) => c.status === "accepted");
  if (filter === "past") return connections.filter((c) => ["declined", "expired", "archived"].includes(c.status));
  return connections;
}

function searchConnections(connections: ConnectionWithProfile[], query: string, activeProfileId: string): ConnectionWithProfile[] {
  const q = query.toLowerCase().trim();
  if (!q) return connections;
  return connections.filter((conn) => {
    const isInbound = conn.to_profile_id === activeProfileId;
    const otherProfile = isInbound ? conn.fromProfile : conn.toProfile;
    const name = otherProfile?.display_name || "";
    return name.toLowerCase().includes(q);
  });
}

export default function ConversationList({
  connections,
  selectedId,
  onSelect,
  loading,
  activeProfileId,
  className = "",
}: ConversationListProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track scroll for divider
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setIsScrolled(scrollRef.current.scrollTop > 0);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, loading]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);

  // Apply filters and search
  const filtered = searchOpen
    ? searchConnections(connections, searchQuery, activeProfileId)
    : filterConnections(connections, filter);

  // Loading state
  if (loading) {
    return (
      <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
        <div className="pl-[44px] pr-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 pl-[44px] pr-5 py-4 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state (no connections at all)
  if (connections.length === 0) {
    return (
      <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
        <div className="pl-[44px] pr-5 py-4">
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
      {/* Header */}
      <div className={`shrink-0 transition-shadow duration-150 ${isScrolled ? "shadow-[0_1px_0_0_#e5e7eb]" : ""}`}>
        {searchOpen ? (
          /* Search mode */
          <div className="pl-[44px] pr-5 py-3.5 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all messages"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-sm font-medium text-gray-900 shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Default mode — title + search icon */
          <div className="pl-[44px] pr-5 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Search messages"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Filter tabs — hidden during search */}
        {!searchOpen && (
          <div className="pl-[44px] pr-5 pb-3 flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <p className="text-sm text-gray-500">
              {searchOpen ? "No results found" : "No conversations"}
            </p>
          </div>
        ) : (
          filtered.map((conn) => {
            const isInbound = conn.to_profile_id === activeProfileId;
            const otherProfile = isInbound ? conn.fromProfile : conn.toProfile;
            const name = otherProfile?.display_name || "Unknown";
            const initials = name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
            const lastMsg = getLastMessage(conn);
            const isSelected = conn.id === selectedId;

            return (
              <button
                key={conn.id}
                onClick={() => onSelect(conn.id)}
                className={`w-full text-left flex items-start gap-3 pl-[44px] pr-5 py-4 border-b border-gray-100 transition-colors ${
                  isSelected
                    ? "bg-primary-50/80"
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
                  {lastMsg && (
                    <p className="text-[13px] text-gray-500 truncate mt-0.5">
                      {lastMsg.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
