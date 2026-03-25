"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Lightweight hook that counts unread inbox conversations.
 *
 * Uses database-backed read tracking via metadata.read_by[profileId].
 * A conversation is considered "read" if metadata.read_by contains an entry
 * for the user's profile ID.
 *
 * Features:
 * - Checks metadata.read_by in the database for persistent read state
 * - Falls back to localStorage for backwards compatibility during migration
 * - Listens for "olera:inbox-read" custom events for immediate updates
 * - Listens for "olera:connection-created" for new connections
 */
export function useUnreadInboxCount(profileIds: string[]): number {
  const [count, setCount] = useState(0);
  const fetchingRef = useRef(false);

  // Stable key for deps — avoids re-running on every render when array ref changes
  const profileKey = profileIds.join(",");

  const recount = useCallback(() => {
    if (!profileKey || fetchingRef.current) return;

    const profileIdList = profileKey.split(",").filter(Boolean);
    if (profileIdList.length === 0) {
      setCount(0);
      return;
    }

    if (!isSupabaseConfigured()) {
      setCount(0);
      return;
    }

    fetchingRef.current = true;

    (async () => {
      try {
        const supabase = createClient();

        // Fetch connections with their metadata (includes read_by)
        // Match inbox query: fetch both outbound and inbound, active statuses only
        const [outbound, inbound, matchesOutbound, matchesInbound] = await Promise.all([
          supabase
            .from("connections")
            .select("id, metadata, from_profile_id, to_profile_id")
            .in("from_profile_id", profileIdList)
            .eq("type", "inquiry")
            .in("status", ["pending", "accepted"]),
          supabase
            .from("connections")
            .select("id, metadata, from_profile_id, to_profile_id")
            .in("to_profile_id", profileIdList)
            .eq("type", "inquiry")
            .in("status", ["pending", "accepted"]),
          // Accepted provider-initiated matches
          supabase
            .from("connections")
            .select("id, metadata, from_profile_id, to_profile_id")
            .in("from_profile_id", profileIdList)
            .eq("type", "request")
            .eq("status", "accepted"),
          supabase
            .from("connections")
            .select("id, metadata, from_profile_id, to_profile_id")
            .in("to_profile_id", profileIdList)
            .eq("type", "request")
            .eq("status", "accepted"),
        ]);

        // Merge, deduplicate, and filter out hidden and archived connections
        const seen = new Set<string>();
        const connections: Array<{
          id: string;
          metadata: Record<string, unknown> | null;
          from_profile_id: string;
          to_profile_id: string;
        }> = [];

        const allConns = [
          ...(outbound.data || []),
          ...(inbound.data || []),
          ...(matchesOutbound.data || []),
          ...(matchesInbound.data || []),
        ];

        for (const conn of allConns) {
          if (seen.has(conn.id)) continue;
          seen.add(conn.id);
          const meta = conn.metadata as Record<string, unknown> | undefined;
          if (meta?.hidden || meta?.archived) continue;
          connections.push(conn);
        }

        if (connections.length === 0) {
          setCount(0);
          return;
        }

        // Get localStorage read IDs as fallback for older connections without metadata.read_by
        let localStorageReadIds = new Set<string>();
        try {
          for (const profileId of profileIdList) {
            const stored = localStorage.getItem(`olera_inbox_read_${profileId}`);
            if (stored) {
              const parsed: string[] = JSON.parse(stored);
              parsed.forEach((readId) => localStorageReadIds.add(readId));
            }
          }
        } catch {
          // localStorage may be unavailable
        }

        // Count unread: connection is unread if neither database nor localStorage shows it as read
        let unreadCount = 0;
        for (const conn of connections) {
          const meta = conn.metadata as Record<string, unknown> | null;
          const readBy = (meta?.read_by as Record<string, string>) || {};

          // Determine which profile ID the user is using for this connection
          const userProfileId = profileIdList.find(
            (pid) => pid === conn.from_profile_id || pid === conn.to_profile_id
          );

          if (!userProfileId) continue;

          // Check if read in database (primary) or localStorage (fallback)
          const isReadInDb = !!readBy[userProfileId];
          const isReadInLocalStorage = localStorageReadIds.has(conn.id);

          if (!isReadInDb && !isReadInLocalStorage) {
            unreadCount++;
          }
        }

        setCount(unreadCount);
      } catch (err) {
        console.error("[useUnreadInboxCount] Error:", err);
        setCount(0);
      } finally {
        fetchingRef.current = false;
      }
    })();
  }, [profileKey]);

  // Initial count
  useEffect(() => {
    recount();
  }, [recount]);

  // Re-count when a conversation is marked as read, or a new connection is created
  useEffect(() => {
    const handler = () => {
      // Small delay to allow database write to complete
      setTimeout(recount, 100);
    };
    window.addEventListener("olera:inbox-read", handler);
    window.addEventListener("olera:connection-created", handler);
    return () => {
      window.removeEventListener("olera:inbox-read", handler);
      window.removeEventListener("olera:connection-created", handler);
    };
  }, [recount]);

  // Cross-tab synchronization: re-count when localStorage changes in another tab
  // This provides immediate updates for legacy localStorage tracking
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("olera_inbox_read_")) {
        recount();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [recount]);

  return count;
}
