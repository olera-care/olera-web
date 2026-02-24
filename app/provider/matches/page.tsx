"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import ConnectButton from "@/components/shared/ConnectButton";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";

// ── Timeline config ──

const TIMELINE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  immediate: { label: "Immediate", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  within_1_month: { label: "Within 1 month", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  within_3_months: { label: "Within 3 months", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  exploring: { label: "Just exploring", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

// ── Relative time helper ──

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ── Blur name for free tier ──

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

// ── Inline keyframes ──

const floatKeyframes = `
@keyframes matchFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`;

// ── Main page ──

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { membership } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const profileId = providerProfile?.id;

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch families with active care posts + existing connections in parallel
        const [familiesRes, connectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, type, care_types, metadata, image_url, slug, created_at")
            .eq("type", "family")
            .eq("is_active", true)
            .filter("metadata->care_post->>status", "eq", "active")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted"]),
        ]);

        if (familiesRes.error) {
          console.error("[olera] matches fetch error:", familiesRes.error.message);
        }

        setFamilies((familiesRes.data as Profile[]) || []);
        setContactedIds(
          new Set(connectionsRes.data?.map((c) => c.to_profile_id) || [])
        );
      } catch (err) {
        console.error("[olera] matches fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  // Separate contacted vs new families
  const { newFamilies, contactedFamilies } = useMemo(() => {
    const newF: Profile[] = [];
    const contactedF: Profile[] = [];
    for (const f of families) {
      if (contactedIds.has(f.id)) {
        contactedF.push(f);
      } else {
        newF.push(f);
      }
    }
    return { newFamilies: newF, contactedFamilies: contactedF };
  }, [families, contactedIds]);

  // ── Loading skeleton ──

  if (!providerProfile || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                  </div>
                  <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="h-[44px] bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──

  if (families.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-[15px] text-gray-500 mt-1">
            Discover families looking for care in your area
          </p>
        </div>
        <div className="flex flex-col items-center text-center py-16 px-8">
          <div
            className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-5"
            style={{ animation: "matchFloat 3s ease-in-out infinite" }}
          >
            <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            No families found
          </h3>
          <p className="text-[15px] text-gray-500 mt-2 leading-relaxed max-w-[360px]">
            When families publish care posts looking for providers like you,
            they&apos;ll appear here. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Matches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover families looking for care in your area
        </p>
      </div>

      {!hasFullAccess && (
        <div className="mb-6">
          <UpgradePrompt context="view full family details and express interest" />
        </div>
      )}

      {/* New families */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {newFamilies.map((family) => (
          <FamilyCareCard
            key={family.id}
            family={family}
            hasFullAccess={hasFullAccess}
            fromProfileId={profileId!}
          />
        ))}
      </div>

      {/* Already contacted section */}
      {contactedFamilies.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
            Already contacted &middot; {contactedFamilies.length}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {contactedFamilies.map((family) => (
              <FamilyCareCard
                key={family.id}
                family={family}
                hasFullAccess={hasFullAccess}
                fromProfileId={profileId!}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Family Care Card ──

function FamilyCareCard({
  family,
  hasFullAccess,
  fromProfileId,
}: {
  family: Profile;
  hasFullAccess: boolean;
  fromProfileId: string;
}) {
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const relationship = meta?.relationship_to_recipient;
  const aboutSituation = meta?.about_situation;
  const publishedAt = meta?.care_post?.published_at;
  const displayName = family.display_name || "Family";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
      {/* Header: avatar + status + name + location */}
      <div className="flex items-start gap-3.5 mb-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
          style={{ background: hasFullAccess ? avatarGradient(displayName) : "#9ca3af" }}
        >
          {hasFullAccess ? initial : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            {timeline && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                <span className={`w-1.5 h-1.5 rounded-full ${timeline.dot}`} />
                {timeline.label}
              </span>
            )}
            {publishedAt && (
              <span className="text-xs text-gray-400 shrink-0">
                {timeAgo(publishedAt)}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-medium text-gray-900 truncate">
            {hasFullAccess ? displayName : blurName(displayName)}
          </h3>
          {locationStr && (
            <p className="text-sm text-gray-500 truncate">
              {hasFullAccess ? locationStr : "***"}
            </p>
          )}
        </div>
      </div>

      {/* Care needs tags */}
      {careNeeds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {careNeeds.slice(0, 3).map((need) => (
            <span
              key={need}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full"
            >
              {need}
            </span>
          ))}
          {careNeeds.length > 3 && (
            <span className="text-xs text-gray-400">
              +{careNeeds.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* About situation snippet */}
      {aboutSituation && hasFullAccess && (
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {aboutSituation}
        </p>
      )}

      {/* Relationship */}
      {relationship && !aboutSituation && (
        <p className="text-sm text-gray-400 mb-3">
          Care for <span className="text-gray-600">{relationship}</span>
        </p>
      )}

      {/* Upgrade hint for free tier */}
      {!hasFullAccess && (
        <p className="text-xs text-amber-600 font-medium mb-3">
          Upgrade to view full details
        </p>
      )}

      {/* Action */}
      <div className="pt-3 border-t border-gray-100">
        <ConnectButton
          fromProfileId={fromProfileId}
          toProfileId={family.id}
          toName={family.display_name}
          connectionType="request"
          connectionMetadata={{ provider_initiated: true }}
          label="Express Interest"
          sentLabel="Interest Sent"
          fullWidth
          size="sm"
        />
      </div>
    </div>
  );
}
