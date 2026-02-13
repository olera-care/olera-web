import type { Connection } from "@/lib/types";

// ── Display status for family (care seeker) view ──

export type FamilyDisplayStatus =
  | "pending"
  | "responded"
  | "declined"
  | "withdrawn"
  | "expired"
  | "ended";

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
      if (connection.metadata?.ended) return "ended";
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
    case "ended":
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

// ── Display status for provider view ──

export type ProviderDisplayStatus =
  | "new_request"
  | "pending_outbound"
  | "connected"
  | "declined"
  | "withdrawn"
  | "expired"
  | "ended";

export type ProviderConnectionTab = "attention" | "active" | "past";

/**
 * Maps a DB connection to the provider-facing display status.
 * Requires knowing if the connection is inbound (family → this provider).
 */
export function getProviderDisplayStatus(
  connection: Connection,
  isInbound: boolean
): ProviderDisplayStatus {
  switch (connection.status) {
    case "pending":
      return isInbound ? "new_request" : "pending_outbound";
    case "accepted":
      return "connected";
    case "declined":
      return "declined";
    case "expired":
    case "archived":
      if (connection.metadata?.ended) return "ended";
      if (connection.metadata?.withdrawn) return "withdrawn";
      return "expired";
    default:
      return isInbound ? "new_request" : "pending_outbound";
  }
}

/** Which tab a provider display status belongs to */
export function getProviderConnectionTab(
  displayStatus: ProviderDisplayStatus
): ProviderConnectionTab {
  switch (displayStatus) {
    case "new_request":
      return "attention";
    case "pending_outbound":
    case "connected":
      return "active";
    case "declined":
    case "withdrawn":
    case "expired":
    case "ended":
      return "past";
  }
}

export const PROVIDER_STATUS_CONFIG: Record<
  ProviderDisplayStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  new_request: {
    label: "New Request",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  pending_outbound: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  connected: {
    label: "Connected",
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
  ended: {
    label: "Ended",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
};

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
  ended: {
    label: "Ended",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
};
