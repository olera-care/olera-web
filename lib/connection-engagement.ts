/**
 * Engagement-based categorization for the connections tracker.
 *
 * Unlike connection-temperature.ts (which tracks message-based state),
 * this module categorizes connections by provider engagement level:
 *
 *   New        → Lead sent, provider hasn't viewed it yet
 *   Viewed     → Provider opened the lead page
 *   Engaged    → Provider revealed contact info (opened drawer)
 *   Connected  → Provider reached out (called, emailed, or messaged)
 *   Stuck      → No provider activity for 10+ days, awaiting re-engagement
 *   Needs Call → Re-engagement email sent, still no response (14+ days)
 *
 * This matches the actual provider journey rather than assuming
 * a messaging-based workflow.
 */

export type EngagementLevel =
  | "new"
  | "viewed"
  | "engaged"
  | "connected"
  | "stuck"
  | "needs_call";

/**
 * Family engagement levels - parallel to provider engagement but from family's perspective.
 *
 *   New       → Provider hasn't responded yet (family is waiting)
 *   Awaiting  → Provider responded, family hasn't replied (ball in family's court)
 *   Connected → Family replied at least once (conversation active)
 *   Stuck     → No family activity for 14+ days
 *   Needs Call → No family activity for 24+ days
 */
export type FamilyEngagementLevel =
  | "new"
  | "awaiting"
  | "connected"
  | "stuck"
  | "needs_call";

export interface EngagementData {
  emailClicked: boolean;
  leadOpened: boolean;
  contactRevealed: boolean;
  phoneClicked: boolean;
  emailLinkClicked: boolean;
  continueInInbox: boolean;
  providerMessaged: boolean;
  /** Provider explicitly marked the lead as "Replied" in their drawer */
  markedReplied: boolean;
  /** Provider archived with reason "already_connected" */
  alreadyConnected: boolean;
  lastActivityAt: string | null;
  /** Set by cron when all automated outreach is exhausted */
  needsCall?: boolean;
}

/**
 * Family engagement data - tracks family's actions after provider responds.
 */
export interface FamilyEngagementData {
  /** Provider sent a real message (non-auto-reply) */
  providerResponded: boolean;
  /** Timestamp when provider first responded */
  providerRespondedAt: string | null;
  /** Family sent a message AFTER provider responded */
  familyReplied: boolean;
  /** Number of family messages after provider responded */
  familyMessageCount: number;
  /** Family's last activity timestamp (their last message, not thread's last message) */
  lastFamilyActivityAt: string | null;
  /** Number of times family has been nudged */
  familyNudgeCount: number;
}

export interface EngagementResult {
  level: EngagementLevel;
  label: string;
  /** Days since last activity (any engagement event or connection creation) */
  daysSinceActivity: number;
  /** Whether this connection is going stale */
  isStale: boolean;
}

export interface FamilyEngagementResult {
  level: FamilyEngagementLevel;
  label: string;
  /** Days since last family activity */
  daysSinceActivity: number;
  /** Whether the family engagement is going stale */
  isStale: boolean;
}

// ── Thresholds ──

const DAY_MS = 24 * 60 * 60 * 1000;

// Provider engagement thresholds (compressed for faster human intervention)
/** Provider connections with no activity beyond this are "stuck" */
export const PROVIDER_STUCK_THRESHOLD_DAYS = 10;
/** Provider connections stuck beyond this need manual call intervention */
export const PROVIDER_NEEDS_CALL_THRESHOLD_DAYS = 14;

// Family engagement thresholds (more lenient)
/** Family connections with no activity beyond this are "stuck" */
export const FAMILY_STUCK_THRESHOLD_DAYS = 14;
/** Family connections stuck beyond this need manual call intervention */
export const FAMILY_NEEDS_CALL_THRESHOLD_DAYS = 24;

// Legacy exports for backwards compatibility (use provider thresholds)
/** @deprecated Use PROVIDER_STUCK_THRESHOLD_DAYS or FAMILY_STUCK_THRESHOLD_DAYS */
export const STUCK_THRESHOLD_DAYS = PROVIDER_STUCK_THRESHOLD_DAYS;
/** @deprecated Use PROVIDER_NEEDS_CALL_THRESHOLD_DAYS or FAMILY_NEEDS_CALL_THRESHOLD_DAYS */
export const NEEDS_CALL_THRESHOLD_DAYS = PROVIDER_NEEDS_CALL_THRESHOLD_DAYS;

// ── Labels ──

export const ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  new: "New",
  viewed: "Viewed",
  engaged: "Engaged",
  connected: "Connected",
  stuck: "Stuck",
  needs_call: "Needs Call",
};

