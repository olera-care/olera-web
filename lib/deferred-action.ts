import type { DeferredAction } from "@/lib/types";
import { validateReturnUrl } from "@/lib/validation";

const STORAGE_KEY = "olera_deferred_action";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Store a deferred action to be executed after auth completes.
 * Uses localStorage (not sessionStorage) so it persists when magic links
 * open in a new tab.
 */
export function setDeferredAction(action: Omit<DeferredAction, "createdAt">) {
  if (typeof window === "undefined") return;

  // Validate returnUrl before storing to prevent open redirect attacks
  const safeReturnUrl = validateReturnUrl(action.returnUrl, "/browse");

  const entry: DeferredAction = {
    ...action,
    returnUrl: safeReturnUrl,
    createdAt: new Date().toISOString(),
  };

  console.log("[deferred-action] SET:", entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function getDeferredAction(): DeferredAction | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  console.log("[deferred-action] GET raw:", raw);
  if (!raw) return null;

  try {
    const entry: DeferredAction = JSON.parse(raw);
    const age = Date.now() - new Date(entry.createdAt).getTime();

    // Expire stale entries
    if (age > MAX_AGE_MS) {
      console.log("[deferred-action] Expired, clearing");
      clearDeferredAction();
      return null;
    }

    // Validate returnUrl on read as defense-in-depth
    // (in case storage was tampered with or old entries exist)
    entry.returnUrl = validateReturnUrl(entry.returnUrl, "/browse");

    return entry;
  } catch {
    console.log("[deferred-action] Parse error, clearing");
    clearDeferredAction();
    return null;
  }
}

export function clearDeferredAction() {
  if (typeof window === "undefined") return;
  console.log("[deferred-action] CLEAR called from:", new Error().stack);
  localStorage.removeItem(STORAGE_KEY);
}
