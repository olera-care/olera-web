"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread inbox conversations.
 * Fetches inquiry connections (pending/accepted) for the given profile,
 * checks against `olera_inbox_read` localStorage, and returns the count.
 *
 * Listens for "olera:inbox-read" custom events so the count updates
 * immediately when a conversation is opened in the inbox.
 */
export function useUnreadInboxCount(profileId: string | undefined): number {
  const [count, setCount] = useState(0);

  const recount = useCallback(() => {
    if (!profileId || !isSupabaseConfigured()) return;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select("id")
        .or(`to_profile_id.eq.${profileId},from_profile_id.eq.${profileId}`)
        .in("status", ["pending", "accepted"])
        .eq("type", "inquiry");

      if (!data) return;

      let readIds = new Set<string>();
      try {
        const stored = localStorage.getItem("olera_inbox_read");
        if (stored) readIds = new Set(JSON.parse(stored));
      } catch {
        // localStorage may be unavailable
      }

      setCount(data.filter((c) => !readIds.has(c.id)).length);
    })();
  }, [profileId]);

  // Initial count
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a conversation is marked as read in the inbox
  useEffect(() => {
    const handler = () => recount();
    window.addEventListener("olera:inbox-read", handler);
    return () => {
      window.removeEventListener("olera:inbox-read", handler);
    };
  }, [recount]);

  return count;
}
