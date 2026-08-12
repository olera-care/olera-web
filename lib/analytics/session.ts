const COOKIE_NAME = "olera_session";
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;
const VISIT_STORAGE_KEY = "olera_growth_visit";
const VISIT_TIMEOUT_MS = 30 * 60 * 1000;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${TTL_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read or create the anonymous session id stored in the `olera_session` cookie.
 * Sliding 30-day TTL — every read refreshes the expiry.
 *
 * Anonymous, no PII. Disclosed in /privacy.
 */
export function getOrCreateSessionId(): string {
  const existing = readCookie(COOKIE_NAME);
  if (existing) {
    writeCookie(COOKIE_NAME, existing);
    return existing;
  }
  const fresh = newSessionId();
  writeCookie(COOKIE_NAME, fresh);
  return fresh;
}

/**
 * Return the short-lived visit identifier used by growth attribution.
 *
 * `getOrCreateSessionId` predates attribution and is intentionally a sliding
 * 30-day anonymous-person identifier. A conversion rate needs a visit-shaped
 * denominator, so this id rotates after 30 minutes of inactivity. localStorage
 * lets an internal navigation (and another tab in the same research visit)
 * keep the same visit without changing the legacy cookie contract.
 */
export function getOrCreateVisitId(): string {
  if (typeof window === "undefined") return "server";
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as { id?: string; lastActivity?: number } : null;
    const valid = parsed?.id && typeof parsed.lastActivity === "number" && now - parsed.lastActivity < VISIT_TIMEOUT_MS;
    const id = valid ? parsed.id as string : newSessionId();
    window.localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify({ id, lastActivity: now }));
    return id;
  } catch {
    // Private browsing/storage denial: sessionStorage is a safe best-effort
    // fallback and still survives normal same-tab navigation.
    try {
      const existing = window.sessionStorage.getItem(VISIT_STORAGE_KEY);
      if (existing) return existing;
      const id = newSessionId();
      window.sessionStorage.setItem(VISIT_STORAGE_KEY, id);
      return id;
    } catch {
      return newSessionId();
    }
  }
}
