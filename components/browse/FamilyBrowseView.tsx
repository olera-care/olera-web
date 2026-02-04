"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile } from "@/lib/types";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectButton from "@/components/shared/ConnectButton";
import EmptyState from "@/components/ui/EmptyState";
import ProfileCard, { profileToCard } from "@/components/shared/ProfileCard";

interface FamilyBrowseViewProps {
  /** "standalone" renders full-page layout; "portal" renders for portal embed */
  layout?: "standalone" | "portal";
}

export default function FamilyBrowseView({
  layout = "standalone",
}: FamilyBrowseViewProps) {
  const { user, activeProfile, membership } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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

    const fetchFamilies = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("type", "family")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      setFamilies((data as Profile[]) || []);
      setLoading(false);
    };

    fetchFamilies();
  }, [profileId, isProvider]);

  if (!isProvider) {
    if (layout === "portal") {
      return (
        <EmptyState
          title="Provider access required"
          description="Switch to an organization or caregiver profile to browse families."
        />
      );
    }
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Provider access required
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          This page is only available to care providers.
        </p>
        <Link
          href="/browse"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Browse care providers instead
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={
          layout === "standalone"
            ? "max-w-7xl mx-auto px-4 py-16 text-center"
            : "text-center py-16"
        }
      >
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading families...</p>
      </div>
    );
  }

  const gridCols =
    layout === "standalone"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  const content = (
    <>
      {!hasAccess && (
        <div className="mb-8">
          <UpgradePrompt context="browse family profiles and initiate contact" />
        </div>
      )}

      {families.length === 0 ? (
        <EmptyState
          title="No families found"
          description="Families who sign up will appear here."
        />
      ) : (
        <>
          <p className="text-base text-gray-500 mb-6">
            {families.length} famil{families.length !== 1 ? "ies" : "y"} found
          </p>
          <div className={`grid ${gridCols} gap-6`}>
            {families.map((family) => (
              <ProfileCard
                key={family.id}
                card={profileToCard(family)}
                blurred={!hasAccess}
                actions={
                  hasAccess && activeProfile?.id ? (
                    <ConnectButton
                      fromProfileId={activeProfile.id}
                      toProfileId={family.id}
                      toName={family.display_name}
                      connectionType="inquiry"
                      label="Initiate Contact"
                      sentLabel="Contact Sent"
                      fullWidth
                    />
                  ) : !hasAccess ? (
                    <p className="text-sm text-warm-600 font-medium">
                      Upgrade to Pro to view full details and reach out.
                    </p>
                  ) : undefined
                }
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  if (layout === "portal") {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Families Looking for Care
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Connect with families in your area who are looking for care
            services.
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Families Looking for Care
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Connect with families in your area who are looking for care
            services.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </div>
    </div>
  );
}
