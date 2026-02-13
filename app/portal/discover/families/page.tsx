"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectButton from "@/components/shared/ConnectButton";
import EmptyState from "@/components/ui/EmptyState";

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "Immediate",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Just exploring",
};

interface ExistingConnection {
  to_profile_id: string;
  status: string;
}

export default function DiscoverFamiliesPage() {
  const { activeProfile, membership } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [existingConnections, setExistingConnections] = useState<
    Map<string, ExistingConnection>
  >(new Map());

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";
  const hasAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const profileId = activeProfile?.id;

  useEffect(() => {
    if (!profileId || !isProvider || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch families and existing outbound connections in parallel
        const [familiesRes, connectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select(
              "id, display_name, city, state, type, care_types, metadata, image_url, slug"
            )
            .eq("type", "family")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("connections")
            .select("to_profile_id, status")
            .eq("from_profile_id", profileId)
            .neq("type", "save"),
        ]);

        if (familiesRes.error) {
          console.error(
            "[olera] discover families error:",
            familiesRes.error.message
          );
          setError(familiesRes.error.message);
        }
        setFamilies((familiesRes.data as Profile[]) || []);

        // Build a map of existing connections by target profile
        if (connectionsRes.data) {
          const map = new Map<string, ExistingConnection>();
          for (const c of connectionsRes.data) {
            map.set(c.to_profile_id, c);
          }
          setExistingConnections(map);
        }
      } catch (err) {
        console.error("[olera] discover families failed:", err);
        setError("Failed to load families.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId, isProvider]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return families;
    const q = search.toLowerCase();
    return families.filter((f) => {
      const name = f.display_name?.toLowerCase() || "";
      const city = f.city?.toLowerCase() || "";
      const state = f.state?.toLowerCase() || "";
      const careTypes = (f.care_types || []).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        careTypes.includes(q)
      );
    });
  }, [families, search]);

  if (!isProvider) {
    return (
      <EmptyState
        title="Provider access required"
        description="Switch to an organization or caregiver profile to browse families."
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading families...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">
          Families Looking for Care
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect with families in your area who are looking for care services.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base flex items-center justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              // Re-trigger useEffect by toggling
              setFamilies([]);
            }}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {!hasAccess && (
        <div className="mb-6">
          <UpgradePrompt context="browse family profiles and initiate contact" />
        </div>
      )}

      {/* Search */}
      {families.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or care type..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No families match your search" : "No families found"}
          description={
            search
              ? "Try adjusting your search terms."
              : "Families who sign up will appear here."
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {filtered.length} famil{filtered.length !== 1 ? "ies" : "y"}
            {search ? " matching" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                hasAccess={hasAccess}
                fromProfileId={activeProfile?.id}
                existingConnection={existingConnections.get(family.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FamilyCard({
  family,
  hasAccess,
  fromProfileId,
  existingConnection,
}: {
  family: Profile;
  hasAccess: boolean;
  fromProfileId?: string;
  existingConnection?: ExistingConnection;
}) {
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline
    ? TIMELINE_LABELS[meta.timeline] || meta.timeline
    : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const initial = family.display_name?.charAt(0).toUpperCase() || "?";

  // Deterministic gradient for avatar
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
  ];
  let hash = 0;
  for (let i = 0; i < family.display_name.length; i++) {
    hash = family.display_name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradient = gradients[Math.abs(hash) % gradients.length];

  const alreadyConnected = !!existingConnection;
  const connectionStatus = existingConnection?.status;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="p-5">
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ background: hasAccess ? gradient : "#9ca3af" }}
          >
            {hasAccess ? initial : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 leading-snug">
              {hasAccess ? family.display_name : blurName(family.display_name)}
            </h3>
            {locationStr && (
              <p className="text-sm text-gray-500 mt-0.5">
                {hasAccess ? locationStr : "***"}
              </p>
            )}
          </div>
          {/* Connection status indicator */}
          {alreadyConnected && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                connectionStatus === "accepted"
                  ? "bg-emerald-50 text-emerald-700"
                  : connectionStatus === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "accepted"
                    ? "bg-emerald-400"
                    : connectionStatus === "pending"
                    ? "bg-amber-400"
                    : "bg-gray-400"
                }`}
              />
              {connectionStatus === "accepted"
                ? "Connected"
                : connectionStatus === "pending"
                ? "Pending"
                : connectionStatus === "declined"
                ? "Declined"
                : "Sent"}
            </span>
          )}
        </div>

        {timeline && hasAccess && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium text-gray-500">Timeline:</span>{" "}
            {timeline}
          </p>
        )}

        {careNeeds.length > 0 && hasAccess && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {careNeeds.map((need) => (
              <span
                key={need}
                className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-lg"
              >
                {need}
              </span>
            ))}
          </div>
        )}

        {!hasAccess && (
          <p className="text-sm text-warm-600 font-medium mt-3">
            Upgrade to Pro to view full details and reach out.
          </p>
        )}

        {hasAccess && fromProfileId && !alreadyConnected && (
          <div className="mt-3">
            <ConnectButton
              fromProfileId={fromProfileId}
              toProfileId={family.id}
              toName={family.display_name}
              toProfileType="family"
              connectionType="inquiry"
              label="Connect"
              sentLabel="Request Sent"
              fullWidth
            />
          </div>
        )}

        {hasAccess && alreadyConnected && (
          <div className="mt-3">
            <Link
              href="/portal/connections"
              className={`block w-full text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                connectionStatus === "accepted"
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {connectionStatus === "accepted"
                ? "Message"
                : connectionStatus === "pending"
                ? "Awaiting reply"
                : "View connection"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}
