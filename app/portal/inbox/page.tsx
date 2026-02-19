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

      // Fetch inbound and outbound inquiry connections
      // Only fetch active connections initially — archived are loaded lazily
      const [outbound, inbound] = await Promise.all([
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
      ]);

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
        setConnections([]);
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

      setConnections(enriched);

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

  // Submit report with reason (sets metadata.reported with timestamp + reason, archives)
  const handleReportSubmit = useCallback(async (connectionId: string, reason: string, details: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

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

    // Optimistic local update first, then persist to DB
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: "archived" as ConnectionStatus, metadata: updatedMeta }
          : c
      )
    );
    if (selectedIdRef.current === connectionId) setSelectedId(null);
    setReportingConnectionId(null);

    await supabase
      .from("connections")
      .update({ status: "archived", metadata: updatedMeta })
      .eq("id", connectionId);
  }, [activeProfile?.id]);

  // Archive a connection (saves original status in metadata, sets status = 'archived')
  const handleArchive = useCallback(async (connectionId: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    const existingMeta = (conn.metadata as Record<string, unknown>) || {};
    const archiveMeta = { ...existingMeta, archived_from_status: conn.status };

    // Optimistic local update first, then persist to DB
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: "archived" as ConnectionStatus, metadata: archiveMeta }
          : c
      )
    );
    if (selectedIdRef.current === connectionId) setSelectedId(null);

    await supabase
      .from("connections")
      .update({ status: "archived", metadata: archiveMeta })
      .eq("id", connectionId);
  }, []);

  // Unarchive a connection (restores original status from metadata)
  const handleUnarchive = useCallback(async (connectionId: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    const meta = (conn.metadata as Record<string, unknown>) || {};
    const restoreStatus = (meta.archived_from_status as ConnectionStatus) || "accepted";

    // Optimistic local update first, then persist to DB
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: restoreStatus } : c
      )
    );

    await supabase
      .from("connections")
      .update({ status: restoreStatus })
      .eq("id", connectionId);
  }, []);

  // Delete a connection (soft-delete via metadata.hidden)
  const handleDelete = useCallback(async (connectionId: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;

    const existingMeta = (conn.metadata as Record<string, unknown>) || {};

    // Optimistic local update first, then persist to DB
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    if (selectedIdRef.current === connectionId) setSelectedId(null);

    await supabase
      .from("connections")
      .update({ metadata: { ...existingMeta, hidden: true } })
      .eq("id", connectionId);
  }, []);

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
