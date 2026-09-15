"use client";

/**
 * RichContextModal - Data-driven sales briefing modal
 *
 * Displays a comprehensive briefing built from real database records.
 * NO AI generation - everything shown is traceable to actual data.
 */

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types (defined locally to avoid importing from API route)
// ─────────────────────────────────────────────────────────────────────────────

interface BriefingResponse {
  theOneFix: string;
  whatWeOweThem: string | null;
  openWith: string[];
  getThese: string[];
  offer: string;
  logAfterCall: string;
  tags: string[];
  questions: {
    received: number;
    answered: number;
    unanswered: number;
    recentQuestions: Array<{
      question: string;
      created_at: string;
      answered: boolean;
    }>;
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
  photos: {
    count: number;
    hasHeroImage: boolean;
    urls: string[];
  };
  emailAssessment: {
    isGeneric: boolean;
    genericReason: string | null;
  };
  profileCompleteness: {
    percentage: number;
    missingSections: string[];
    hasDescription: boolean;
    hasPricing: boolean;
    hasStaffInfo: boolean;
    hasHours: boolean;
  };
  adBoost: {
    hasAnyCampaign: boolean;
    activeCampaign: boolean;
    totalCampaigns: number;
    lastCampaignStatus: string | null;
    totalLeadsFromAds: number;
  };
  flags: Array<{
    type: "warning" | "info" | "opportunity";
    label: string;
    detail: string;
  }>;
  recommendedAction: {
    priority: number;
    action: string;
    rationale: string;
    pitchAngle: string;
  };
  openingScript: string;
  captureChecklist: Array<{
    item: string;
    reason: string;
  }>;
}

interface RichContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingId: string;
  providerName: string;
}

