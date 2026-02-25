"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage, getFreeConnectionsRemaining, FREE_CONNECTION_LIMIT } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import ConnectButton from "@/components/shared/ConnectButton";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";

// ── Types ──

type TimelineFilter = "all" | "immediate" | "within_1_month" | "exploring";
type SortOption = "best_match" | "most_recent" | "most_urgent";

// ── Timeline config ──

const TIMELINE_CONFIG: Record<string, { label: string; dot: string; glow: string; border: string; text: string; bg: string }> = {
  immediate: { label: "Immediate", dot: "bg-red-400", glow: "glowRed", border: "border-red-200", text: "text-red-600", bg: "bg-red-50/50" },
  within_1_month: { label: "Within 1 month", dot: "bg-amber-400", glow: "glowAmber", border: "border-amber-200", text: "text-amber-600", bg: "bg-amber-50/50" },
  within_3_months: { label: "Within 3 months", dot: "bg-blue-400", glow: "glowBlue", border: "border-blue-200", text: "text-blue-600", bg: "bg-blue-50/50" },
  exploring: { label: "Exploring", dot: "bg-warm-300", glow: "glowWarm", border: "border-warm-200", text: "text-gray-500", bg: "bg-warm-50/50" },
};

const FILTER_TABS: { id: TimelineFilter; label: string }[] = [
  { id: "all", label: "All matches" },
  { id: "immediate", label: "Immediate" },
  { id: "within_1_month", label: "Within 1 month" },
  { id: "exploring", label: "Exploring" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "best_match", label: "Best match" },
  { id: "most_recent", label: "Most recent" },
  { id: "most_urgent", label: "Most urgent" },
];

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function computeMatchingServices(
  familyNeeds: string[],
  providerServices: string[],
): number {
  if (!familyNeeds.length || !providerServices.length) return 0;
  const providerSet = new Set(providerServices.map((s) => s.toLowerCase()));
  return familyNeeds.filter((n) => providerSet.has(n.toLowerCase())).length;
}

const URGENCY_ORDER: Record<string, number> = {
  immediate: 0,
  within_1_month: 1,
  within_3_months: 2,
  exploring: 3,
};

// ── Inline keyframes ──

const floatKeyframes = `
@keyframes matchFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes glowRed {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(248,113,113,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(248,113,113,0.6); }
}
@keyframes glowAmber {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(251,191,36,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(251,191,36,0.6); }
}
@keyframes glowBlue {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(96,165,250,0.3); }
  50% { box-shadow: 0 0 8px 3px rgba(96,165,250,0.6); }
}
@keyframes glowWarm {
  0%, 100% { box-shadow: 0 0 3px 1px rgba(168,162,158,0.25); }
  50% { box-shadow: 0 0 8px 3px rgba(168,162,158,0.45); }
}
`;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function LocationIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PeopleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function SendIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  );
}

function InfoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function MatchesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-32 bg-warm-100 rounded-lg mb-2.5" />
          <div className="h-4 w-96 bg-warm-50 rounded" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-11 w-[420px] bg-vanilla-50 border border-warm-100/60 rounded-xl" />
          <div className="h-5 w-32 bg-warm-50 rounded" />
        </div>
        <div className="h-16 bg-white rounded-2xl border border-warm-100/60 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-warm-100/60 overflow-hidden">
                <div className="p-7">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-warm-100 shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-40 bg-warm-100 rounded mb-2" />
                      <div className="h-3.5 w-24 bg-warm-50 rounded" />
                    </div>
                    <div className="h-7 w-24 bg-warm-50 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-warm-100/60 rounded-xl overflow-hidden mb-5">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="bg-warm-50/50 py-3 px-4">
                        <div className="h-4 w-20 bg-warm-100 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mb-5 pl-4 border-l-2 border-warm-100">
                    <div className="h-3.5 bg-warm-50 rounded w-full" />
                    <div className="h-3.5 bg-warm-50 rounded w-4/5" />
                  </div>
                  <div className="flex gap-2.5">
                    <div className="h-8 w-24 bg-warm-50 rounded-full" />
                    <div className="h-8 w-28 bg-warm-50 rounded-full" />
                  </div>
                </div>
                <div className="bg-warm-50/40 px-7 py-4">
                  <div className="h-4 w-48 bg-warm-100/60 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="h-72 bg-warm-50/50 rounded-2xl border border-warm-100/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function MatchesEmptyState() {
  return (
    <div className="lg:col-span-2">
      <div className="flex flex-col items-center text-center py-20 px-8">
        <div
          className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100/50 flex items-center justify-center mb-6"
          style={{ animation: "matchFloat 3s ease-in-out infinite" }}
        >
          <PeopleIcon className="w-8 h-8 text-primary-500" />
        </div>
        <h3 className="text-lg font-display font-bold text-gray-900">
          No families found yet
        </h3>
        <p className="text-[15px] text-gray-500 mt-2 leading-relaxed max-w-sm">
          When families publish care posts matching your services and location,
          they&apos;ll appear here. Check back soon.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free-tier Usage Banner
// ---------------------------------------------------------------------------

function UsageBanner({
  remaining,
  totalFamilies,
}: {
  remaining: number;
  totalFamilies: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-7 py-4.5 flex items-center justify-between mb-8">
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: FREE_CONNECTION_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`w-[9px] h-[9px] rounded-full ${
                i < remaining ? "bg-primary-500" : "bg-warm-200"
              }`}
            />
          ))}
        </div>
        <p className="text-[15px] text-gray-600">
          <span className="font-bold text-gray-900">{remaining} reach-out{remaining !== 1 ? "s" : ""}</span>{" "}
          <span className="text-gray-400">remaining this month</span>
        </p>
      </div>
      <div className="flex items-center gap-5">
        <p className="text-[15px] text-gray-400 hidden sm:block">
          <span className="font-semibold text-gray-700">{totalFamilies}</span>{" "}
          families near you
        </p>
        <Link
          href="/provider/pro"
          className="inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
          Get unlimited
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pro Upgrade Banner (shown after 3rd card for free-tier users)
// ---------------------------------------------------------------------------

