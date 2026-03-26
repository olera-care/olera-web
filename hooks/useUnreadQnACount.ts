"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread pending Q&A questions for a provider.
 * Fetches pending questions from the database and checks metadata.read_by
 * for read tracking, with localStorage fallback for backwards compatibility.
 *
 * Features:
 * - Database-backed read tracking via metadata.read_by[profileId]
 * - Fetches from database on mount
 * - Listens for "olera:qna-read" custom events for immediate updates
 * - Listens for "olera:qna-sync" for page-level syncs
 * - Cross-tab synchronization via storage events
 * - localStorage fallback for backwards compatibility
 */
export function useUnreadQnACount(providerSlug: string | null, profileId?: string | null): number {
  const [count, setCount] = useState(0);
  const fetchingRef = useRef(false);

  // Create stable key for dependencies
  const paramKey = `${providerSlug || ""}:${profileId || ""}`;

  const recount = useCallback(() => {
    if (!providerSlug || fetchingRef.current) return;

    if (!isSupabaseConfigured()) {
      setCount(0);
      return;
    }

    fetchingRef.current = true;

    (async () => {
      try {
        const supabase = createClient();

        // Fetch pending (unanswered) questions for this provider with metadata for read tracking
        const { data: questions } = await supabase
          .from("provider_questions")
          .select("id, metadata")
          .eq("provider_id", providerSlug)
          .eq("status", "pending");

        if (!questions || questions.length === 0) {
          setCount(0);
          try {
            localStorage.setItem(`olera_qna_count_${profileId || providerSlug}`, "0");
          } catch { /* localStorage unavailable */ }
          return;
        }

        // Get localStorage read IDs as fallback for backwards compatibility
        let localStorageReadIds = new Set<string>();
        try {
          // Check both profileId-based and slug-based keys for migration compatibility
          const keys = [profileId, providerSlug].filter(Boolean);
          for (const key of keys) {
            const stored = localStorage.getItem(`olera_qna_read_${key}`);
            if (stored) {
              const parsed: string[] = JSON.parse(stored);
              parsed.forEach((id) => localStorageReadIds.add(id));
            }
          }
        } catch { /* localStorage unavailable */ }

        // Count unread: question is unread if neither database nor localStorage shows it as read
        let unreadCount = 0;
        for (const q of questions) {
          const meta = (q.metadata as Record<string, unknown>) || {};
          const readBy = (meta.read_by as Record<string, string>) || {};

          // Check database read_by (primary - use profileId if available)
          const isReadInDb = profileId ? !!readBy[profileId] : false;

          // Check localStorage (fallback)
          const isReadInLocalStorage = localStorageReadIds.has(q.id);

          if (!isReadInDb && !isReadInLocalStorage) {
            unreadCount++;
          }
        }

        setCount(unreadCount);

        // Cache the count
        try {
          localStorage.setItem(`olera_qna_count_${profileId || providerSlug}`, String(unreadCount));
        } catch { /* localStorage unavailable */ }
      } catch (err) {
        console.error("[useUnreadQnACount] Error:", err);
        setCount(0);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [paramKey, providerSlug, profileId]);

  // Initial count from database
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a question is marked as read
  useEffect(() => {
    const handler = () => {
      setTimeout(recount, 100);
    };
    window.addEventListener("olera:qna-read", handler);
    return () => window.removeEventListener("olera:qna-read", handler);
  }, [recount]);

  // Listen for sync events from Q&A page
  useEffect(() => {
    const syncHandler = (e: Event) => {
      const { count: syncedCount, providerSlug: syncSlug } = (e as CustomEvent).detail;
      if (syncSlug === providerSlug && typeof syncedCount === "number") {
        setCount(syncedCount);
        try {
          localStorage.setItem(`olera_qna_count_${providerSlug}`, String(syncedCount));
        } catch { /* localStorage unavailable */ }
      }
    };
    window.addEventListener("olera:qna-sync", syncHandler);
    return () => window.removeEventListener("olera:qna-sync", syncHandler);
  }, [providerSlug]);

  // Listen for new questions (increment count)
  useEffect(() => {
    const newHandler = () => setCount((c) => c + 1);
    window.addEventListener("olera:qna-new", newHandler);
    return () => window.removeEventListener("olera:qna-new", newHandler);
  }, []);

  // Cross-tab synchronization
  useEffect(() => {
    if (!providerSlug) return;
    const readKey = `olera_qna_read_${providerSlug}`;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === readKey) {
        recount();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [providerSlug, recount]);

  return count;
}

/**
 * Mark a question as read in the database (metadata.read_by) and localStorage fallback.
 * Dispatches olera:qna-read event for immediate UI updates.
 */
export async function markQuestionAsRead(questionId: string, profileId: string): Promise<void> {
  // Optimistically update localStorage for immediate feedback
  const readKey = `olera_qna_read_${profileId}`;
  try {
    const stored = localStorage.getItem(readKey);
    const readIds: string[] = stored ? JSON.parse(stored) : [];
    if (!readIds.includes(questionId)) {
      readIds.push(questionId);
      localStorage.setItem(readKey, JSON.stringify(readIds));
    }
  } catch { /* localStorage unavailable */ }

  // Dispatch event for immediate UI updates
  window.dispatchEvent(new CustomEvent("olera:qna-read"));

  // Persist to database
  try {
    await fetch("/api/provider/questions/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
  } catch (err) {
    console.error("[markQuestionAsRead] Failed to persist to database:", err);
    // localStorage fallback already in place
  }
}

/**
 * Migrate localStorage read data from slug-based key to profileId-based key.
 * This is a one-time migration for backwards compatibility.
 */
export function migrateQnaReadData(providerSlug: string, profileId: string): void {
  if (!providerSlug || !profileId || providerSlug === profileId) return;
  try {
    const oldKey = `olera_qna_read_${providerSlug}`;
    const newKey = `olera_qna_read_${profileId}`;
    const oldData = localStorage.getItem(oldKey);
    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
    }
  } catch { /* localStorage unavailable */ }
}
