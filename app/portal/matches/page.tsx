"use client";

import { useState, useCallback, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";
import CarePostView from "@/components/portal/matches/CarePostView";
import InterestedTabContent from "@/components/portal/matches/InterestedTabContent";
import CarePostSidebar from "@/components/portal/matches/CarePostSidebar";
import CareProfileControlsMobile from "@/components/portal/matches/CareProfileControlsMobile";
import EditCarePostModal from "@/components/portal/matches/EditCarePostModal";
import MatchProviderCard from "@/components/portal/matches/MatchProviderCard";
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

  const [step, setStep] = useState<"default" | "review" | "active">(
    hasPost ? "active" : "default"
  );

  // Refresh account data on mount to ensure fresh profile state
  // (e.g., after navigating here from onboarding banner)
  const hasRefreshedRef = useRef(false);
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshAccountData();
    }
  }, [refreshAccountData]);

  // Sync step state when hasPost changes (e.g., after refresh reveals activated profile)
  useEffect(() => {
    if (hasPost && step === "default") {
      setStep("active");
    }
  }, [hasPost, step]);

  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();

  // Recommended providers for the waiting state
  const [recommendedProviders, setRecommendedProviders] = useState<RecommendedProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Fetch recommended providers based on profile location and care types
  useEffect(() => {
    async function fetchRecommendedProviders() {
      if (!activeProfile?.city || !activeProfile?.state) return;
      if (!hasPost || totalInterested > 0) return; // Only fetch for waiting state

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
  }, [activeProfile?.city, activeProfile?.state, hasPost, totalInterested]);

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

    // If no business profile, we need to create an inquiry differently
    // For now, create a connection to a placeholder or handle via API
    if (!toProfileId) {
      // Create connection via API which handles this case
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
      // Redirect to inbox with the new connection
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

    // Redirect to inbox
    router.push(`/portal/inbox?connection=${connection.id}`);
  }, [activeProfile, router]);

  // Handle declining an interested provider
  const handleDeclineProvider = useCallback(async (connectionId: string) => {
    const supabase = createClient();
    await supabase
      .from("connections")
      .update({ status: "declined" })
      .eq("id", connectionId);

    // Refresh to update the list
    refreshAccountData();
  }, [refreshAccountData]);

  // Dynamic subtitle based on state
  const subtitle = (() => {
    if (hasPost && totalInterested === 0) {
      return isActive
        ? "Your care profile is live — providers are looking."
        : "Your care profile is paused. Resume to get new matches.";
    }
    if (totalInterested > 0) {
      if (isActive) {
        return `${totalInterested} provider${totalInterested === 1 ? "" : "s"} interested in your care needs.`;
      }
      if (isPaused) {
        return "Your profile is paused, but you can still review matches.";
      }
      return "Review providers who reached out.";
    }
    if (step === "review") return "Review your care profile before publishing.";
    return "Discover providers or let them find you.";
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
    setStep("active");
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
    // If no interested providers, go back to default state
    if (totalInterested === 0) {
      setStep("default");
    }
  }, [refreshAccountData, totalInterested]);

  // Check if profile has minimum data to go live
  const hasLocation = Boolean(activeProfile?.city && activeProfile?.state);
  const hasCareTypes = Boolean(activeProfile?.care_types && activeProfile.care_types.length > 0);
  const canGoLive = hasLocation && hasCareTypes;
  const [activatingProfile, setActivatingProfile] = useState(false);

  const handleQuickGoLive = async () => {
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
        setStep("active");
      }
    } catch (err) {
      console.error("[matches] Failed to activate:", err);
    } finally {
      setActivatingProfile(false);
    }
  };

  // ── DEFAULT STATE — no care profile and no interested providers ──
  // Simplified: either quick "Go Live" or link to Welcome
  if (step === "default" && !hasPost && totalInterested === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-900">Matches</h2>
          <p className="text-[15px] text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Main content */}
            <div className="px-8 pt-10 pb-8 text-center">
              {/* Warm illustration */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                {canGoLive ? "Ready to go live?" : "Complete your profile to get matched"}
              </h3>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-[380px] mx-auto mb-7">
                {canGoLive
                  ? "Let providers in your area discover you and reach out directly."
                  : "Add your location and care needs so providers can find you."}
              </p>

              {canGoLive ? (
                <button
                  onClick={handleQuickGoLive}
                  disabled={activatingProfile}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[15px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-400 hover:to-primary-500 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200 disabled:opacity-70"
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
                    "Go live now"
                  )}
                </button>
              ) : (
                <Link
                  href="/welcome"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[15px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-400 hover:to-primary-500 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200"
                >
                  Complete setup
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {/* What's missing indicator (if not ready) */}
            {!canGoLive && (
              <>
                <div className="mx-6 border-t border-gray-200/60" />
                <div className="px-8 py-4">
                  <p className="text-[13px] font-medium text-gray-500 mb-2">What&apos;s needed:</p>
                  <div className="flex flex-wrap gap-2">
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
                </div>
              </>
            )}
          </div>
        </div>

        {activeProfile && editModalOpen && (
          <EditCarePostModal
            profile={activeProfile}
            userEmail={user?.email}
            onClose={() => setEditModalOpen(false)}
            onSaved={async () => {
              setEditModalOpen(false);
              await refreshAccountData();
              setStep("review");
            }}
          />
        )}
      </div>
      </div>
    );
  }

  // ── REVIEW STATE — reviewing care profile before publishing ──
  if (step === "review" && !hasPost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-900">Matches</h2>
          <p className="text-[15px] text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="max-w-2xl">
          {activeProfile && (
            <CarePostView
              activeProfile={activeProfile}
              userEmail={user?.email}
              onPublish={handlePublish}
              onDeactivate={handleDeactivate}
              initialStep="review"
              onBack={() => setStep("default")}
            />
          )}
        </div>
      </div>
      </div>
    );
  }

  // ── WAITING STATE — care profile exists (active/paused) but no providers yet ──
  // Now shows personalized provider recommendations
  if (hasPost && totalInterested === 0) {
    const locationDisplay = [activeProfile?.city, activeProfile?.state].filter(Boolean).join(", ");

    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
        {/* Mobile: Sticky controls bar */}
        <div className="lg:hidden">
          {activeProfile && (
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
          {/* Header with status */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-display font-bold text-gray-900">Matches</h2>
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                ) : isPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Paused
                  </span>
                ) : null}
              </div>
              <p className="text-[15px] text-gray-500 mt-1">
                {subtitle}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setEditModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left — Provider recommendations */}
            <div className="lg:col-span-2">
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    While you wait, explore providers
                  </h3>
                  {locationDisplay && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      Matching your needs in {locationDisplay}
                    </p>
                  )}
                </div>
                <Link
                  href="/browse"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  View all →
                </Link>
              </div>

              {/* Provider grid */}
              {loadingProviders ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                      <div className="h-40 bg-gray-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-10 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recommendedProviders.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedProviders.map((provider) => {
                    const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")[0] || null;
                    const priceRange = provider.lower_price
                      ? provider.upper_price
                        ? `$${provider.lower_price.toLocaleString()}–$${provider.upper_price.toLocaleString()}/mo`
                        : `From $${provider.lower_price.toLocaleString()}/mo`
                      : null;

                    return (
                      <MatchProviderCard
                        key={provider.provider_id}
                        provider={{
                          id: provider.provider_id,
                          name: provider.provider_name,
                          slug: provider.provider_id,
                          image: imageUrl,
                          category: provider.provider_category,
                          city: provider.city,
                          state: provider.state,
                          rating: provider.google_rating,
                          priceRange,
                        }}
                        onMessage={handleSendMessage}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">No providers found</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    We couldn&apos;t find providers in your area yet.
                  </p>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Browse all providers
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right — sidebar (desktop only) */}
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
                />
              )}
            </div>
          </div>
        </div>

        {/* Edit modal for mobile */}
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

  // ── ACTIVE STATE — providers interested (regardless of profile status), show grid ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Mobile: Sticky controls bar - show whenever there are interested providers */}
      <div className="lg:hidden">
        {activeProfile && (
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
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-gray-900">Matches</h2>
          <p className="text-[15px] text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Desktop: 2/3 + 1/3 grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 items-start">
          {/* Main content — 2/3 */}
          <div className="lg:col-span-2">
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

          {/* Sidebar — 1/3 */}
          <div className="lg:col-span-1">
            {activeProfile && (
              <CarePostSidebar
                activeProfile={activeProfile}
                interestedCount={totalInterested}
                userEmail={user?.email}
                onPublish={handlePublish}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
                onProfileUpdated={refreshAccountData}
              />
            )}
          </div>
        </div>

        {/* Mobile: Full-width compact cards */}
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
      </div>

      {/* Edit modal for mobile */}
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
