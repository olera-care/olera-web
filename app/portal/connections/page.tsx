"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, ConnectionStatus, Profile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectionDrawer from "@/components/portal/ConnectionDrawer";

interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

type TabKey = "all" | "inquiry" | "invitation" | "application";

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  inquiry: "Inquiries",
  invitation: "Invitations",
  application: "Applications",
};

export default function ConnectionsPage() {
  const { activeProfile, membership } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const fetchConnections = useCallback(async () => {
    if (!activeProfile || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const cols =
        "id, type, status, from_profile_id, to_profile_id, message, created_at, updated_at";

      // Two parallel eq queries instead of one OR — each uses its own index
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

      // Merge and dedupe (a connection could match both directions)
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

      // Fetch associated profiles in one batch
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
            "id, display_name, city, state, type, email, phone, slug, image_url, source_provider_id"
          )
          .in("id", Array.from(profileIds));
        profiles = (profileData as Profile[]) || [];

        // For profiles missing image_url, try to get image from iOS olera-providers
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

  // Filter connections by tab
  const filtered =
    activeTab === "all"
      ? connections
      : connections.filter((c) => c.type === activeTab);

  // Determine which tabs to show based on what connection types exist
  const typeCounts: Record<string, number> = {};
  connections.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  const availableTabs: TabKey[] = ["all"];
  if (typeCounts["inquiry"]) availableTabs.push("inquiry");
  if (typeCounts["invitation"]) availableTabs.push("invitation");
  if (typeCounts["application"]) availableTabs.push("application");

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading connections...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-lg text-gray-600">
          {isProvider
            ? "Manage inquiries, invitations, and applications."
            : "Your connections with care providers."}
        </p>
      </div>

      {error && (
        <div
          className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base flex items-center justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(""); setLoading(true); fetchConnections(); }}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs — only show if there are multiple types */}
      {availableTabs.length > 2 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                activeTab === tab
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {TAB_LABELS[tab]}
              {tab !== "all" && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({typeCounts[tab] || 0})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={
            activeTab === "all"
              ? "No connections yet"
              : `No ${TAB_LABELS[activeTab].toLowerCase()} yet`
          }
          description={
            isProvider
              ? "When families or caregivers reach out, their connections will appear here."
              : "Browse providers and connect to get started."
          }
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              activeProfileId={activeProfile?.id || ""}
              isProvider={!!isProvider}
              hasFullAccess={hasFullAccess}
              onSelect={setSelectedConnectionId}
            />
          ))}
        </div>
      )}

      {isProvider && !hasFullAccess && connections.length > 0 && (
        <div className="mt-8">
          <UpgradePrompt context="view full details and respond to connections" />
        </div>
      )}

      <ConnectionDrawer
        connectionId={selectedConnectionId}
        isOpen={!!selectedConnectionId}
        onClose={() => setSelectedConnectionId(null)}
        onStatusChange={(connectionId: string, newStatus: ConnectionStatus) => {
          setConnections((prev) =>
            prev.map((c) =>
              c.id === connectionId ? { ...c, status: newStatus } : c
            )
          );
        }}
      />
    </div>
  );
}

function ConnectionCard({
  connection,
  activeProfileId,
  isProvider,
  hasFullAccess,
  onSelect,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  onSelect: (id: string) => void;
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  const typeLabel =
    connection.type === "inquiry" ? "Inquiry"
    : connection.type === "invitation" ? "Invitation"
    : connection.type === "application" ? "Application"
    : connection.type;

  const statusBadge: Record<string, { variant: "default" | "pending" | "verified" | "trial"; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "verified", label: "Accepted" },
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
    <div className="bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
      <button
        type="button"
        onClick={() => onSelect(connection.id)}
        className="block w-full text-left px-3.5 py-2.5 cursor-pointer bg-transparent border-none"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            {imageUrl && !shouldBlur ? (
              <img
                src={imageUrl}
                alt={otherName}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
              >
                {shouldBlur ? "?" : initial}
              </div>
            )}
          </div>

          {/* Content — two lines */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                {shouldBlur ? blurName(otherName) : otherName}
              </h3>
              <Badge variant={badge.variant} className="!text-xs !px-2 !py-0.5 shrink-0">
                {badge.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {typeLabel} · {createdAt}
              {!shouldBlur && otherLocation ? ` · ${otherLocation}` : ""}
            </p>
          </div>

          {/* Chevron */}
          <svg className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  );
}

function blurName(name: string): string {
  if (!name) return "***";
  const parts = name.split(" ");
  return parts.map((p) => p.charAt(0) + "***").join(" ");
}

/** Deterministic gradient for fallback avatars based on name */
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
