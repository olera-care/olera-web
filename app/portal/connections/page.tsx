"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectionDrawer from "@/components/portal/ConnectionDrawer";

interface ConnectionWithProfile extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

// ── Parse connection.message JSON ──
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

// ── Deterministic gradient for fallback avatars ──
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

export default function ConnectionsPage() {
  const { activeProfile, membership } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer state
  const [drawerConnectionId, setDrawerConnectionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // ── Group connections ──
  const grouped = groupConnections(connections, activeProfile?.id || "", isProvider);

  const openDrawer = (id: string) => {
    setDrawerConnectionId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Delay clearing connectionId so the close animation finishes
    setTimeout(() => setDrawerConnectionId(null), 300);
  };

  const handleStatusChange = (connectionId: string, newStatus: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connectionId ? { ...c, status: newStatus as Connection["status"] } : c
      )
    );
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500 text-base">Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base flex items-center justify-between"
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

      {connections.length === 0 ? (
        <EmptyState
          title="No connections yet"
          description={
            isProvider
              ? "When families or caregivers reach out, their connections will appear here."
              : "Browse providers and connect to get started."
          }
          action={
            !isProvider ? (
              <Link href="/browse">
                <Button>Browse Providers</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div>
          {grouped.needsAttention.length > 0 && (
            <ConnectionGroup
              title="Needs Attention"
              icon={
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                  <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              }
              connections={grouped.needsAttention}
              activeProfileId={activeProfile?.id || ""}
              isProvider={isProvider}
              hasFullAccess={hasFullAccess}
              onSelect={openDrawer}
              variant="attention"
            />
          )}

          {grouped.active.length > 0 && (
            <ConnectionGroup
              title="Active"
              connections={grouped.active}
              activeProfileId={activeProfile?.id || ""}
              isProvider={isProvider}
              hasFullAccess={hasFullAccess}
              onSelect={openDrawer}
            />
          )}

          {grouped.past.length > 0 && (
            <ConnectionGroup
              title="Past"
              connections={grouped.past}
              activeProfileId={activeProfile?.id || ""}
              isProvider={isProvider}
              hasFullAccess={hasFullAccess}
              onSelect={openDrawer}
              variant="muted"
            />
          )}

          {isProvider && !hasFullAccess && connections.length > 0 && (
            <div className="mt-6">
              <UpgradePrompt context="view full details and respond to connections" />
            </div>
          )}
        </div>
      )}

      {/* Connection Drawer */}
      <ConnectionDrawer
        connectionId={drawerConnectionId}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

// ── Grouping Logic ──

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

// ── Connection Group ──

function ConnectionGroup({
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
      <div className="space-y-2">
        {connections.map((connection) => (
          <ConnectionCard
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

// ── Connection Card ──

function ConnectionCard({
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
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="shrink-0">
            {imageUrl && !shouldBlur ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={otherName}
                className="w-11 h-11 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
                style={{ background: shouldBlur ? "#9ca3af" : avatarGradient(otherName) }}
              >
                {shouldBlur ? "?" : initial}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {variant === "attention" && (
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                  </svg>
                )}
                <h3 className="text-base font-semibold text-gray-900 truncate leading-snug">
                  {shouldBlur ? blurName(otherName) : otherName}
                </h3>
              </div>
              <Badge variant={badge.variant} className="!text-xs !px-2.5 !py-0.5 shrink-0">
                {badge.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {careTypeLabel} &middot; {createdAt}
              {!shouldBlur && otherLocation ? ` \u00b7 ${otherLocation}` : ""}
            </p>
          </div>

          {/* Chevron */}
          <svg className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
