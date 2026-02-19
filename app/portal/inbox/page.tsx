"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Connection, ConnectionStatus, Profile } from "@/lib/types";
import ConversationList from "@/components/messaging/ConversationList";
import type { ConnectionWithProfile } from "@/components/messaging/ConversationList";
import ConversationPanel from "@/components/messaging/ConversationPanel";
import ProviderDetailPanel from "@/components/messaging/ProviderDetailPanel";
import ReportConnectionModal from "@/components/messaging/ReportConnectionModal";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  type?: string;
}

/** Sort by last activity — last thread message, then updated_at, then created_at */
function getLastActivityTime(conn: ConnectionWithProfile): number {
  const meta = conn.metadata as Record<string, unknown> | undefined;
  const thread = (meta?.thread as ThreadMessage[]) || [];
  if (thread.length > 0) {
    return new Date(thread[thread.length - 1].created_at).getTime();
  }
  return new Date(conn.updated_at || conn.created_at).getTime();
}

function InboxContent() {
  const searchParams = useSearchParams();
  const { activeProfile, profiles } = useAuth();

  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [detailOpen, setDetailOpen] = useState(false);
  const [reportingConnectionId, setReportingConnectionId] = useState<string | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);

  // Track managed connections. Protection is cleared ONLY when DB data confirms the change,
  // not on a timer or in finally blocks. This eliminates all race conditions.
  // "expect_absent" = archived/deleted, should NOT appear in active query
  // "expect_present" = unarchived, SHOULD appear in active query
  const managedOpsRef = useRef(new Map<string, "expect_absent" | "expect_present">());

  // Auto-select from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setSelectedId(id);
  }, [searchParams]);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!activeProfile || !profiles.length || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const profileIds = profiles.map((p) => p.id);

      // Fetch active connections + archived count in parallel
      const [outbound, inbound, archivedOut, archivedIn] = await Promise.all([
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .in("from_profile_id", profileIds)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"])
          .order("updated_at", { ascending: false }),
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .in("to_profile_id", profileIds)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"])
          .order("updated_at", { ascending: false }),
        // Lightweight count of archived connections (IDs only)
        supabase
          .from("connections")
          .select("id")
          .in("from_profile_id", profileIds)
          .eq("type", "inquiry")
          .eq("status", "archived"),
        supabase
          .from("connections")
          .select("id")
          .in("to_profile_id", profileIds)
          .eq("type", "inquiry")
          .eq("status", "archived"),
      ]);

      // Deduplicate archived count
      const archivedIds = new Set<string>();
      for (const c of [...(archivedOut.data || []), ...(archivedIn.data || [])]) {
        archivedIds.add(c.id);
      }
      setArchivedCount(archivedIds.size);

      // Merge and deduplicate
      const allConns = [...(outbound.data || []), ...(inbound.data || [])] as Connection[];
      const deduped = new Map<string, Connection>();
      for (const conn of allConns) {
        // Skip hidden connections
        const meta = conn.metadata as Record<string, unknown> | undefined;
        if (meta?.hidden) continue;
        deduped.set(conn.id, conn);
      }
      const uniqueConns = Array.from(deduped.values());

      if (uniqueConns.length === 0) {
        // No active connections — all "expect_absent" ops are confirmed
        for (const [id, expected] of [...managedOpsRef.current.entries()]) {
          if (expected === "expect_absent") managedOpsRef.current.delete(id);
        }
        const managedSnapshot = new Set(managedOpsRef.current.keys());
        setConnections((prev) =>
          prev.filter((c) => c.status === "archived" || managedSnapshot.has(c.id))
        );
        setLoading(false);
        return;
      }

      // Collect all profile IDs for enrichment
      const allProfileIds = new Set<string>();
      for (const conn of uniqueConns) {
        allProfileIds.add(conn.from_profile_id);
        allProfileIds.add(conn.to_profile_id);
      }

      // Fetch business profiles + iOS provider images in parallel
      // (iOS query uses source_provider_id from business_profiles, but we can
      //  fetch all olera-providers for known connections in one go)
      const { data: profileData } = await supabase
        .from("business_profiles")
        .select(
          "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id"
        )
        .in("id", Array.from(allProfileIds));

      const bProfiles = (profileData as Profile[]) || [];

      // Resolve missing images from iOS provider table — only if needed
      const missingImageIds = bProfiles
        .filter((p) => !p.image_url && p.source_provider_id)
        .map((p) => p.source_provider_id as string);

      if (missingImageIds.length > 0) {
        const { data: iosProviders } = await supabase
          .from("olera-providers")
          .select("provider_id, provider_logo, provider_images")
          .in("provider_id", missingImageIds);

        if (iosProviders?.length) {
          const iosMap = new Map(
            iosProviders.map((p: { provider_id: string; provider_logo: string | null; provider_images: string | null }) => [
              p.provider_id,
              p.provider_logo || (p.provider_images?.split(" | ")[0]) || null,
            ])
          );
          for (const p of bProfiles) {
            if (!p.image_url && p.source_provider_id && iosMap.has(p.source_provider_id)) {
              p.image_url = iosMap.get(p.source_provider_id) || null;
            }
          }
        }
      }

      const profileMap = new Map(bProfiles.map((p) => [p.id, p]));

      // Enrich connections with profiles
      const enriched: ConnectionWithProfile[] = uniqueConns.map((conn) => ({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      }));

      // Sort by last activity
      enriched.sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a));

      // Clear managed ops that the DB has confirmed
      const enrichedIds = new Set(enriched.map((c) => c.id));
      for (const [id, expected] of [...managedOpsRef.current.entries()]) {
        if (expected === "expect_absent" && !enrichedIds.has(id)) {
          managedOpsRef.current.delete(id);
        } else if (expected === "expect_present" && enrichedIds.has(id)) {
          managedOpsRef.current.delete(id);
        }
      }

      // Snapshot managed keys BEFORE setConnections — immune to concurrent
      // handler mutations that could clear the ref between queuing and execution
      const managedSnapshot = new Set(managedOpsRef.current.keys());

      setConnections((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));

        // For managed connections still awaiting DB confirmation, keep local state
        const merged = enriched.map((c) =>
          managedSnapshot.has(c.id) && prevById.has(c.id) ? prevById.get(c.id)! : c
        );

        // Preserve connections not in enriched that should be kept
        const mergedIds = new Set(merged.map((c) => c.id));
        const keptFromPrev = prev.filter(
          (c) => !mergedIds.has(c.id) && (managedSnapshot.has(c.id) || c.status === "archived")
        );

        return [...merged, ...keptFromPrev];
      });

      // Auto-select first conversation if none selected and on desktop
      if (!selectedIdRef.current && enriched.length > 0 && window.innerWidth >= 1024) {
        setSelectedId(enriched[0].id);
      }
    } catch (err) {
      console.error("[inbox] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile, profiles]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Lazy-load archived connections when the user opens the archive section
  const archivedLoadedRef = useRef(false);
  const fetchArchived = useCallback(async () => {
    if (archivedLoadedRef.current || !activeProfile || !profiles.length || !isSupabaseConfigured()) return;
    archivedLoadedRef.current = true;

    try {
      const supabase = createClient();
      const pIds = profiles.map((p) => p.id);

      const [outbound, inbound] = await Promise.all([
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .in("from_profile_id", pIds)
          .eq("type", "inquiry")
          .eq("status", "archived")
          .order("updated_at", { ascending: false }),
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .in("to_profile_id", pIds)
          .eq("type", "inquiry")
          .eq("status", "archived")
          .order("updated_at", { ascending: false }),
      ]);

      const allConns = [...(outbound.data || []), ...(inbound.data || [])] as Connection[];
      const deduped = new Map<string, Connection>();
      for (const conn of allConns) {
        const meta = conn.metadata as Record<string, unknown> | undefined;
        if (meta?.hidden) continue;
        deduped.set(conn.id, conn);
      }
      const archivedConns = Array.from(deduped.values());
      if (archivedConns.length === 0) return;

      // Fetch profiles for enrichment
      const archiveProfileIds = new Set<string>();
      for (const conn of archivedConns) {
        archiveProfileIds.add(conn.from_profile_id);
        archiveProfileIds.add(conn.to_profile_id);
      }

      const { data: profileData } = await supabase
        .from("business_profiles")
        .select("id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id")
        .in("id", Array.from(archiveProfileIds));

      const profileMap = new Map(((profileData as Profile[]) || []).map((p) => [p.id, p]));

      const enriched: ConnectionWithProfile[] = archivedConns.map((conn) => ({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      }));

      // Append to existing connections (avoid duplicates from optimistic updates)
      setConnections((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newOnes = enriched.filter((c) => !existingIds.has(c.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    } catch (err) {
      console.error("[inbox] fetch archived error:", err);
      archivedLoadedRef.current = false; // Allow retry
    }
  }, [activeProfile, profiles]);

  // Handle message sent — update thread in local state
  const handleMessageSent = useCallback((connectionId: string, thread: ThreadMessage[]) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              metadata: {
                ...((conn.metadata as Record<string, unknown>) || {}),
                thread,
              },
            }
          : conn
      )
    );
  }, []);

  // Handle care request updated — update message + metadata in local state
  const handleCareRequestUpdated = useCallback(
    (connectionId: string, message: string, metadata: Record<string, unknown>) => {
      setConnections((prev) =>
        prev.map((conn) =>
          conn.id === connectionId
            ? { ...conn, message, metadata }
            : conn
        )
      );
    },
    []
  );

  const selectedConnection = connections.find((c) => c.id === selectedId) || null;

  // Determine the "other" profile for the detail panel
  const isInbound = selectedConnection?.to_profile_id === activeProfile?.id;
  const otherProfile = selectedConnection
    ? isInbound ? selectedConnection.fromProfile : selectedConnection.toProfile
    : null;

  // Close detail panel when switching conversations
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Open report modal
  const handleReportClick = useCallback((connectionId: string) => {
    setReportingConnectionId(connectionId);
  }, []);

  // Helper: call the server-side manage API (bypasses RLS)
  const manageConnection = useCallback(
    async (payload: { connectionId: string; action: string; reportReason?: string; reportDetails?: string }) => {
      const res = await fetch("/api/connections/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update connection");
      }
      return res.json();
    },
    []
  );

  // Submit report — pessimistic: wait for API confirmation before updating state.
  // No optimistic update = no revert = no bounce.
  const handleReportSubmit = useCallback(async (connectionId: string, reason: string, details: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    // Close modal and deselect immediately (UI feedback)
    if (selectedIdRef.current === connectionId) setSelectedId(null);
    setReportingConnectionId(null);

    try {
      await manageConnection({ connectionId, action: "report", reportReason: reason, reportDetails: details });

      // API confirmed — now update local state
      const existingMeta = (conn.metadata as Record<string, unknown>) || {};
      const updatedMeta = {
        ...existingMeta,
        reported: true,
        reported_at: new Date().toISOString(),
        reported_by: activeProfile?.id,
        report_reason: reason,
        report_details: details || null,
        archived_from_status: conn.status,
      };

      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: "archived" as ConnectionStatus, metadata: updatedMeta }
            : c
        )
      );
    } catch (err) {
      console.error("[inbox] report failed:", err);
    }
  }, [activeProfile?.id, manageConnection]);

  // Archive a connection — pessimistic: wait for API confirmation
  const handleArchive = useCallback(async (connectionId: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    // Deselect immediately (UI feedback)
    if (selectedIdRef.current === connectionId) setSelectedId(null);

    try {
      await manageConnection({ connectionId, action: "archive" });

      // API confirmed — now update local state
      const existingMeta = (conn.metadata as Record<string, unknown>) || {};
      const archiveMeta = { ...existingMeta, archived_from_status: conn.status };

      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: "archived" as ConnectionStatus, metadata: archiveMeta }
            : c
        )
      );
    } catch (err) {
      console.error("[inbox] archive failed:", err);
    }
  }, [manageConnection]);

  // Unarchive a connection — pessimistic: wait for API confirmation
  const handleUnarchive = useCallback(async (connectionId: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    try {
      await manageConnection({ connectionId, action: "unarchive" });

      // API confirmed — now update local state
      const meta = (conn.metadata as Record<string, unknown>) || {};
      const restoreStatus = (meta.archived_from_status as ConnectionStatus) || "accepted";

      managedOpsRef.current.set(connectionId, "expect_present");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, status: restoreStatus } : c
        )
      );
    } catch (err) {
      console.error("[inbox] unarchive failed:", err);
    }
  }, [manageConnection]);

  // Delete a connection — pessimistic: wait for API confirmation
  const handleDelete = useCallback(async (connectionId: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    if (selectedIdRef.current === connectionId) setSelectedId(null);

    try {
      await manageConnection({ connectionId, action: "delete" });

      // API confirmed — now remove from state
      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error("[inbox] delete failed:", err);
    }
  }, [manageConnection]);

  return (
    <div className="h-[calc(100vh-64px)] bg-white">
    <div className="h-full flex">
      {/* Left panel — conversation list */}
      <ConversationList
        connections={connections}
        selectedId={selectedId}
        onSelect={handleSelect}
        loading={loading}
        activeProfileId={activeProfile?.id || ""}
        onReportConnection={handleReportClick}
        onArchiveConnection={handleArchive}
        onUnarchiveConnection={handleUnarchive}
        onDeleteConnection={handleDelete}
        onLoadArchived={fetchArchived}
        archivedCount={archivedCount}
        className={`w-full lg:w-[360px] lg:shrink-0 ${selectedId ? "hidden lg:flex" : "flex"}`}
      />

      {/* Middle panel — conversation detail */}
      <ConversationPanel
        connection={selectedConnection}
        activeProfile={activeProfile ?? null}
        onMessageSent={handleMessageSent}
        onCareRequestUpdated={handleCareRequestUpdated}
        onBack={() => setSelectedId(null)}
        detailOpen={detailOpen}
        onToggleDetail={() => setDetailOpen((p) => !p)}
        className={`w-full lg:flex-1 ${selectedId ? "flex" : "hidden lg:flex"}`}
      />

      {/* Right panel — provider details (animated width) */}
      {otherProfile && (
        <div
          className={`hidden lg:flex shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
            detailOpen ? "w-[360px]" : "w-0"
          }`}
        >
          <ProviderDetailPanel
            profile={otherProfile}
            onClose={() => setDetailOpen(false)}
            className="flex w-[360px] h-full"
          />
        </div>
      )}
    </div>

    {/* Report modal */}
    {reportingConnectionId && (
      <ReportConnectionModal
        connectionId={reportingConnectionId}
        onClose={() => setReportingConnectionId(null)}
        onSubmit={handleReportSubmit}
      />
    )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
