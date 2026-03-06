/**
 * Claim Session Manager
 *
 * Manages claim flow state with localStorage persistence for recovery.
 * Handles browser close, refresh, and OAuth redirects gracefully.
 */

const STORAGE_KEY = "olera_claim_session_v2";
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface ClaimSessionData {
  sessionId: string;
  providerId: string;
  providerSlug: string;
  providerName: string;
  emailHint?: string;
  step: "wizard" | "verifying" | "code-sent" | "verified" | "finalizing";
  verified: boolean;
  tokenValidated?: boolean;
  createdAt: number;
  expiresAt: number;
}

/**
 * Get or create a claim session
 */
export function getOrCreateClaimSession(
  providerId: string,
  providerSlug: string,
  providerName: string
): ClaimSessionData {
  const existing = getClaimSession();

  // If existing session matches this provider and isn't expired, return it
  if (existing && existing.providerId === providerId && Date.now() < existing.expiresAt) {
    return existing;
  }

  // Create new session
  const session: ClaimSessionData = {
    sessionId: crypto.randomUUID(),
    providerId,
    providerSlug,
    providerName,
    step: "wizard",
    verified: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
  };

  saveClaimSession(session);
  return session;
}

/**
 * Get current claim session from storage
 */
export function getClaimSession(): ClaimSessionData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session: ClaimSessionData = JSON.parse(stored);

    // Check expiry
    if (Date.now() > session.expiresAt) {
      clearClaimSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Save claim session to storage
 */
export function saveClaimSession(session: ClaimSessionData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    // Also store in sessionStorage for backward compatibility
    sessionStorage.setItem("olera_onboard_session", session.sessionId);
    sessionStorage.setItem("olera_onboard_provider_id", session.providerId);
    if (session.verified) {
      sessionStorage.setItem("olera_onboard_verified", "true");
    }
  } catch {
    // Storage unavailable
  }
}

/**
 * Update claim session
 */
export function updateClaimSession(updates: Partial<ClaimSessionData>): ClaimSessionData | null {
  const session = getClaimSession();
  if (!session) return null;

  const updated = { ...session, ...updates };
  saveClaimSession(updated);
  return updated;
}

/**
 * Mark session as verified
 */
export function markSessionVerified(emailHint?: string): ClaimSessionData | null {
  return updateClaimSession({
    step: "verified",
    verified: true,
    emailHint,
  });
}

/**
 * Mark session as token-validated (skipped code verification)
 */
export function markSessionTokenValidated(emailHint: string): ClaimSessionData | null {
  return updateClaimSession({
    step: "verified",
    verified: true,
    tokenValidated: true,
    emailHint,
  });
}

/**
 * Clear claim session
 */
export function clearClaimSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("olera_onboard_session");
    sessionStorage.removeItem("olera_onboard_verified");
    sessionStorage.removeItem("olera_onboard_provider_id");
  } catch {
    // Storage unavailable
  }
}

/**
 * Check if there's a recoverable session for a provider
 */
export function hasRecoverableSession(providerId: string): boolean {
  const session = getClaimSession();
  return session !== null && session.providerId === providerId && Date.now() < session.expiresAt;
}

/**
 * Get session ID (for API calls)
 */
export function getSessionId(): string {
  const session = getClaimSession();
  if (session) return session.sessionId;

  // Fallback to sessionStorage or generate new
  if (typeof window !== "undefined") {
    const existing = sessionStorage.getItem("olera_onboard_session");
    if (existing) return existing;
  }

  return crypto.randomUUID();
}
