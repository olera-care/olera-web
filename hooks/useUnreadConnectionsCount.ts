"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread (accepted) connections for a profile.
 * Only fetches connection IDs (no joins) and checks against localStorage read state.
 *
 * Listens for "olera:connection-read" custom events so the count updates
 * immediately when a connection is opened on the Connections page.
 */
export function useUnreadConnectionsCount(profileId: string | undefined): number {
  const [count, setCount] = useState(0);

  const recount = useCallback(() => {
    if (!profileId || !isSupabaseConfigured()) return;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select("id")
        .or(`to_profile_id.eq.${profileId},from_profile_id.eq.${profileId}`)
        .eq("status", "accepted")
        .neq("type", "save");

      if (!data) return;

      let readIds = new Set<string>();
      try {
        const stored = localStorage.getItem("olera_read_connections");
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

  // Re-count when a connection is marked as read
  useEffect(() => {
    const handler = () => recount();
    window.addEventListener("olera:connection-read", handler);
    return () => window.removeEventListener("olera:connection-read", handler);
  }, [recount]);

  return count;
}
