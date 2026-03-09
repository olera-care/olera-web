"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Migrate old unscoped localStorage key to new profile-scoped keys.
 * Runs once per individual profile ID to ensure all profiles get the old data.
 */
function migrateInboxReadData(profileIds: string[]): void {
  const OLD_KEY = "olera_inbox_read";

  try {
    const oldData = localStorage.getItem(OLD_KEY);
    if (!oldData) return;

    const oldIds: string[] = JSON.parse(oldData);
    if (oldIds.length === 0) return;

    // Migrate to EACH individual profile key (not a joined key)
    for (const profileId of profileIds) {
      const newKey = `olera_inbox_read_${profileId}`;
      const migrationFlag = `olera_inbox_migrated_${profileId}`;

      // Skip if already migrated for this profile
      if (localStorage.getItem(migrationFlag)) continue;

      const existingNew = localStorage.getItem(newKey);
      if (!existingNew) {
        // Migrate old data to new key
        localStorage.setItem(newKey, oldData);
      } else {
        // Merge old and new data
        const newIds: string[] = JSON.parse(existingNew);
        const merged = [...new Set([...oldIds, ...newIds])];
        localStorage.setItem(newKey, JSON.stringify(merged));
      }
      // Mark as migrated for this profile
      localStorage.setItem(migrationFlag, "1");
    }
  } catch {
    // localStorage unavailable
  }
}

/**
 * Lightweight hook that counts unread inbox conversations.
 * Fetches active inquiry connections (pending/accepted) for the given profiles,
 * excludes hidden (soft-deleted) ones, checks against profile-scoped localStorage,
 * and returns the count.
 *
 * Features:
 * - Listens for "olera:inbox-read" custom events for immediate updates
 * - Listens for "storage" events for cross-tab synchronization
 * - Migrates old unscoped localStorage data to profile-scoped keys
 */
export function useUnreadInboxCount(profileIds: string[]): number {
  const [count, setCount] = useState(0);
  const migratedRef = useRef(false);

  // Stable key for deps — avoids re-running on every render when array ref changes
  const profileKey = profileIds.join(",");

  // Migrate old data on first run - now migrates to each individual profile key
  useEffect(() => {
    if (profileIds.length > 0 && !migratedRef.current) {
      migrateInboxReadData(profileIds);
      migratedRef.current = true;
    }
  }, [profileIds, profileKey]);

  const recount = useCallback(() => {
    if (!profileKey) return;

    const profileIdList = profileKey.split(",");

    // Collect read IDs from ALL individual profile keys
    // ConversationList marks as read using single profile ID, so we need to check each
    let readIds = new Set<string>();
    try {
      for (const id of profileIdList) {
        const stored = localStorage.getItem(`olera_inbox_read_${id}`);
        if (stored) {
          const parsed: string[] = JSON.parse(stored);
          parsed.forEach((readId) => readIds.add(readId));
        }
      }
    } catch {
      // localStorage may be unavailable
    }

    if (!isSupabaseConfigured()) {
      setCount(0);
      return;
    }

    (async () => {
      const supabase = createClient();

      // Match inbox query: fetch both outbound and inbound, active statuses only
      // Also include accepted provider-initiated matches (type="request")
      const [outbound, inbound, matchesOutbound, matchesInbound] = await Promise.all([
        supabase
          .from("connections")
          .select("id, metadata")
          .in("from_profile_id", profileIdList)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"]),
        supabase
          .from("connections")
          .select("id, metadata")
          .in("to_profile_id", profileIdList)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"]),
        // Accepted provider-initiated matches
        supabase
          .from("connections")
          .select("id, metadata")
          .in("from_profile_id", profileIdList)
          .eq("type", "request")
          .eq("status", "accepted"),
        supabase
          .from("connections")
          .select("id, metadata")
          .in("to_profile_id", profileIdList)
          .eq("type", "request")
          .eq("status", "accepted"),
      ]);

      // Merge, deduplicate, and filter out hidden and archived connections
      const seen = new Set<string>();
      const connectionIds: string[] = [];
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
        connectionIds.push(conn.id);
      }

      if (connectionIds.length === 0) {
        setCount(0);
        return;
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

  // Cross-tab synchronization: re-count when localStorage changes in another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Only re-count if an inbox read key was changed
      if (e.key?.startsWith("olera_inbox_read_")) {
        recount();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [recount]);

  return count;
}
