"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread inbox conversations.
 * Fetches active inquiry connections (pending/accepted) for the given profiles,
 * excludes hidden (soft-deleted) ones, checks against `olera_inbox_read`
 * localStorage, and returns the count.
 *
 * Listens for "olera:inbox-read" custom events so the count updates
 * immediately when a conversation is opened in the inbox.
 */
export function useUnreadInboxCount(profileIds: string[]): number {
  const [count, setCount] = useState(0);

  // Stable key for deps — avoids re-running on every render when array ref changes
  const profileKey = profileIds.join(",");

  const recount = useCallback(() => {
    if (!profileKey || !isSupabaseConfigured()) return;

    const ids = profileKey.split(",");

    (async () => {
      const supabase = createClient();

      // Match inbox query: fetch both outbound and inbound, active statuses only
      const [outbound, inbound] = await Promise.all([
        supabase
          .from("connections")
          .select("id, metadata")
          .in("from_profile_id", ids)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"]),
        supabase
          .from("connections")
          .select("id, metadata")
          .in("to_profile_id", ids)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"]),
      ]);

      // Merge, deduplicate, and filter out hidden and archived connections
      const seen = new Set<string>();
      const connectionIds: string[] = [];
      for (const conn of [...(outbound.data || []), ...(inbound.data || [])]) {
        if (seen.has(conn.id)) continue;
        seen.add(conn.id);
        const meta = conn.metadata as Record<string, unknown> | undefined;
        if (meta?.hidden || meta?.archived) continue;
        connectionIds.push(conn.id);
      }

      let readIds = new Set<string>();
      try {
        const stored = localStorage.getItem("olera_inbox_read");
        if (stored) readIds = new Set(JSON.parse(stored));
      } catch {
        // localStorage may be unavailable
      }

      setCount(connectionIds.filter((id) => !readIds.has(id)).length);
    })();
  }, [profileKey]);

  // Initial count
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a conversation is marked as read, or a new connection is created
  useEffect(() => {
    const handler = () => recount();
    window.addEventListener("olera:inbox-read", handler);
    window.addEventListener("olera:connection-created", handler);
    return () => {
      window.removeEventListener("olera:inbox-read", handler);
      window.removeEventListener("olera:connection-created", handler);
    };
  }, [recount]);

  return count;
}
