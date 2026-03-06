"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage, getFreeConnectionsRemaining, FREE_CONNECTION_LIMIT, isProfileShareable } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import { calculateProfileCompleteness, type ExtendedMetadata } from "@/lib/profile-completeness";
import OrganizationsTab from "./OrganizationsTab";
import CaregiversTab from "./CaregiversTab";

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

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveTime(miles: number): string {
  const minutes = Math.round(miles / 0.5); // ~30 mph avg
  if (minutes < 1) return "1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

const URGENCY_ORDER: Record<string, number> = {
  immediate: 0,
  within_1_month: 1,
  within_3_months: 2,
  exploring: 3,
};

const DEFAULT_NOTE_KEY = "olera_default_reachout_note";
const PAGE_SIZE = 20;

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

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function MatchesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function MatchesEmptyState() {
  return (
    <div>
      <div className="flex flex-col items-center text-center py-20 px-8">
        <div
          className="w-16 h-16 rounded-2xl bg-warm-100/60 border border-warm-200/50 flex items-center justify-center mb-6"
          style={{ animation: "matchFloat 3s ease-in-out infinite" }}
        >
          <PeopleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-display font-bold text-gray-900">
          No families found yet
        </h3>
        <p className="text-[15px] text-gray-500 mt-2 leading-relaxed max-w-sm">
          When families publish care profiles matching your services and location,
          they&apos;ll appear here. Check back soon.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matches Sidebar (sticky — mirrors dashboard completeness sidebar)
// ---------------------------------------------------------------------------

function MatchesSidebar({
  remaining,
  totalFamilies,
  isFreeTier,
  contactedCount,
  respondedCount,
  newMatchesToday,
}: {
  remaining: number | null;
  totalFamilies: number;
  isFreeTier: boolean;
  contactedCount: number;
  respondedCount: number;
  newMatchesToday: number;
}) {
  const isPro = !isFreeTier;
  const responseRate = contactedCount > 0 ? Math.round((respondedCount / contactedCount) * 100) : 0;

  const used = FREE_CONNECTION_LIMIT - (remaining ?? FREE_CONNECTION_LIMIT);

  return (
    <div className="sticky top-24 space-y-3">
      {/* ── Activity + reach-out counter ── */}
      <div className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
        <div className="p-5">
          <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Your activity
          </h3>

          {/* Pipeline stats */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Reach-outs sent</span>
              <span className="text-[13px] font-bold text-gray-900">{contactedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Responses received</span>
              <span className="text-[13px] font-bold text-gray-900">{respondedCount}</span>
            </div>
            {newMatchesToday > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">New matches today</span>
                <span className="text-[13px] font-bold text-primary-600">{newMatchesToday}</span>
              </div>
            )}
          </div>

          {/* Reach-out bar (free tier) */}
          {isFreeTier && remaining !== null && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-gray-500">Reach-outs remaining</span>
                <span className="text-[13px] font-bold text-gray-900">{remaining}</span>
              </div>
              <div className="h-2 bg-warm-100/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${(used / FREE_CONNECTION_LIMIT) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {used} of {FREE_CONNECTION_LIMIT} used
              </p>
            </div>
          )}

          {/* Pro badge for pro users */}
          {isPro && (
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50/60 border border-primary-100/60">
                <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-[10px] font-bold text-primary-700 tracking-wide uppercase">Pro</span>
              </div>
              <span className="text-[13px] text-gray-500">Unlimited reach-outs</span>
            </div>
          )}
        </div>

        {/* Free tier: compact Pro upsell */}
        {isFreeTier && (
          <Link
            href="/provider/pro"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            Get unlimited · $25/mo
          </Link>
        )}
      </div>

      {/* ── How It Works — always visible ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden p-5">
        <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          How it works
        </h3>
        <div className="space-y-3.5">
          {[
            { num: 1, bold: "Browse matches", rest: "and reach out" },
            { num: 2, bold: "They review", rest: "your profile and message" },
            { num: 3, bold: "Continue", rest: "the conversation in your Inbox" },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-warm-100/70 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-gray-500">{step.num}</span>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">{step.bold}</span> {step.rest}
              </p>
            </div>
          ))}
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
  isExpanded,
  onExpand,
  onCollapse,
  providerProfile,
  reachOutNote,
  onNoteChange,
  saveAsDefault,
  onSaveAsDefaultChange,
  sending,
  onSend,
  sendError,
  reachOutCount,
  isNew,
}: {
  family: Profile;
  hasFullAccess: boolean;
  fromProfileId: string;
  providerCareTypes: string[];
  freeRemaining: number | null;
  contacted?: boolean;
  isExpanded?: boolean;
  onExpand?: (family: Profile) => void;
  onCollapse?: () => void;
  providerProfile?: Profile | null;
  reachOutNote?: string;
  onNoteChange?: (v: string) => void;
  saveAsDefault?: boolean;
  onSaveAsDefaultChange?: (v: boolean) => void;
  sending?: boolean;
  onSend?: () => void;
  sendError?: string | null;
  reachOutCount?: number;
  isNew?: boolean;
}) {
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const aboutSituation = meta?.about_situation || family.description;
  const publishedAt = meta?.care_post?.published_at;
  const paymentMethods = meta?.payment_methods || [];
  const savedBenefits = meta?.saved_benefits || [];
  const primaryPayment = paymentMethods[0] || null;
  const allBenefits = [...paymentMethods.slice(1), ...savedBenefits];
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const displayName = family.display_name || "Family";
  const initials = getInitials(displayName);
  const familyFirstName = displayName.split(/\s+/)[0];
  const matchCount = computeMatchingServices(careNeeds, providerCareTypes);
  const reachOuts = reachOutCount ?? 0;

  // Match context line
  const matchingNames = careNeeds.filter((n) =>
    providerCareTypes.some((s) => s.toLowerCase() === n.toLowerCase())
  );
  const matchContext = matchCount >= 2
    ? `Strong match — needs ${matchingNames.slice(0, 2).join(" and ")}, which you provide`
    : matchCount === 1
    ? `Good match — needs ${matchingNames[0]}, which you provide`
    : reachOuts === 0
    ? "New opportunity — be first to connect"
    : null;

  // Distance computation
  const providerLat = providerProfile?.lat;
  const providerLng = providerProfile?.lng;
  const familyLat = family.lat;
  const familyLng = family.lng;
  const driveTime =
    providerLat != null && providerLng != null && familyLat != null && familyLng != null
      ? estimateDriveTime(haversineDistance(providerLat, providerLng, familyLat, familyLng))
      : null;

  // Provider preview data
  const providerName = providerProfile?.display_name || "Your profile";
  const providerLocation = providerProfile
    ? [providerProfile.city, providerProfile.state].filter(Boolean).join(", ")
    : "";
  const providerInitials = providerProfile ? getInitials(providerName) : "";
  const providerCompleteness = providerProfile
    ? calculateProfileCompleteness(
        providerProfile,
        (providerProfile.metadata || {}) as ExtendedMetadata,
      )
    : null;

  return (
    <div
      className={[
        "bg-white rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]",
        isExpanded
          ? "border-gray-300 shadow-lg shadow-gray-900/[0.06] ring-1 ring-gray-200/60"
          : "border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300",
        contacted ? "opacity-55" : "",
      ].join(" ")}
    >
      {/* ── Card body ── */}
      <div className="p-4 lg:p-7">
        {/* Mobile header layout */}
        <div className="lg:hidden mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm"
              style={{ background: hasFullAccess ? avatarGradient(displayName) : "#9ca3af" }}
            >
              {hasFullAccess ? initials : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-display font-bold text-gray-900 leading-tight">
                {hasFullAccess ? displayName : blurName(displayName)}
              </h3>
              {locationStr && (
                <div className="flex items-center gap-1 mt-0.5">
                  <LocationIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {hasFullAccess ? locationStr : "***"}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {isNew && !contacted && (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                New
              </span>
            )}
            {timeline && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${timeline.border} ${timeline.text} ${timeline.bg}`}>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${timeline.dot}`}
                  style={{ animation: `${timeline.glow} 2s ease-in-out infinite` }}
                />
                {timeline.label}
              </span>
            )}
            {publishedAt && (
              <span className="text-xs text-gray-400 tabular-nums">
                {timeAgo(publishedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Desktop header layout */}
        <div className="hidden lg:flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white shadow-sm"
            style={{ background: hasFullAccess ? avatarGradient(displayName) : "#9ca3af" }}
          >
            {hasFullAccess ? initials : "?"}
          </div>
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
          <div className="flex items-center gap-2.5 shrink-0">
            {isNew && !contacted && (
              <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                New
              </span>
            )}
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

        {/* ── Match context line ── */}
        {matchContext && !contacted && (
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-4 lg:mb-5 ${
            matchCount >= 2
              ? "bg-primary-50/60 border border-primary-100/60"
              : matchCount === 1
              ? "bg-warm-50/60 border border-warm-100/60"
              : "bg-primary-50/40 border border-primary-100/40"
          }`}>
            {matchCount > 0 ? (
              <CheckCircleIcon className="w-4 h-4 text-primary-500 shrink-0" />
            ) : (
              <PeopleIcon className="w-4 h-4 text-primary-500 shrink-0" />
            )}
            <p className={`text-[13px] font-medium ${matchCount >= 2 ? "text-primary-700" : matchCount === 1 ? "text-gray-600" : "text-primary-600"}`}>
              {matchContext}
            </p>
          </div>
        )}

        {/* ── About situation — full text when expanded ── */}
        <div className="border-l-2 border-warm-200 pl-3 lg:pl-4 mb-4 lg:mb-5">
          {aboutSituation && hasFullAccess ? (
            <p className={`text-sm lg:text-[15px] text-gray-600 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
              {aboutSituation}
            </p>
          ) : (
            <p className="text-sm lg:text-[15px] text-gray-400 italic leading-relaxed">
              No description provided
            </p>
          )}
        </div>

        {/* ── Care need tags — horizontal scroll on mobile ── */}
        {careNeeds.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide pb-1">
            {careNeeds.slice(0, 5).map((need) => {
              const isMatch = providerCareTypes.some(
                (s) => s.toLowerCase() === need.toLowerCase(),
              );
              return (
                <span
                  key={need}
                  className={`inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 ${
                    isMatch
                      ? "border-[#F5F4F1] text-gray-700 bg-[#F5F4F1]"
                      : "border-warm-100 text-gray-500 bg-white"
                  }`}
                >
                  {isMatch && (
                    <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {need}
                </span>
              );
            })}
            {careNeeds.length > 5 && (
              <span className="text-xs lg:text-[13px] text-gray-400 self-center pl-1 shrink-0">
                +{careNeeds.length - 5}
              </span>
            )}
          </div>
        )}

        {/* ── Payment & benefits ── */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide pb-1">
          <span className="text-[10px] lg:text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-0.5 shrink-0">
            Payment
          </span>
          {primaryPayment ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border border-primary-100 text-primary-700 bg-primary-50/40 whitespace-nowrap shrink-0">
                <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                {primaryPayment}
              </span>
              {paymentExpanded ? (
                allBenefits.map((b) => (
                  <span key={b} className="inline-flex items-center text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border border-warm-100 text-gray-500 bg-white whitespace-nowrap shrink-0">
                    {b}
                  </span>
                ))
              ) : (
                allBenefits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentExpanded(true)}
                    className="inline-flex items-center text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full border border-warm-100 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-500 transition-colors whitespace-nowrap shrink-0"
                  >
                    +{allBenefits.length} more
                  </button>
                )
              )}
            </>
          ) : (
            <span className="inline-flex items-center text-xs lg:text-[13px] font-medium px-2.5 lg:px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 whitespace-nowrap shrink-0">
              Not specified
            </span>
          )}
        </div>
      </div>

      {/* ── Inline reach-out expansion ── */}
      <div
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={`border-t border-warm-100/60 bg-gradient-to-b from-vanilla-50/40 to-warm-50/20 transition-[opacity,transform] ${isExpanded ? "duration-400 delay-150 opacity-100 translate-y-0" : "duration-200 opacity-0 translate-y-1"}`}>
          <div className="px-7 py-6">
            {/* Message heading */}
            <h4 className="text-[18px] font-display font-bold text-gray-900 mb-3">
              Tell the {familyFirstName} family why you&apos;re a good fit
            </h4>

            {/* Textarea */}
            <textarea
              value={reachOutNote}
              onChange={(e) => onNoteChange?.(e.target.value)}
              placeholder={`Share what makes your care approach a great match for the ${familyFirstName} family...`}
              rows={4}
              className="w-full px-4 py-3.5 text-[15px] leading-relaxed text-gray-700 bg-white border border-warm-200/80 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none placeholder:text-gray-400"
            />

            {/* Hint + save as default */}
            <div className="flex items-center justify-between mt-2.5 mb-6">
              <p className="text-[13px] text-gray-400">
                Personal notes get <span className="font-medium">3&times; more responses</span>
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => onSaveAsDefaultChange?.(e.target.checked)}
                  className="w-4 h-4 rounded border-warm-300 text-primary-600 focus:ring-primary-500/20 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[13px] text-gray-500">
                  Save as default
                </span>
              </label>
            </div>

            {/* ── Profile sharing notice ── */}
            {providerProfile && (
              <div className="flex items-center gap-2.5 text-[13px] text-gray-400">
                <EyeIcon className="w-4 h-4 shrink-0" />
                {providerCompleteness && providerCompleteness.overall < 100 ? (
                  <p>
                    Your profile ({providerCompleteness.overall}% complete) will be shared.{" "}
                    <a href="/provider" className="font-medium text-gray-500 underline underline-offset-2 decoration-gray-300 hover:text-gray-700 transition-colors">
                      Complete it
                    </a>{" "}
                    to get more responses.
                  </p>
                ) : (
                  <p>Your full profile will be shared with {familyFirstName}.</p>
                )}
              </div>
            )}

            {/* Error */}
            {sendError && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600">
                {sendError}
              </div>
            )}
          </div>

          {/* ── Expanded footer: usage left / cancel + send ── */}
          <div className="border-t border-warm-100/60 px-7 py-4 flex items-center justify-between gap-4">
            {freeRemaining !== null ? (
              <p className="text-[13px] text-gray-400 min-w-0 truncate">
                This will use 1 of your {freeRemaining} monthly reach-out{freeRemaining !== 1 ? "s" : ""}
              </p>
            ) : <div />}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onCollapse}
                disabled={sending}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-[14px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSend}
                disabled={sending}
                className="group inline-flex items-center gap-2 pl-5 pr-6 py-2.5 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] disabled:opacity-70 disabled:hover:shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] transition-all duration-200 shrink-0"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                )}
                {sending ? "Sending\u2026" : "Send reach-out"}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Card footer (collapsed states) ── */}
      {!isExpanded && (
        <>
          {contacted ? (
            /* Already reached out */
            <div className="bg-warm-50/40 border-t border-warm-100/60 px-4 lg:px-7 py-3 lg:py-4 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                <p className="text-xs lg:text-[13px] text-gray-500 font-medium">Reached out</p>
              </div>
            </div>
          ) : freeRemaining !== null && freeRemaining <= 0 ? (
            /* Exhausted state — upgrade CTA */
            <div className="border-t border-warm-100/60 px-4 lg:px-7 py-3 lg:py-4 flex flex-col lg:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <p className="text-xs lg:text-[13px] text-gray-400">
                  {FREE_CONNECTION_LIMIT} free reach-outs used
                </p>
              </div>
              <Link
                href="/provider/pro"
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 lg:pl-4 lg:pr-5 py-2.5 rounded-xl lg:rounded-full bg-gray-900 text-white text-xs lg:text-[13px] font-semibold hover:bg-gray-800 transition-colors min-h-[44px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                Upgrade to reach out
              </Link>
            </div>
          ) : (
            /* Normal — reach out button */
            <div className="bg-warm-50/40 border-t border-warm-100/60 px-4 lg:px-7 py-3 lg:py-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="hidden lg:flex items-center gap-1.5">
                <InfoIcon className="w-4 h-4 text-gray-400" />
                <p className="text-[13px] text-gray-400">
                  Your profile will be shared with this family
                </p>
              </div>
              <button
                type="button"
                onClick={() => onExpand?.(family)}
                className="w-full lg:w-auto group inline-flex items-center justify-center gap-2 px-5 lg:pl-5 lg:pr-6 py-3 lg:py-2.5 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-sm lg:text-[14px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.98] transition-all duration-200 min-h-[48px] lg:min-h-0"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075-5.925v2.1a1.575 1.575 0 0 1 3.15 0v1.425M13.2 8.1v-1.5a1.575 1.575 0 0 1 3.15 0v3.075M13.2 8.1l.075 3.525M6.9 7.575a1.575 1.575 0 0 1 3.15 0v1.5m-3.15-1.5v4.65c0 2.733 1.566 5.1 3.853 6.25.484.243 1.01.427 1.553.546a7.462 7.462 0 0 0 5.956-1.553A7.466 7.466 0 0 0 21 12.376V9.75a1.575 1.575 0 0 0-3.15 0v1.875" />
                </svg>
                Reach out
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type MatchesView = "families" | "organizations" | "caregivers";

// ── Inbound interest types ──

interface InboundInterest {
  id: string;
  from_profile_id: string;
  type: string;
  status: string;
  message: string | null;
  created_at: string;
  profile: Profile | null;
}

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { membership, refreshAccountData } = useAuth();
  const isCaregiver = providerProfile?.type === "caregiver";
  const isOrg = providerProfile?.type === "organization";
  const [activeView, setActiveView] = useState<MatchesView>("families");

  // Read ?tab= from URL on mount (avoids useSearchParams Suspense requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "organizations") setActiveView("organizations");
    if (tab === "caregivers") setActiveView("caregivers");
  }, []);

  // ── Section A: Inbound interest (families/orgs who reached out to us) ──
  const [inboundInterest, setInboundInterest] = useState<InboundInterest[]>([]);
  const [inboundLoading, setInboundLoading] = useState(true);

  const profileId_for_inbound = providerProfile?.id;

  useEffect(() => {
    if (!profileId_for_inbound || !isSupabaseConfigured()) {
      setInboundLoading(false);
      return;
    }

    const fetchInbound = async () => {
      try {
        const supabase = createClient();

        // Fetch connections where someone reached out TO this provider
        // Types: "inquiry" (family → provider), "invitation" (org → caregiver)
        const { data: connections, error } = await supabase
          .from("connections")
          .select("id, from_profile_id, type, status, message, created_at")
          .eq("to_profile_id", profileId_for_inbound)
          .in("type", ["inquiry", "invitation"])
          .in("status", ["pending", "accepted"])
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("[olera] inbound interest error:", error.message);
          setInboundLoading(false);
          return;
        }

        if (!connections || connections.length === 0) {
          setInboundInterest([]);
          setInboundLoading(false);
          return;
        }

        // Enrich with profile data
        const fromIds = [...new Set(connections.map((c) => c.from_profile_id))];
        const { data: profiles } = await supabase
          .from("business_profiles")
          .select("id, display_name, city, state, type, care_types, metadata, image_url, slug")
          .in("id", fromIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p as Profile]));

        setInboundInterest(
          connections.map((c) => ({
            ...c,
            profile: profileMap.get(c.from_profile_id) || null,
          }))
        );
      } catch (err) {
        console.error("[olera] inbound interest failed:", err);
      } finally {
        setInboundLoading(false);
      }
    };

    fetchInbound();
  }, [profileId_for_inbound]);

  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [reachOutCounts, setReachOutCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");

  // Toast state for post-reach-out feedback
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Last visit tracking for "New" badges
  const [lastVisitTs, setLastVisitTs] = useState<number>(0);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("olera_matches_last_visit");
      if (stored) setLastVisitTs(parseInt(stored, 10));
      // Update the timestamp for next visit
      localStorage.setItem("olera_matches_last_visit", String(Date.now()));
    } catch { /* ignore */ }
  }, []);

  // Reach-out expansion state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [reachOutNote, setReachOutNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Mobile bottom sheet state
  const [reachOutSheetFamily, setReachOutSheetFamily] = useState<Profile | null>(null);

  const hasFullAccess = canEngage(
    providerProfile?.type,
    membership,
    "view_inquiry_details"
  );

  const freeRemaining = getFreeConnectionsRemaining(membership);
  const isFreeTier = freeRemaining !== null;
  const providerCareTypes = providerProfile?.care_types || [];

  const profileId = providerProfile?.id;

  // ── Expansion handlers ──

  // Mobile: open bottom sheet; Desktop: expand inline
  const handleExpand = useCallback(
    (familyId: string, family?: Profile) => {
      if (!isProfileShareable(providerProfile)) return;
      setSendError(null);
      try {
        const saved = localStorage.getItem(DEFAULT_NOTE_KEY);
        if (saved) {
          setReachOutNote(saved);
          setSaveAsDefault(true);
        } else {
          setReachOutNote("");
          setSaveAsDefault(false);
        }
      } catch {
        setReachOutNote("");
        setSaveAsDefault(false);
      }
      // Mobile: use bottom sheet
      if (window.innerWidth < 1024 && family) {
        setReachOutSheetFamily(family);
      } else {
        setExpandedCardId(familyId);
      }
    },
    [providerProfile],
  );

  const handleCloseReachOutSheet = useCallback(() => {
    if (!sending) {
      setReachOutSheetFamily(null);
      setSendError(null);
    }
  }, [sending]);

  const handleCollapse = useCallback(() => {
    if (!sending) {
      setExpandedCardId(null);
      setSendError(null);
    }
  }, [sending]);

  const handleSend = useCallback(
    async (toProfileId: string) => {
      if (!profileId || !isSupabaseConfigured()) return;

      setSending(true);
      setSendError(null);

      try {
        const supabase = createClient();

        const { error: insertError } = await supabase
          .from("connections")
          .insert({
            from_profile_id: profileId,
            to_profile_id: toProfileId,
            type: "request",
            status: "pending",
            message: reachOutNote.trim() || null,
            metadata: { provider_initiated: true },
          });

        if (insertError) {
          if (
            insertError.code === "23505" ||
            insertError.message.includes("duplicate") ||
            insertError.message.includes("unique")
          ) {
            setContactedIds((prev) => new Set([...prev, toProfileId]));
            setExpandedCardId(null);
            return;
          }
          throw new Error(insertError.message);
        }

        // Increment free_responses_used for free tier
        if (
          membership &&
          (membership.status === "free" || membership.status === "trialing")
        ) {
          const newCount = (membership.free_responses_used ?? 0) + 1;
          await supabase
            .from("memberships")
            .update({ free_responses_used: newCount })
            .eq("account_id", membership.account_id);

          await refreshAccountData();
        }

        // Persist default note
        if (saveAsDefault && reachOutNote.trim()) {
          try {
            localStorage.setItem(DEFAULT_NOTE_KEY, reachOutNote.trim());
          } catch {
            /* ignore */
          }
        } else if (!saveAsDefault) {
          try {
            localStorage.removeItem(DEFAULT_NOTE_KEY);
          } catch {
            /* ignore */
          }
        }

        setContactedIds((prev) => new Set([...prev, toProfileId]));
        setExpandedCardId(null);
        setReachOutSheetFamily(null);
        setReachOutNote("");

        // Show toast confirmation
        const targetFamily = families.find((f) => f.id === toProfileId);
        const firstName = targetFamily?.display_name?.split(/\s+/)[0] || "this family";
        setToast(`Reach-out sent! ${firstName} will see your profile and message.`);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : String(err);
        setSendError(`Something went wrong: ${msg}`);
      } finally {
        setSending(false);
      }
    },
    [profileId, reachOutNote, saveAsDefault, membership, refreshAccountData],
  );

  const fetchFamilies = useCallback(
    async (offset: number) => {
      if (!profileId || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setFetchError(null);

      try {
        const supabase = createClient();

        // Round 1: families + provider's own connections (+ responded)
        const [familiesRes, connectionsRes, respondedRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, lat, lng, type, care_types, metadata, image_url, slug, created_at")
            .eq("type", "family")
            .eq("is_active", true)
            .filter("metadata->care_post->>status", "eq", "active")
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE),
          ...(offset === 0
            ? [
                supabase
                  .from("connections")
                  .select("to_profile_id")
                  .eq("from_profile_id", profileId)
                  .eq("type", "request")
                  .in("status", ["pending", "accepted"]),
                supabase
                  .from("connections")
                  .select("to_profile_id")
                  .eq("from_profile_id", profileId)
                  .eq("type", "request")
                  .eq("status", "accepted"),
              ]
            : [Promise.resolve({ data: null, error: null }), Promise.resolve({ data: null, error: null })]),
        ]);

        if (familiesRes.error) {
          throw new Error(familiesRes.error.message);
        }

        const fetchedFamilies = (familiesRes.data as Profile[]) || [];
        setHasMore(fetchedFamilies.length > PAGE_SIZE);
        const trimmed = fetchedFamilies.slice(0, PAGE_SIZE);

        if (offset === 0) {
          setFamilies(trimmed);
          setContactedIds(
            new Set(connectionsRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
          );
          setRespondedIds(
            new Set(respondedRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
          );
        } else {
          setFamilies((prev) => [...prev, ...trimmed]);
        }

        // Reach-out counts per family
        const familyIds = trimmed.map((f) => f.id);
        if (familyIds.length > 0) {
          const { data: reachOuts } = await supabase
            .from("connections")
            .select("to_profile_id")
            .in("to_profile_id", familyIds)
            .eq("type", "request")
            .in("status", ["pending", "accepted"]);

          const counts = new Map<string, number>();
          (reachOuts || []).forEach((r: { to_profile_id: string }) => {
            counts.set(r.to_profile_id, (counts.get(r.to_profile_id) || 0) + 1);
          });
          if (offset === 0) {
            setReachOutCounts(counts);
          } else {
            setReachOutCounts((prev) => {
              const merged = new Map(prev);
              counts.forEach((v, k) => merged.set(k, v));
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("[olera] matches fetch failed:", err);
        setFetchError(
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to load matches. Please try again.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    fetchFamilies(0);
  }, [fetchFamilies]);

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

  // New since last visit count
  const newSinceLastVisit = useMemo(() => {
    if (!lastVisitTs) return 0;
    return families.filter((f) => {
      const ts = f.created_at ? new Date(f.created_at).getTime() : 0;
      return ts > lastVisitTs;
    }).length;
  }, [families, lastVisitTs]);

  // Check if a family card is "new" since last visit
  const isNewCard = useCallback((createdAt: string | undefined) => {
    if (!lastVisitTs || !createdAt) return false;
    return new Date(createdAt).getTime() > lastVisitTs;
  }, [lastVisitTs]);

  if (!providerProfile || loading) {
    return <MatchesSkeleton />;
  }

  // Error state — show after loading completes with no data
  if (fetchError && families.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-[17px] font-display font-semibold text-gray-900 mb-1.5">
            Couldn&apos;t load matches
          </p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            {fetchError}
          </p>
          <button
            type="button"
            onClick={() => fetchFamilies(0)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />
      {/* ── Page header ── */}
      <div className="mb-5 lg:mb-6">
        <h1 className="text-2xl lg:text-[28px] font-display font-bold text-gray-900 tracking-tight">
          Matches
        </h1>
      </div>

      {/* ── Section A: Inbound interest — only visible when populated ── */}
      {!inboundLoading && inboundInterest.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Interested in you
            </h2>
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
              {inboundInterest.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inboundInterest.map((item) => {
              const p = item.profile;
              if (!p) return null;
              const locationStr = [p.city, p.state].filter(Boolean).join(", ");
              const isInquiry = item.type === "inquiry";
              return (
                <Link
                  key={item.id}
                  href="/provider/inbox"
                  className="bg-white rounded-xl border border-primary-100 hover:border-primary-300 hover:shadow-md p-4 transition-all duration-200 block"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: avatarGradient(p.display_name || "?") }}
                    >
                      {getInitials(p.display_name || "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {hasFullAccess ? p.display_name : blurName(p.display_name)}
                      </p>
                      {locationStr && (
                        <p className="text-xs text-gray-500 truncate">{hasFullAccess ? locationStr : "***"}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-600">
                      {isInquiry ? "Sent you an inquiry" : "Invited you to apply"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs with counts ── */}
      {(isCaregiver || isOrg) && (
        <div className="flex items-center justify-between border-b border-gray-200 mb-5 lg:mb-6">
          <div className="flex gap-1">
            {(isCaregiver
              ? [
                  { id: "families" as MatchesView, label: "Families", count: families.length },
                  { id: "organizations" as MatchesView, label: "Jobs" },
                ]
              : [
                  { id: "families" as MatchesView, label: "Families", count: families.length },
                  { id: "caregivers" as MatchesView, label: "Caregivers" },
                ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={[
                  "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                  activeView === tab.id
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                ].join(" ")}
              >
                {tab.label}
                {"count" in tab && tab.count != null && (
                  <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort + filter dropdowns — visible in Families tab */}
          {activeView === "families" && (
            <div className="hidden lg:flex items-center gap-2 shrink-0 pb-2">
              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as TimelineFilter)}
                  aria-label="Filter by timeline"
                  className="text-sm font-medium text-gray-600 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 bg-white"
                >
                  {FILTER_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort matches"
                  className="text-sm font-medium text-gray-600 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 bg-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Content grid — sidebar persists across all tabs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2">
          {/* ── Organizations tab ── */}
          {isCaregiver && activeView === "organizations" ? (
            <OrganizationsTab providerCareTypes={providerCareTypes} />
          ) : isOrg && activeView === "caregivers" ? (
            /* ── Caregivers tab ── */
            <CaregiversTab />
          ) : (
            /* ── Families tab ── */
            <div className="space-y-5">
              {families.length === 0 ? (
                <MatchesEmptyState />
              ) : filteredFamilies.length === 0 ? (
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
                filteredFamilies.map((family) => (
                  <div key={family.id}>
                    <FamilyCareCard
                      family={family}
                      hasFullAccess={hasFullAccess}
                      fromProfileId={profileId!}
                      providerCareTypes={providerCareTypes}
                      freeRemaining={freeRemaining}
                      isExpanded={expandedCardId === family.id}
                      onExpand={(f) => handleExpand(f.id, f)}
                      onCollapse={handleCollapse}
                      providerProfile={providerProfile}
                      reachOutNote={reachOutNote}
                      onNoteChange={setReachOutNote}
                      saveAsDefault={saveAsDefault}
                      onSaveAsDefaultChange={setSaveAsDefault}
                      sending={sending}
                      onSend={() => handleSend(family.id)}
                      sendError={sendError}
                      reachOutCount={reachOutCounts.get(family.id) || 0}
                      isNew={isNewCard(family.created_at)}
                    />
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
                        reachOutCount={reachOutCounts.get(family.id) || 0}
                        providerProfile={providerProfile}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => fetchFamilies(families.length)}
                    disabled={loadingMore}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Load more matches"
                    )}
                  </button>
                </div>
              )}

              {/* Inline error for load-more failures */}
              {fetchError && families.length > 0 && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <p className="text-sm text-red-500">Couldn&apos;t load more matches.</p>
                  <button
                    type="button"
                    onClick={() => fetchFamilies(families.length)}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — hidden on mobile, persistent across all tabs */}
        <div className="hidden lg:block lg:col-span-1">
          <MatchesSidebar
            remaining={freeRemaining}
            totalFamilies={families.length}
            isFreeTier={isFreeTier}
            contactedCount={contactedIds.size}
            respondedCount={respondedIds.size}
            newMatchesToday={families.filter((f) => {
              const created = f.created_at ? new Date(f.created_at) : null;
              if (!created) return false;
              const today = new Date();
              return created.toDateString() === today.toDateString();
            }).length}
          />
        </div>
      </div>

      {/* ── Mobile Reach Out Bottom Sheet ── */}
      {reachOutSheetFamily && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={handleCloseReachOutSheet}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: hasFullAccess ? avatarGradient(reachOutSheetFamily.display_name || "Family") : "#9ca3af" }}
                >
                  {hasFullAccess ? getInitials(reachOutSheetFamily.display_name || "Family") : "?"}
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-gray-900">
                    Reach out to {hasFullAccess ? (reachOutSheetFamily.display_name?.split(/\s+/)[0] || "this family") : "this family"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReachOutSheet}
                disabled={sending}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5">
              <p className="text-[15px] text-gray-600 mb-4">
                Tell them why you&apos;re a great fit for their care needs.
              </p>

              <textarea
                value={reachOutNote}
                onChange={(e) => setReachOutNote(e.target.value)}
                placeholder={`Share what makes your care approach a great match...`}
                rows={4}
                className="w-full px-4 py-3.5 text-[15px] leading-relaxed text-gray-700 bg-white border border-warm-200/80 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none placeholder:text-gray-400"
              />

              <div className="flex items-center justify-between mt-3 mb-4">
                <p className="text-xs text-gray-400">
                  Personal notes get <span className="font-medium">3× more responses</span>
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-warm-300 text-primary-600 focus:ring-primary-500/20 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">Save as default</span>
                </label>
              </div>

              {/* Profile sharing notice */}
              <div className="flex items-center gap-2.5 text-xs text-gray-400 mb-4">
                <EyeIcon className="w-4 h-4 shrink-0" />
                <p>Your full profile will be shared with this family.</p>
              </div>

              {/* Error */}
              {sendError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-red-600">
                  {sendError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center gap-3">
              {freeRemaining !== null && (
                <p className="text-xs text-gray-400 flex-1">
                  Uses 1 of {freeRemaining} reach-outs
                </p>
              )}
              <button
                type="button"
                onClick={handleCloseReachOutSheet}
                disabled={sending}
                className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSend(reachOutSheetFamily.id)}
                disabled={sending}
                className="flex-1 max-w-[160px] group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/20 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] disabled:opacity-70 transition-all"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </>
      )}

    {/* ── Toast notification ── */}
    {toast && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-xl shadow-2xl max-w-md">
          <CheckCircleIcon className="w-5 h-5 text-primary-400 shrink-0" />
          <p className="text-sm font-medium">{toast}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}
    </div>
    </div>
  );
}
