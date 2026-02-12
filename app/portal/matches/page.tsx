"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Provider } from "@/lib/types/provider";
import type { FamilyMetadata } from "@/lib/types";
import Button from "@/components/ui/Button";
import MatchCardStack from "@/components/portal/matches/MatchCardStack";
import MatchSortBar from "@/components/portal/matches/MatchSortBar";
import ConnectionConfirmModal from "@/components/portal/matches/ConnectionConfirmModal";
import CarePostView from "@/components/portal/matches/CarePostView";

type SortOption = "relevance" | "closest" | "highest_rated";
type SubTab = "foryou" | "carepost";

export default function MatchesPage() {
  const { activeProfile, user, refreshAccountData } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>("foryou");

  // For You state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection modal state
  const [confirmProvider, setConfirmProvider] = useState<Provider | null>(null);
  const cardStackRef = useRef<HTMLDivElement>(null);

  const meta = (activeProfile?.metadata || {}) as FamilyMetadata;
  const hasRequiredFields =
    activeProfile?.care_types?.length && activeProfile?.state;

  // Fetch matches
  const fetchMatches = useCallback(
    async (sortOption: SortOption) => {
      if (!hasRequiredFields) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/matches/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort: sortOption }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch");
        }

        const data = await res.json();
        setProviders(data.providers || []);
        setTotalCount(data.totalCount || 0);
      } catch (err) {
        console.error("Fetch matches error:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [hasRequiredFields]
  );

  useEffect(() => {
    fetchMatches(sort);
  }, [sort, fetchMatches]);

  // Dismiss handler
  const handleDismiss = useCallback(async (provider: Provider) => {
    try {
      await fetch("/api/matches/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          providerName: provider.provider_name,
        }),
      });
    } catch (err) {
      console.error("Dismiss error:", err);
    }
  }, []);

  // Connect handler — opens modal
  const handleConnect = useCallback((provider: Provider) => {
    setConfirmProvider(provider);
  }, []);

  // View profile handler
  const handleViewProfile = useCallback((provider: Provider) => {
    window.open(`/providers/${provider.provider_id}`, "_blank");
  }, []);

  // Send connection request
  const handleSendRequest = useCallback(async () => {
    if (!confirmProvider) return;

    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: confirmProvider.provider_id,
          providerName: confirmProvider.provider_name,
          providerSlug: confirmProvider.provider_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send request");
      }

      setConfirmProvider(null);

      // Advance the card stack
      const stack = cardStackRef.current as HTMLDivElement & {
        advanceCard?: () => void;
      };
      if (stack?.advanceCard) {
        stack.advanceCard();
      }
    } catch (err) {
      console.error("Connection request error:", err);
    }
  }, [confirmProvider]);

  // Sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

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
      <div>
        <h2 className="text-[22px] font-bold text-gray-900">Matches</h2>
        <p className="text-sm text-gray-500 mt-1 mb-8">
          Discover providers or let them find you.
        </p>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
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
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Matches</h2>
          <p className="text-sm text-gray-500 mt-1">
            Discover providers or let them find you.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-0.5 rounded-xl w-fit">
        {(
          [
            { id: "foryou", label: "For You" },
            { id: "carepost", label: "My Care Post" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={[
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
              subTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* For You view */}
      {subTab === "foryou" && (
        <>
          {error ? (
            <div className="text-center py-16">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Button size="sm" onClick={() => fetchMatches(sort)}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {!loading && providers.length > 0 && (
                <MatchSortBar
                  matchCount={totalCount}
                  sort={sort}
                  onSortChange={handleSortChange}
                />
              )}

              <div className="flex justify-center min-h-[560px]">
                <div ref={cardStackRef}>
                  <MatchCardStack
                    providers={providers}
                    onDismiss={handleDismiss}
                    onConnect={handleConnect}
                    onViewProfile={handleViewProfile}
                    isLoading={loading}
                  />
                </div>
              </div>
            </>
          )}
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

      {/* Connection Confirm Modal */}
      <ConnectionConfirmModal
        isOpen={!!confirmProvider}
        onClose={() => setConfirmProvider(null)}
        onConfirm={handleSendRequest}
        provider={confirmProvider}
        activeProfile={activeProfile}
        userEmail={user?.email}
      />
    </div>
  );
}
