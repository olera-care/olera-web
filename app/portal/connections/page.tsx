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
import SplitViewLayout from "@/components/portal/SplitViewLayout";
import ConnectionDetailContent from "@/components/portal/ConnectionDetailContent";
import ConnectionListItem from "@/components/portal/ConnectionListItem";
import type { ConnectionWithProfile } from "@/components/portal/ConnectionListItem";
import { avatarGradient, blurName, parseMessage } from "@/components/portal/ConnectionDetailContent";
import {
  getFamilyDisplayStatus,
  getConnectionTab,
  getProviderDisplayStatus,
  getProviderConnectionTab,
  isConnectionUnread,
  FAMILY_STATUS_CONFIG,
  PROVIDER_STATUS_CONFIG,
  type ConnectionTab,
  type ProviderConnectionTab,
} from "@/lib/connection-utils";

// ── Read state from localStorage ──

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

  // ── Tab & read state ──
  const [activeTab, setActiveTab] = useState<ConnectionTab>("active");
  const [providerTab, setProviderTab] = useState<ProviderConnectionTab>("attention");
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  // ── Selection state (replaces drawer) ──
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

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
      }

      // Render immediately with available data (gradient avatars for missing images)
      const buildEnriched = (profileList: Profile[]) => {
        const profileMap = new Map(profileList.map((p) => [p.id, p]));
        return connectionData.map((c) => ({
          ...c,
          fromProfile: profileMap.get(c.from_profile_id) || null,
          toProfile: profileMap.get(c.to_profile_id) || null,
        }));
      };

      setConnections(buildEnriched(profiles));
      setLoading(false);

      // Resolve iOS images in the background (non-blocking)
      const missingImageIds = profiles
        .filter((p) => !p.image_url && p.source_provider_id)
        .map((p) => p.source_provider_id as string);

      if (missingImageIds.length > 0) {
        supabase
          .from("olera-providers")
          .select("provider_id, provider_logo, provider_images")
          .in("provider_id", missingImageIds)
          .then(({ data: iosProviders }) => {
            if (iosProviders?.length) {
              const iosMap = new Map(
                iosProviders.map((p: { provider_id: string; provider_logo: string | null; provider_images: string | null }) => [
                  p.provider_id,
                  p.provider_logo || (p.provider_images?.split(" | ")[0]) || null,
                ])
              );
              const updatedProfiles = profiles.map((p) => {
                if (!p.image_url && p.source_provider_id && iosMap.has(p.source_provider_id)) {
                  return { ...p, image_url: iosMap.get(p.source_provider_id) || null };
                }
                return p;
              });
              setConnections(buildEnriched(updatedProfiles));
            }
          });
      }
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

  // ── Tab grouping (family view) ──
  const tabbed = useMemo(() => {
    const active: ConnectionWithProfile[] = [];
    const connected: ConnectionWithProfile[] = [];
    const past: ConnectionWithProfile[] = [];

    for (const c of connections) {
      if (c.metadata?.hidden) continue;

      // Hide provider-initiated (inbound) connections from the family view
      // until the reverse flow (provider → care seeker) is fully designed.
      const isInbound = c.to_profile_id === activeProfile?.id;
      if (isInbound) continue;

      const displayStatus = getFamilyDisplayStatus(c);
      const tab = getConnectionTab(displayStatus);

      if (tab === "active") active.push(c);
      else if (tab === "connected") connected.push(c);
      else past.push(c);
    }

    return { active, connected, past };
  }, [connections]);

  // Unread count for connected tab
  const unreadCount = useMemo(
    () => tabbed.connected.filter((c) => isConnectionUnread(c, readIds)).length,
    [tabbed.connected, readIds]
  );

  // ── Provider tab grouping ──
  const providerTabbed = useMemo(() => {
    const attention: ConnectionWithProfile[] = [];
    const active: ConnectionWithProfile[] = [];
    const past: ConnectionWithProfile[] = [];

    const pid = activeProfile?.id || "";
    for (const c of connections) {
      if (c.metadata?.hidden) continue;
      const isInbound = c.to_profile_id === pid;
      const displayStatus = getProviderDisplayStatus(c, isInbound);
      const tab = getProviderConnectionTab(displayStatus);
      if (tab === "attention") attention.push(c);
      else if (tab === "active") active.push(c);
      else past.push(c);
    }

    return { attention, active, past };
  }, [connections, activeProfile?.id]);

  // Pre-fetched connection data for instant detail rendering
  const preloadedConnection = useMemo(
    () => (selectedConnectionId ? connections.find((c) => c.id === selectedConnectionId) ?? null : null),
    [selectedConnectionId, connections]
  );

  // ── Handlers ──

  const selectAndMarkRead = (id: string) => {
    setSelectedConnectionId(id);
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

  const clearSelection = () => {
    setSelectedConnectionId(null);
    fetchConnections();
  };

  const handleStatusChange = (connectionId: string, newStatus: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: newStatus as Connection["status"] } : c
      )
    );
  };

  const handleWithdraw = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId
          ? { ...c, status: "expired" as Connection["status"], metadata: { ...(c.metadata || {}), withdrawn: true } }
          : c
      )
    );
    clearSelection();
  };

  const handleHide = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    clearSelection();
  };

  // ── Loading state ──

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">
            {isProvider ? "Connections" : "My Connections"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isProvider
              ? "Manage inquiries from families and your outreach."
              : "Track your care provider requests and responses."}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl max-w-md">
          {(isProvider ? ["Needs Attention", "Active", "Past"] : ["Active", "Connected", "Past"]).map((label) => (
            <div key={label} className="flex-1 flex items-center justify-center px-5 py-2 rounded-lg text-sm font-semibold text-gray-400">
              {label}
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-32 bg-gray-200 rounded mb-1.5" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-md shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    );
  }

  // ── Empty state (no connections at all) ──

  if (connections.length === 0 && !error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <EmptyState
          title="No connections yet"
          description={
            isProvider
              ? "When families reach out or you connect with them, their requests will appear here."
              : "Browse providers and connect to get started."
          }
          action={
            isProvider ? (
              <Link href="/portal/discover/families">
                <Button>Discover Families</Button>
              </Link>
            ) : (
              <Link href="/browse">
                <Button>Browse Providers</Button>
              </Link>
            )
          }
        />
      </div>
    );
  }

  // ── Determine current tab connections ──

  const currentConnections = isProvider
    ? providerTabbed[providerTab]
    : tabbed[activeTab];

  const currentTab = isProvider ? providerTab : activeTab;

  // Tab definitions
  const tabs = isProvider
    ? [
        { id: "attention" as const, label: "Needs Attention", count: providerTabbed.attention.length, badge: providerTabbed.attention.length },
        { id: "active" as const, label: "Active", count: providerTabbed.active.length, badge: 0 },
        { id: "past" as const, label: "Past", count: providerTabbed.past.length, badge: 0 },
      ]
    : [
        { id: "active" as const, label: "Active", count: tabbed.active.length, badge: 0 },
        { id: "connected" as const, label: "Connected", count: tabbed.connected.length, badge: unreadCount },
        { id: "past" as const, label: "Past", count: tabbed.past.length, badge: 0 },
      ];

  // ── Layout mode ──

  const hasSelection = selectedConnectionId !== null;

  // Shared tab bar
  const tabBar = (
    <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl max-w-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            if (isProvider) setProviderTab(tab.id as ProviderConnectionTab);
            else setActiveTab(tab.id as ConnectionTab);
          }}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all relative",
            currentTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          {tab.label}
          <span className={[
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            currentTab === tab.id ? "text-gray-600 bg-gray-100" : "text-gray-400",
          ].join(" ")}>
            {tab.count}
          </span>
          {tab.badge > 0 && currentTab !== tab.id && (
            <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <SplitViewLayout
      selectedId={selectedConnectionId}
      onBack={clearSelection}
      expandWhenEmpty
      left={
        hasSelection ? (
          /* ── Compact list mode (split view) ── */
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {isProvider ? "Connections" : "My Connections"}
              </h2>
            </div>

            <div className="sticky top-0 z-10 bg-white px-4 pb-2 shrink-0">
              {tabBar}
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentConnections.length === 0 ? (
                isProvider ? (
                  <ProviderTabEmptyState tab={providerTab} />
                ) : (
                  <TabEmptyState tab={activeTab} />
                )
              ) : (
                currentConnections.map((connection) => {
                  const unread = !isProvider && isConnectionUnread(connection, readIds);
                  return (
                    <ConnectionListItem
                      key={connection.id}
                      connection={connection}
                      activeProfileId={activeProfile?.id || ""}
                      selected={connection.id === selectedConnectionId}
                      unread={unread}
                      onSelect={selectAndMarkRead}
                      isProvider={isProvider}
                      hasFullAccess={hasFullAccess}
                    />
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ── Card grid mode (full width) ── */
          <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-gray-900">
                {isProvider ? "Connections" : "My Connections"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isProvider
                  ? "Manage inquiries from families and your outreach."
                  : "Track your care provider requests and responses."}
              </p>
            </div>

            {error && (
              <div className="mb-4">
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center justify-between" role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={() => { setError(""); setLoading(true); fetchConnections(); }} className="text-xs font-medium text-red-700 hover:text-red-800 underline ml-2">Retry</button>
                </div>
              </div>
            )}

            <div className="mb-6">{tabBar}</div>

            {currentConnections.length === 0 ? (
              isProvider ? (
                <ProviderTabEmptyState tab={providerTab} />
              ) : (
                <TabEmptyState tab={activeTab} />
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentConnections.map((connection) => {
                  const unread = !isProvider && isConnectionUnread(connection, readIds);
                  return (
                    <ConnectionGridCard
                      key={connection.id}
                      connection={connection}
                      activeProfileId={activeProfile?.id || ""}
                      unread={unread}
                      onSelect={selectAndMarkRead}
                      isProvider={isProvider}
                      hasFullAccess={hasFullAccess}
                    />
                  );
                })}
              </div>
            )}

            {isProvider && !hasFullAccess && connections.length > 0 && (
              <div className="mt-6">
                <UpgradePrompt context="view full details and respond to connections" />
              </div>
            )}
          </div>
        )
      }
      right={
        selectedConnectionId ? (
          <ConnectionDetailContent
            connectionId={selectedConnectionId}
            isActive={true}
            onClose={clearSelection}
            onStatusChange={handleStatusChange}
            onWithdraw={handleWithdraw}
            onHide={handleHide}
            preloadedConnection={preloadedConnection}
            showHeader={false}
          />
        ) : null
      }
    />
  );
}

// ── Tab Empty States ──

function TabEmptyState({ tab }: { tab: ConnectionTab }) {
  const config: Record<ConnectionTab, { icon: string; title: string; subtitle: string; cta?: { label: string; href: string } }> = {
    active: {
      icon: "\u{1F4E8}",
      title: "No active requests yet",
      subtitle: "When you reach out to a provider, your pending requests will show up here.",
      cta: { label: "Browse providers", href: "/browse" },
    },
    connected: {
      icon: "\u{1F4AC}",
      title: "No connections yet",
      subtitle: "When a provider accepts your request, your connection will appear here.",
    },
    past: {
      icon: "\u{1F4C2}",
      title: "No past connections",
      subtitle: "Expired, withdrawn, and declined connections will be archived here.",
    },
  };
  const { icon, title, subtitle, cta } = config[tab];
  return (
    <div className="py-12 text-center px-6">
      <span className="text-3xl block mb-2">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{subtitle}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// ── Provider Tab Empty States ──

function ProviderTabEmptyState({ tab }: { tab: ProviderConnectionTab }) {
  const config: Record<ProviderConnectionTab, { icon: string; title: string; subtitle: string }> = {
    attention: {
      icon: "\u{1F4E8}",
      title: "No pending requests",
      subtitle: "New family inquiries will appear here for you to review.",
    },
    active: {
      icon: "\u{1F4AC}",
      title: "No active connections",
      subtitle: "When you connect with families, conversations will show up here.",
    },
    past: {
      icon: "\u{1F4C2}",
      title: "No past connections",
      subtitle: "Expired, declined, and ended connections will be archived here.",
    },
  };
  const { icon, title, subtitle } = config[tab];
  return (
    <div className="py-12 text-center px-6">
      <span className="text-3xl block mb-2">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{subtitle}</p>
    </div>
  );
}

// ── Connection Grid Card (full-width default view) ──

function ConnectionGridCard({
  connection,
  activeProfileId,
  unread,
  onSelect,
  isProvider,
  hasFullAccess,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  unread: boolean;
  onSelect: (id: string) => void;
  isProvider: boolean;
  hasFullAccess: boolean;
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  const parsedMsg = parseMessage(connection.message);
  const careTypeLabel =
    parsedMsg?.careType ||
    connection.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const statusConfig = isProvider
    ? PROVIDER_STATUS_CONFIG[getProviderDisplayStatus(connection, isInbound)]
    : FAMILY_STATUS_CONFIG[getFamilyDisplayStatus(connection)];

  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(connection.id)}
      className="w-full text-left rounded-xl border border-gray-100 p-4 hover:border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {imageUrl && !shouldBlur ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={otherName}
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
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
          {/* Status + date metadata row */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <span className="text-[11px] text-gray-400 shrink-0">{createdAt}</span>
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 truncate">
            {shouldBlur ? blurName(otherName) : otherName}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {[otherLocation, careTypeLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </button>
  );
}
