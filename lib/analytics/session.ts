const COOKIE_NAME = "olera_session";
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

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
