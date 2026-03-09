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

  // Migrate old data on first run
  useEffect(() => {
    if (providerSlug && !migratedRef.current) {
      migrateQnAReadData(providerSlug);
      migratedRef.current = true;
    }
  }, [providerSlug]);

  // Read cached count from localStorage (set by Q&A page)
  useEffect(() => {
    if (!providerSlug) {
      setCount(0);
      return;
    }

    try {
      const cacheKey = `olera_qna_count_${providerSlug}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        setCount(parseInt(cached, 10) || 0);
      }
    } catch {
      // localStorage unavailable
    }
  }, [providerSlug]);

  // Listen for sync events from Q&A page (authoritative source)
  useEffect(() => {
    const syncHandler = (e: Event) => {
      const { count: syncedCount, providerSlug: syncSlug } = (e as CustomEvent).detail;
      if (typeof syncedCount === "number") {
        setCount(syncedCount);
        // Cache the count for future page loads
        if (syncSlug) {
          try {
            localStorage.setItem(`olera_qna_count_${syncSlug}`, String(syncedCount));
          } catch {
            // localStorage unavailable
          }
        }
      }
    };
    window.addEventListener("olera:qna-sync", syncHandler);
    return () => window.removeEventListener("olera:qna-sync", syncHandler);
  }, []);

  // Listen for new questions (increment count)
  useEffect(() => {
    const newHandler = () => setCount((c) => c + 1);
    window.addEventListener("olera:qna-new", newHandler);
    return () => window.removeEventListener("olera:qna-new", newHandler);
  }, []);

  // Cross-tab synchronization: update count when localStorage changes in another tab
  useEffect(() => {
    if (!providerSlug) return;
    const cacheKey = `olera_qna_count_${providerSlug}`;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue !== null) {
        setCount(parseInt(e.newValue, 10) || 0);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [providerSlug]);

  return count;
}
