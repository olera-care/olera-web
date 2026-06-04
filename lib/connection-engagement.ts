/**
 * Engagement-based categorization for the connections tracker.
 *
 * Unlike connection-temperature.ts (which tracks message-based state),
 * this module categorizes connections by provider engagement level:
 *
 *   New      → Lead sent, provider hasn't viewed it yet
 *   Viewed   → Provider opened the lead page
 *   Engaged  → Provider revealed contact info (opened drawer)
 *   Connected → Provider reached out (called, emailed, or messaged)
 *   Stuck    → No activity for 14+ days
 *
 * This matches the actual provider journey rather than assuming
 * a messaging-based workflow.
 */

export type EngagementLevel =
  | "new"
  | "viewed"
  | "engaged"
  | "connected"
  | "stuck";

export interface EngagementData {
  emailClicked: boolean;
  leadOpened: boolean;
  contactRevealed: boolean;
  phoneClicked: boolean;
  emailLinkClicked: boolean;
  providerMessaged: boolean;
  lastActivityAt: string | null;
}

export interface EngagementResult {
  level: EngagementLevel;
  label: string;
  /** Days since last activity (any engagement event or connection creation) */
  daysSinceActivity: number;
  /** Whether this connection is going stale */
  isStale: boolean;
}

// ── Thresholds ──

const DAY_MS = 24 * 60 * 60 * 1000;

/** Connections with no activity beyond this are "stuck" */
export const STUCK_THRESHOLD_DAYS = 14;

// ── Labels ──

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  new: "New",
  viewed: "Viewed",
  engaged: "Engaged",
  connected: "Connected",
  stuck: "Stuck",
};

export const ENGAGEMENT_CONFIG: Record<
  EngagementLevel,
  { label: string; dot: string; text: string; description: string }
> = {
  new: {
    label: "New",
    dot: "bg-blue-400",
    text: "text-blue-700",
    description: "Lead sent, provider hasn't viewed yet",
  },
  viewed: {
    label: "Viewed",
    dot: "bg-amber-400",
    text: "text-amber-700",
    description: "Provider opened the lead",
  },
  engaged: {
    label: "Engaged",
    dot: "bg-orange-400",
    text: "text-orange-700",
    description: "Provider revealed contact info",
  },
  connected: {
    label: "Connected",
    dot: "bg-emerald-400",
    text: "text-emerald-700",
    description: "Provider reached out to family",
  },
  stuck: {
    label: "Stuck",
    dot: "bg-gray-400",
    text: "text-gray-500",
    description: "No activity for 14+ days",
  },
};

/**
 * Calculate the engagement level for a connection based on provider activity.
 *
 * Hierarchy (highest wins):
 *   1. Connected - provider messaged, called, or emailed
 *   2. Engaged - provider revealed contact info
 *   3. Viewed - provider opened the lead
 *   4. New - no engagement yet
 *   5. Stuck - any of above but stale (14+ days)
 */
export function getEngagementLevel(
  engagement: EngagementData,
  connectionCreatedAt: string,
  now: number = Date.now()
): EngagementResult {
  // Calculate staleness
  const lastActivity = engagement.lastActivityAt
    ? new Date(engagement.lastActivityAt).getTime()
    : new Date(connectionCreatedAt).getTime();
  const daysSinceActivity = Math.floor((now - lastActivity) / DAY_MS);
  const isStale = daysSinceActivity >= STUCK_THRESHOLD_DAYS;

  // Determine base level (before stuck check)
  let baseLevel: EngagementLevel;

  if (
    engagement.providerMessaged ||
    engagement.phoneClicked ||
    engagement.emailLinkClicked
  ) {
    // Provider reached out - this is success
    baseLevel = "connected";
  } else if (engagement.contactRevealed) {
    // Provider revealed contact info - actively interested
    baseLevel = "engaged";
  } else if (engagement.leadOpened) {
    // Provider viewed the lead - passive interest
    baseLevel = "viewed";
  } else {
    // No engagement yet
    baseLevel = "new";
  }

  // Connected connections don't become stuck (they're successful)
  // Other levels become stuck if stale
  const level: EngagementLevel =
    baseLevel !== "connected" && isStale ? "stuck" : baseLevel;

  return {
    level,
    label: ENGAGEMENT_LABELS[level],
    daysSinceActivity,
    isStale,
  };
}

/**
 * Check if a connection is considered successful.
 * Connected = provider took action to reach the family.
 */
export function isConnected(engagement: EngagementData): boolean {
  return (
    engagement.providerMessaged ||
    engagement.phoneClicked ||
    engagement.emailLinkClicked
  );
}

/**
 * Sort priority for the connections list.
 * Lower = more urgent / needs attention.
 *
 * Priority:
 *   1. Engaged (hot leads - provider interested but hasn't reached out)
 *   2. Viewed (warm - they looked)
 *   3. New (cold - need to nudge)
 *   4. Stuck (stale - last resort)
 *   5. Connected (success - just monitoring)
 */
export const ENGAGEMENT_PRIORITY: Record<EngagementLevel, number> = {
  engaged: 0,   // Hot - prioritize these
  viewed: 1,    // Warm
  new: 2,       // Cold
  stuck: 3,     // Stale
  connected: 4, // Success - lowest priority (good problem to have)
};
