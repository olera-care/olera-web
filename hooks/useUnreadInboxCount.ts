"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Migrate old unscoped localStorage key to new profile-scoped key.
 * Only runs once per profile key.
 */
function migrateInboxReadData(profileKey: string): void {
  const OLD_KEY = "olera_inbox_read";
  const newKey = `olera_inbox_read_${profileKey}`;
  const migrationFlag = `olera_inbox_migrated_${profileKey}`;

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
    // Mark as migrated (don't delete old key yet - other profiles may need it)
    localStorage.setItem(migrationFlag, "1");
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
 * Falls back to mock connection IDs when Supabase has no real connections.
 *
 * Listens for "olera:inbox-read" custom events so the count updates
 * immediately when a conversation is opened in the inbox.
 */
export function useUnreadInboxCount(profileIds: string[]): number {
  const [count, setCount] = useState(0);
  const migratedRef = useRef(false);

  // Stable key for deps — avoids re-running on every render when array ref changes
  const profileKey = profileIds.join(",");

  // Migrate old data on first run
  useEffect(() => {
    if (profileKey && !migratedRef.current) {
      migrateInboxReadData(profileKey);
      migratedRef.current = true;
    }
  }, [profileKey]);

  const recount = useCallback(() => {
    if (!profileKey) return;

    // Use profile-scoped localStorage key to avoid cross-user conflicts
    const inboxReadKey = `olera_inbox_read_${profileKey}`;
    let readIds = new Set<string>();
    try {
      const stored = localStorage.getItem(inboxReadKey);
      if (stored) readIds = new Set(JSON.parse(stored));
    } catch {
      // localStorage may be unavailable
    }

    if (!isSupabaseConfigured()) {
      setCount(0);
      return;
    }

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

  return count;
}
