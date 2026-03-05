"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile } from "@/lib/types";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import CaregiverCard from "@/components/shared/CaregiverCard";
import EmptyState from "@/components/ui/EmptyState";

export default function DiscoverCaregiversPage() {
  const { activeProfile, membership } = useAuth();
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrg = activeProfile?.type === "organization";
  const hasAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const profileId = activeProfile?.id;

  useEffect(() => {
    if (!profileId || !isOrg || !isSupabaseConfigured()) {
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
  }, [profileId, isOrg]);

  if (!isOrg) {
    return (
      <div className="px-8 py-6">
        <EmptyState
          title="Organization access required"
          description="Switch to an organization profile to browse caregivers."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading caregivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Caregivers</h1>
        <p className="text-lg text-gray-600 mt-1">
          Find experienced caregivers to join your team.
        </p>
      </div>

      {!hasAccess && (
        <div className="mb-8">
          <UpgradePrompt context="browse caregiver profiles and send invitations" />
        </div>
      )}

      {caregivers.length === 0 ? (
        <EmptyState
          title="No caregivers found"
          description="Caregivers who sign up will appear here."
        />
      ) : (
        <>
          <p className="text-base text-gray-500 mb-6">
            {caregivers.length} caregiver{caregivers.length !== 1 ? "s" : ""}{" "}
            found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {caregivers.map((caregiver) => (
              <CaregiverCard
                key={caregiver.id}
                caregiver={caregiver}
                hasAccess={hasAccess}
                fromProfileId={activeProfile?.id}
                lockedMessage="Upgrade to Pro to view full details and invite."
              />
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
}

