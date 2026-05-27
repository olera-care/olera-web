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
}

interface MyOutreachProps {
  families: Profile[];
  connectionData: Map<string, ConnectionInfo>;
  archivedIds: Set<string>;
  // Optional controlled state (for syncing mobile/desktop instances)
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function MyOutreach({
  families,
  connectionData,
  archivedIds,
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
          <div className="border-t border-gray-100 px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <OutreachLink
              count={pendingItems.length}
              label="pending"
              status="pending"
            />
            <OutreachLink
              count={activeItems.length}
              label="connected"
              status="connected"
            />
            <OutreachLink
              count={archivedItems.length}
              label="declined"
              status="declined"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple underlined link to outreach page
function OutreachLink({
  count,
  label,
  status,
}: {
  count: number;
  label: string;
  status: "pending" | "connected" | "declined";
}) {
  return (
    <Link
      href={`/provider/outreach?status=${status}`}
      className="text-[14px] text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors"
    >
      {count} {label}
    </Link>
  );
}

