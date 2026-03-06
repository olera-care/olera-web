"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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

  const recount = useCallback(() => {
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
      const supabase = createClient();

      // Fetch pending questions for this provider
      const { data, error } = await supabase
        .from("provider_questions")
        .select("id")
        .eq("provider_id", providerSlug)
        .eq("status", "pending");

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
    const handler = () => recount();
    window.addEventListener("olera:qna-read", handler);
    window.addEventListener("olera:qna-new", handler);
    return () => {
      window.removeEventListener("olera:qna-read", handler);
      window.removeEventListener("olera:qna-new", handler);
    };
  }, [recount]);

  // Sync event from Q&A page to override count (fixes stale badge from localStorage mismatch)
  useEffect(() => {
    const syncHandler = (e: Event) => {
      const { count: syncedCount } = (e as CustomEvent).detail;
      if (typeof syncedCount === "number") {
        setCount(syncedCount);
      }
    };
    window.addEventListener("olera:qna-sync", syncHandler);
    return () => window.removeEventListener("olera:qna-sync", syncHandler);
  }, []);

  return count;
}
