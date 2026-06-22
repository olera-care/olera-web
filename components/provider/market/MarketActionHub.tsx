"use client";

import { useState, useMemo } from "react";
import type { MarketDiagnosticData } from "./MarketDiagnostic";
import type { SelfRank } from "@/lib/market-diagnostic/self-rank";
import MarketDiagnostic from "./MarketDiagnostic";
import ReviewsTab from "./tabs/ReviewsTab";

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
            Your Market · {data.meta.city}
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
              hasGooglePlaceId={!!providerPlaceId}
              city={data.meta.city}
              topCompetitor={data.competitorLandscape?.leaders?.[0] ?? null}
              leaders={data.competitorLandscape?.leaders ?? []}
              providerReviewCount={providerReviewCount ?? null}
            />
          )}

          {activeTab === "referrals" && (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <p className="text-lg font-display font-semibold text-stone-900 mb-2">Referrals</p>
              <p className="text-sm text-stone-500">Coming soon</p>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
              </div>
              <p className="text-lg font-display font-semibold text-stone-900 mb-2">Managed Ads</p>
              <p className="text-sm text-stone-500">Coming soon</p>
            </div>
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
