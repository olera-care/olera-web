"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread (accepted) connections for a profile.
 * Only fetches connection IDs (no joins) and checks against localStorage read state.
 */
export function useUnreadConnectionsCount(profileId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
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

      // Check against localStorage read state
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

  return count;
}
