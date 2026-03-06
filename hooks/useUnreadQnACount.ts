"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Migrate old unscoped localStorage key to new profile-scoped key.
 * Only runs once per provider slug.
 */
function migrateQnAReadData(providerSlug: string): void {
  const OLD_KEY = "olera_qna_read";
  const newKey = `olera_qna_read_${providerSlug}`;
  const migrationFlag = `olera_qna_migrated_${providerSlug}`;

  try {
    // Skip if already migrated
    if (localStorage.getItem(migrationFlag)) return;

    const oldData = localStorage.getItem(OLD_KEY);
    if (oldData) {
      const existingNew = localStorage.getItem(newKey);
      if (!existingNew) {
        // Migrate old data to new key
        localStorage.setItem(newKey, oldData);
      } else {
        // Merge old and new data
        const oldIds: string[] = JSON.parse(oldData);
        const newIds: string[] = JSON.parse(existingNew);
        const merged = [...new Set([...oldIds, ...newIds])];
        localStorage.setItem(newKey, JSON.stringify(merged));
      }
    }
    // Mark as migrated
    localStorage.setItem(migrationFlag, "1");
  } catch {
    // localStorage unavailable
  }
}

/**
 * Lightweight hook that counts unread pending Q&A questions for a provider.
 * Fetches pending questions for the given provider slug,
 * checks against profile-scoped localStorage, and returns the count.
 *
 * Listens for "olera:qna-read" custom events so the count updates
 * immediately when a question is viewed in the Q&A page.
 */
export function useUnreadQnACount(providerSlug: string | null): number {
  const [count, setCount] = useState(0);
  const migratedRef = useRef(false);
  // Track if Q&A page has synced the authoritative count
  const syncedRef = useRef(false);

  // Migrate old data on first run
  useEffect(() => {
    if (providerSlug && !migratedRef.current) {
      migrateQnAReadData(providerSlug);
      migratedRef.current = true;
    }
  }, [providerSlug]);

  const recount = useCallback(() => {
    // If Q&A page has synced, trust that count instead of re-querying
    if (syncedRef.current) return;

    if (!providerSlug) {
      setCount(0);
      return;
    }

    // Use provider-scoped localStorage key to avoid cross-user conflicts
    const qnaReadKey = `olera_qna_read_${providerSlug}`;
    let readIds = new Set<string>();
    try {
      const stored = localStorage.getItem(qnaReadKey);
      if (stored) readIds = new Set(JSON.parse(stored));
    } catch {
      // localStorage may be unavailable
    }

    if (!isSupabaseConfigured()) {
      // No Supabase configured - return 0
      setCount(0);
      return;
    }

    (async () => {
      // Double-check sync flag before setting (async operation may complete after sync)
      if (syncedRef.current) return;

      const supabase = createClient();

      // Fetch pending questions for this provider
      const { data, error } = await supabase
        .from("provider_questions")
        .select("id")
        .eq("provider_id", providerSlug)
        .eq("status", "pending");

      if (syncedRef.current) return; // Check again after await

      if (error) {
        console.error("Failed to fetch Q&A count:", error);
        setCount(0);
        return;
      }

      if (!data || data.length === 0) {
        setCount(0);
        return;
      }

      // Count questions that haven't been read
      const unreadCount = data.filter((q) => !readIds.has(q.id)).length;
      setCount(unreadCount);
    })();
  }, [providerSlug]);

  // Initial count
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a question is marked as read, or a new question is submitted
  useEffect(() => {
    const handler = () => {
      // Reset sync flag so we re-query (new question submitted)
      syncedRef.current = false;
      recount();
    };
    window.addEventListener("olera:qna-read", handler);
    window.addEventListener("olera:qna-new", handler);
    return () => {
      window.removeEventListener("olera:qna-read", handler);
      window.removeEventListener("olera:qna-new", handler);
    };
  }, [recount]);

  // Sync event from Q&A page - this is the authoritative count
  useEffect(() => {
    const syncHandler = (e: Event) => {
      const { count: syncedCount } = (e as CustomEvent).detail;
      if (typeof syncedCount === "number") {
        syncedRef.current = true; // Mark as synced so recount is skipped
        setCount(syncedCount);
      }
    };
    window.addEventListener("olera:qna-sync", syncHandler);
    return () => window.removeEventListener("olera:qna-sync", syncHandler);
  }, []);

  return count;
}
