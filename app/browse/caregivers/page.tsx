"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import CaregiverCard from "@/components/shared/CaregiverCard";

export default function BrowseCaregiversPage() {
  const { activeProfile, membership, openAuth } = useAuth();
  const [caregivers, setCaregivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!activeProfile;
  const hasAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchCaregivers = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("business_profiles")
          .select("id, display_name, city, state, type, care_types, metadata, image_url, slug")
          .eq("type", "caregiver")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        setCaregivers((data as Profile[]) || []);
      } catch (err) {
        console.error("[olera] browse caregivers failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaregivers();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Loading caregivers...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Browse Caregivers
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Find experienced private caregivers in your area.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoggedIn && !hasAccess && (
          <div className="mb-8">
            <UpgradePrompt context="browse caregiver profiles and send invitations" />
          </div>
        )}

        {!isLoggedIn && (
          <div className="mb-8 bg-secondary-50 border border-secondary-200 rounded-xl p-6 text-center">
            <p className="text-base text-gray-700 mb-3">
              Sign in to view full caregiver profiles and send connection requests.
            </p>
            <Button
              variant="secondary"
              onClick={() => openAuth({ defaultMode: "sign-in" })}
            >
              Sign in
            </Button>
          </div>
        )}

        {caregivers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No caregivers found
            </h2>
            <p className="text-lg text-gray-600">
              Caregivers who sign up will appear here.
            </p>
          </div>
        ) : (
          <>
            <p className="text-base text-gray-500 mb-6">
              {caregivers.length} caregiver{caregivers.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {caregivers.map((caregiver) => (
                <CaregiverCard
                  key={caregiver.id}
                  caregiver={caregiver}
                  hasAccess={hasAccess}
                  fromProfileId={activeProfile?.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

