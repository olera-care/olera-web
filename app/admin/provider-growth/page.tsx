"use client";

/**
 * Provider Growth Page
 *
 * Tracks claimed providers through their lifecycle from initial claim
 * through verification, pitch meetings, and conversion to paying customers.
 *
 * Pipeline: New Claims → Meeting Scheduled → Pitched → Not Interested
 * Conversion: Ads (free_intro → subscribed) | MedJobs (in_pilot → subscribed)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ProviderGrowthWithProfile, GrowthStats } from "@/lib/provider-growth/queries";
import type { PipelineStage, AdsStatus, MedjobsStatus, ClaimSource } from "@/lib/provider-growth/stages";
import {
  GrowthTabs,
  StatsHeader,
  ProviderRow,
  ProviderDrawer,
  type ActiveTab,
} from "./components";

export default function ProviderGrowthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const tab = searchParams.get("tab") as PipelineStage | null;
    if (tab && ["new_claim", "meeting_scheduled", "pitched", "not_interested"].includes(tab)) {
      return { type: "pipeline", stage: tab as PipelineStage };
    }
    return { type: "pipeline", stage: "new_claim" };
  });

  // Data state
  const [providers, setProviders] = useState<ProviderGrowthWithProfile[]>([]);
  const [stats, setStats] = useState<GrowthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Selection state
  const [selectedProvider, setSelectedProvider] = useState<ProviderGrowthWithProfile | null>(null);
  const selectedProviderIdRef = useRef<string | null>(null);

  // Keep ref in sync with selected provider
  useEffect(() => {
    selectedProviderIdRef.current = selectedProvider?.id ?? null;
  }, [selectedProvider]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/provider-growth/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Set filters based on active tab
      if (activeTab.type === "pipeline") {
        params.set("pipelineStage", activeTab.stage);
      } else {
        // Conversion tabs
        if (activeTab.tab === "converted") {
          if (activeTab.subTab === "ads") {
            params.set("adsStatus", "free_intro");
          } else if (activeTab.subTab === "medjobs") {
            params.set("medjobsStatus", "in_pilot");
          } else if (activeTab.subTab === "both") {
            params.set("adsStatus", "free_intro");
            params.set("medjobsStatus", "in_pilot");
          }
        } else if (activeTab.tab === "paying") {
          if (activeTab.subTab === "ads") {
            params.set("adsStatus", "subscribed");
          } else if (activeTab.subTab === "medjobs") {
            params.set("medjobsStatus", "subscribed");
          } else if (activeTab.subTab === "both") {
            params.set("adsStatus", "subscribed");
            params.set("medjobsStatus", "subscribed");
          }
        }
      }

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/provider-growth?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (e) {
      console.error("Failed to fetch providers:", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Handle tab change
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedProvider(null);

    // Update URL
    if (tab.type === "pipeline") {
      router.push(`/admin/provider-growth?tab=${tab.stage}`, { scroll: false });
    } else {
      router.push(`/admin/provider-growth?tab=${tab.tab}&sub=${tab.subTab}`, { scroll: false });
    }
  };

  // Handle provider update (after drawer action)
  const handleProviderUpdate = async () => {
    await fetchProviders();
    fetchStats();
  };

  // Update selected provider when providers list changes
  useEffect(() => {
    const currentId = selectedProviderIdRef.current;
    if (currentId) {
      const updated = providers.find((p) => p.id === currentId);
      if (updated) {
        setSelectedProvider(updated);
      }
    }
  }, [providers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Provider Growth</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track claimed providers from claim to conversion
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <StatsHeader stats={stats} loading={loadingStats} />

        {/* Tabs */}
        <GrowthTabs activeTab={activeTab} onTabChange={handleTabChange} stats={stats} />

        {/* Provider list */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {debouncedSearch
                ? `No providers found matching "${debouncedSearch}"`
                : "No providers in this stage"}
            </div>
          ) : (
            <div>
              {providers.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  onClick={() => setSelectedProvider(provider)}
                  selected={selectedProvider?.id === provider.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && providers.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {providers.length} provider{providers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedProvider && (
        <ProviderDrawer
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onUpdate={handleProviderUpdate}
        />
      )}
    </div>
  );
}
