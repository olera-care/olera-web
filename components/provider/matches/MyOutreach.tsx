"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";

// Connection data from parent
interface ConnectionInfo {
  id: string;
  message: string | null;
  created_at: string;
  status: "pending" | "accepted" | "declined";
  reply_message?: string | null;
  replied_at?: string | null;
  reminder_sent?: boolean;
}

interface MyOutreachProps {
  families: Profile[];
  connectionData: Map<string, ConnectionInfo>;
  archivedIds: Set<string>;
  reminderSentIds: Set<string>;
  onSendReminder?: (connectionId: string) => void;
  sendingReminderId?: string | null;
}

// Avatar colors matching sidebar
const AVATAR_COLORS = [
  { bg: "#d4ede7", text: "#1a6055" },
  { bg: "#fce5d8", text: "#a04020" },
  { bg: "#e0ddf4", text: "#4838a0" },
  { bg: "#fcdede", text: "#982828" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// Check if reminder can be sent (48 hours since initial outreach, no reminder sent yet)
function canSendReminder(conn: ConnectionInfo, reminderSentIds: Set<string>): boolean {
  if (conn.status !== "pending") return false;
  // Check both the connection data AND the live state (for immediate UI update after sending)
  if (conn.reminder_sent || reminderSentIds.has(conn.id)) return false;

  const sentAt = new Date(conn.created_at).getTime();
  const now = Date.now();
  const hoursSince = (now - sentAt) / (1000 * 60 * 60);

  return hoursSince >= 48;
}

export default function MyOutreach({
  families,
  connectionData,
  archivedIds,
  reminderSentIds,
  onSendReminder,
  sendingReminderId,
}: MyOutreachProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Build outreach items with family data
  const outreachItems = useMemo(() => {
    const items: Array<{
      family: Profile;
      connection: ConnectionInfo;
      category: "pending" | "active" | "archived";
    }> = [];

    connectionData.forEach((conn, familyId) => {
      const family = families.find((f) => f.id === familyId);
      if (!family) return;

      // Skip if explicitly archived by user
      if (archivedIds.has(conn.id)) return;

      let category: "pending" | "active" | "archived";
      if (conn.status === "accepted") {
        category = "active";
      } else if (conn.status === "declined") {
        category = "archived";
      } else {
        category = "pending";
      }

      items.push({ family, connection: conn, category });
    });

    // Sort by created_at descending (most recent first)
    items.sort((a, b) =>
      new Date(b.connection.created_at).getTime() - new Date(a.connection.created_at).getTime()
    );

    return items;
  }, [families, connectionData, archivedIds]);

  // Separate by category
  const pendingItems = outreachItems.filter((i) => i.category === "pending");
  const activeItems = outreachItems.filter((i) => i.category === "active");
  const archivedItems = outreachItems.filter((i) => i.category === "archived");

  const totalCount = outreachItems.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-gray-900">My Outreach</span>
          {totalCount > 0 && (
            <span className="text-[13px] font-medium text-gray-400">({totalCount})</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100">
            {/* Status summary row - only show when there's outreach */}
            {totalCount > 0 && (
              <div className="flex items-center gap-4 px-5 py-3 bg-gray-50/50 text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-gray-500">Pending</span>
                  <span className="font-semibold text-gray-700">{pendingItems.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-gray-500">Connected</span>
                  <span className="font-semibold text-gray-700">{activeItems.length}</span>
                </div>
                {archivedItems.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-gray-500">Declined</span>
                    <span className="font-semibold text-gray-700">{archivedItems.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* Outreach list */}
            <div className="max-h-[320px] overflow-y-auto">
              {totalCount === 0 ? (
                /* Empty state */
                <div className="px-5 py-6 text-center">
                  <p className="text-[13px] text-gray-500">
                    No outreach yet. Send a note to families to get started.
                  </p>
                </div>
              ) : (
                <>
                  {/* Pending section */}
                  {pendingItems.length > 0 && (
                    <OutreachSection
                      title="Awaiting Response"
                      items={pendingItems}
                      reminderSentIds={reminderSentIds}
                      onSendReminder={onSendReminder}
                      sendingReminderId={sendingReminderId}
                    />
                  )}

                  {/* Active/Connected section */}
                  {activeItems.length > 0 && (
                    <OutreachSection
                      title="Connected"
                      items={activeItems}
                    />
                  )}

                  {/* Archived/Declined section */}
                  {archivedItems.length > 0 && (
                    <OutreachSection
                      title="Not a Match"
                      items={archivedItems}
                      muted
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section within outreach list
function OutreachSection({
  title,
  items,
  muted = false,
  reminderSentIds,
  onSendReminder,
  sendingReminderId,
}: {
  title: string;
  items: Array<{ family: Profile; connection: ConnectionInfo }>;
  muted?: boolean;
  reminderSentIds?: Set<string>;
  onSendReminder?: (connectionId: string) => void;
  sendingReminderId?: string | null;
}) {
  return (
    <div className={muted ? "opacity-60" : ""}>
      <div className="px-5 py-2 bg-gray-50/30 border-b border-gray-100">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{title}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map(({ family, connection }, index) => (
          <OutreachItem
            key={connection.id}
            family={family}
            connection={connection}
            colorIndex={index}
            reminderSentIds={reminderSentIds}
            onSendReminder={onSendReminder}
            sendingReminderId={sendingReminderId}
          />
        ))}
      </div>
    </div>
  );
}

// Individual outreach item
function OutreachItem({
  family,
  connection,
  colorIndex,
  reminderSentIds,
  onSendReminder,
  sendingReminderId,
}: {
  family: Profile;
  connection: ConnectionInfo;
  colorIndex: number;
  reminderSentIds?: Set<string>;
  onSendReminder?: (connectionId: string) => void;
  sendingReminderId?: string | null;
}) {
  const colors = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const canRemind = canSendReminder(connection, reminderSentIds || new Set());
  const isSendingReminder = sendingReminderId === connection.id;
  const wasNudged = reminderSentIds?.has(connection.id) || connection.reminder_sent;

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {getInitials(family.display_name || "?")}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 truncate">
          {family.display_name || "Family"}
        </p>
        <p className="text-[11px] text-gray-400">
          {timeAgo(connection.created_at)}
          {connection.status === "accepted" && connection.replied_at && (
            <> · Replied {timeAgo(connection.replied_at)}</>
          )}
        </p>
      </div>

      {/* Status badge / Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {connection.status === "pending" && (
          <>
            {canRemind && onSendReminder ? (
              <button
                type="button"
                onClick={() => onSendReminder(connection.id)}
                disabled={isSendingReminder}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {isSendingReminder ? "Sending..." : "Nudge"}
              </button>
            ) : wasNudged ? (
              <span className="text-[10px] text-gray-400">Nudged</span>
            ) : null}
            <span className="px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 rounded-full">
              Pending
            </span>
          </>
        )}

        {connection.status === "accepted" && (
          <Link
            href="/provider/connections"
            className="px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
          >
            View
          </Link>
        )}

        {connection.status === "declined" && (
          <span className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded-full">
            Declined
          </span>
        )}
      </div>
    </div>
  );
}
