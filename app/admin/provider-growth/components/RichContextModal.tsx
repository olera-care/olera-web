"use client";

/**
 * RichContextModal - Clean, minimal sales briefing
 *
 * Apple/Airbnb-inspired design: white space, typography hierarchy, minimal color.
 */

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BriefingResponse {
  questions: {
    received: number;
    unanswered: number;
  };
  engagement: {
    lastDashboardVisit: string | null;
    dashboardVisits30d: number;
    lastProfileEdit: string | null;
    profileEdits30d: number;
    sectionsEdited: string[];
    lastLogin: string | null;
    leadsOpened: number;
    leadOpenRate: number;
    contactsRevealed: number;
  };
  photos: { count: number };
  reviews: {
    rating: number | null;
    count: number | null;
    opportunityLevel: "none" | "mild" | "strong";
    opportunityReason: string | null;
    hasUsedReviewRequests: boolean;
    reviewRequestsSent: number;
  };
  emailAssessment: {
    isGeneric: boolean;
    genericReason: string | null;
  };
  profileCompleteness: {
    percentage: number;
    missingSections: string[];
  };
  adBoost: {
    hasAnyCampaign: boolean;
    activeCampaign: boolean;
    totalCampaigns: number;
    totalLeadsFromAds: number;
    lastCampaignStatus: "pending_profile" | "requested" | "scheduled" | "live" | "ended" | "cancelled" | null;
    campaign: {
      status: "pending_profile" | "requested" | "scheduled" | "live" | "ended" | "cancelled" | null;
      channel: "google" | "meta" | "both" | null;
      budgetCents: number | null;
      spendCents: number | null;
      impressions: number | null;
      clicks: number | null;
      landings: number | null;
      delivered: number | null;
      flightStartDate: string | null;
      flightEndDate: string | null;
      photoReadiness: "unreviewed" | "update_requested" | "review_requested" | "ready" | null;
    } | null;
  };
  medjobs: {
    status: "none" | "in_pilot" | "pilot_expired" | "subscribed";
    eligible: boolean;
    pilotStartedAt: string | null;
    subscribedAt: string | null;
    opportunityLevel: "none" | "pitch" | "convert" | "renew";
    opportunityReason: string | null;
  };
  flags: Array<{
    type: "warning" | "info" | "opportunity";
    label: string;
    detail: string;
  }>;
  recommendedAction: {
    action: string;
    rationale: string;
    pitchAngle: string;
  };
  openingScript: string;
  captureChecklist: Array<{ item: string; reason: string }>;
}

interface BriefingData {
  briefing: BriefingResponse;
  metrics?: {
    googleRating: number | null;
    googleReviewCount: number | null;
    photoCount: number;
    adSpendCents: number | null;
    leadCount: number;
    profileCompleteness: number;
    leadOpenRate: number;
  };
  context?: {
    adsStatus: string;
    claimedAt: string | null;
  };
}

interface RichContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingId: string;
  providerName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function RichContextModal({
  isOpen,
  onClose,
  trackingId,
  providerName,
}: RichContextModalProps) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/provider-growth/${trackingId}/briefing`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    if (isOpen && !data && !loading) fetchBriefing();
  }, [isOpen, data, loading, fetchBriefing]);

  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, [trackingId]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const b = data?.briefing;
  const m = data?.metrics;
  const adsStatus = data?.context?.adsStatus;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{providerName}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sales Briefing</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-100px)]">
            {loading && <LoadingState />}
            {error && <ErrorState error={error} onRetry={fetchBriefing} />}

            {b && m && (
              <div className="space-y-6">
                {/* Key Numbers - simple row */}
                <div className="flex items-baseline gap-8 text-sm">
                  <Stat label="Rating" value={m.googleRating?.toFixed(1) ?? "—"} />
                  <Stat label="Leads" value={m.leadCount} />
                  <Stat label="Questions" value={b.questions.received} alert={b.questions.unanswered > 0} />
                  <Stat label="Profile" value={`${m.profileCompleteness}%`} />
                  <Stat label="Photos" value={m.photoCount} />
                </div>

                {/* Priority Action - the ONE thing to focus on */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Focus of this call
                  </p>
                  <p className="text-base font-medium text-gray-900">{b.recommendedAction.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{b.recommendedAction.rationale}</p>
                </div>

                {/* Opening Line */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Opening line
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    "{b.openingScript}"
                  </p>
                </div>

                {/* Issues - simple list, no colored boxes */}
                {b.flags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Things to address
                    </p>
                    <ul className="space-y-1.5">
                      {b.flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400 mt-0.5">
                            {flag.type === "warning" ? "•" : "○"}
                          </span>
                          <span className={flag.type === "warning" ? "text-gray-900" : "text-gray-600"}>
                            {flag.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What to capture */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Capture during call
                  </p>
                  <ul className="space-y-1.5">
                    {b.captureChecklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-300 mt-0.5">☐</span>
                        <span className="text-gray-700">{item.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick facts - compact */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ad Boost</span>
                      <span className="text-gray-900">
                        {adsStatus === "subscribed" ? "Paying" : adsStatus === "free_intro" ? "Trial" : "None"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dashboard visits</span>
                      <span className="text-gray-900">{b.engagement.dashboardVisits30d} (30d)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last login</span>
                      <span className="text-gray-900">
                        {b.engagement.lastLogin ? formatRelative(b.engagement.lastLogin) : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Leads opened</span>
                      <span className="text-gray-900">{b.engagement.leadOpenRate}%</span>
                    </div>
                    {b.emailAssessment.isGeneric && (
                      <div className="col-span-2 flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="text-amber-600">Generic address</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stat({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div>
      <div className={`text-lg font-semibold ${alert ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-6 w-8 bg-gray-100 rounded" />
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="h-24 bg-gray-50 rounded-xl" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-full bg-gray-50 rounded" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-600 mb-3">{error}</p>
      <button
        onClick={onRetry}
        className="text-sm font-medium text-gray-900 hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
