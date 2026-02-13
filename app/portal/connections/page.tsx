"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectionDrawer from "@/components/portal/ConnectionDrawer";
import type { ConnectionWithProfile } from "@/components/portal/ConnectionDetailPanel";
import {
  getFamilyDisplayStatus,
  getProviderDisplayStatus,
  isConnectionUnread,
  FAMILY_STATUS_CONFIG,
  PROVIDER_STATUS_CONFIG,
} from "@/lib/connection-utils";

// ── Helpers ──

function parseMessage(message: string | null): {
  careRecipient?: string;
  careType?: string;
  urgency?: string;
  notes?: string;
} | null {
  if (!message) return null;
  try {
    const p = JSON.parse(message);
    return {
      careRecipient: p.care_recipient
        ? String(p.care_recipient).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      careType: p.care_type
        ? String(p.care_type).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      urgency: p.urgency
        ? String(p.urgency).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : undefined,
      notes: p.additional_notes || undefined,
    };
  } catch {
    return null;
  }
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #0891b2, #2dd4bf)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.split(" ").map((p) => p.charAt(0) + "***").join(" ");
}

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem("olera_read_connections");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem("olera_read_connections", JSON.stringify([...ids]));
  } catch {
    // localStorage may be unavailable
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Page ──

export default function ConnectionsPage() {
  const { activeProfile, membership } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());
  const [drawerConnectionId, setDrawerConnectionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // ── Fetch connections ──
  const fetchConnections = useCallback(async () => {
    if (!activeProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const cols =
        "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at";

      const [inboundRes, outboundRes] = await Promise.all([
        supabase
          .from("connections")
          .select(cols)
          .eq("to_profile_id", activeProfile.id)
          .neq("type", "save")
          .order("created_at", { ascending: false }),
        supabase
          .from("connections")
          .select(cols)
          .eq("from_profile_id", activeProfile.id)
          .neq("type", "save")
          .order("created_at", { ascending: false }),
      ]);

      if (inboundRes.error) throw new Error(inboundRes.error.message);
      if (outboundRes.error) throw new Error(outboundRes.error.message);

      const seen = new Set<string>();
      const connectionData: Connection[] = [];
      for (const c of [
        ...(inboundRes.data || []),
        ...(outboundRes.data || []),
      ] as Connection[]) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          connectionData.push(c);
        }
      }
      connectionData.sort((a, b) => b.created_at.localeCompare(a.created_at));

      const profileIds = new Set<string>();
      connectionData.forEach((c) => {
        profileIds.add(c.from_profile_id);
        profileIds.add(c.to_profile_id);
      });

      let profiles: Profile[] = [];
      if (profileIds.size > 0) {
        const { data: profileData } = await supabase
          .from("business_profiles")
          .select(
            "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id"
          )
          .in("id", Array.from(profileIds));
        profiles = (profileData as Profile[]) || [];

        const missingImageIds = profiles
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
            profiles = profiles.map((p) => {
              if (!p.image_url && p.source_provider_id && iosMap.has(p.source_provider_id)) {
                return { ...p, image_url: iosMap.get(p.source_provider_id) || null };
              }
              return p;
            });
          }
        }
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const enriched: ConnectionWithProfile[] = connectionData.map((c) => ({
        ...c,
        fromProfile: profileMap.get(c.from_profile_id) || null,
        toProfile: profileMap.get(c.to_profile_id) || null,
      }));

      setConnections(enriched);
    } catch (err: unknown) {
      console.error("[olera] fetchConnections failed:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Real-time + polling
  useEffect(() => {
    if (!activeProfile || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel("connections-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `to_profile_id=eq.${activeProfile.id}` }, () => { fetchConnections(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `from_profile_id=eq.${activeProfile.id}` }, () => { fetchConnections(); })
      .subscribe();

    const poll = setInterval(() => { fetchConnections(); }, 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [activeProfile, fetchConnections]);

  // ── Categorize connections ──
  const sections = useMemo(() => {
    const needsAction: ConnectionWithProfile[] = [];
    const scheduled: ConnectionWithProfile[] = [];
    const waiting: ConnectionWithProfile[] = [];
    const past: ConnectionWithProfile[] = [];

    const pid = activeProfile?.id || "";

    for (const c of connections) {
      if (c.metadata?.hidden) continue;

      const isInbound = c.to_profile_id === pid;
      const meta = c.metadata as Record<string, unknown> | undefined;
      const scheduledCall = meta?.scheduled_call as { status: string; date: string; time: string } | null;
      const hasUpcomingCall =
        scheduledCall?.status === "confirmed" &&
        new Date(`${scheduledCall.date}T${scheduledCall.time}:00`) > new Date();

      if (isProvider) {
        const displayStatus = getProviderDisplayStatus(c, isInbound);
        if (displayStatus === "new_request") {
          needsAction.push(c);
        } else if (displayStatus === "connected") {
          if (hasUpcomingCall) {
            scheduled.push(c);
          } else {
            needsAction.push(c);
          }
        } else if (displayStatus === "pending_outbound") {
          waiting.push(c);
        } else {
          past.push(c);
        }
      } else {
        const displayStatus = getFamilyDisplayStatus(c);
        if (displayStatus === "responded") {
          if (hasUpcomingCall) {
            scheduled.push(c);
          } else {
            needsAction.push(c);
          }
        } else if (displayStatus === "pending") {
          waiting.push(c);
        } else {
          past.push(c);
        }
      }
    }

    return { needsAction, scheduled, waiting, past };
  }, [connections, activeProfile?.id, isProvider]);

  // ── Handlers ──
  const openDrawer = (id: string) => {
    setDrawerConnectionId(id);
    setDrawerOpen(true);
    if (!readIds.has(id)) {
      const conn = connections.find((c) => c.id === id);
      if (conn && (conn.status === "accepted" || (isProvider && conn.status === "pending"))) {
        const updated = new Set(readIds);
        updated.add(id);
        setReadIds(updated);
        persistReadIds(updated);
      }
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerConnectionId(null), 300);
    fetchConnections();
  };

  const handleStatusChange = (connectionId: string, newStatus: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: newStatus as Connection["status"] } : c
      )
    );
    fetchConnections();
  };

  const handleWithdraw = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: "expired" as Connection["status"], metadata: { ...(c.metadata || {}), withdrawn: true } }
          : c
      )
    );
    closeDrawer();
  };

  const handleHide = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    closeDrawer();
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500 text-base">Loading connections...</p>
      </div>
    );
  }

  // ── Empty state ──
  if (connections.length === 0 && !error) {
    return (
      <EmptyState
        title="No connections yet"
        description={isProvider
          ? "When families reach out or you connect with them, their requests will appear here."
          : "Browse providers and connect to get started."}
        action={
          <Link href={isProvider ? "/portal/discover/families" : "/browse"}>
            <Button>{isProvider ? "Browse families" : "Browse Providers"}</Button>
          </Link>
        }
      />
    );
  }

  // ── Helper to get next-step hint for a connection ──
  const getHint = (c: ConnectionWithProfile): string => {
    const isInbound = c.to_profile_id === (activeProfile?.id || "");
    const meta = c.metadata as Record<string, unknown> | undefined;
    const thread = (meta?.thread as Array<{ from_profile_id: string }>) || [];
    const hasMessages = thread.length > 0;
    const nextStepReq = meta?.next_step_request as { type: string } | null;
    const timeProposal = meta?.time_proposal as { status: string } | null;

    if (isProvider) {
      if (c.status === "pending" && isInbound) return "New request — review and respond";
      if (timeProposal?.status === "pending") return "Time proposed — waiting for response";
      if (nextStepReq) return "Call requested — suggest a time";
      if (!hasMessages) return "Send a message to introduce yourself";
      return "Schedule a call to discuss next steps";
    }

    if (timeProposal?.status === "pending") return "Time suggested — confirm or pick another";
    if (nextStepReq) return "Call requested — waiting for their availability";
    if (!hasMessages) return "Send a message to get started";
    return "Schedule a call to discuss needs, availability, and costs";
  };

  // ── Render ──
  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); fetchConnections(); }} className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-4">Retry</button>
        </div>
      )}

      {/* Page header */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-900">
          {isProvider ? "Connections" : "My Connections"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isProvider
            ? "Respond to inquiries and schedule consultations."
            : "Message providers, schedule calls, and find the right fit."}
        </p>
      </div>

      {/* Section: Next steps */}
      {sections.needsAction.length > 0 && (
        <div>
          <SectionHeader
            title="Next steps"
            count={sections.needsAction.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sections.needsAction.map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                activeProfileId={activeProfile?.id || ""}
                isProvider={isProvider}
                hasFullAccess={hasFullAccess}
                hint={getHint(c)}
                unread={isConnectionUnread(c, readIds)}
                onSelect={openDrawer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section: Scheduled */}
      {sections.scheduled.length > 0 && (
        <div>
          <SectionHeader
            title="Scheduled"
            count={sections.scheduled.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sections.scheduled.map((c) => {
              const meta = c.metadata as Record<string, unknown> | undefined;
              const sc = meta?.scheduled_call as { date: string; time: string; type: string } | null;
              const callLabel = sc
                ? new Date(`${sc.date}T${sc.time}:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  + " \u00b7 " + new Date(`${sc.date}T${sc.time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                : null;
              return (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  activeProfileId={activeProfile?.id || ""}
                  isProvider={isProvider}
                  hasFullAccess={hasFullAccess}
                  hint={callLabel ? `Call ${callLabel}` : undefined}
                  onSelect={openDrawer}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Waiting */}
      {sections.waiting.length > 0 && (
        <div>
          <SectionHeader
            title={isProvider ? "Sent" : "Waiting for reply"}
            count={sections.waiting.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sections.waiting.map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                activeProfileId={activeProfile?.id || ""}
                isProvider={isProvider}
                hasFullAccess={hasFullAccess}
                hint={`Sent ${relativeTime(c.created_at)}`}
                muted
                onSelect={openDrawer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section: Past (collapsed) */}
      {sections.past.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showPast ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Past connections
            <span className="text-xs text-gray-300">{sections.past.length}</span>
          </button>
          {showPast && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {sections.past.map((c) => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  activeProfileId={activeProfile?.id || ""}
                  isProvider={isProvider}
                  hasFullAccess={hasFullAccess}
                  muted
                  onSelect={openDrawer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade prompt for locked-out providers */}
      {!hasFullAccess && isProvider && connections.length > 0 && (
        <UpgradePrompt context="view full details and respond to connections" />
      )}

      <ConnectionDrawer
        connectionId={drawerConnectionId}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
        onWithdraw={handleWithdraw}
        onHide={handleHide}
      />
    </div>
  );
}

// ── Section Header ──

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
  );
}

// ── Unified Connection Card ──

function ConnectionCard({
  connection,
  activeProfileId,
  isProvider,
  hasFullAccess,
  hint,
  muted,
  unread,
  onSelect,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  hint?: string;
  muted?: boolean;
  unread?: boolean;
  onSelect: (id: string) => void;
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state].filter(Boolean).join(", ");

  const parsedMsg = parseMessage(connection.message);
  const careTypeLabel = parsedMsg?.careType || connection.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const shouldBlur = isProvider && !hasFullAccess && isInbound;
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  // Status label
  const displayStatus = isProvider
    ? getProviderDisplayStatus(connection, isInbound)
    : getFamilyDisplayStatus(connection);
  const statusConfig = isProvider
    ? PROVIDER_STATUS_CONFIG[displayStatus as keyof typeof PROVIDER_STATUS_CONFIG]
    : FAMILY_STATUS_CONFIG[displayStatus as keyof typeof FAMILY_STATUS_CONFIG];

  return (
    <button
      type="button"
      onClick={() => onSelect(connection.id)}
      className={`w-full text-left rounded-xl border transition-colors group cursor-pointer ${
        muted
          ? "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="relative shrink-0 mt-0.5">
            {imageUrl && !shouldBlur ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={otherName}
                className={`w-11 h-11 rounded-xl object-cover ${muted ? "opacity-60" : ""}`}
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white ${muted ? "opacity-60" : ""}`}
                style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
              >
                {shouldBlur ? "?" : initial}
              </div>
            )}
            {unread && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-tight">{careTypeLabel}</p>
                <h3 className={`text-base truncate leading-snug ${
                  unread ? "font-bold text-gray-900" : muted ? "font-medium text-gray-500" : "font-semibold text-gray-900"
                }`}>
                  {shouldBlur ? blurName(otherName) : otherName}
                </h3>
                {otherLocation && !shouldBlur && (
                  <p className={`text-sm truncate mt-0.5 ${muted ? "text-gray-400" : "text-gray-500"}`}>
                    {otherLocation}
                  </p>
                )}
              </div>
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 mt-0.5 ${statusConfig.bg} ${statusConfig.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            {/* Hint / next step */}
            {hint && (
              <p className={`text-sm mt-1.5 ${muted ? "text-gray-400" : "text-gray-500"}`}>
                {hint}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
