"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
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

function getLastActivityTime(conn: ConnectionWithProfile): number {
  const meta = conn.metadata as Record<string, unknown> | undefined;
  const thread = (meta?.thread as ThreadMessage[]) || [];
  if (thread.length > 0) {
    return new Date(thread[thread.length - 1].created_at).getTime();
  }
  return new Date(conn.updated_at || conn.created_at).getTime();
}

function ProviderInboxContent() {
  const searchParams = useSearchParams();
  const { activeProfile } = useAuth();
  const providerProfile = useProviderProfile();

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

  const managedOpsRef = useRef(new Map<string, "expect_absent" | "expect_present">());
  const profileCacheRef = useRef(new Map<string, Profile>());

  // Auto-select from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setSelectedId(id);
  }, [searchParams]);

  // Fetch connections for the provider profile only
  const fetchConnections = useCallback(async () => {
    if (!providerProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const profileId = providerProfile.id;

      // Fire archived count in background — doesn't block the active conversations render
      ;(async () => {
        try {
          const [archivedOut, archivedIn] = await Promise.all([
            supabase
              .from("connections")
              .select("id, metadata")
              .eq("from_profile_id", profileId)
              .eq("type", "inquiry")
              .filter("metadata->>archived", "eq", "true"),
            supabase
              .from("connections")
              .select("id, metadata")
              .eq("to_profile_id", profileId)
              .eq("type", "inquiry")
              .filter("metadata->>archived", "eq", "true"),
          ]);
          const archivedIds = new Set<string>();
          for (const c of [...(archivedOut.data || []), ...(archivedIn.data || [])]) {
            const meta = c.metadata as Record<string, unknown> | undefined;
            if (meta?.hidden) continue;
            archivedIds.add(c.id);
          }
          setArchivedCount(archivedIds.size);
        } catch (err) {
          console.error("[provider/inbox] archived count error:", err);
        }
      })();

      // Only wait for active connections (pending/accepted) before proceeding to render
      const [outbound, inbound] = await Promise.all([
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .eq("from_profile_id", profileId)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"])
          .order("updated_at", { ascending: false }),
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .eq("to_profile_id", profileId)
          .eq("type", "inquiry")
          .in("status", ["pending", "accepted"])
          .order("updated_at", { ascending: false }),
      ]);

      // Merge and deduplicate — skip hidden and archived
      const allConns = [...(outbound.data || []), ...(inbound.data || [])] as Connection[];
      const deduped = new Map<string, Connection>();
      for (const conn of allConns) {
        const meta = conn.metadata as Record<string, unknown> | undefined;
        if (meta?.hidden || meta?.archived) continue;
        deduped.set(conn.id, conn);
      }
      const uniqueConns = Array.from(deduped.values());

      if (uniqueConns.length === 0) {
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

      // Only fetch profiles not already in session cache
      const profileCache = profileCacheRef.current;
      const uncachedIds = Array.from(allProfileIds).filter((id) => !profileCache.has(id));

      if (uncachedIds.length > 0) {
        const { data: profileData } = await supabase
          .from("business_profiles")
          .select(
            "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id"
          )
          .in("id", uncachedIds);

        const newProfiles = (profileData as Profile[]) || [];

        const missingImageIds = newProfiles
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
            for (const p of newProfiles) {
              if (!p.image_url && p.source_provider_id && iosMap.has(p.source_provider_id)) {
                p.image_url = iosMap.get(p.source_provider_id) || null;
              }
            }
          }
        }

        for (const p of newProfiles) {
          profileCache.set(p.id, p);
        }
      }

      const profileMap = profileCache;

      const enriched: ConnectionWithProfile[] = uniqueConns.map((conn) => ({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      }));

      enriched.sort((a, b) => getLastActivityTime(b) - getLastActivityTime(a));

      const enrichedIds = new Set(enriched.map((c) => c.id));
      for (const [id, expected] of [...managedOpsRef.current.entries()]) {
        if (expected === "expect_absent" && !enrichedIds.has(id)) {
          managedOpsRef.current.delete(id);
        } else if (expected === "expect_present" && enrichedIds.has(id)) {
          managedOpsRef.current.delete(id);
        }
      }

      const managedSnapshot = new Set(managedOpsRef.current.keys());

      setConnections((prev) => {
        const prevById = new Map(prev.map((c) => [c.id, c]));
        const merged = enriched.map((c) =>
          managedSnapshot.has(c.id) && prevById.has(c.id) ? prevById.get(c.id)! : c
        );
        const mergedIds = new Set(merged.map((c) => c.id));
        const keptFromPrev = prev.filter(
          (c) => !mergedIds.has(c.id) && (managedSnapshot.has(c.id) || c.status === "archived")
        );
        return [...merged, ...keptFromPrev];
      });

      if (!selectedIdRef.current && enriched.length > 0 && window.innerWidth >= 1024) {
        setSelectedId(enriched[0].id);
      }
    } catch (err) {
      console.error("[provider/inbox] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [providerProfile]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const handler = () => fetchConnections();
    window.addEventListener("olera:connection-created", handler);
    return () => window.removeEventListener("olera:connection-created", handler);
  }, [fetchConnections]);

  // Lazy-load archived connections
  const archivedLoadedRef = useRef(false);
  const fetchArchived = useCallback(async () => {
    if (archivedLoadedRef.current || !providerProfile || !isSupabaseConfigured()) return;
    archivedLoadedRef.current = true;

    try {
      const supabase = createClient();
      const profileId = providerProfile.id;

      const [outbound, inbound] = await Promise.all([
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .eq("from_profile_id", profileId)
          .eq("type", "inquiry")
          .filter("metadata->>archived", "eq", "true")
          .order("updated_at", { ascending: false }),
        supabase
          .from("connections")
          .select("id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at")
          .eq("to_profile_id", profileId)
          .eq("type", "inquiry")
          .filter("metadata->>archived", "eq", "true")
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
        status: "archived" as ConnectionStatus,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      }));

      setConnections((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newOnes = enriched.filter((c) => !existingIds.has(c.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    } catch (err) {
      console.error("[provider/inbox] fetch archived error:", err);
      archivedLoadedRef.current = false;
    }
  }, [providerProfile]);

  const handleMessageSent = useCallback((connectionId: string, thread: ThreadMessage[]) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? { ...conn, metadata: { ...((conn.metadata as Record<string, unknown>) || {}), thread } }
          : conn
      )
    );
  }, []);

  const handleCareRequestUpdated = useCallback(
    (connectionId: string, message: string, metadata: Record<string, unknown>) => {
      setConnections((prev) =>
        prev.map((conn) => conn.id === connectionId ? { ...conn, message, metadata } : conn)
      );
    },
    []
  );

  const selectedConnection = connections.find((c) => c.id === selectedId) || null;
  const isInbound = selectedConnection?.to_profile_id === providerProfile?.id;
  const otherProfile = selectedConnection
    ? isInbound ? selectedConnection.fromProfile : selectedConnection.toProfile
    : null;

  const handleSelect = useCallback((id: string) => { setSelectedId(id); }, []);
  const handleReportClick = useCallback((connectionId: string) => { setReportingConnectionId(connectionId); }, []);

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

  const handleReportSubmit = useCallback(async (connectionId: string, reason: string, details: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;
    if (selectedIdRef.current === connectionId) setSelectedId(null);
    setReportingConnectionId(null);
    try {
      await manageConnection({ connectionId, action: "report", reportReason: reason, reportDetails: details });
      const existingMeta = (conn.metadata as Record<string, unknown>) || {};
      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: "archived" as ConnectionStatus, metadata: { ...existingMeta, reported: true } }
            : c
        )
      );
    } catch (err) {
      console.error("[provider/inbox] report failed:", err);
    }
  }, [manageConnection]);

  const handleArchive = useCallback(async (connectionId: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;
    if (selectedIdRef.current === connectionId) setSelectedId(null);
    try {
      await manageConnection({ connectionId, action: "archive" });
      const existingMeta = (conn.metadata as Record<string, unknown>) || {};
      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: "archived" as ConnectionStatus, metadata: { ...existingMeta, archived_from_status: conn.status } }
            : c
        )
      );
    } catch (err) {
      console.error("[provider/inbox] archive failed:", err);
    }
  }, [manageConnection]);

  const handleUnarchive = useCallback(async (connectionId: string) => {
    const conn = connectionsRef.current.find((c) => c.id === connectionId);
    if (!conn) return;
    try {
      await manageConnection({ connectionId, action: "unarchive" });
      const meta = (conn.metadata as Record<string, unknown>) || {};
      const restoreStatus = (meta.archived_from_status as ConnectionStatus) || "accepted";
      managedOpsRef.current.set(connectionId, "expect_present");
      setConnections((prev) =>
        prev.map((c) => c.id === connectionId ? { ...c, status: restoreStatus } : c)
      );
    } catch (err) {
      console.error("[provider/inbox] unarchive failed:", err);
    }
  }, [manageConnection]);

  const handleDelete = useCallback(async (connectionId: string) => {
    if (selectedIdRef.current === connectionId) setSelectedId(null);
    try {
      await manageConnection({ connectionId, action: "delete" });
      managedOpsRef.current.set(connectionId, "expect_absent");
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error("[provider/inbox] delete failed:", err);
    }
  }, [manageConnection]);

  // Use providerProfile for activeProfileId — determines which side of the conversation is "us"
  const activeProfileId = providerProfile?.id || activeProfile?.id || "";

  return (
    <div className="h-[calc(100vh-64px)] bg-white">
      <div className="h-full flex">
        <ConversationList
          connections={connections}
          selectedId={selectedId}
          onSelect={handleSelect}
          loading={loading}
          activeProfileId={activeProfileId}
          onReportConnection={handleReportClick}
          onArchiveConnection={handleArchive}
          onUnarchiveConnection={handleUnarchive}
          onDeleteConnection={handleDelete}
          onLoadArchived={fetchArchived}
          archivedCount={archivedCount}
          variant="provider"
          className={`w-full lg:w-[360px] lg:shrink-0 ${selectedId ? "hidden lg:flex" : "flex"}`}
        />

        <ConversationPanel
          connection={selectedConnection}
          activeProfile={providerProfile ?? null}
          onMessageSent={handleMessageSent}
          onCareRequestUpdated={handleCareRequestUpdated}
          onBack={() => setSelectedId(null)}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((p) => !p)}
          className={`w-full lg:flex-1 ${selectedId ? "flex" : "hidden lg:flex"}`}
        />

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

export default function ProviderInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProviderInboxContent />
    </Suspense>
  );
}
