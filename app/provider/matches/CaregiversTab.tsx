"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile, CaregiverMetadata } from "@/lib/types";
import ConnectButton from "@/components/shared/ConnectButton";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import EmptyState from "@/components/ui/EmptyState";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import { CAREGIVER_SKILL_LABELS } from "@/lib/constants/caregiver-skills";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

export default function CaregiversTab() {
  const { activeProfile, membership } = useAuth();
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
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

    const fetchCaregivers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("business_profiles")
          .select("id, display_name, city, state, type, care_types, metadata, image_url, slug")
          .eq("type", "caregiver")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) console.error("[olera] discover caregivers error:", error.message);
        setCaregivers((data as Profile[]) || []);
      } catch (err) {
        console.error("[olera] discover caregivers failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaregivers();
  }, [profileId]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading caregivers...</p>
      </div>
    );
  }

  return (
    <div>
      {!hasAccess && (
        <div className="mb-8">
          <UpgradePrompt context="browse caregiver profiles and send invitations" />
        </div>
      )}

      {caregivers.length === 0 ? (
        <EmptyState
          title="No caregivers found yet"
          description="Professional caregivers who sign up will appear here. Check back soon."
        />
      ) : (
        <div className="space-y-5">
          {caregivers.map((cg) => (
            <CaregiverMatchCard
              key={cg.id}
              caregiver={cg}
              hasAccess={hasAccess}
              fromProfileId={activeProfile?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standardized caregiver card — matches family card layout
// ---------------------------------------------------------------------------

function CaregiverMatchCard({
  caregiver,
  hasAccess,
  fromProfileId,
}: {
  caregiver: Profile;
  hasAccess: boolean;
  fromProfileId?: string;
}) {
  const meta = caregiver.metadata as CaregiverMetadata;
  const locationStr = [caregiver.city, caregiver.state].filter(Boolean).join(", ");
  const experience = meta?.years_experience;
  const certifications = meta?.certifications || [];
  const rateStr =
    meta?.hourly_rate_min && meta?.hourly_rate_max
      ? `$${meta.hourly_rate_min}–${meta.hourly_rate_max}/hr`
      : null;
  const displayName = caregiver.display_name || "Caregiver";
  const initials = getInitials(displayName);

  // Skills as readable labels
  const skillLabels = caregiver.care_types.map(
    (t) => CAREGIVER_SKILL_LABELS[t] || t
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 overflow-hidden transition-[border-color,box-shadow] duration-300">
      <div className="p-4 lg:p-7">
        {/* Header */}
        <div className="flex items-start gap-3 lg:gap-4 mb-4 lg:mb-5">
          <div
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 text-sm lg:text-[15px] font-bold text-white shadow-sm"
            style={{ background: hasAccess ? avatarGradient(displayName) : "#9ca3af" }}
          >
            {hasAccess ? initials : "?"}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base lg:text-lg font-display font-bold text-gray-900 truncate leading-tight">
              {hasAccess ? displayName : blurName(displayName)}
            </h3>
            {locationStr && (
              <p className="text-xs lg:text-[13px] text-gray-500 mt-0.5 lg:mt-1">
                {hasAccess ? locationStr : "***"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {experience && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border border-warm-200 text-gray-600 bg-warm-50/50">
                {experience} yr{experience !== 1 ? "s" : ""} exp.
              </span>
            )}
            {certifications.includes("CNA (Certified Nursing Assistant)") && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border border-secondary-200 text-secondary-700 bg-secondary-50/50">
                CNA
              </span>
            )}
          </div>
        </div>

        {/* Match context for orgs — show services overlap */}
        {skillLabels.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4 lg:mb-5 bg-warm-50/60 border border-warm-100/60">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-[13px] font-medium text-gray-600">
              Offers {skillLabels.slice(0, 2).join(" and ")}{skillLabels.length > 2 ? ` and ${skillLabels.length - 2} more` : ""}
            </p>
          </div>
        )}

        {/* Rate + certifications */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {rateStr && (
            <span className="inline-flex items-center text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border border-warm-100 text-gray-600 bg-white">
              {rateStr}
            </span>
          )}
          {certifications.slice(0, 3).map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border border-secondary-100 text-secondary-700 bg-secondary-50/40"
            >
              {cert}
            </span>
          ))}
          {certifications.length > 3 && (
            <span className="text-xs text-gray-400 self-center pl-1">
              +{certifications.length - 3}
            </span>
          )}
        </div>

        {!hasAccess && (
          <p className="text-sm text-warm-600 font-medium mt-3">
            Upgrade to view full profiles and send invitations.
          </p>
        )}
      </div>

      {/* Footer with action */}
      <div className="bg-warm-50/40 border-t border-warm-100/60 px-4 lg:px-7 py-3 lg:py-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {hasAccess && caregiver.slug && (
          <Link
            href={`/provider/${caregiver.slug}`}
            target="_blank"
            className="hidden lg:inline-flex items-center text-[13px] font-medium text-gray-500 hover:text-primary-600 transition-colors"
          >
            View profile &rarr;
          </Link>
        )}
        {hasAccess && fromProfileId ? (
          <div className="w-full lg:w-auto">
            <ConnectButton
              fromProfileId={fromProfileId}
              toProfileId={caregiver.id}
              toName={caregiver.display_name}
              connectionType="invitation"
              label="Invite to apply"
              sentLabel="Invitation sent"
            />
          </div>
        ) : !hasAccess ? (
          <p className="text-xs text-gray-400 text-center lg:text-right">
            Upgrade to invite caregivers
          </p>
        ) : null}
      </div>
    </div>
  );
}
