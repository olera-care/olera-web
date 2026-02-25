"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage, getFreeConnectionsRemaining, FREE_CONNECTION_LIMIT, isProfileShareable } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import { calculateProfileCompleteness, type ExtendedMetadata } from "@/lib/profile-completeness";

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
    <div className="lg:col-span-2">
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
          When families publish care posts matching your services and location,
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
}: {
  remaining: number | null;
  totalFamilies: number;
  isFreeTier: boolean;
}) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <div className="sticky top-24 space-y-3">
      {/* ── Combined card: Stats + Pro upsell ── */}
      <div className="rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* White top: usage stats */}
        <div className="bg-white p-6">
          {isFreeTier && remaining !== null ? (
            <>
              {/* Circular progress + count */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="relative w-20 h-20 mb-3">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f0eeeb" strokeWidth="5" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="#374151" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${(remaining / FREE_CONNECTION_LIMIT) * 213.6} 213.6`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[28px] font-display font-bold text-gray-900">
                    {remaining}
                  </span>
                </div>
                <p className="text-[15px] text-gray-500">
                  <span className="font-bold text-gray-900">{remaining} of {FREE_CONNECTION_LIMIT}</span> reach-outs remaining
                </p>
              </div>

              {/* Families stat */}
              <div className="flex items-center justify-center gap-2.5 bg-warm-50/50 rounded-xl px-4 py-3">
                <PeopleIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-[13px] text-gray-500">
                  <span className="font-bold text-gray-900">{totalFamilies}</span> families waiting
                </p>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                Your matches
              </h4>
              <div className="flex items-center gap-2.5 bg-warm-50/50 rounded-xl px-4 py-3">
                <PeopleIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-[13px] text-gray-500">
                  <span className="font-bold text-gray-900">{totalFamilies}</span> families near you are looking for care
                </p>
              </div>
            </>
          )}
        </div>

        {/* Dark bottom: Pro upsell (free tier only) */}
        {isFreeTier && (
          <div
            className="relative"
            style={{ background: "linear-gradient(135deg, #1a1d23 0%, #252830 50%, #1e2127 100%)" }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 opacity-[0.06] pointer-events-none"
              style={{ background: "radial-gradient(circle at 80% 20%, #199087, transparent 70%)" }}
            />

            <div className="relative p-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-4">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                <span className="text-[11px] font-bold text-amber-400 tracking-wide uppercase">Pro</span>
              </div>

              <h3 className="text-[17px] font-display font-bold text-white leading-tight mb-1.5 tracking-tight">
                Connect with every family
              </h3>
              <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                Unlimited reach-outs, priority visibility, and more leads.
              </p>

              <div className="flex items-center justify-between mb-5">
                <div className="text-center">
                  <p className="text-sm font-display font-bold text-white tracking-tight leading-none uppercase">Unlimited</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Reach-outs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-white tracking-tight leading-none">3&times;</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">Visibility</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-white tracking-tight leading-none">2&times;</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">More leads</p>
                </div>
              </div>

              <Link
                href="/provider/pro"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary-500 text-white text-[14px] font-bold hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                Get unlimited · $25/mo
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── How It Works accordion ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setHowItWorksOpen(!howItWorksOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-warm-50/30 transition-colors"
        >
          <span className="text-[13px] font-semibold text-gray-500">How it works</span>
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
            <div className="px-5 pb-5 space-y-4 border-t border-warm-100/60 pt-4">
              {[
                { num: 1, bold: "Send a note", rest: "explaining why you\u2019re a good fit" },
                { num: 2, bold: "Family reviews", rest: "your profile and message" },
                { num: 3, bold: "If they accept,", rest: "a conversation opens in your inbox" },
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
}: {
  family: Profile;
  hasFullAccess: boolean;
  fromProfileId: string;
  providerCareTypes: string[];
  freeRemaining: number | null;
  contacted?: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
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
}) {
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const aboutSituation = meta?.about_situation;
  const publishedAt = meta?.care_post?.published_at;
  const displayName = family.display_name || "Family";
  const initials = getInitials(displayName);
  const familyFirstName = displayName.split(/\s+/)[0];
  const matchCount = computeMatchingServices(careNeeds, providerCareTypes);
  const reachOuts = reachOutCount ?? 0;

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
      <div className="p-7">
        {/* Header: avatar + name/location + timeline + time */}
        <div className="flex items-start gap-4 mb-5">
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

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-3 rounded-xl border border-warm-100/80 overflow-hidden mb-5">
          {/* Services match */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30">
            <CheckCircleIcon className="w-4 h-4 text-primary-500" />
            <p className="text-[13px] text-gray-500">
              <span className="font-bold text-gray-700">{matchCount} service{matchCount !== 1 ? "s" : ""}</span>{" "}
              match
            </p>
          </div>
          {/* Distance / location */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30 border-x border-warm-100/80">
            <LocationIcon className="w-4 h-4 text-primary-500" />
            <p className="text-[13px] text-gray-500">
              {driveTime ? (
                <><span className="font-bold text-gray-700">{driveTime}</span> from you</>
              ) : (
                <span className="font-bold text-gray-700">{locationStr || "—"}</span>
              )}
            </p>
          </div>
          {/* Providers reached out */}
          <div className="flex items-center justify-center gap-2 py-3 px-3 bg-warm-50/30">
            <PeopleIcon className={`w-4 h-4 ${reachOuts === 0 ? "text-primary-500" : reachOuts >= 4 ? "text-amber-500" : "text-primary-500"}`} />
            <p className="text-[13px] text-gray-500">
              {reachOuts === 0 ? (
                <span className="font-bold text-gray-700">Be first to connect!</span>
              ) : (
                <><span className={`font-bold ${reachOuts >= 4 ? "text-amber-600" : "text-gray-700"}`}>{reachOuts >= 4 ? "4+" : reachOuts}</span> reached out</>
              )}
            </p>
          </div>
        </div>

        {/* ── About situation — full text when expanded ── */}
        <div className="border-l-2 border-warm-200 pl-4 mb-5 min-h-[3.25rem]">
          {aboutSituation && hasFullAccess ? (
            <p className={`text-[15px] text-gray-600 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
              {aboutSituation}
            </p>
          ) : (
            <p className="text-[15px] text-gray-400 italic leading-relaxed">
              No description provided
            </p>
          )}
        </div>

        {/* ── Care need tags ── */}
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
                      ? "border-[#F5F4F1] text-gray-700 bg-[#F5F4F1]"
                      : "border-warm-100 text-gray-500 bg-white"
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
            <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                <p className="text-[13px] text-gray-500 font-medium">Reached out</p>
              </div>
            </div>
          ) : freeRemaining !== null && freeRemaining <= 0 ? (
            /* Exhausted state — dashed border + upgrade CTA */
            <div className="border-t border-dashed border-warm-200/60 px-7 py-4 flex items-center justify-between">
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
            /* Normal — reach out button */
            <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <InfoIcon className="w-4 h-4 text-gray-400" />
                <p className="text-[13px] text-gray-400">
                  Your profile will be shared with this family
                </p>
              </div>
              <button
                type="button"
                onClick={onExpand}
                className="group inline-flex items-center gap-2 pl-5 pr-6 py-2.5 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200"
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

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { membership, refreshAccountData } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [reachOutCounts, setReachOutCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");

  // Reach-out expansion state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [reachOutNote, setReachOutNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

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

  const handleExpand = useCallback(
    (familyId: string) => {
      if (!isProfileShareable(providerProfile)) return;
      setExpandedCardId(familyId);
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
    },
    [providerProfile],
  );

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
        setReachOutNote("");
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

  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Round 1: families + provider's own connections
        const [familiesRes, connectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, lat, lng, type, care_types, metadata, image_url, slug, created_at")
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

        const fetchedFamilies = (familiesRes.data as Profile[]) || [];
        setFamilies(fetchedFamilies);
        setContactedIds(
          new Set(connectionsRes.data?.map((c) => c.to_profile_id) || [])
        );

        // Round 2: reach-out counts per family
        const familyIds = fetchedFamilies.map((f) => f.id);
        if (familyIds.length > 0) {
          const { data: reachOuts } = await supabase
            .from("connections")
            .select("to_profile_id")
            .in("to_profile_id", familyIds)
            .eq("type", "request")
            .in("status", ["pending", "accepted"]);

          const counts = new Map<string, number>();
          (reachOuts || []).forEach((r) => {
            counts.set(r.to_profile_id, (counts.get(r.to_profile_id) || 0) + 1);
          });
          setReachOutCounts(counts);
        }
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
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
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

      {/* ── Filter tabs + Sort — full width to align with sidebar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={[
                "px-5 py-2.5 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all duration-150",
                activeFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 flex items-center">
          <span className="text-sm text-gray-400 mr-2">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort matches"
              className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 bg-white"
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
      </div>

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
                    isExpanded={expandedCardId === family.id}
                    onExpand={() => handleExpand(family.id)}
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
          </div>

          {/* Sidebar — 1/3 */}
          <div className="lg:col-span-1">
            <MatchesSidebar
              remaining={freeRemaining}
              totalFamilies={families.length}
              isFreeTier={isFreeTier}
            />
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
