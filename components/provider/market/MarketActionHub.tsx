"use client";

import { useState, useMemo } from "react";
import type { MarketDiagnosticData } from "./MarketDiagnostic";
import type { SelfRank } from "@/lib/market-diagnostic/self-rank";
import MarketDiagnostic from "./MarketDiagnostic";
import ReviewsTab from "./tabs/ReviewsTab";
import ReferralsTab from "./tabs/ReferralsTab";
import AdsTab from "./tabs/AdsTab";

type Tab = "reviews" | "referrals" | "ads";

interface MarketActionHubProps {
  data: MarketDiagnosticData;
  self: SelfRank | null;
  providerName?: string;
  providerSlug?: string;
  providerPlaceId?: string;
  providerReviewCount?: number | null;
}

/**
 * The new "Your Market" action hub - a focused action layer on top of the market analysis.
 * Three tabs: Reviews, Referrals, Ads
 * The full market analysis collapses below.
 */
export default function MarketActionHub({
  data,
  self,
  providerName,
  providerSlug,
  providerPlaceId,
  providerReviewCount,
}: MarketActionHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>("reviews");
  const [isMarketExpanded, setIsMarketExpanded] = useState(false);
  // Incremented when outreach status changes, triggers refetch in expanded section
  const [outreachRefetchKey, setOutreachRefetchKey] = useState(0);

  // Calculate reviews needed to beat next competitor
  const reviewsContext = useMemo(() => {
    if (!self || !data.competitorLandscape) return null;

    const ranked = data.competitorLandscape.ranked || data.competitorLandscape.leaders;
    if (!ranked || ranked.length === 0) return null;

    // Find the competitor just ahead of us
    const competitorsAhead = ranked.filter(c => c.reviews > self.reviews);
    if (competitorsAhead.length === 0) {
      // Provider is #1
      return { isFirst: true, rank: 1, reviews: self.reviews };
    }

    // Sort by reviews ascending to find the closest competitor ahead
    const sortedAhead = [...competitorsAhead].sort((a, b) => a.reviews - b.reviews);
    const nextCompetitor = sortedAhead[0];
    const reviewsNeeded = nextCompetitor.reviews - self.reviews + 1; // +1 to beat them
    const targetRank = self.rank - 1;

    return {
      isFirst: false,
      rank: self.rank,
      reviews: self.reviews,
      nextCompetitor: nextCompetitor.name,
      nextCompetitorReviews: nextCompetitor.reviews,
      reviewsNeeded,
      targetRank,
    };
  }, [self, data.competitorLandscape]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "reviews", label: "Reviews" },
    { id: "referrals", label: "Referrals" },
    { id: "ads", label: "Ads" },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Action Hub - centered, narrow */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#199087]">
            This week · {data.meta.city}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-stone-100 rounded-full p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === "reviews" && (
            <ReviewsTab
              reviewsContext={reviewsContext}
              providerSlug={providerSlug}
              providerName={providerName}
              hasGooglePlaceId={!!providerPlaceId}
              city={data.meta.city}
              providerReviewCount={providerReviewCount ?? null}
              topCompetitor={data.competitorLandscape?.leaders?.[0] ?? null}
            />
          )}

          {activeTab === "referrals" && (
            <ReferralsTab
              targets={data.referralGraph?.prioritizedTargets ?? []}
              providerName={providerName}
              city={data.meta.city}
              onStatusUpdate={() => setOutreachRefetchKey((k) => k + 1)}
            />
          )}

          {activeTab === "ads" && (
            <AdsTab
              city={data.meta.city}
              familiesInCity={data.demand?.olera?.familiesInCity ?? null}
            />
          )}
        </div>

        {/* Collapsible trigger */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setIsMarketExpanded(!isMarketExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span>View your full market analysis</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isMarketExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Market Analysis - full width container */}
      {isMarketExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 animate-fade-in">
          <MarketDiagnostic
            data={data}
            showHeader={false}
            interactive
            providerName={providerName}
            providerSlug={providerSlug}
            self={self}
            outreachRefetchKey={outreachRefetchKey}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
