"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import SplitViewLayout from "@/components/portal/SplitViewLayout";
import LeadDetailPanel from "@/components/provider-dashboard/LeadDetailPanel";
import ConnectionListItem from "@/components/portal/ConnectionListItem";
import type { ConnectionWithProfile } from "@/components/portal/ConnectionListItem";
import { avatarGradient, blurName } from "@/components/portal/ConnectionDetailContent";
import {
  getProviderDisplayStatus,
  getProviderConnectionTab,
  PROVIDER_STATUS_CONFIG,
  type ProviderConnectionTab,
} from "@/lib/connection-utils";

// ── Main Page ──

export default function ProviderConnectionsPage() {
  const { membership } = useAuth();
  const providerProfile = useProviderProfile();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  // ── Tab state ──
  const [providerTab, setProviderTab] = useState<ProviderConnectionTab>("attention");

  // ── Selection state ──
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // ── Fetch connections ──
  const fetchConnections = useCallback(async () => {
    if (!providerProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const cols =
        "id, type, status, from_profile_id, to_profile_id, message, metadata, created_at, updated_at";

      const { data: rawConnections, error: connError } = await supabase
        .from("connections")
        .select(cols)
        .or(`to_profile_id.eq.${providerProfile.id},from_profile_id.eq.${providerProfile.id}`)
        .neq("type", "save")
        .order("created_at", { ascending: false });

      if (connError) throw new Error(connError.message);

      const connectionData = (rawConnections || []) as Connection[];

      const buildEnriched = (profileList: Profile[]) => {
        const profileMap = new Map(profileList.map((p) => [p.id, p]));
        return connectionData.map((c) => ({
          ...c,
          fromProfile: profileMap.get(c.from_profile_id) || null,
          toProfile: profileMap.get(c.to_profile_id) || null,
        }));
      };

      // Show connections immediately with gradient avatars
      setConnections(buildEnriched([]));
      setLoading(false);

      // Fetch profiles in background, then enrich
      const profileIds = new Set<string>();
      connectionData.forEach((c) => {
        profileIds.add(c.from_profile_id);
        profileIds.add(c.to_profile_id);
      });

      if (profileIds.size > 0) {
        const { data: profileData } = await supabase
          .from("business_profiles")
          .select(
            "id, display_name, description, image_url, city, state, type, email, phone, website, slug, care_types, category, source_provider_id"
          )
          .in("id", Array.from(profileIds));
        const profiles = (profileData as Profile[]) || [];

        setConnections(buildEnriched(profiles));

        // Resolve iOS images in the background
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
  }, [providerProfile]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // ── Provider tab grouping ──
  const providerTabbed = useMemo(() => {
    const attention: ConnectionWithProfile[] = [];
    const active: ConnectionWithProfile[] = [];
    const past: ConnectionWithProfile[] = [];

    const pid = providerProfile?.id || "";
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
  }, [connections, providerProfile?.id]);

  // Pre-fetched connection data for instant detail rendering
  const preloadedConnection = useMemo(
    () => (selectedConnectionId ? connections.find((c) => c.id === selectedConnectionId) ?? null : null),
    [selectedConnectionId, connections]
  );

  // ── Handlers ──

  const selectConnection = (id: string) => {
    setSelectedConnectionId(id);
  };

  const clearSelection = () => {
    setSelectedConnectionId(null);
    fetchConnections();
  };

  const handleArchive = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  // ── Loading state ──

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Leads</h2>
            <p className="text-[15px] text-gray-500 mt-1">Families interested in your services</p>
          </div>
          <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl max-w-md">
            {["Needs Attention", "Active", "Past"].map((label) => (
              <div key={label} className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-gray-400 whitespace-nowrap">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-warm-100/60 bg-white p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-warm-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="h-3 w-16 bg-warm-100 rounded" />
                      <div className="h-3 w-12 bg-warm-50 rounded" />
                    </div>
                    <div className="h-4 w-36 bg-warm-100 rounded mb-1.5" />
                    <div className="h-3 w-44 bg-warm-50 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──

  if (connections.length === 0 && !error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EmptyState
          title="No leads yet"
          description="When families express interest in your services, they'll appear here."
        />
      </div>
    );
  }

  // ── Current tab data ──

  const currentConnections = providerTabbed[providerTab];

  const tabs: { id: ProviderConnectionTab; label: string; count: number; badge: number }[] = [
    { id: "attention", label: "Needs Attention", count: providerTabbed.attention.length, badge: providerTabbed.attention.length },
    { id: "active", label: "Active", count: providerTabbed.active.length, badge: 0 },
    { id: "past", label: "Past", count: providerTabbed.past.length, badge: 0 },
  ];

  // ── Layout mode ──

  const hasSelection = selectedConnectionId !== null;
  const activeProfileId = providerProfile?.id || "";

  // Shared tab bar
  const tabBar = (
    <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl max-w-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            setProviderTab(tab.id);
            setSelectedConnectionId(null);
          }}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all relative",
            providerTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          {tab.label}
          <span className={[
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            providerTab === tab.id ? "text-gray-600 bg-warm-50" : "text-gray-400",
          ].join(" ")}>
            {tab.count}
          </span>
          {tab.badge > 0 && providerTab !== tab.id && (
            <span className="text-[10px] font-bold text-white bg-primary-600 rounded-full w-4 h-4 flex items-center justify-center">
              {tab.badge}
            </span>
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
      equalWidth
      left={
        hasSelection ? (
          /* ── Compact list mode (split view) ── */
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <h2 className="text-xl font-display font-bold text-gray-900">Leads</h2>
            </div>

            <div className="sticky top-0 z-10 bg-white px-4 pb-2 shrink-0">
              {tabBar}
            </div>

            <div className="flex-1 overflow-y-auto">
              {currentConnections.length === 0 ? (
                <ProviderTabEmptyState tab={providerTab} />
              ) : (
                currentConnections.map((connection) => (
                  <ConnectionListItem
                    key={connection.id}
                    connection={connection}
                    activeProfileId={activeProfileId}
                    selected={connection.id === selectedConnectionId}
                    unread={false}
                    onSelect={selectConnection}
                    isProvider={true}
                    hasFullAccess={hasFullAccess}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* ── Card grid mode (full width) ── */
          <div className="h-full overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">Leads</h2>
              <p className="text-[15px] text-gray-500 mt-1">Families interested in your services</p>
            </div>

            {error && (
              <div className="mb-4">
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between border border-red-100" role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={() => { setError(""); setLoading(true); fetchConnections(); }} className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-2">Retry</button>
                </div>
              </div>
            )}

            <div className="mb-6">{tabBar}</div>

            {currentConnections.length === 0 ? (
              <ProviderTabEmptyState tab={providerTab} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentConnections.map((connection) => (
                  <ConnectionGridCard
                    key={connection.id}
                    connection={connection}
                    activeProfileId={activeProfileId}
                    onSelect={selectConnection}
                    hasFullAccess={hasFullAccess}
                  />
                ))}
              </div>
            )}

            {!hasFullAccess && connections.length > 0 && (
              <div className="mt-6">
                <UpgradePrompt context="view full details and respond to connections" />
              </div>
            )}
          </div>
        )
      }
      right={
        selectedConnectionId ? (
          <LeadDetailPanel
            connectionId={selectedConnectionId}
            preloadedConnection={preloadedConnection}
            onClose={clearSelection}
            onArchive={handleArchive}
          />
        ) : null
      }
    />
  );
}

// ── Provider Tab Empty States ──

function ProviderTabEmptyState({ tab }: { tab: ProviderConnectionTab }) {
  const config: Record<ProviderConnectionTab, { title: string; subtitle: string; icon: React.ReactNode }> = {
    attention: {
      title: "No new leads",
      subtitle: "When a family reaches out, new leads appear here for you to review.",
      icon: (
        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    active: {
      title: "No active leads",
      subtitle: "Leads you've responded to or are in conversation with will show here.",
      icon: (
        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
    past: {
      title: "No past leads",
      subtitle: "Expired, declined, and ended leads will be archived here.",
      icon: (
        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
  };
  const { title, subtitle, icon } = config[tab];
  return (
    <div className="py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100/50 flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <h3 className="text-base font-display font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[320px] mx-auto">{subtitle}</p>
    </div>
  );
}

// ── Connection Grid Card ──

function ConnectionGridCard({
  connection,
  activeProfileId,
  onSelect,
  hasFullAccess,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  onSelect: (id: string) => void;
  hasFullAccess: boolean;
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  const shouldBlur = !hasFullAccess && isInbound;

  const statusConfig = PROVIDER_STATUS_CONFIG[getProviderDisplayStatus(connection, isInbound)];

  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <div className="w-full text-left rounded-2xl bg-white border border-gray-200/80 shadow-sm p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
      <button
        type="button"
        onClick={() => onSelect(connection.id)}
        className="w-full text-left cursor-pointer"
      >
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {imageUrl && !shouldBlur ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={otherName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
              >
                {shouldBlur ? "?" : initial}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
              <span className="text-xs text-gray-400 shrink-0">{createdAt}</span>
            </div>
            <h3 className="text-[15px] font-medium text-gray-900 truncate">
              {shouldBlur ? blurName(otherName) : otherName}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {otherLocation}
            </p>
            {!!(connection.metadata as Record<string, unknown>)?.provider_initiated && (
              <p className="text-xs text-primary-600 mt-1 font-medium">
                You reached out
              </p>
            )}
          </div>
        </div>
      </button>
      <div className="mt-3 pt-3 border-t border-warm-100/60 flex justify-end">
        <Link
          href={`/provider/inbox?id=${connection.id}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Message
        </Link>
      </div>
    </div>
  );
}
