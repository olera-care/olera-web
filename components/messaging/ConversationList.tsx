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
  onReportConnection?: (id: string) => void;
  onArchiveConnection?: (id: string) => void;
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

function getCareType(connection: ConnectionWithProfile): string | null {
  if (!connection.message) return null;
  try {
    const parsed = JSON.parse(connection.message);
    if (parsed.care_type) {
      return String(parsed.care_type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  } catch {
    // ignore
  }
  return null;
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

  // Fall back to auto-intro message
  const autoIntro = meta?.auto_intro as string | undefined;
  if (autoIntro) {
    return { text: autoIntro, timestamp: connection.created_at };
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

const PAST_STATUSES = ["declined", "expired", "archived"];

function getActiveConnections(connections: ConnectionWithProfile[]): ConnectionWithProfile[] {
  return connections.filter((c) => !PAST_STATUSES.includes(c.status));
}

function getPastConnections(connections: ConnectionWithProfile[]): ConnectionWithProfile[] {
  return connections.filter((c) => PAST_STATUSES.includes(c.status));
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

type FilterOption = "all" | "pending" | "connected";

const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All",
  pending: "Pending",
  connected: "Connected",
};

/** Read-tracking key for localStorage */
const READ_KEY = "olera_inbox_read";

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markAsRead(connectionId: string) {
  const readSet = getReadSet();
  readSet.add(connectionId);
  localStorage.setItem(READ_KEY, JSON.stringify([...readSet]));
}

export default function ConversationList({
  connections,
  selectedId,
  onSelect,
  loading,
  activeProfileId,
  onReportConnection,
  onArchiveConnection,
  className = "",
}: ConversationListProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveOpen, setPastOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Load read tracking from localStorage
  useEffect(() => {
    setReadIds(getReadSet());
  }, []);

  // Mark selected conversation as read
  useEffect(() => {
    if (selectedId) {
      markAsRead(selectedId);
      setReadIds((prev) => new Set([...prev, selectedId]));
    }
  }, [selectedId]);

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

  // Close menu / dropdown on outside click
  useEffect(() => {
    if (!menuOpenId && !filterDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
      if (filterDropdownOpen && filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId, filterDropdownOpen]);

  // Apply filters
  const filtered = (() => {
    if (searchOpen) return searchConnections(connections, searchQuery, activeProfileId);
    let list = getActiveConnections(connections);
    if (filterOption === "pending") list = list.filter((c) => c.status === "pending");
    if (filterOption === "connected") list = list.filter((c) => c.status === "accepted");
    if (unreadOnly) list = list.filter((c) => !readIds.has(c.id));
    return list;
  })();

  // Past connections shown separately in accordion (not during search)
  const pastConnections = searchOpen ? [] : getPastConnections(connections);

  // Shared conversation item renderer
  const renderConversationItem = (conn: ConnectionWithProfile, isPast = false) => {
    const isInbound = conn.to_profile_id === activeProfileId;
    const otherProfile = isInbound ? conn.fromProfile : conn.toProfile;
    const name = otherProfile?.display_name || "Unknown";
    const initials = name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const lastMsg = getLastMessage(conn);
    const careType = getCareType(conn);
    const isSelected = conn.id === selectedId;
    const isMenuOpen = menuOpenId === conn.id;
    const isUnread = !readIds.has(conn.id);

    return (
      <div key={conn.id} className="pl-[28px] pr-3 py-0.5">
        <div
          className={`group relative rounded-xl transition-colors ${
            isSelected
              ? "bg-primary-50/80"
              : "hover:bg-gray-50"
          } ${isPast ? "opacity-60" : ""}`}
        >
          <button
            onClick={() => onSelect(conn.id)}
            className="w-full text-left flex items-start gap-3.5 px-4 py-4"
          >
            {/* Avatar with unread indicator */}
            <div className="relative shrink-0 mt-0.5">
              {otherProfile?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherProfile.image_url}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: avatarGradient(name) }}
                >
                  {initials}
                </div>
              )}
              {isUnread && !isPast && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className={`block text-base truncate ${isUnread && !isPast ? "font-semibold text-gray-900" : "font-normal text-gray-900"}`}>
                    {name}
                  </span>
                </div>
                {lastMsg && (
                  <span className={`text-[13px] shrink-0 ${isUnread && !isPast ? "text-primary-600 font-medium" : "text-gray-400"}`}>
                    {formatRelativeTime(lastMsg.timestamp)}
                  </span>
                )}
              </div>
              {careType && (
                <p className="text-sm text-primary-600 font-medium mt-0.5 truncate">
                  {careType}
                </p>
              )}
              {lastMsg && (
                <p className="text-[15px] text-gray-500 truncate mt-0.5">
                  {lastMsg.text}
                </p>
              )}
            </div>
          </button>

          {/* Hover action menu — hidden on past items */}
          {!isPast && (
            <div className={`absolute right-4 top-4 ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(isMenuOpen ? null : conn.id);
                }}
                className="p-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                aria-label="More actions"
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
                >
                  {onArchiveConnection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveConnection(conn.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archive
                    </button>
                  )}
                  {onReportConnection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReportConnection(conn.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21V4a1 1 0 011-1h4l2 3h8a1 1 0 011 1v8a1 1 0 01-1 1h-6l-2-3H4a1 1 0 00-1 1v7" />
                      </svg>
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex flex-col border-r border-gray-200 bg-white ${className}`}>
        <div className="pl-[44px] pr-5 py-5">
          <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="pl-[28px] pr-3 py-0.5">
              <div className="flex items-start gap-3.5 px-4 py-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-50 rounded w-1/3" />
                  <div className="h-3 bg-gray-50 rounded w-full" />
                </div>
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
        <div className="pl-[44px] pr-5 py-5">
          <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.5} />
                <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" strokeWidth={1.5} />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-gray-900 mb-1">No conversations yet</p>
            <p className="text-sm text-gray-500 mb-4">Connect with a provider to start messaging</p>
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
          <div className="pl-[44px] pr-5 py-4 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations"
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
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
          <div className="pl-[44px] pr-5 py-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
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

        {/* Filter pills — Airbnb style, hidden during search */}
        {!searchOpen && (
          <div className="pl-[44px] pr-5 pb-4 flex items-center gap-2.5">
            {/* "All" dropdown pill */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setFilterDropdownOpen((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                  filterOption !== "all" || unreadOnly
                    ? "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    : "bg-gray-900 text-white"
                }`}
              >
                {FILTER_LABELS[filterOption]}
                <svg className={`w-3 h-3 transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {filterDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setFilterOption(key);
                        setUnreadOnly(false);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        filterOption === key
                          ? "text-gray-900 font-semibold bg-gray-50"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {FILTER_LABELS[key]}
                      {filterOption === key && (
                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* "Unread" toggle pill */}
            <button
              onClick={() => {
                setUnreadOnly((p) => {
                  if (!p) setFilterOption("all");
                  return !p;
                });
              }}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                unreadOnly
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Unread
            </button>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 && pastConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <p className="text-[15px] text-gray-500">
              {searchOpen ? "No results found" : "No conversations"}
            </p>
          </div>
        ) : (
          <>
            {filtered.length === 0 && !searchOpen && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <p className="text-[15px] text-gray-500">No conversations</p>
              </div>
            )}
            {filtered.map((conn) => renderConversationItem(conn))}

            {/* Past conversations accordion */}
            {pastConnections.length > 0 && !searchOpen && (
              <>
                <button
                  onClick={() => setPastOpen((p) => !p)}
                  className="w-full flex items-center justify-between pl-[44px] pr-5 py-3.5 mt-2 bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-500">
                    Archived ({pastConnections.length})
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${archiveOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {archiveOpen && pastConnections.map((conn) => renderConversationItem(conn, true))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
