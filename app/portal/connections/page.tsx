"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectionDrawer from "@/components/portal/ConnectionDrawer";
import ConnectionDetailPanel from "@/components/portal/ConnectionDetailPanel";
import type { ConnectionWithProfile } from "@/components/portal/ConnectionDetailPanel";
import {
  getFamilyDisplayStatus,
  getConnectionTab,
  isConnectionUnread,
  FAMILY_STATUS_CONFIG,
  type ConnectionTab,
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
  const router = useRouter();
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

  // ── Family-specific state ──
  const [activeTab, setActiveTab] = useState<ConnectionTab>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  // ── Provider drawer state (kept for provider view) ──
  const [drawerConnectionId, setDrawerConnectionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // ── Tab grouping (family view) ──
  const tabbed = useMemo(() => {
    const active: ConnectionWithProfile[] = [];
    const responded: ConnectionWithProfile[] = [];
    const past: ConnectionWithProfile[] = [];

    for (const c of connections) {
      // Hide soft-deleted connections
      if (c.metadata?.hidden) continue;

      const displayStatus = getFamilyDisplayStatus(c);
      const tab = getConnectionTab(displayStatus);

      if (tab === "active") active.push(c);
      else if (tab === "responded") responded.push(c);
      else past.push(c);
    }

    return { active, responded, past };
  }, [connections]);

  // Unread count for responded tab
  const unreadCount = useMemo(
    () => tabbed.responded.filter((c) => isConnectionUnread(c, readIds)).length,
    [tabbed.responded, readIds]
  );

  // ── Provider grouping (preserved) ──
  const providerGrouped = useMemo(
    () => groupConnections(connections, activeProfile?.id || "", isProvider),
    [connections, activeProfile?.id, isProvider]
  );

  // ── Handlers ──

  const handleSelectFamily = (id: string) => {
    setSelectedId(id);
    // Mark as read
    const conn = connections.find((c) => c.id === id);
    if (conn && conn.status === "accepted" && !readIds.has(id)) {
      const updated = new Set(readIds);
      updated.add(id);
      setReadIds(updated);
      persistReadIds(updated);
    }
  };

  // Mobile: navigate to detail page
  const handleSelectMobile = (id: string) => {
    router.push(`/portal/connections/${id}`);
  };

  const handleWithdraw = async (connectionId: string) => {
    try {
      const res = await fetch("/api/connections/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to withdraw");
      }
      // Update local state
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, status: "expired" as Connection["status"], metadata: { ...c.metadata, withdrawn: true } }
            : c
        )
      );
      setSelectedId(null);
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleHide = async (connectionId: string) => {
    try {
      const res = await fetch("/api/connections/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove");
      }
      // Update local state
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId
            ? { ...c, metadata: { ...c.metadata, hidden: true } }
            : c
        )
      );
      setSelectedId(null);
    } catch (err) {
      console.error("Hide error:", err);
    }
  };

  const handleConnectAgain = async (connection: ConnectionWithProfile) => {
    // Navigate to the provider page where they can send a new request
    const profile = connection.toProfile;
    if (profile?.slug) {
      router.push(`/provider/${profile.slug}`);
    } else if (profile?.source_provider_id) {
      router.push(`/providers/${profile.source_provider_id}`);
    }
  };

  // Provider drawer handlers
  const openDrawer = (id: string) => {
    setDrawerConnectionId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerConnectionId(null), 300);
  };

  const handleStatusChange = (connectionId: string, newStatus: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: newStatus as Connection["status"] } : c
      )
    );
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

  // ── Provider view (preserved) ──

  if (isProvider) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base flex items-center justify-between" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => { setError(""); setLoading(true); fetchConnections(); }} className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-4">Retry</button>
          </div>
        )}

        {connections.length === 0 ? (
          <EmptyState
            title="No connections yet"
            description="When families or caregivers reach out, their connections will appear here."
          />
        ) : (
          <div>
            {providerGrouped.needsAttention.length > 0 && (
              <ProviderConnectionGroup
                title="Needs Attention"
                icon={<svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" /><path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>}
                connections={providerGrouped.needsAttention}
                activeProfileId={activeProfile?.id || ""}
                isProvider={true}
                hasFullAccess={hasFullAccess}
                onSelect={openDrawer}
                variant="attention"
              />
            )}
            {providerGrouped.active.length > 0 && (
              <ProviderConnectionGroup title="Active" connections={providerGrouped.active} activeProfileId={activeProfile?.id || ""} isProvider={true} hasFullAccess={hasFullAccess} onSelect={openDrawer} />
            )}
            {providerGrouped.past.length > 0 && (
              <ProviderConnectionGroup title="Past" connections={providerGrouped.past} activeProfileId={activeProfile?.id || ""} isProvider={true} hasFullAccess={hasFullAccess} onSelect={openDrawer} variant="muted" />
            )}
            {!hasFullAccess && connections.length > 0 && (
              <div className="mt-6"><UpgradePrompt context="view full details and respond to connections" /></div>
            )}
          </div>
        )}

        <ConnectionDrawer connectionId={drawerConnectionId} isOpen={drawerOpen} onClose={closeDrawer} onStatusChange={handleStatusChange} />
      </div>
    );
  }

  // ── Family view — 3-tab split layout ──

  const selectedConnection = selectedId
    ? connections.find((c) => c.id === selectedId) || null
    : null;

  const currentTabConnections = tabbed[activeTab];

  const tabs: { id: ConnectionTab; label: string; count: number; badge: number }[] = [
    { id: "active", label: "Active", count: tabbed.active.length, badge: 0 },
    { id: "responded", label: "Responded", count: tabbed.responded.length, badge: unreadCount },
    { id: "past", label: "Past", count: tabbed.past.length, badge: 0 },
  ];

  if (connections.length === 0 && !error) {
    return (
      <EmptyState
        title="No connections yet"
        description="Browse providers and connect to get started."
        action={
          <Link href="/browse">
            <Button>Browse Providers</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base flex items-center justify-between mb-4" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); fetchConnections(); }} className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-4">Retry</button>
        </div>
      )}

      {/* Split layout — hidden on mobile, show list-only on small screens */}
      <div className="hidden lg:flex" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* ── Left Panel: List ── */}
        <div className="w-[380px] shrink-0 flex flex-col">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-[22px] font-bold text-gray-900">My Connections</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your care provider requests and responses.
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-0.5 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setSelectedId(null); }}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all relative",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {tab.label}
                <span className={[
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                  activeTab === tab.id ? "text-gray-600 bg-gray-100" : "text-gray-400",
                ].join(" ")}>
                  {tab.count}
                </span>
                {tab.badge > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            ))}
          </div>

          {/* Connection list */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-1.5">
            {currentTabConnections.length === 0 ? (
              <TabEmptyState tab={activeTab} />
            ) : (
              currentTabConnections.map((connection) => {
                const unread = isConnectionUnread(connection, readIds);
                return (
                  <FamilyConnectionCard
                    key={connection.id}
                    connection={connection}
                    activeProfileId={activeProfile?.id || ""}
                    selected={selectedId === connection.id}
                    unread={unread}
                    onSelect={handleSelectFamily}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Panel: Detail ── */}
        <div className="flex-1 min-w-0">
          {selectedConnection ? (
            <ConnectionDetailPanel
              connection={selectedConnection}
              activeProfileId={activeProfile?.id || ""}
              onClose={() => setSelectedId(null)}
              onWithdraw={handleWithdraw}
              onHide={handleHide}
              onConnectAgain={handleConnectAgain}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-l border-gray-200">
              <div className="text-center px-10">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-gray-500">Select a connection</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click on a provider to view the conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile layout — list only ── */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">My Connections</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your care provider requests and responses.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-0.5 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all relative",
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
              <span className={[
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                activeTab === tab.id ? "text-gray-600 bg-gray-100" : "text-gray-400",
              ].join(" ")}>
                {tab.count}
              </span>
              {tab.badge > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* Connection list */}
        <div className="space-y-1.5">
          {currentTabConnections.length === 0 ? (
            <TabEmptyState tab={activeTab} />
          ) : (
            currentTabConnections.map((connection) => {
              const unread = isConnectionUnread(connection, readIds);
              return (
                <FamilyConnectionCard
                  key={connection.id}
                  connection={connection}
                  activeProfileId={activeProfile?.id || ""}
                  selected={false}
                  unread={unread}
                  onSelect={handleSelectMobile}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab Empty States ──

function TabEmptyState({ tab }: { tab: ConnectionTab }) {
  const messages: Record<ConnectionTab, { title: string; subtitle: string }> = {
    active: {
      title: "No active requests.",
      subtitle: "Pending and viewed connections appear here.",
    },
    responded: {
      title: "No responses yet.",
      subtitle: "When a provider replies, you\u2019ll see it here.",
    },
    past: {
      title: "No past connections.",
      subtitle: "Expired, withdrawn, and declined connections appear here.",
    },
  };
  const msg = messages[tab];
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-500">{msg.title}</p>
      <p className="text-xs text-gray-400 mt-1">{msg.subtitle}</p>
    </div>
  );
}

// ── Family Connection Card ──

function FamilyConnectionCard({
  connection,
  activeProfileId,
  selected,
  unread,
  onSelect,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  selected: boolean;
  unread: boolean;
  onSelect: (id: string) => void;
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

  const displayStatus = getFamilyDisplayStatus(connection);
  const statusConfig = FAMILY_STATUS_CONFIG[displayStatus];

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
      className={[
        "w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all",
        selected
          ? "bg-emerald-50/50 border-emerald-600/30"
          : "bg-white border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={otherName}
            className="w-11 h-11 rounded-xl object-cover"
          />
        ) : (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
            style={{ background: avatarGradient(otherName) }}
          >
            {initial}
          </div>
        )}
        {unread && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span
          className={[
            "text-sm text-gray-900 truncate block leading-snug",
            unread ? "font-bold" : "font-semibold",
          ].join(" ")}
        >
          {otherName}
        </span>
        <span className="text-xs text-gray-500 block truncate">{careTypeLabel}</span>
        <span className="text-[11px] text-gray-400 block mt-0.5">
          {createdAt}{otherLocation ? ` \u00b7 ${otherLocation}` : ""}
        </span>
      </div>

      {/* Status badge */}
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${statusConfig.bg} ${statusConfig.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
        {statusConfig.label}
      </span>
    </button>
  );
}

// ── Provider Grouping (preserved from original) ──

function groupConnections(
  connections: ConnectionWithProfile[],
  activeProfileId: string,
  isProvider: boolean
): {
  needsAttention: ConnectionWithProfile[];
  active: ConnectionWithProfile[];
  past: ConnectionWithProfile[];
} {
  const needsAttention: ConnectionWithProfile[] = [];
  const active: ConnectionWithProfile[] = [];
  const past: ConnectionWithProfile[] = [];

  for (const c of connections) {
    if (c.status === "declined" || c.status === "archived") {
      past.push(c);
    } else if (isProvider) {
      const isInbound = c.to_profile_id === activeProfileId;
      if (c.status === "pending" && isInbound) {
        needsAttention.push(c);
      } else {
        active.push(c);
      }
    } else {
      if (c.status === "accepted") {
        needsAttention.push(c);
      } else {
        active.push(c);
      }
    }
  }

  return { needsAttention, active, past };
}

// ── Provider Connection Group (preserved from original) ──

function ProviderConnectionGroup({
  title,
  icon,
  connections,
  activeProfileId,
  isProvider,
  hasFullAccess,
  onSelect,
  variant = "normal",
}: {
  title: string;
  icon?: React.ReactNode;
  connections: ConnectionWithProfile[];
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  onSelect: (id: string) => void;
  variant?: "normal" | "attention" | "muted";
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        {icon}
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${
          variant === "muted" ? "text-gray-400" : "text-gray-500"
        }`}>
          {title}
        </h3>
        <span className="text-sm text-gray-400">({connections.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {connections.map((connection) => (
          <ProviderConnectionCard
            key={connection.id}
            connection={connection}
            activeProfileId={activeProfileId}
            isProvider={isProvider}
            hasFullAccess={hasFullAccess}
            onSelect={onSelect}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

// ── Provider Connection Card (preserved from original) ──

function ProviderConnectionCard({
  connection,
  activeProfileId,
  isProvider,
  hasFullAccess,
  onSelect,
  variant,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  onSelect: (id: string) => void;
  variant: "normal" | "attention" | "muted";
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  const parsedMsg = parseMessage(connection.message);
  const careTypeLabel = parsedMsg?.careType || connection.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const statusBadge: Record<string, { variant: "default" | "pending" | "verified" | "trial"; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "verified", label: "Responded" },
    declined: { variant: "default", label: "Declined" },
    archived: { variant: "default", label: "Archived" },
  };
  const badge = statusBadge[connection.status] || statusBadge.pending;

  const createdAt = new Date(connection.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  const shouldBlur = isProvider && !hasFullAccess && isInbound;
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(connection.id)}
      className={`w-full text-left rounded-xl border transition-colors group cursor-pointer ${
        variant === "attention"
          ? "border-amber-100 bg-amber-50/30 hover:bg-amber-50/60"
          : variant === "muted"
          ? "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 mt-0.5">
            {imageUrl && !shouldBlur ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={otherName} className="w-11 h-11 rounded-xl object-cover" />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
                style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
              >
                {shouldBlur ? "?" : initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 leading-tight">{careTypeLabel}</p>
                <div className="flex items-center gap-1.5">
                  {variant === "attention" && (
                    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                    </svg>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 truncate leading-snug">
                    {shouldBlur ? blurName(otherName) : otherName}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {createdAt}
                  {!shouldBlur && otherLocation ? ` \u00b7 ${otherLocation}` : ""}
                </p>
              </div>
              <Badge variant={badge.variant} className="!text-xs !px-2.5 !py-0.5 shrink-0 mt-0.5">
                {badge.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
