"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread reviews for a provider.
 * Fetches published reviews for the given provider ID,
 * checks against profile-scoped localStorage, and returns the count.
 *
 * Features:
 * - Listens for "olera:reviews-read" custom events for immediate updates
 * - Listens for "storage" events for cross-tab synchronization
 * - Auto-marks all reviews as read when the Reviews page dispatches sync event
 */
export function useUnreadReviewsCount(providerId: string | null): number {
  const [count, setCount] = useState(0);
  const fetchingRef = useRef(false);

  const recount = useCallback(() => {
    if (!providerId || fetchingRef.current) return;

    if (!isSupabaseConfigured()) {
      setCount(0);
      return;
    }

    fetchingRef.current = true;

    (async () => {
      try {
        const supabase = createClient();

        // Fetch reviews with metadata for read tracking
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, metadata")
          .eq("provider_id", providerId)
          .eq("status", "published");

        if (!reviews || reviews.length === 0) {
          setCount(0);
          return;
        }

        // Get localStorage read IDs as fallback for backwards compatibility
        let localStorageReadIds = new Set<string>();
        try {
          const stored = localStorage.getItem(`olera_reviews_read_${providerId}`);
          if (stored) {
            const parsed: string[] = JSON.parse(stored);
            parsed.forEach((id) => localStorageReadIds.add(id));
          }
        } catch { /* localStorage unavailable */ }

        // Count unread: review is unread if neither database nor localStorage shows it as read
        let unreadCount = 0;
        for (const r of reviews) {
          const meta = (r.metadata as Record<string, unknown>) || {};
          const readBy = (meta.read_by as Record<string, string>) || {};

          // Check database read_by (primary)
          const isReadInDb = !!readBy[providerId];

          // Check localStorage (fallback)
          const isReadInLocalStorage = localStorageReadIds.has(r.id);

          if (!isReadInDb && !isReadInLocalStorage) {
            unreadCount++;
          }
        }

        setCount(unreadCount);
      } catch (err) {
        console.error("[useUnreadReviewsCount] Error:", err);
        setCount(0);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [providerId]);

  // Initial count - always recount when providerId changes
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a review is marked as read
  useEffect(() => {
    const handler = () => recount();
    window.addEventListener("olera:reviews-read", handler);
    return () => window.removeEventListener("olera:reviews-read", handler);
  }, [recount]);

  // Listen for sync events from Reviews page (authoritative source)
  useEffect(() => {
    const syncHandler = (e: Event) => {
      const { count: syncedCount, providerId: syncProviderId } = (e as CustomEvent).detail;
      if (syncProviderId === providerId && typeof syncedCount === "number") {
        setCount(syncedCount);
        // Cache the count for future page loads
        try {
          localStorage.setItem(`olera_reviews_count_${providerId}`, String(syncedCount));
        } catch {
          // localStorage unavailable
        }
      }
    };
    window.addEventListener("olera:reviews-sync", syncHandler);
    return () => window.removeEventListener("olera:reviews-sync", syncHandler);
  }, [providerId]);

  // Cross-tab synchronization: re-count when localStorage changes in another tab
  useEffect(() => {
    if (!providerId) return;
    const readKey = `olera_reviews_read_${providerId}`;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === readKey) {
        recount();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [providerId, recount]);

  return count;
}

/**
 * Mark a review as read in the database (metadata.read_by) and localStorage fallback.
 * Dispatches olera:reviews-read event for immediate UI updates.
 */
export async function markReviewAsRead(reviewId: string, profileId: string): Promise<void> {
  // Optimistically update localStorage for immediate feedback
  const readKey = `olera_reviews_read_${profileId}`;
  try {
    const stored = localStorage.getItem(readKey);
    const readIds: string[] = stored ? JSON.parse(stored) : [];
    if (!readIds.includes(reviewId)) {
      readIds.push(reviewId);
      localStorage.setItem(readKey, JSON.stringify(readIds));
    }
  } catch { /* localStorage unavailable */ }

  // Dispatch event for immediate UI updates
  window.dispatchEvent(new CustomEvent("olera:reviews-read"));

  // Persist to database
  try {
    await fetch("/api/provider/reviews/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
  } catch (err) {
    console.error("[markReviewAsRead] Failed to persist to database:", err);
    // localStorage fallback already in place
  }
}

/**
 * Migrate localStorage read data from old key format to new profileId-based key.
 * This is a one-time migration for backwards compatibility.
 */
export function migrateReviewsReadData(oldKey: string, profileId: string): void {
  if (!oldKey || !profileId || oldKey === profileId) return;
  try {
    const oldKeyFull = `olera_reviews_read_${oldKey}`;
    const newKey = `olera_reviews_read_${profileId}`;
    const oldData = localStorage.getItem(oldKeyFull);
    if (oldData && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldData);
    }
  } catch { /* localStorage unavailable */ }
}

/**
 * Mark all reviews as read for a provider (legacy function for compatibility).
 * Updates localStorage and dispatches sync event.
 * @deprecated Use markReviewAsRead for individual reviews instead
 */
export function markAllReviewsAsRead(reviewIds: string[], profileId: string): void {
  const readKey = `olera_reviews_read_${profileId}`;
  try {
    const stored = localStorage.getItem(readKey);
    const existingIds: string[] = stored ? JSON.parse(stored) : [];
    const merged = [...new Set([...existingIds, ...reviewIds])];
    localStorage.setItem(readKey, JSON.stringify(merged));
    // Dispatch sync event with count 0
    window.dispatchEvent(new CustomEvent("olera:reviews-sync", {
      detail: { count: 0, providerId: profileId }
    }));
  } catch {
    // localStorage unavailable
  }
}
