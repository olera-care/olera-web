"use client";

/**
 * RecentMoves — track row IDs that just had a Log action applied.
 *
 * E2: when admin logs an outcome that moves the row across tabs
 * (e.g. voicemail → row jumps from Calls to Replies), the destination
 * tab briefly highlights the moved row so admin SEES where the work
 * landed. Implemented as a context-level state set so navigation
 * across tabs preserves the highlight signal as long as the admin
 * stays in the /admin/* layout tree.
 *
 * Each markMoved() call adds the row id to a transient Set + queues
 * a 5-second auto-clear. Consumers read via isRecent(id) and apply
 * their own highlight class. No CSS strategy is dictated here.
 *
 * Falls back to no-op when called outside the provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface RecentMovesApi {
  markMoved: (rowId: string) => void;
  isRecent: (rowId: string) => boolean;
}

const HIGHLIGHT_MS = 5000;

const NOOP_API: RecentMovesApi = {
  markMoved: () => {},
  isRecent: () => false,
};

const RecentMovesContext = createContext<RecentMovesApi | null>(null);

export function RecentMovesProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<Set<string>>(new Set());
  // Track per-row timers so repeated marks reset the window instead of
  // stacking multiple clears.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const markMoved = useCallback<RecentMovesApi["markMoved"]>((rowId) => {
    if (!rowId) return;
    setRecent((prev) => {
      if (prev.has(rowId)) return prev;
      const next = new Set(prev);
      next.add(rowId);
      return next;
    });
    const existing = timersRef.current.get(rowId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setRecent((prev) => {
        if (!prev.has(rowId)) return prev;
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      timersRef.current.delete(rowId);
    }, HIGHLIGHT_MS);
    timersRef.current.set(rowId, timer);
  }, []);

  const isRecent = useCallback<RecentMovesApi["isRecent"]>(
    (rowId) => recent.has(rowId),
    [recent],
  );

  return (
    <RecentMovesContext.Provider value={{ markMoved, isRecent }}>
      {children}
    </RecentMovesContext.Provider>
  );
}

export function useRecentMoves(): RecentMovesApi {
  return useContext(RecentMovesContext) ?? NOOP_API;
}
