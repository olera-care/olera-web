"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile } from "@/lib/types";
import RoleGate from "@/components/shared/RoleGate";
import ConnectButton from "@/components/shared/ConnectButton";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import EmptyState from "@/components/ui/EmptyState";
import ProfileCard, { profileToCard } from "@/components/shared/ProfileCard";

interface ProviderJobBrowseViewProps {
  /** "standalone" renders full-page layout; "portal" renders for portal embed */
  layout?: "standalone" | "portal";
}

export default function ProviderJobBrowseView({
  layout = "standalone",
}: ProviderJobBrowseViewProps) {
  return (
    <RoleGate
      requiredType="caregiver"
      actionLabel="browse organizations for job opportunities"
    >
      <ProviderJobBrowseContent layout={layout} />
    </RoleGate>
  );
}

function ProviderJobBrowseContent({
  layout,
}: {
  layout: "standalone" | "portal";
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
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("type", "organization")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      setOrgs((data as Profile[]) || []);
      setLoading(false);
    };

    fetchOrgs();
  }, [profileId]);

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
        <p className="mt-4 text-gray-500">Loading organizations...</p>
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
          <UpgradePrompt context="apply to organizations and share your profile" />
        </div>
      )}

      {orgs.length === 0 ? (
        <EmptyState
          title="No organizations found"
          description="Organizations who sign up will appear here."
        />
      ) : (
        <>
          <p className="text-base text-gray-500 mb-6">
            {orgs.length} organization{orgs.length !== 1 ? "s" : ""} found
          </p>
          <div className={`grid ${gridCols} gap-6`}>
            {orgs.map((org) => (
              <ProfileCard
                key={org.id}
                card={profileToCard(org)}
                actions={
                  activeProfile?.id ? (
                    <ConnectButton
                      fromProfileId={activeProfile.id}
                      toProfileId={org.id}
                      toName={org.display_name}
                      connectionType="application"
                      label="Apply"
                      sentLabel="Applied"
                      fullWidth
                    />
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
            Find Job Opportunities
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Browse agencies, facilities, and organizations looking for
            caregivers.
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
            Find Job Opportunities
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Browse agencies, facilities, and organizations looking for
            caregivers.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </div>
    </div>
  );
}
