"use client";

import { useState, useMemo } from "react";
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
  // Optional controlled state (for syncing mobile/desktop instances)
  isOpen?: boolean;
  onToggle?: () => void;
}

// Simple time ago helper
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d ago";
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
  isOpen: controlledIsOpen,
  onToggle,
}: MyOutreachProps) {
  // Support both controlled (synced) and uncontrolled (local) state
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? localIsOpen;
  const handleToggle = onToggle ?? (() => setLocalIsOpen(!localIsOpen));

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
        onClick={handleToggle}
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
          <div className="border-t border-gray-100 px-5 py-4 space-y-2">
            {/* Upwork-style: "X pending outreach" as underlined clickable links */}
            <OutreachLink
              count={pendingItems.length}
              label="pending outreach"
              items={pendingItems}
              reminderSentIds={reminderSentIds}
              onSendReminder={onSendReminder}
              sendingReminderId={sendingReminderId}
            />
            <OutreachLink
              count={activeItems.length}
              label="connected"
              items={activeItems}
            />
            <OutreachLink
              count={archivedItems.length}
              label="declined"
              items={archivedItems}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Upwork-style link: "X pending outreach" (underlined, clickable)
function OutreachLink({
  count,
  label,
  items,
  reminderSentIds,
  onSendReminder,
  sendingReminderId,
}: {
  count: number;
  label: string;
  items: Array<{ family: Profile; connection: ConnectionInfo }>;
  reminderSentIds?: Set<string>;
  onSendReminder?: (connectionId: string) => void;
  sendingReminderId?: string | null;
}) {
  // For now, just display. Will become a Link to /provider/outreach when that page exists
  return (
    <div>
      <span className="text-[14px] text-gray-900 font-medium">
        {count} {label}
      </span>
      {/* Show items inline if any exist */}
      {items.length > 0 && (
        <div className="mt-2 ml-3 space-y-1.5">
          {items.slice(0, 3).map(({ family, connection }) => (
            <div key={connection.id} className="flex items-center gap-2 text-[13px]">
              <span className="text-gray-600 truncate max-w-[140px]">
                {family.display_name || "Family"}
              </span>
              <span className="text-gray-400 text-[11px] shrink-0">
                {timeAgo(connection.created_at)}
              </span>
              {label === "pending outreach" && canSendReminder(connection, reminderSentIds || new Set()) && onSendReminder && (
                <button
                  type="button"
                  onClick={() => onSendReminder(connection.id)}
                  disabled={sendingReminderId === connection.id}
                  className="text-[11px] text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  {sendingReminderId === connection.id ? "..." : "Nudge"}
                </button>
              )}
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-[12px] text-gray-400">+{items.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
}