export const FAMILY_ENGAGEMENT_LABELS: Record<FamilyEngagementLevel, string> = {
  new: "New",
  awaiting: "Awaiting",
  connected: "Connected",
  stuck: "Stuck",
  needs_call: "Needs Call",
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
    description: "No activity for 10+ days",
  },
  needs_call: {
    label: "Needs Call",
    dot: "bg-red-400",
    text: "text-red-600",
    description: "Re-engagement failed, requires manual call",
  },
};

export const FAMILY_ENGAGEMENT_CONFIG: Record<
  FamilyEngagementLevel,
  { label: string; dot: string; text: string; description: string }
> = {
  new: {
    label: "New",
    dot: "bg-blue-400",
    text: "text-blue-700",
    description: "Provider hasn't responded yet",
  },
  awaiting: {
    label: "Awaiting",
    dot: "bg-amber-400",
    text: "text-amber-700",
    description: "Provider responded, awaiting family reply",
  },
  connected: {
    label: "Connected",
    dot: "bg-emerald-400",
    text: "text-emerald-700",
    description: "Family replied to provider",
  },
  stuck: {
    label: "Stuck",
    dot: "bg-gray-400",
    text: "text-gray-500",
    description: "No family activity for 14+ days",
  },
  needs_call: {
    label: "Needs Call",
    dot: "bg-red-400",
    text: "text-red-600",
    description: "No family activity for 24+ days",
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
 *   5. Stuck - any of above but stale (10+ days)
 *   6. Needs Call - stuck beyond 14 days OR marked by cron as needing manual intervention
 */
export function getEngagementLevel(
  engagement: EngagementData,
  connectionCreatedAt: string,
  now: number = Date.now()
): EngagementResult {
  // Calculate staleness
  // Use the MORE RECENT of: provider's last activity OR connection creation
  // A connection can't be "stale" before it was created!
  const connectionCreatedTime = new Date(connectionCreatedAt).getTime();
  const providerLastActivity = engagement.lastActivityAt
    ? new Date(engagement.lastActivityAt).getTime()
    : connectionCreatedTime;
  // If provider's activity is older than this connection, use connection creation time
  const lastActivity = Math.max(providerLastActivity, connectionCreatedTime);
  const daysSinceActivity = Math.floor((now - lastActivity) / DAY_MS);
  const isStale = daysSinceActivity >= PROVIDER_STUCK_THRESHOLD_DAYS;
  const needsCallByTime = daysSinceActivity >= PROVIDER_NEEDS_CALL_THRESHOLD_DAYS;

  // Determine base level first (before applying time-based rules)
  let baseLevel: EngagementLevel;

  if (
    engagement.providerMessaged ||
    engagement.phoneClicked ||
    engagement.emailLinkClicked ||
    engagement.markedReplied ||    // Provider explicitly marked as "Replied"
    engagement.alreadyConnected    // Provider archived with "Already connected" reason
  ) {
    // Provider reached out - this is success
    baseLevel = "connected";
  } else if (engagement.contactRevealed || engagement.continueInInbox) {
    // Provider revealed contact info or clicked to continue in inbox - actively interested
    baseLevel = "engaged";
  } else if (engagement.leadOpened) {
    // Provider viewed the lead - passive interest
    baseLevel = "viewed";
  } else {
    // No engagement yet
    baseLevel = "new";
  }

  // Determine final engagement level (purely time-based for UI tabs)
  // - Connected: provider reached out (success) - never becomes stuck/needs_call
  // - Needs Call: ANY non-connected 14+ day old connection (regardless of cron flag)
  // - Viewed/Engaged: provider showed interest, keep in their tab until 14 days
  // - Stuck: no engagement for 10+ days (only for "new" connections)
  let level: EngagementLevel;
  if (baseLevel === "connected") {
    level = "connected";
  } else if (needsCallByTime) {
    // Any non-connected 14+ day old connection needs manual call
    // This is purely time-based - no dependency on cron's needsCall flag
    level = "needs_call";
  } else if (baseLevel === "viewed" || baseLevel === "engaged") {
    // Provider showed interest - keep them in their tab until 14 days
    level = baseLevel;
  } else if (isStale) {
    // 10+ days with NO engagement → stuck (awaiting re-engagement email)
    level = "stuck";
  } else {
    level = baseLevel;
  }

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
    engagement.emailLinkClicked ||
    engagement.markedReplied ||
    engagement.alreadyConnected
  );
}

/**
 * Sort priority for the connections list.
 * Lower = more urgent / needs attention.
 *
 * Priority:
 *   1. Needs Call (requires immediate manual intervention)
 *   2. Engaged (hot leads - provider interested but hasn't reached out)
 *   3. Viewed (warm - they looked)
 *   4. New (cold - need to nudge)
 *   5. Stuck (stale - awaiting re-engagement)
 *   6. Connected (success - just monitoring)
 */
export const ENGAGEMENT_PRIORITY: Record<EngagementLevel, number> = {
  needs_call: 0, // Urgent - requires manual call
  engaged: 1,    // Hot - prioritize these
  viewed: 2,     // Warm
  new: 3,        // Cold
  stuck: 4,      // Stale - awaiting re-engagement
  connected: 5,  // Success - lowest priority (good problem to have)
};

/**
 * Sort priority for family engagement (family perspective).
 * Lower = more urgent / needs attention.
 */
export const FAMILY_ENGAGEMENT_PRIORITY: Record<FamilyEngagementLevel, number> = {
  needs_call: 0, // Urgent - family unresponsive 24+ days
  awaiting: 1,   // Hot - provider responded, family hasn't
  new: 2,        // Cold - waiting on provider
  stuck: 3,      // Stale - family went silent
  connected: 4,  // Success - family replied
};

/**
 * Calculate family engagement level based on family's activity after provider responds.
 *
 * Key difference from provider engagement:
 * - Family engagement tracking starts AFTER provider responds
 * - Until provider responds, connection shows as "new" (same as provider side)
 *
 * Hierarchy:
 *   1. Provider hasn't responded yet → "new"
 *   2. Provider responded, family hasn't replied → "awaiting"
 *   3. Family replied at least once → "connected" (success state)
 *   4. No family activity for 14+ days (not connected) → "stuck"
 *   5. No family activity for 24+ days → "needs_call"
 */
export function getFamilyEngagementLevel(
  data: FamilyEngagementData,
  connectionCreatedAt: string,
  now: number = Date.now()
): FamilyEngagementResult {
  // If provider hasn't responded yet, escalate to admin based on time
  // This ensures provider-silent connections don't sit in "new" forever
  if (!data.providerResponded) {
    const connectionCreatedTime = new Date(connectionCreatedAt).getTime();
    const daysSinceCreation = Math.floor((now - connectionCreatedTime) / DAY_MS);

    // Provider-silent connections should escalate:
    // - 24+ days → needs_call (admin intervention required)
    // - 14+ days → stuck (re-engagement failed, heading to needs_call)
    // - <14 days → new (normal flow, emails #5 and #7 will handle)
    let level: FamilyEngagementLevel;
    let isStale: boolean;

    if (daysSinceCreation >= FAMILY_NEEDS_CALL_THRESHOLD_DAYS) {
      level = "needs_call";
      isStale = true;
    } else if (daysSinceCreation >= FAMILY_STUCK_THRESHOLD_DAYS) {
      level = "stuck";
      isStale = true;
    } else {
      level = "new";
      isStale = false;
    }

    return {
      level,
      label: FAMILY_ENGAGEMENT_LABELS[level],
      daysSinceActivity: daysSinceCreation,
      isStale,
    };
  }

  // Calculate staleness from family's last activity
  // Use provider response time as baseline (not connection creation) since family
  // engagement only starts after provider responds
  const providerRespondedTime = data.providerRespondedAt
    ? new Date(data.providerRespondedAt).getTime()
    : new Date(connectionCreatedAt).getTime();
  const familyLastActivity = data.lastFamilyActivityAt
    ? new Date(data.lastFamilyActivityAt).getTime()
    : providerRespondedTime;
  // Use the more recent of: family's last activity OR when provider responded
  // (family can't be stale before provider even responded)
  const lastActivity = Math.max(familyLastActivity, providerRespondedTime);
  const daysSinceActivity = Math.floor((now - lastActivity) / DAY_MS);
  const isStale = daysSinceActivity >= FAMILY_STUCK_THRESHOLD_DAYS;
  const needsCallByTime = daysSinceActivity >= FAMILY_NEEDS_CALL_THRESHOLD_DAYS;

  // Determine base level
  let baseLevel: FamilyEngagementLevel;

  if (data.familyReplied) {
    // Family replied at least once - success state
    baseLevel = "connected";
  } else {
    // Provider responded but family hasn't replied
    baseLevel = "awaiting";
  }

  // Connected doesn't become stuck (success state)
  let level: FamilyEngagementLevel;
  if (baseLevel === "connected") {
    level = "connected";
  } else if (needsCallByTime) {
    level = "needs_call";
  } else if (isStale) {
    level = "stuck";
  } else {
    level = baseLevel;
  }

  return {
    level,
    label: FAMILY_ENGAGEMENT_LABELS[level],
    daysSinceActivity,
    isStale,
  };
}
