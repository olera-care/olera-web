"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile, OrganizationMetadata } from "@/lib/types";
import ConnectButton from "@/components/shared/ConnectButton";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import EmptyState from "@/components/ui/EmptyState";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function computeMatchingServices(
  orgServices: string[],
  providerServices: string[],
): number {
  if (!orgServices.length || !providerServices.length) return 0;
  const providerSet = new Set(providerServices.map((s) => s.toLowerCase()));
  return orgServices.filter((n) => providerSet.has(n.toLowerCase())).length;
}

export default function OrganizationsTab({
  providerCareTypes = [],
  onCountChange,
}: {
  providerCareTypes?: string[];
  onCountChange?: (count: number) => void;
}) {
  const { activeProfile, membership } = useAuth();
  const [orgs, setOrgs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = canEngage(
    activeProfile?.type,
    membership,
    "initiate_contact"
  );

  const profileId = activeProfile?.id;

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchOrgs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("business_profiles")
          .select("id, display_name, city, state, type, care_types, metadata, image_url, slug")
          .eq("type", "organization")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) console.error("[olera] discover orgs error:", error.message);
        const result = (data as Profile[]) || [];
        setOrgs(result);
        onCountChange?.(result.length);
      } catch (err) {
        console.error("[olera] discover orgs failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, [profileId]);

  // Sort orgs by match quality
  const sortedOrgs = useMemo(() => {
    return [...orgs].sort((a, b) => {
      const matchA = computeMatchingServices(a.care_types, providerCareTypes);
      const matchB = computeMatchingServices(b.care_types, providerCareTypes);
      return matchB - matchA;
    });
  }, [orgs, providerCareTypes]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div>
      {!hasAccess && (
        <div className="mb-8">
          <UpgradePrompt context="apply to organizations and share your profile" />
        </div>
      )}

      {sortedOrgs.length === 0 ? (
        <EmptyState
          title="No organizations found"
          description="Organizations who sign up will appear here."
        />
      ) : (
        <div className="space-y-5">
          {sortedOrgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              fromProfileId={activeProfile?.id}
              providerCareTypes={providerCareTypes}
              hasAccess={hasAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standardized org card — matches family card layout
// ---------------------------------------------------------------------------

function OrgCard({
  org,
  fromProfileId,
  providerCareTypes,
  hasAccess,
}: {
  org: Profile;
  fromProfileId?: string;
  providerCareTypes: string[];
  hasAccess: boolean;
}) {
  const meta = org.metadata as OrganizationMetadata;
  const locationStr = [org.city, org.state].filter(Boolean).join(", ");
  const matchCount = computeMatchingServices(org.care_types, providerCareTypes);
  const matchingNames = org.care_types.filter((n) =>
    providerCareTypes.some((s) => s.toLowerCase() === n.toLowerCase())
  );
  const initials = getInitials(org.display_name || "O");

  const matchContext = matchCount >= 2
    ? `Strong match — hiring for ${matchingNames.slice(0, 2).join(" and ")}`
    : matchCount === 1
    ? `Good match — hiring for ${matchingNames[0]}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 overflow-hidden transition-[border-color,box-shadow] duration-300">
      <div className="p-4 lg:p-7">
        {/* Header */}
        <div className="flex items-start gap-3 lg:gap-4 mb-4 lg:mb-5">
          <div
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 text-sm lg:text-[15px] font-bold text-white shadow-sm"
            style={{ background: avatarGradient(org.display_name || "O") }}
          >
            {org.image_url ? (
              <img src={org.image_url} alt="" className="w-full h-full object-cover rounded-xl lg:rounded-2xl" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base lg:text-lg font-display font-bold text-gray-900 truncate leading-tight">
              {org.display_name}
            </h3>
            {locationStr && (
              <p className="text-xs lg:text-[13px] text-gray-500 mt-0.5 lg:mt-1">{locationStr}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border border-primary-100 text-primary-600 bg-primary-50/50">
              Hiring
            </span>
          </div>
        </div>

        {/* Match context */}
        {matchContext && (
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4 lg:mb-5 ${
            matchCount >= 2
              ? "bg-primary-50/60 border border-primary-100/60"
              : "bg-warm-50/60 border border-warm-100/60"
          }`}>
            <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className={`text-[13px] font-medium ${matchCount >= 2 ? "text-primary-700" : "text-gray-600"}`}>
              {matchContext}
            </p>
          </div>
        )}

        {/* Care type pills */}
        {org.care_types.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {org.care_types.slice(0, 4).map((type) => {
              const isMatch = providerCareTypes.some(
                (s) => s.toLowerCase() === type.toLowerCase(),
              );
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border ${
                    isMatch
                      ? "border-[#F5F4F1] text-gray-700 bg-[#F5F4F1]"
                      : "border-warm-100 text-gray-500 bg-white"
                  }`}
                >
                  {isMatch && (
                    <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {type}
                </span>
              );
            })}
            {org.care_types.length > 4 && (
              <span className="text-xs text-gray-400 self-center pl-1">
                +{org.care_types.length - 4}
              </span>
            )}
          </div>
        )}

        {meta?.staff_count && (
          <p className="text-[13px] text-gray-500 mb-2">
            {meta.staff_count} staff members
          </p>
        )}
      </div>

      {/* Footer with action */}
      <div className="bg-warm-50/40 border-t border-warm-100/60 px-4 lg:px-7 py-3 lg:py-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {org.slug && (
          <Link
            href={`/provider/${org.slug}`}
            target="_blank"
            className="hidden lg:inline-flex items-center text-[13px] font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            View organization &rarr;
          </Link>
        )}
        {fromProfileId && hasAccess ? (
          <div className="w-full lg:w-auto">
            <ConnectButton
              fromProfileId={fromProfileId}
              toProfileId={org.id}
              toName={org.display_name}
              connectionType="application"
              label="Apply"
              sentLabel="Applied"
            />
          </div>
        ) : !hasAccess ? (
          <p className="text-xs text-gray-400 text-center lg:text-right">
            Upgrade to apply to organizations
          </p>
        ) : null}
      </div>
    </div>
  );
}
