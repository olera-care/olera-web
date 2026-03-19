"use client";

import { useState, useCallback, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";
import InterestedTabContent from "@/components/portal/matches/InterestedTabContent";
import CarePostSidebar from "@/components/portal/matches/CarePostSidebar";
import CareProfileControlsMobile from "@/components/portal/matches/CareProfileControlsMobile";
import EditCarePostModal from "@/components/portal/matches/EditCarePostModal";
import MatchesTabs from "@/components/portal/matches/MatchesTabs";
import RecommendedTabContent from "@/components/portal/matches/RecommendedTabContent";
import { useInterestedProviders } from "@/hooks/useInterestedProviders";

interface RecommendedProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_logo: string | null;
  provider_images: string | null;
  city: string | null;
  state: string | null;
  google_rating: number | null;
  lower_price: number | null;
  upper_price: number | null;
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const { activeProfile, user, refreshAccountData } = useAuth();
  const { pending, declined } = useInterestedProviders(activeProfile?.id);
  const carePostStatus = ((activeProfile?.metadata as FamilyMetadata)?.care_post?.status) || null;
  const isActive = carePostStatus === "active";
  const isPaused = carePostStatus === "paused";
  const hasPost = isActive || isPaused;
  const totalInterested = pending.length + declined.length;

  // Tab state - default to "interested" if there are interested providers
  const [activeTab, setActiveTab] = useState<"recommended" | "interested">(
    totalInterested > 0 ? "interested" : "recommended"
  );

  // Sync tab when interested count changes (e.g., first provider reaches out)
  useEffect(() => {
    if (totalInterested > 0 && activeTab === "recommended") {
      // Don't auto-switch if user is already on recommended tab
    }
  }, [totalInterested, activeTab]);

  // Refresh account data on mount to ensure fresh profile state
  const hasRefreshedRef = useRef(false);
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshAccountData();
    }
  }, [refreshAccountData]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();

  // Recommended providers - always fetch (no longer gated by hasPost)
  const [recommendedProviders, setRecommendedProviders] = useState<RecommendedProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Fetch recommended providers based on profile location
  useEffect(() => {
    async function fetchRecommendedProviders() {
      if (!activeProfile?.city || !activeProfile?.state) return;

      setLoadingProviders(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("olera-providers")
          .select("provider_id, provider_name, provider_category, provider_logo, provider_images, city, state, google_rating, lower_price, upper_price")
          .eq("state", activeProfile.state)
          .eq("deleted", false)
          .order("google_rating", { ascending: false, nullsFirst: false })
          .limit(12);

        if (data) {
          setRecommendedProviders(data);
        }
      } catch (err) {
        console.error("[matches] Failed to fetch recommendations:", err);
      } finally {
        setLoadingProviders(false);
      }
    }

    fetchRecommendedProviders();
  }, [activeProfile?.city, activeProfile?.state]);

  // Handle sending a message to a provider (creates inquiry connection)
  const handleSendMessage = useCallback(async (providerId: string, message: string) => {
    if (!activeProfile) return;

    const supabase = createClient();

    // First, check if provider has a business_profile or use olera-providers data
    const { data: providerProfile } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("source_provider_id", providerId)
      .maybeSingle();

    let toProfileId = providerProfile?.id;

    // If no business profile, create connection via API which handles this case
    if (!toProfileId) {
      const res = await fetch("/api/connections/create-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      router.push(`/portal/inbox?connection=${data.connectionId}`);
      return;
    }

    // Create the connection directly
    const { data: connection, error } = await supabase
      .from("connections")
      .insert({
        from_profile_id: activeProfile.id,
        to_profile_id: toProfileId,
        type: "inquiry",
        status: "pending",
        message,
      })
      .select("id")
      .single();

    if (error) throw error;

    router.push(`/portal/inbox?connection=${connection.id}`);
  }, [activeProfile, router]);

  // Dynamic subtitle based on state
  const subtitle = (() => {
    if (activeTab === "interested") {
      if (totalInterested > 0) {
        return `${totalInterested} provider${totalInterested === 1 ? "" : "s"} interested in your care needs.`;
      }
      return "No providers have reached out yet.";
    }
    // Recommended tab
    if (hasPost) {
      return isActive
        ? "Your care profile is live — explore providers while you wait."
        : "Your care profile is paused. Explore providers below.";
    }
    return "Discover providers in your area.";
  })();

  // Care Profile handlers
  const handlePublish = useCallback(async () => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    if (!res.ok) throw new Error("Failed to publish");
    await refreshAccountData();
  }, [refreshAccountData]);

  const handleDeactivate = useCallback(async () => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate" }),
    });
    if (!res.ok) throw new Error("Failed to deactivate");
    await refreshAccountData();
  }, [refreshAccountData]);

  const handleDelete = useCallback(async (reasons: string[]) => {
    const res = await fetch("/api/care-post/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", reasons }),
    });
    if (!res.ok) throw new Error("Failed to delete");
    await refreshAccountData();
  }, [refreshAccountData]);

  // Check if profile has minimum data to go live
  const hasLocation = Boolean(activeProfile?.city && activeProfile?.state);
  const hasCareTypes = Boolean(activeProfile?.care_types && activeProfile.care_types.length > 0);
  const canGoLive = hasLocation && hasCareTypes;
  const [activatingProfile, setActivatingProfile] = useState(false);

  const handleQuickGoLive = useCallback(async () => {
    if (!canGoLive) return;
    setActivatingProfile(true);
    try {
      const res = await fetch("/api/care-post/activate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: activeProfile?.city,
          state: activeProfile?.state,
        }),
      });
      if (res.ok) {
        await refreshAccountData();
      }
    } catch (err) {
      console.error("[matches] Failed to activate:", err);
    } finally {
      setActivatingProfile(false);
    }
  }, [canGoLive, activeProfile?.city, activeProfile?.state, refreshAccountData]);

  const locationDisplay = [activeProfile?.city, activeProfile?.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Mobile: Sticky controls bar (only when profile is live/paused) */}
      <div className="lg:hidden">
        {activeProfile && hasPost && (
          <CareProfileControlsMobile
            activeProfile={activeProfile}
            userEmail={user?.email}
            onPublish={handlePublish}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onEditProfile={() => setEditModalOpen(true)}
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-gray-900">Matches</h1>
              {hasPost && (
                isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                ) : isPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Paused
                  </span>
                ) : null
              )}
            </div>
            <p className="text-[15px] text-gray-500 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Mobile: Go Live CTA (when profile is NOT live) */}
        {!hasPost && (
          <div className="lg:hidden mb-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    Go live to get matches
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Let providers in your area discover you
                  </p>
                </div>
              </div>

              {canGoLive ? (
                <button
                  onClick={handleQuickGoLive}
                  disabled={activatingProfile}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold hover:from-primary-400 hover:to-primary-500 transition-all shadow-[0_1px_3px_rgba(25,144,135,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {activatingProfile ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Going live...
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                      Go Live
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${hasLocation ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {hasLocation ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        </svg>
                      )}
                      Location
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${hasCareTypes ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {hasCareTypes ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        </svg>
                      )}
                      Care needs
                    </span>
                  </div>
                  <Link
                    href="/welcome"
                    className="w-full min-h-[48px] py-3 rounded-xl bg-primary-600 text-white text-[14px] font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Complete setup
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left — Tabs + Content (2/3) */}
          <div className="lg:col-span-2">
            {/* Tab bar */}
            <MatchesTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              interestedCount={totalInterested}
            />

            {/* Tab content - Desktop shows inline, mobile shows in separate section below for interested */}
            {activeTab === "recommended" ? (
              <RecommendedTabContent
                providers={recommendedProviders}
                loading={loadingProviders}
                onSendMessage={handleSendMessage}
              />
            ) : (
              /* Desktop: Interested content inline */
              <div className="hidden lg:block">
                {activeProfile && (
                  <InterestedTabContent
                    profileId={activeProfile.id}
                    hasCarePost={hasPost}
                    familyLat={activeProfile.lat}
                    familyLng={activeProfile.lng}
                    variant="desktop"
                  />
                )}
              </div>
            )}

            {/* Mobile: Interested content in main column */}
            {activeTab === "interested" && (
              <div className="lg:hidden">
                {activeProfile && (
                  <InterestedTabContent
                    profileId={activeProfile.id}
                    hasCarePost={hasPost}
                    familyLat={activeProfile.lat}
                    familyLng={activeProfile.lng}
                    variant="mobile"
                  />
                )}
              </div>
            )}
          </div>

          {/* Right — Sidebar (1/3, desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            {activeProfile && (
              <CarePostSidebar
                activeProfile={activeProfile}
                interestedCount={totalInterested}
                userEmail={user?.email}
                onPublish={handlePublish}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
                onProfileUpdated={refreshAccountData}
                canGoLive={canGoLive}
                onGoLive={handleQuickGoLive}
                activating={activatingProfile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {activeProfile && editModalOpen && (
        <EditCarePostModal
          profile={activeProfile}
          userEmail={user?.email}
          onClose={() => setEditModalOpen(false)}
          onSaved={async () => {
            setEditModalOpen(false);
            await refreshAccountData();
          }}
        />
      )}
    </div>
  );
}
