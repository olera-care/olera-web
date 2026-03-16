"use client";

import { useState, useCallback, Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { FamilyMetadata } from "@/lib/types";
import CarePostView from "@/components/portal/matches/CarePostView";
import InterestedTabContent from "@/components/portal/matches/InterestedTabContent";
import CarePostSidebar from "@/components/portal/matches/CarePostSidebar";
import CareProfileControlsMobile from "@/components/portal/matches/CareProfileControlsMobile";
import EditCarePostModal from "@/components/portal/matches/EditCarePostModal";
import { useInterestedProviders } from "@/hooks/useInterestedProviders";

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

  // ── DEFAULT STATE — no care profile and no interested providers ──
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
              {/* Warm illustration: person being discovered/connected */}
              <div className="w-24 h-24 mx-auto mb-6">
                <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
                  {/* Soft background glow */}
                  <circle cx="48" cy="48" r="40" fill="#199087" fillOpacity="0.08" />
                  <circle cx="48" cy="48" r="28" fill="#199087" fillOpacity="0.12" />

                  {/* Person silhouette - warm, approachable */}
                  <circle cx="48" cy="36" r="10" fill="#199087" fillOpacity="0.9" />
                  <path
                    d="M32 62c0-8.837 7.163-16 16-16s16 7.163 16 16"
                    stroke="#199087"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="#199087"
                    fillOpacity="0.15"
                  />

                  {/* Connection dots - representing providers finding you */}
                  <circle cx="22" cy="40" r="4" fill="#199087" fillOpacity="0.4">
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="74" cy="40" r="4" fill="#199087" fillOpacity="0.4">
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
                  </circle>
                  <circle cx="28" cy="58" r="3" fill="#199087" fillOpacity="0.3">
                    <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite" begin="0.25s" />
                  </circle>
                  <circle cx="68" cy="58" r="3" fill="#199087" fillOpacity="0.3">
                    <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite" begin="0.75s" />
                  </circle>

                  {/* Subtle connection lines */}
                  <path d="M26 40 L38 38" stroke="#199087" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M70 40 L58 38" stroke="#199087" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                Let providers find you
              </h3>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-[380px] mx-auto mb-7">
                Share your care needs once. Providers reach out to you.
              </p>

              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center px-8 py-3.5 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[15px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-400 hover:to-primary-500 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200"
              >
                Share your care profile
              </button>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-gray-200/60" />

            {/* How it works accordion */}
            <div>
              <button
                type="button"
                onClick={() => setHowItWorksOpen(!howItWorksOpen)}
                className="w-full flex items-center justify-between px-8 py-4 text-left hover:bg-warm-50/30 transition-colors"
              >
                <span className="text-[13px] font-semibold text-gray-400">How it works</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${howItWorksOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
                style={{ gridTemplateRows: howItWorksOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="px-8 pb-6 space-y-4 border-t border-warm-100/60 pt-4">
                    {[
                      { num: 1, bold: "Share your care profile", rest: "— we use your existing profile details" },
                      { num: 2, bold: "Providers review", rest: "your profile and reach out if they're a good fit" },
                      { num: 3, bold: "You choose", rest: "— review their profiles and start a conversation" },
                    ].map((s) => (
                      <div key={s.num} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-warm-100/70 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[12px] font-bold text-gray-500">{s.num}</span>
                        </div>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">{s.bold}</span> {s.rest}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
  if (hasPost && totalInterested === 0) {
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
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Matches</h2>
            <p className="text-[15px] text-gray-500 mt-1">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left — waiting card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-8 pt-10 pb-8 text-center">
                  {/* Delightful illustration: anticipation, momentum, being seen */}
                  <div className="w-32 h-32 mx-auto mb-6">
                    <svg viewBox="0 0 128 128" fill="none" className="w-full h-full">
                      {/* Radiating energy rings - animated */}
                      <circle cx="64" cy="64" r="56" stroke="#199087" strokeOpacity="0.08" strokeWidth="2">
                        <animate attributeName="r" values="48;56;48" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="stroke-opacity" values="0.12;0.05;0.12" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="64" cy="64" r="44" stroke="#199087" strokeOpacity="0.12" strokeWidth="2">
                        <animate attributeName="r" values="40;48;40" dur="3s" repeatCount="indefinite" begin="0.3s" />
                        <animate attributeName="stroke-opacity" values="0.15;0.08;0.15" dur="3s" repeatCount="indefinite" begin="0.3s" />
                      </circle>

                      {/* Central warm glow */}
                      <circle cx="64" cy="64" r="32" fill="#199087" fillOpacity="0.1" />

                      {/* Person - centered, confident, visible */}
                      <circle cx="64" cy="52" r="12" fill="#199087" />
                      <path
                        d="M44 82c0-11.046 8.954-20 20-20s20 8.954 20 20"
                        fill="#199087"
                        fillOpacity="0.85"
                      />

                      {/* Sparkles representing attention/discovery */}
                      <g className="sparkles">
                        <path d="M28 48 L30 44 L32 48 L30 52 Z" fill="#199087" fillOpacity="0.6">
                          <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                        </path>
                        <path d="M96 48 L98 44 L100 48 L98 52 Z" fill="#199087" fillOpacity="0.6">
                          <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                        </path>
                        <path d="M38 76 L40 72 L42 76 L40 80 Z" fill="#199087" fillOpacity="0.5">
                          <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" begin="0.25s" />
                        </path>
                        <path d="M86 76 L88 72 L90 76 L88 80 Z" fill="#199087" fillOpacity="0.5">
                          <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" begin="0.75s" />
                        </path>
                        <circle cx="24" cy="64" r="2" fill="#199087" fillOpacity="0.4">
                          <animate attributeName="fill-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="104" cy="64" r="2" fill="#199087" fillOpacity="0.4">
                          <animate attributeName="fill-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="1s" />
                        </circle>
                      </g>

                      {/* Subtle upward motion lines */}
                      <path d="M54 28 L54 20" stroke="#199087" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round">
                        <animate attributeName="stroke-opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite" />
                      </path>
                      <path d="M64 24 L64 14" stroke="#199087" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round">
                        <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" begin="0.3s" />
                      </path>
                      <path d="M74 28 L74 20" stroke="#199087" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round">
                        <animate attributeName="stroke-opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite" begin="0.6s" />
                      </path>
                    </svg>
                  </div>

                  <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                    Providers in your area can see you now
                  </h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed max-w-[420px] mx-auto">
                    We&apos;ll notify you the moment a provider reaches out. Most respond within 3–5 days.
                  </p>
                </div>

                {/* Divider */}
                <div className="mx-8 border-t border-gray-200/60" />

                {/* Browse link */}
                <div className="px-8 py-5">
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Browse providers while you wait
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
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
                onPublish={handlePublish}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
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