function ProUpgradeBanner({ remainingFamilies }: { remainingFamilies: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1d23 0%, #252830 50%, #1e2127 100%)" }}>
      {/* Subtle warm glow accent — top-right */}
      <div
        className="absolute top-0 right-0 w-72 h-72 opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, #199087, transparent 70%)" }}
      />

      <div className="relative px-8 py-9 sm:px-10 sm:py-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/20 mb-6">
          <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
          <span className="text-xs font-bold text-primary-400 tracking-wide uppercase">
            Olera Pro
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-[22px] sm:text-[26px] font-display font-bold text-white leading-tight mb-3 tracking-tight">
          {remainingFamilies} more {remainingFamilies === 1 ? "family is" : "families are"} waiting to hear from you
        </h3>
        <p className="text-[15px] text-gray-400 leading-relaxed max-w-lg mb-8">
          You&apos;ve reached your monthly limit. Upgrade to connect with every family
          that matches your services, get priority visibility, and convert more leads into clients.
        </p>

        {/* Value stats */}
        <div className="flex items-start gap-8 sm:gap-12 mb-9">
          <div>
            <p className="text-2xl font-display font-bold text-primary-400 tracking-tight">
              &infin;
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">Reach-outs</p>
          </div>
          <div className="w-px h-10 bg-gray-700/60" />
          <div>
            <p className="text-2xl font-display font-bold text-primary-400 tracking-tight">
              3&times;
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">Visibility</p>
          </div>
          <div className="w-px h-10 bg-gray-700/60" />
          <div>
            <p className="text-2xl font-display font-bold text-primary-400 tracking-tight">
              2&times;
            </p>
            <p className="text-[13px] text-gray-500 mt-0.5">More leads</p>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-5">
          <Link
            href="/provider/pro"
            className="inline-flex items-center gap-2.5 pl-6 pr-7 py-3.5 rounded-xl bg-primary-500 text-white text-[15px] font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
          >
            Upgrade to Pro
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <span className="text-[14px] text-gray-500">
            From <span className="font-semibold text-gray-400">$25/mo</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Family Care Card
// ---------------------------------------------------------------------------

