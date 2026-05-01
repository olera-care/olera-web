/**
 * LocalStorage helpers for anonymous provider saves.
 *
 * Anonymous users can save unlimited providers locally with gentle nudges
 * to sign up at milestones. After authenticating, saves migrate to the database.
 */

const STORAGE_KEY = "olera_saved_providers";
const NUDGE_STATE_KEY = "olera_save_nudge_state";

// Milestones where we show the sign-up nudge toast
export const NUDGE_MILESTONES = [1, 3, 7, 15];

// Legacy limit kept for backwards compatibility (no longer enforced)
export const ANON_SAVE_LIMIT = 3;

export interface SavedProviderEntry {
  providerId: string;
  slug: string;
  name: string;
  location: string;
  careTypes: string[];
  image: string | null;
  rating?: number;
  savedAt: string;
}

function readStorage(): SavedProviderEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: SavedProviderEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getAnonSaves(): SavedProviderEntry[] {
  return readStorage();
}

export function getAnonSaveCount(): number {
  return readStorage().length;
}

export function isAnonSaved(providerId: string): boolean {
  return readStorage().some((e) => e.providerId === providerId);
}

/**
 * Add an anonymous save. No longer enforces a limit.
 * Returns the new count of saved providers (for milestone detection).
 */
export function addAnonSave(
  entry: Omit<SavedProviderEntry, "savedAt">
): number {
  const saves = readStorage();
  if (saves.some((e) => e.providerId === entry.providerId)) return saves.length; // already saved

  saves.push({ ...entry, savedAt: new Date().toISOString() });
  writeStorage(saves);
  return saves.length;
}

// ── Nudge State Management ──

interface NudgeState {
  lastShownAt: string | null;
  lastShownCount: number;
  dismissCount: number;
  // If user dismisses 3+ times in a session, back off
  sessionDismissCount: number;
}

function readNudgeState(): NudgeState {
  if (typeof window === "undefined") {
    return { lastShownAt: null, lastShownCount: 0, dismissCount: 0, sessionDismissCount: 0 };
  }
  try {
    const raw = localStorage.getItem(NUDGE_STATE_KEY);
    if (!raw) return { lastShownAt: null, lastShownCount: 0, dismissCount: 0, sessionDismissCount: 0 };
    const parsed = JSON.parse(raw);
    // Session dismiss count resets on page load (stored in memory only)
    return { ...parsed, sessionDismissCount: 0 };
  } catch {
    return { lastShownAt: null, lastShownCount: 0, dismissCount: 0, sessionDismissCount: 0 };
  }
}

function writeNudgeState(state: Omit<NudgeState, "sessionDismissCount">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NUDGE_STATE_KEY, JSON.stringify(state));
}

// In-memory session state (not persisted)
let sessionDismissCount = 0;

/**
 * Check if we should show the nudge for the current save count.
 * Returns true if this count is a milestone and we haven't shown yet.
 */
export function shouldShowNudge(currentCount: number): boolean {
  // Don't show if user has dismissed 3+ times this session (nudge fatigue)
  if (sessionDismissCount >= 3) return false;

  // Check if current count is a milestone
  if (!NUDGE_MILESTONES.includes(currentCount)) return false;

  const state = readNudgeState();

  // Don't show if we already showed for this milestone or higher
  if (state.lastShownCount >= currentCount) return false;

  return true;
}

/**
 * Record that we showed the nudge at a certain count.
 */
export function recordNudgeShown(count: number) {
  const state = readNudgeState();
  writeNudgeState({
    lastShownAt: new Date().toISOString(),
    lastShownCount: count,
    dismissCount: state.dismissCount,
  });
}

/**
 * Record that the user dismissed the nudge.
 */
export function recordNudgeDismissed() {
  sessionDismissCount++;
  const state = readNudgeState();
  writeNudgeState({
    ...state,
    dismissCount: state.dismissCount + 1,
  });
}

export function removeAnonSave(providerId: string): void {
  const saves = readStorage().filter((e) => e.providerId !== providerId);
  writeStorage(saves);
}

export function clearAnonSaves(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
