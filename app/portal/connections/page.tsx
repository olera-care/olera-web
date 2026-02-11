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
  const [responding, setResponding] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

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
            "id, display_name, city, state, type, email, phone, slug, image_url"
          )
          .in("id", Array.from(profileIds));
        profiles = (profileData as Profile[]) || [];
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

  const handleStatusUpdate = async (
    connectionId: string,
    newStatus: "accepted" | "declined" | "archived"
  ) => {
    if (!isSupabaseConfigured() || !activeProfile) return;

    setResponding(connectionId);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connectionId)
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`);

      if (updateError) throw new Error(updateError.message);

      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, status: newStatus } : c
        )
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setResponding(null);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        <p className="text-lg text-gray-600 mt-1">
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
        <div className="space-y-4">
          {filtered.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              activeProfileId={activeProfile?.id || ""}
              isProvider={!!isProvider}
              hasFullAccess={hasFullAccess}
              responding={responding === connection.id}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {isProvider && !hasFullAccess && connections.length > 0 && (
        <div className="mt-8">
          <UpgradePrompt context="view full details and respond to connections" />
        </div>
      )}
    </div>
  );
}

/** Parse the connection message JSON and extract human-readable notes */
function parseConnectionMessage(message: string | null): string | null {
  if (!message) return null;
  try {
    const parsed = JSON.parse(message);
    // Show additional_notes if provided by the user
    if (parsed.additional_notes && typeof parsed.additional_notes === "string") {
      return parsed.additional_notes;
    }
    return null;
  } catch {
    // If it's not JSON (plain text message), return as-is
    return message;
  }
}

/** Extract care type from the connection message JSON */
function parseCareType(message: string | null): string | null {
  if (!message) return null;
  try {
    const parsed = JSON.parse(message);
    const raw = parsed.care_type;
    if (!raw || typeof raw !== "string") return null;
    return raw
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  } catch {
    return null;
  }
}

function ConnectionCard({
  connection,
  activeProfileId,
  isProvider,
  hasFullAccess,
  responding,
  onStatusUpdate,
}: {
  connection: ConnectionWithProfile;
  activeProfileId: string;
  isProvider: boolean;
  hasFullAccess: boolean;
  responding: boolean;
  onStatusUpdate: (id: string, status: "accepted" | "declined" | "archived") => void;
}) {
  const isInbound = connection.to_profile_id === activeProfileId;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const otherName = otherProfile?.display_name || "Unknown";
  const otherLocation = [otherProfile?.city, otherProfile?.state]
    .filter(Boolean)
    .join(", ");

  const typeLabel =
    connection.type === "inquiry"
      ? isInbound ? "Received" : "Sent"
      : connection.type === "invitation"
      ? isInbound ? "Received" : "Sent"
      : connection.type === "application"
      ? isInbound ? "Received" : "Sent"
      : "";

  const typeIcon =
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
  const noteText = parseConnectionMessage(connection.message);
  const careType = parseCareType(connection.message);
  const imageUrl = otherProfile?.image_url;
  const initial = otherName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-sm hover:border-gray-300 transition-all duration-150">
      <Link
        href={`/portal/connections/${connection.id}`}
        className="block px-5 py-4"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {imageUrl && !shouldBlur ? (
              <img
                src={imageUrl}
                alt={otherName}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-base font-bold">
                {shouldBlur ? "?" : initial}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {shouldBlur ? blurName(otherName) : otherName}
              </h3>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              {otherLocation && !shouldBlur && (
                <span>{otherLocation}</span>
              )}
              {otherLocation && !shouldBlur && careType && (
                <span className="text-gray-300">&middot;</span>
              )}
              {careType && !shouldBlur && (
                <span>{careType}</span>
              )}
              {shouldBlur && <span>***</span>}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{typeIcon} {typeLabel}</span>
              <span className="text-gray-300">&middot;</span>
              <span>{createdAt}</span>
            </div>

            {noteText && (
              <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                {shouldBlur ? blurText(noteText) : noteText}
              </p>
            )}

            {shouldBlur && (
              <p className="mt-2 text-xs text-warm-600 font-medium">
                Upgrade to see full details
              </p>
            )}
          </div>

          {/* Chevron */}
          <svg className="w-5 h-5 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Quick actions — outside the link */}
      {isInbound && hasFullAccess && connection.status === "pending" && (
        <div className="px-5 pb-4 -mt-1 flex gap-2">
          <Button
            size="sm"
            onClick={() => onStatusUpdate(connection.id, "accepted")}
            loading={responding}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onStatusUpdate(connection.id, "declined")}
            loading={responding}
          >
            Decline
          </Button>
        </div>
      )}

      {/* Accepted: quick actions */}
      {connection.status === "accepted" && otherProfile && !shouldBlur && (
        <div className="px-5 pb-4 -mt-1 flex gap-2 flex-wrap">
          {otherProfile.email && (
            <a
              href={`mailto:${otherProfile.email}?subject=${encodeURIComponent(`Schedule a meeting — ${otherProfile.display_name}`)}`}
              className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </a>
          )}
          {otherProfile.phone && (
            <a
              href={`tel:${otherProfile.phone}`}
              className="inline-flex items-center gap-1.5 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Call
            </a>
          )}
          {otherProfile.slug && (
            <Link
              href={`/provider/${otherProfile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function blurName(name: string): string {
  if (!name) return "***";
  const parts = name.split(" ");
  return parts.map((p) => p.charAt(0) + "***").join(" ");
}

function blurText(text: string): string {
  if (!text) return "";
  if (text.length <= 20) return "*".repeat(text.length);
  return text.substring(0, 20) + "...";
}