function FamilyCareCard({
  family,
  hasFullAccess,
  fromProfileId,
  providerCareTypes,
  freeRemaining,
  contacted,
}: {
  family: Profile;
  hasFullAccess: boolean;
  fromProfileId: string;
  providerCareTypes: string[];
  freeRemaining: number | null;
  contacted?: boolean;
}) {
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const aboutSituation = meta?.about_situation;
  const publishedAt = meta?.care_post?.published_at;
  const displayName = family.display_name || "Family";
  const initials = getInitials(displayName);

  // Compute matching services
  const matchCount = computeMatchingServices(careNeeds, providerCareTypes);

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 ${contacted ? "opacity-55" : ""}`}>
      {/* ── Card body ── */}
      <div className="p-7">
        {/* Header: avatar + name/location + timeline + time */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar — rounded-2xl, warm tones */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white shadow-sm"
            style={{ background: hasFullAccess ? avatarGradient(displayName) : "#9ca3af" }}
          >
            {hasFullAccess ? initials : "?"}
          </div>

          {/* Name + location */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-lg font-display font-bold text-gray-900 truncate leading-tight">
              {hasFullAccess ? displayName : blurName(displayName)}
            </h3>
            {locationStr && (
              <div className="flex items-center gap-1 mt-1">
                <LocationIcon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[13px] text-gray-500">
                  {hasFullAccess ? locationStr : "***"}
                </span>
              </div>
            )}
          </div>

          {/* Timeline pill + timestamp — right side */}
          <div className="flex items-center gap-3 shrink-0">
            {timeline && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${timeline.border} ${timeline.text} ${timeline.bg}`}>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${timeline.dot}`}
                  style={{ animation: `${timeline.glow} 2s ease-in-out infinite` }}
                />
                {timeline.label}
              </span>
            )}
            {publishedAt && (
              <span className="text-[13px] text-gray-400 tabular-nums">
                {timeAgo(publishedAt)}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats bar — 3 columns ── */}
        <div className="grid grid-cols-3 rounded-xl border border-warm-100/80 overflow-hidden mb-5">
          {/* Services match */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30">
            <CheckCircleIcon className="w-4 h-4 text-primary-500" />
            <p className="text-[13px] text-gray-500">
              <span className="font-bold text-primary-600">{matchCount} service{matchCount !== 1 ? "s" : ""}</span>{" "}
              match
            </p>
          </div>
          {/* Location */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30 border-x border-warm-100/80">
            <LocationIcon className="w-4 h-4 text-primary-500" />
            <p className="text-[13px] text-gray-500">
              <span className="font-bold text-gray-700">{locationStr || "—"}</span>
            </p>
          </div>
          {/* Competition indicator */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30">
            <PeopleIcon className="w-4 h-4 text-primary-500" />
            <p className="text-[13px] text-gray-500">
              <span className="font-bold text-gray-700">{careNeeds.length}</span>{" "}
              care need{careNeeds.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── About situation — blockquote style (fixed height: 2 lines) ── */}
        <div className="border-l-2 border-warm-200 pl-4 mb-5 min-h-[3.25rem]">
          {aboutSituation && hasFullAccess ? (
            <p className="text-[15px] text-gray-600 leading-relaxed line-clamp-2">
              {aboutSituation}
            </p>
          ) : (
            <p className="text-[15px] text-gray-400 italic leading-relaxed">
              No description provided
            </p>
          )}
        </div>

        {/* ── Care need tags with checkmarks ── */}
        {careNeeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {careNeeds.slice(0, 5).map((need) => {
              const isMatch = providerCareTypes.some(
                (s) => s.toLowerCase() === need.toLowerCase(),
              );
              return (
                <span
                  key={need}
                  className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border ${
                    isMatch
                      ? "border-primary-200 text-primary-700 bg-primary-50/50"
                      : "border-warm-100 text-gray-600 bg-white"
                  }`}
                >
                  {isMatch && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {need}
                </span>
              );
            })}
            {careNeeds.length > 5 && (
              <span className="text-[13px] text-gray-400 self-center pl-1">
                +{careNeeds.length - 5}
              </span>
            )}
          </div>
        )}

      </div>

      {/* ── Card footer ── */}
      {freeRemaining !== null && freeRemaining <= 0 ? (
        /* Exhausted state — dashed border + upgrade CTA */
        <div className="border-t border-dashed border-primary-200/60 px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-[13px] text-gray-400">
              You&apos;ve used all {FREE_CONNECTION_LIMIT} free reach-outs this month
            </p>
          </div>
          <Link
            href="/provider/pro"
            className="inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            Upgrade to reach out
          </Link>
        </div>
      ) : (
        /* Normal state — warm strip with connect button */
        <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <InfoIcon className="w-4 h-4 text-gray-400" />
            <p className="text-[13px] text-gray-400">
              Your profile will be shared with this family
            </p>
          </div>
          <ConnectButton
            fromProfileId={fromProfileId}
            toProfileId={family.id}
            toName={family.display_name}
            connectionType="request"
            connectionMetadata={{ provider_initiated: true }}
            label="Reach out"
            sentLabel="Sent"
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { membership } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const freeRemaining = getFreeConnectionsRemaining(membership);
  const isFreeTier = freeRemaining !== null;
  const providerCareTypes = providerProfile?.care_types || [];

  const profileId = providerProfile?.id;

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();

        const [familiesRes, connectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, type, care_types, metadata, image_url, slug, created_at")
            .eq("type", "family")
            .eq("is_active", true)
            .filter("metadata->care_post->>status", "eq", "active")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted"]),
        ]);

        if (familiesRes.error) {
          console.error("[olera] matches fetch error:", familiesRes.error.message);
        }

        setFamilies((familiesRes.data as Profile[]) || []);
        setContactedIds(
          new Set(connectionsRes.data?.map((c) => c.to_profile_id) || [])
        );
      } catch (err) {
        console.error("[olera] matches fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  // Filter + sort
  const filteredFamilies = useMemo(() => {
    const newF = families.filter((f) => !contactedIds.has(f.id));

    let filtered = newF;
    if (activeFilter !== "all") {
      filtered = newF.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        return meta?.timeline === activeFilter;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const metaA = a.metadata as FamilyMetadata;
      const metaB = b.metadata as FamilyMetadata;

      if (sortBy === "most_recent") {
        const dateA = metaA?.care_post?.published_at || a.created_at;
        const dateB = metaB?.care_post?.published_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }

      if (sortBy === "most_urgent") {
        const urgA = URGENCY_ORDER[metaA?.timeline || "exploring"] ?? 3;
        const urgB = URGENCY_ORDER[metaB?.timeline || "exploring"] ?? 3;
        return urgA - urgB;
      }

      // best_match: most service overlap first, then urgent, then recent
      const needsA = metaA?.care_needs || a.care_types || [];
      const needsB = metaB?.care_needs || b.care_types || [];
      const matchA = computeMatchingServices(needsA, providerCareTypes);
      const matchB = computeMatchingServices(needsB, providerCareTypes);
      if (matchA !== matchB) return matchB - matchA;
      const urgA = URGENCY_ORDER[metaA?.timeline || "exploring"] ?? 3;
      const urgB = URGENCY_ORDER[metaB?.timeline || "exploring"] ?? 3;
      if (urgA !== urgB) return urgA - urgB;
      const dateA = metaA?.care_post?.published_at || a.created_at;
      const dateB = metaB?.care_post?.published_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return sorted;
  }, [families, contactedIds, activeFilter, sortBy, providerCareTypes]);

  const contactedFamilies = useMemo(
    () => families.filter((f) => contactedIds.has(f.id)),
    [families, contactedIds],
  );

  if (!providerProfile || loading) {
    return <MatchesSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-[28px] font-display font-bold text-gray-900 tracking-tight">
          Matches
        </h1>
        <p className="text-[15px] text-gray-500 mt-1.5 leading-relaxed">
          Matched to your services and location. Reach out to start a conversation.
        </p>
      </div>

      {/* ── Filter tabs + Sort ── */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={[
                "px-5 py-2.5 rounded-[10px] text-[13px] font-semibold whitespace-nowrap transition-all duration-150",
                activeFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort matches"
            className="text-[13px] font-bold text-gray-900 bg-transparent border-none cursor-pointer focus:outline-none focus:ring-0 pr-5 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0 center",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Free-tier usage banner ── */}
      {isFreeTier && (
        <UsageBanner
          remaining={freeRemaining}
          totalFamilies={families.length}
        />
      )}

      {/* ── Content grid ── */}
      {families.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <MatchesEmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content — 2/3 */}
          <div className="lg:col-span-2 space-y-5">
            {filteredFamilies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm text-center py-16 px-8">
                <div className="w-12 h-12 rounded-2xl bg-warm-50 border border-warm-100/60 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-warm-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                </div>
                <p className="text-[15px] font-display font-semibold text-gray-900 mb-1">
                  No matches for this filter
                </p>
                <p className="text-sm text-gray-500">
                  Try &ldquo;All matches&rdquo; to see everyone.
                </p>
              </div>
            ) : (
              filteredFamilies.map((family, idx) => (
                <div key={family.id}>
                  <FamilyCareCard
                    family={family}
                    hasFullAccess={hasFullAccess}
                    fromProfileId={profileId!}
                    providerCareTypes={providerCareTypes}
                    freeRemaining={freeRemaining}
                  />
                  {/* Pro banner after the 3rd card for free-tier users */}
                  {idx === 2 && isFreeTier && filteredFamilies.length > FREE_CONNECTION_LIMIT && (
                    <div className="mt-5">
                      <ProUpgradeBanner remainingFamilies={filteredFamilies.length - FREE_CONNECTION_LIMIT} />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Already contacted */}
            {contactedFamilies.length > 0 && (
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Already contacted &middot; {contactedFamilies.length}
                </p>
                <div className="space-y-5">
                  {contactedFamilies.map((family) => (
                    <FamilyCareCard
                      key={family.id}
                      family={family}
                      hasFullAccess={hasFullAccess}
                      fromProfileId={profileId!}
                      providerCareTypes={providerCareTypes}
                      freeRemaining={freeRemaining}
                      contacted
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="lg:col-span-1">
            {/* Placeholder for future sidebar content */}
          </div>
        </div>
      )}
    </div>
  );
}