interface BriefingData {
  briefing: BriefingResponse;
  generatedAt: string;
  cached: boolean;
  metrics?: {
    googleRating: number | null;
    googleReviewCount: number | null;
    photoCount: number;
    adSpendCents: number | null;
    leadCount: number;
    questionsUnanswered: number;
    profileCompleteness: number;
    leadOpenRate: number;
  };
  context?: {
    provider: {
      displayName: string;
      email: string | null;
      phone: string | null;
    };
    pipelineStage: string;
    adsStatus: string;
    claimedAt: string | null;
    daysOverdue: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  subtext,
  alert,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 text-center ${alert ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
      <div className={`text-2xl font-bold ${alert ? "text-amber-700" : "text-gray-900"}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
        {label}
      </div>
      {subtext && (
        <div className={`text-xs mt-0.5 ${alert ? "text-amber-600" : "text-gray-400"}`}>{subtext}</div>
      )}
    </div>
  );
}

function Tag({ children, type = "default" }: { children: React.ReactNode; type?: "default" | "warning" | "success" }) {
  const colors = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors[type]}`}>
      {children}
    </span>
  );
}

function Section({
  title,
  borderColor,
  children,
  icon,
}: {
  title: string;
  borderColor: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`border-l-4 ${borderColor} pl-4 py-2`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function FlagBadge({ flag }: { flag: { type: "warning" | "info" | "opportunity"; label: string; detail: string } }) {
  const colors = {
    warning: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    opportunity: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  const icons = {
    warning: "⚠️",
    info: "ℹ️",
    opportunity: "💡",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${colors[flag.type]}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{icons[flag.type]}</span>
        {flag.label}
      </div>
      <div className="text-xs mt-0.5 opacity-80">{flag.detail}</div>
    </div>
  );
}

function ChecklistItem({ item, reason }: { item: string; reason: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 mt-0.5">☐</span>
      <div>
        <span className="text-gray-900">{item}</span>
        <span className="text-gray-400 ml-1">— {reason}</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 h-16" />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-full h-6 w-24" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-l-4 border-gray-200 pl-4 py-2">
            <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-8 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
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
      const url = `/api/admin/provider-growth/${trackingId}/briefing`;
      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load briefing");
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load briefing");
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  useEffect(() => {
    if (isOpen && !data && !loading) {
      fetchBriefing();
    }
  }, [isOpen, data, loading, fetchBriefing]);

  // Reset state when trackingId changes (different provider selected)
  useEffect(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, [trackingId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const briefing = data?.briefing;
  const metrics = data?.metrics;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Sales Briefing
              </h2>
              <p className="text-sm text-gray-500">{providerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 font-medium">
                Data-driven • No AI
              </span>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading && <LoadingSkeleton />}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={() => fetchBriefing()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Try Again
                </button>
              </div>
            )}

            {briefing && (
              <div className="space-y-6">
                {/* Metrics Grid - Expanded */}
                {metrics && (
                  <div className="grid grid-cols-4 gap-3">
                    <MetricCard
                      label="Google Rating"
                      value={metrics.googleRating?.toFixed(1) ?? "N/A"}
                      subtext={metrics.googleReviewCount ? `${metrics.googleReviewCount} reviews` : undefined}
                    />
                    <MetricCard
                      label="Leads"
                      value={metrics.leadCount}
                      subtext={metrics.leadOpenRate < 50 && metrics.leadCount > 0 ? `${metrics.leadOpenRate}% opened` : undefined}
                      alert={metrics.leadOpenRate < 50 && metrics.leadCount > 3}
                    />
                    <MetricCard
                      label="Questions"
                      value={briefing.questions.received}
                      subtext={briefing.questions.unanswered > 0 ? `${briefing.questions.unanswered} waiting` : "all answered"}
                      alert={briefing.questions.unanswered > 0}
                    />
                    <MetricCard
                      label="Profile"
                      value={`${metrics.profileCompleteness}%`}
                      subtext="complete"
                      alert={metrics.profileCompleteness < 70}
                    />
                  </div>
                )}

                {/* Second row of metrics */}
                {metrics && (
                  <div className="grid grid-cols-4 gap-3">
                    <MetricCard
                      label="Photos"
                      value={briefing.photos.count}
                      alert={briefing.photos.count < 3}
                    />
                    <MetricCard
                      label="Ad Spend"
                      value={metrics.adSpendCents !== null ? `$${Math.round(metrics.adSpendCents / 100)}` : "None"}
                    />
                    <MetricCard
                      label="Dashboard Visits"
                      value={briefing.engagement.dashboardVisits30d}
                      subtext="last 30 days"
                    />
                    <MetricCard
                      label="Profile Edits"
                      value={briefing.engagement.profileEdits30d}
                      subtext="last 30 days"
                    />
                  </div>
                )}

                {/* Flags / Issues to Address */}
                {briefing.flags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Issues to Address
                    </div>
                    <div className="grid gap-2">
                      {briefing.flags.map((flag, i) => (
                        <FlagBadge key={i} flag={flag} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <Section title="Recommended Action" borderColor="border-amber-400">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                    <div className="text-gray-900 font-medium">{briefing.recommendedAction.action}</div>
                    <div className="text-sm text-gray-600 mt-1">{briefing.recommendedAction.rationale}</div>
                    <div className="text-sm text-amber-700 mt-2 font-medium">
                      Pitch angle: {briefing.recommendedAction.pitchAngle}
                    </div>
                  </div>
                </Section>

                {/* Opening Script */}
                <Section title="Opening Script" borderColor="border-teal-400">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700 italic">
                    &ldquo;{briefing.openingScript}&rdquo;
                  </div>
                </Section>

                {/* What to Capture */}
                <Section title="What to Capture" borderColor="border-gray-300">
                  <div className="space-y-2">
                    {briefing.captureChecklist.map((item, i) => (
                      <ChecklistItem key={i} item={item.item} reason={item.reason} />
                    ))}
                  </div>
                </Section>

                {/* Engagement Details */}
                <Section title="Engagement Details" borderColor="border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Last dashboard visit:</span>{" "}
                      <span className="text-gray-900">
                        {briefing.engagement.lastDashboardVisit
                          ? formatRelativeTime(briefing.engagement.lastDashboardVisit)
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last profile edit:</span>{" "}
                      <span className="text-gray-900">
                        {briefing.engagement.lastProfileEdit
                          ? formatRelativeTime(briefing.engagement.lastProfileEdit)
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last login:</span>{" "}
                      <span className="text-gray-900">
                        {briefing.engagement.lastLogin
                          ? formatRelativeTime(briefing.engagement.lastLogin)
                          : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Contacts revealed:</span>{" "}
                      <span className="text-gray-900">{briefing.engagement.contactsRevealed}</span>
                    </div>
                    {briefing.engagement.sectionsEdited.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Sections edited:</span>{" "}
                        <span className="text-gray-900">{briefing.engagement.sectionsEdited.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Email Assessment */}
                {briefing.emailAssessment.isGeneric && (
                  <Section title="Email Assessment" borderColor="border-blue-200">
                    <div className="text-sm text-blue-800 bg-blue-50 rounded px-3 py-2">
                      {briefing.emailAssessment.genericReason}
                    </div>
                  </Section>
                )}

                {/* Ad Boost Status */}
                {briefing.adBoost.hasAnyCampaign && (
                  <Section title="Ad Boost History" borderColor="border-purple-200">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{briefing.adBoost.totalCampaigns}</span> campaign{briefing.adBoost.totalCampaigns !== 1 ? "s" : ""} total
                      {briefing.adBoost.activeCampaign && <span className="ml-2 text-emerald-600 font-medium">(1 active)</span>}
                      {briefing.adBoost.totalLeadsFromAds > 0 && (
                        <span className="ml-2">• {briefing.adBoost.totalLeadsFromAds} leads from ads</span>
                      )}
                    </div>
                  </Section>
                )}

                {/* Tags */}
                {briefing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {briefing.tags.map((tag, i) => (
                      <Tag
                        key={i}
                        type={
                          tag.includes("unanswered") || tag.includes("overdue") || tag.includes("not opening")
                            ? "warning"
                            : tag.includes("verified") || tag.includes("clicks")
                              ? "success"
                              : "default"
                        }
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
