"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { FamilyMetadata } from "@/lib/types";
import Button from "@/components/ui/Button";
import CarePostView from "@/components/portal/matches/CarePostView";
import InterestedTabContent from "@/components/portal/matches/InterestedTabContent";
import { useInterestedProviders } from "@/hooks/useInterestedProviders";

type SubTab = "carepost" | "interested";

export default function MatchesPage() {
  const { activeProfile, user, refreshAccountData } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [subTab, setSubTab] = useState<SubTab>(
    initialTab === "interested" ? "interested" : "carepost"
  );
  const { pendingCount } = useInterestedProviders(activeProfile?.id);
  const carePostStatus = ((activeProfile?.metadata as FamilyMetadata)?.care_post?.status) || null;
  const hasCarePost = carePostStatus === "active";

  // Track when InterestedTabContent is in split view mode
  const [interestedSplitView, setInterestedSplitView] = useState(false);

  const hasRequiredFields =
    activeProfile?.care_types?.length && activeProfile?.state;

  // Care Post handlers
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

  // Profile guard
  if (!hasRequiredFields) {
    return (
      <div className="px-8 py-6 h-full"><div>
        <h2 className="text-xl font-semibold text-gray-900">Matches</h2>
        <p className="text-sm text-gray-500 mt-1 mb-8">
          Discover providers or let them find you.
        </p>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete your profile first
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-[380px] mx-auto leading-relaxed">
            We need your care type preferences and location to find providers
            that match your needs.
          </p>
          <Link href="/portal/profile">
            <Button size="sm">Complete profile</Button>
          </Link>
        </div>
      </div></div>
    );
  }

  // ── Sub-tab bar (shared between normal view and split view left panel) ──
  const matchesTabBar = (
    <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl w-fit">
      {(
        [
          { id: "carepost", label: "My Care Post", badge: 0 },
          { id: "interested", label: "Interested Providers", badge: pendingCount },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          onClick={() => setSubTab(tab.id)}
          className={[
            "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5",
            subTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          {tab.label}
          {tab.badge > 0 && subTab !== tab.id && (
            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 rounded-full w-4 h-4 flex items-center justify-center">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // When Interested tab is in split view, render without wrapper so
  // SplitViewLayout aligns with the sidebar (matching Connections page)
  const isInterestedSplitView = subTab === "interested" && interestedSplitView;

  return (
    <div className={isInterestedSplitView ? "h-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full"}>
      {/* Header + Tabs — hidden when Interested split view is active
          (they move into the split view's left panel instead) */}
      {!isInterestedSplitView && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Matches</h2>
              <p className="text-sm text-gray-500 mt-1">
                Discover providers or let them find you.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            {matchesTabBar}
          </div>
        </>
      )}

      {/* My Care Post view */}
      {subTab === "carepost" && activeProfile && (
        <CarePostView
          activeProfile={activeProfile}
          userEmail={user?.email}
          onPublish={handlePublish}
          onDeactivate={handleDeactivate}
        />
      )}

      {/* Interested view — always at same tree position to preserve state */}
      {subTab === "interested" && activeProfile && (
        <InterestedTabContent
          profileId={activeProfile.id}
          hasCarePost={hasCarePost}
          onSwitchToCarePost={() => setSubTab("carepost")}
          onSelectionChange={setInterestedSplitView}
          matchesTabBar={matchesTabBar}
        />
      )}
    </div>
  );
}
