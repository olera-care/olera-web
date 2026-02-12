import type { Connection } from "@/lib/types";

// ── Display status for family (care seeker) view ──

export type FamilyDisplayStatus =
  | "pending"
  | "responded"
  | "declined"
  | "withdrawn"
  | "expired";

export type ConnectionTab = "active" | "responded" | "past";

/**
 * Maps a DB connection to the family-facing display status.
 *
 * DB statuses: pending, accepted, declined, expired
 * - `accepted` → "responded"
 * - `expired` + metadata.withdrawn → "withdrawn"
 * - `expired` → "expired"
 * - `declined` → "declined"
 * - `pending` → "pending"
 */
export function getFamilyDisplayStatus(
  connection: Connection
): FamilyDisplayStatus {
  switch (connection.status) {
    case "accepted":
      return "responded";
    case "declined":
      return "declined";
    case "expired":
    case "archived":
      if (connection.metadata?.withdrawn) return "withdrawn";
      return "expired";
    default:
      return "pending";
  }
}

/** Which tab a display status belongs to */
export function getConnectionTab(
  displayStatus: FamilyDisplayStatus
): ConnectionTab {
  switch (displayStatus) {
    case "pending":
      return "active";
    case "responded":
      return "responded";
    case "declined":
    case "withdrawn":
    case "expired":
      return "past";
  }
}

/** Whether a responded connection is unread */
export function isConnectionUnread(
  connection: Connection,
  readIds: Set<string>
): boolean {
  return connection.status === "accepted" && !readIds.has(connection.id);
}

// ── Status badge config ──

export const FAMILY_STATUS_CONFIG: Record<
  FamilyDisplayStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  responded: {
    label: "Responded",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-400",
  },
  declined: {
    label: "Declined",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  expired: {
    label: "Expired",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
};
