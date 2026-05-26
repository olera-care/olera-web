"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { useProviderDashboardV2Data } from "@/hooks/useProviderDashboardV2Data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage, getFreeConnectionsRemaining, FREE_CONNECTION_LIMIT, isProfileShareable, getProfileCompletionGaps } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import { calculateProfileCompleteness, type ExtendedMetadata } from "@/lib/profile-completeness";
import {
  type MatchesFilters,
  DEFAULT_FILTERS,
} from "@/components/provider/matches/MatchesFilterBar";
import FamilyMatchCard from "@/components/provider/matches/FamilyMatchCard";
import FiltersModal, { type FiltersState, DEFAULT_FILTERS_STATE, countActiveFilters } from "@/components/provider/matches/FiltersModal";
import MyOutreach from "@/components/provider/matches/MyOutreach";

// Tab types for the matches view
type MatchesTab = "best_matches" | "near_you";
import ReachOutDrawer from "@/components/provider/matches/ReachOutDrawer";
import Pagination from "@/components/ui/Pagination";
import VerificationMethodModal from "@/components/provider/VerificationMethodModal";
import { useVerificationModal } from "@/lib/hooks/useVerificationModal";


// ── Timeline config ──

const TIMELINE_CONFIG: Record<string, { label: string; dot: string; glow: string; border: string; text: string; bg: string }> = {
  immediate: { label: "Immediate", dot: "bg-red-400", glow: "glowRed", border: "border-red-200", text: "text-red-600", bg: "bg-red-50/50" },
  within_1_month: { label: "Within 1 month", dot: "bg-amber-400", glow: "glowAmber", border: "border-amber-200", text: "text-amber-600", bg: "bg-amber-50/50" },
  within_3_months: { label: "Within 3 months", dot: "bg-blue-400", glow: "glowBlue", border: "border-blue-200", text: "text-blue-600", bg: "bg-blue-50/50" },
  exploring: { label: "Exploring", dot: "bg-warm-300", glow: "glowWarm", border: "border-warm-200", text: "text-gray-500", bg: "bg-warm-50/50" },
};


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

function getFirstName(name: string): string {
  if (!name) return "User";
  return name.split(" ")[0];
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
const PAGE_SIZE = 12;

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
// ---------------------------------------------------------------------------
// Discovery Banner (matches Profile page style)
// ---------------------------------------------------------------------------

function DiscoveryBanner({
  familyCount,
  firstName,
}: {
  familyCount: number;
  firstName: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-warm-950 md:min-h-[220px]">
      {/* Background image - hidden on mobile, fades into warm-950 on left */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage: "url('/Matches-banner-image.png')",
          backgroundSize: "auto 140%",
          backgroundPosition: "right 30%",
          backgroundRepeat: "no-repeat",
          // Soft-fade into the warm-950 background
          maskImage: "linear-gradient(to right, transparent 0%, transparent calc(100% - 520px), black calc(100% - 320px), black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent calc(100% - 520px), black calc(100% - 320px), black 100%)",
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background: `linear-gradient(to right,
            rgba(42, 24, 16, 0.96) 0%,
            rgba(42, 24, 16, 0.96) calc(100% - 480px),
            rgba(42, 24, 16, 0.7) calc(100% - 340px),
            rgba(42, 24, 16, 0.25) calc(100% - 160px),
            rgba(42, 24, 16, 0.08) 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative px-6 py-5 md:px-9 md:py-7 max-w-[560px]">
        {/* Greeting */}
        <p className="font-serif italic text-[15px] md:text-[16px] text-warm-200/85 leading-snug mb-2">
          Hey {firstName}
        </p>

        {/* Headline */}
        <p className="font-display text-[20px] md:text-[24px] font-semibold text-white leading-[1.2] tracking-tight">
          {familyCount} {familyCount === 1 ? 'family is' : 'families are'} looking for care.
        </p>

        {/* Subline */}
        <p className="mt-2 text-sm text-warm-100/70 leading-relaxed">
          First to reach out is 3× more likely to connect.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matches Tabs (replaces filter bar)
// ---------------------------------------------------------------------------

const TABS: { id: MatchesTab; label: string }[] = [
  { id: "best_matches", label: "Best Matches" },
  { id: "near_you", label: "Near You" },
];

function MatchesTabs({
  activeTab,
  onTabChange,
  activeFilterCount,
  onFiltersClick,
}: {
  activeTab: MatchesTab;
  onTabChange: (tab: MatchesTab) => void;
  activeFilterCount: number;
  onFiltersClick: () => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative pb-3 text-[15px] transition-colors ${
                  isActive
                    ? "font-semibold text-gray-900"
                    : "font-normal text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filters button - desktop */}
        <button
          type="button"
          onClick={onFiltersClick}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-primary-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Chips (shows active filters with quick-clear)
// ---------------------------------------------------------------------------

// Label mappings for filter values
const FILTER_LABELS: Record<string, Record<string, string>> = {
  distance: {
    "25": "Within 25 mi",
    "50": "Within 50 mi",
    "100": "Within 100 mi",
  },
  urgency: {
    immediate: "ASAP",
    within_1_month: "Within 1 month",
    within_3_months: "Within 3 months",
    exploring: "Exploring",
  },
  careTypes: {
    home_care: "Home Care",
    memory_care: "Memory Care",
    assisted_living: "Assisted Living",
    nursing_home: "Nursing Home",
    independent_living: "Independent Living",
    hospice: "Hospice",
  },
  paymentMethods: {
    private_pay: "Private Pay",
    medicaid: "Medicaid",
    medicare: "Medicare",
    veterans_benefits: "Veterans Benefits",
    private_insurance: "Private Insurance",
  },
  whoNeedsCare: {
    myself: "Self",
    my_parent: "Parent",
    my_spouse: "Spouse",
    someone_else: "Other",
  },
  schedule: {
    mornings: "Mornings",
    afternoons: "Afternoons",
    evenings: "Evenings",
    overnight: "Overnight",
    full_time: "Full-time",
    flexible: "Flexible",
  },
  profileQuality: {
    complete: "Complete profiles",
  },
};

function FilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: FiltersState;
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; value: string; label: string }[] = [];

  // Distance
  if (filters.distance !== "any") {
    chips.push({
      key: "distance",
      value: filters.distance,
      label: FILTER_LABELS.distance[filters.distance] || filters.distance,
    });
  }

  // Urgency
  for (const value of filters.urgency) {
    chips.push({
      key: "urgency",
      value,
      label: FILTER_LABELS.urgency[value] || value,
    });
  }

  // Care Types
  for (const value of filters.careTypes) {
    chips.push({
      key: "careTypes",
      value,
      label: FILTER_LABELS.careTypes[value] || value,
    });
  }

  // Payment Methods
  for (const value of filters.paymentMethods) {
    chips.push({
      key: "paymentMethods",
      value,
      label: FILTER_LABELS.paymentMethods[value] || value,
    });
  }

  // Who Needs Care
  for (const value of filters.whoNeedsCare) {
    chips.push({
      key: "whoNeedsCare",
      value,
      label: FILTER_LABELS.whoNeedsCare[value] || value,
    });
  }

  // Schedule
  for (const value of filters.schedule) {
    chips.push({
      key: "schedule",
      value,
      label: FILTER_LABELS.schedule[value] || value,
    });
  }

  // Profile Quality
  if (filters.profileQuality !== "all") {
    chips.push({
      key: "profileQuality",
      value: filters.profileQuality,
      label: FILTER_LABELS.profileQuality[filters.profileQuality] || filters.profileQuality,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            className="p-0.5 -mr-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Snapshot Card (Upwork-style sidebar header)
// ---------------------------------------------------------------------------

function ProfileSnapshotCard({
  profile,
  completeness,
}: {
  profile: Profile;
  completeness: number;
}) {
  const displayName = profile.display_name || "Your Business";
  const category = profile.category || profile.care_types?.[0] || "Care Provider";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start gap-3.5">
        {/* Profile image or initials */}
        {profile.image_url ? (
          <Image
            src={profile.image_url}
            alt={displayName}
            width={52}
            height={52}
            className="w-13 h-13 rounded-xl object-cover shrink-0"
            style={{ width: 52, height: 52 }}
          />
        ) : (
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: avatarGradient(displayName), width: 52, height: 52 }}
          >
            {initials}
          </div>
        )}

        {/* Name and category */}
        <div className="flex-1 min-w-0 pt-0.5">
          <Link
            href={profile.slug ? `/provider/${profile.slug}` : "/provider"}
            className="block text-[15px] font-semibold text-gray-900 hover:underline truncate leading-tight"
          >
            {displayName}
          </Link>
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {category}
          </p>
        </div>
      </div>

      {/* Complete your profile link */}
      <Link
        href="/provider"
        className="inline-block text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline mt-4 transition-colors"
      >
        Complete your profile
      </Link>

      {/* Progress bar - simple, Upwork style */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 tabular-nums">{completeness}%</span>
      </div>
    </div>
  );
}

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
  );
}

// ---------------------------------------------------------------------------
// How It Works Accordion
// ---------------------------------------------------------------------------

function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-[15px] font-semibold text-gray-900">How it works</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            {[
              { num: 1, bold: "Send a note", rest: "explaining why you're a good fit" },
              { num: 2, bold: "Family reviews", rest: "your profile and message" },
              { num: 3, bold: "If they reply,", rest: "you're connected" },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-gray-500">{step.num}</span>
                </div>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-900">{step.bold}</span> {step.rest}
                </p>
              </div>
            ))}
            <p className="text-[13px] text-gray-400 leading-relaxed pt-3 border-t border-gray-100">
              Families choose the first provider who responds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProviderMatchesPage() {
  const providerProfile = useProviderProfile();
  const { user, membership, refreshAccountData } = useAuth();
  const { metadata: dashboardMetadata } = useProviderDashboardData(providerProfile);
  // Fetch v2 data (reviews, response rate) for accurate profile completeness
  const v2 = useProviderDashboardV2Data("30d", true, user?.id);
  const [families, setFamilies] = useState<Profile[]>([]);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [reachOutCounts, setReachOutCounts] = useState<Map<string, number>>(new Map());
  // Full connection data for Reached Out tab cards
  const [connectionData, setConnectionData] = useState<Map<string, {
    id: string;
    message: string | null;
    created_at: string;
    status: "pending" | "accepted" | "declined";
    reply_message?: string | null;
    replied_at?: string | null;
    reminder_sent?: boolean;
  }>>(new Map());
  // Track which connections have had reminders sent (local state, persisted via DB)
  const [reminderSentIds, setReminderSentIds] = useState<Set<string>>(new Set());
  const [archivedConnectionIds, setArchivedConnectionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchesFilters>(DEFAULT_FILTERS);
  const [modalFilters, setModalFilters] = useState<FiltersState>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("olera_matches_filters");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Validate the parsed object has expected shape
          if (parsed && typeof parsed === "object" && "distance" in parsed) {
            const merged = { ...DEFAULT_FILTERS_STATE, ...parsed };

            // Migrate old filter values to new values (Phase 2 rename)
            const PAYMENT_MIGRATIONS: Record<string, string> = {
              va_benefits: "veterans_benefits",
              long_term_care_insurance: "", // removed, clear it
              aid_attendance: "", // removed, clear it
            };
            const WHO_MIGRATIONS: Record<string, string> = {
              self: "myself",
              parent: "my_parent",
              spouse: "my_spouse",
              other: "someone_else",
            };

            // Migrate payment methods
            if (Array.isArray(merged.paymentMethods)) {
              merged.paymentMethods = merged.paymentMethods
                .map((v: string) => PAYMENT_MIGRATIONS[v] ?? v)
                .filter((v: string) => v !== "");
            }

            // Migrate who needs care
            if (Array.isArray(merged.whoNeedsCare)) {
              merged.whoNeedsCare = merged.whoNeedsCare
                .map((v: string) => WHO_MIGRATIONS[v] ?? v)
                .filter((v: string) => v !== "");
            }

            return merged;
          }
        }
      } catch {
        // Ignore parsing errors, use defaults
      }
    }
    return DEFAULT_FILTERS_STATE;
  });
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MatchesTab>("best_matches");

  // Reach-out drawer state
  const [drawerFamily, setDrawerFamily] = useState<Profile | null>(null);
  const [reachOutNote, setReachOutNote] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [profileGapWarning, setProfileGapWarning] = useState<string[] | null>(null);
  const gapWarningRef = useRef<HTMLDivElement>(null);

  // Reminder sending state
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Track if initial fetch has completed (ref to avoid re-renders)
  const hasFetchedOnceRef = useRef(false);
  const [totalCount, setTotalCount] = useState(0);

  // Track which family's drawer should reopen after verification
  const [pendingDrawerFamily, setPendingDrawerFamily] = useState<Profile | null>(null);

  // Verification-based access control: only verified providers see full details
  // Note: "not_required" is for high-trust providers who auto-verified at claim time
  const isVerified = providerProfile?.verification_state === "verified" || providerProfile?.verification_state === "not_required";
  const hasFullAccess = isVerified;

  // Verification modal hook
  const {
    isOpen: isVerificationModalOpen,
    open: openVerificationModalRaw,
    close: closeVerificationModal,
    handleSubmit: handleVerificationSubmit,
    handleDismiss: handleVerificationDismiss,
  } = useVerificationModal({
    profileId: providerProfile?.id || "",
    onVerified: () => {
      // Reopen drawer with saved family after verification
      if (pendingDrawerFamily) {
        setDrawerFamily(pendingDrawerFamily);
        setPendingDrawerFamily(null);
      }
      // Refresh data to reflect verification state
      window.location.reload();
    },
    onDismissed: () => {
      setPendingDrawerFamily(null);
    },
  });

  // Handle verification click from drawer - close drawer first to avoid stacking
  const handleVerifyFromDrawer = useCallback(() => {
    if (drawerFamily) {
      setPendingDrawerFamily(drawerFamily);
      setDrawerFamily(null); // Close drawer first
    }
    // Small delay to prevent visual stacking
    setTimeout(() => {
      openVerificationModalRaw();
    }, 100);
  }, [drawerFamily, openVerificationModalRaw]);

  const freeRemaining = getFreeConnectionsRemaining(membership);
  const isFreeTier = freeRemaining !== null;
  const providerCareTypes = providerProfile?.care_types || [];
  const providerPaymentMethods = useMemo(() => {
    const meta = providerProfile?.metadata as ExtendedMetadata | undefined;
    return meta?.accepted_payments || [];
  }, [providerProfile]);

  const profileId = providerProfile?.id;

  // Profile completeness for sidebar snapshot (synced with dashboard calculation)
  const profileCompleteness = useMemo(() => {
    if (!providerProfile) return 0;
    const meta = (dashboardMetadata || providerProfile.metadata || {}) as ExtendedMetadata;
    // Include reviews and response rate from v2 data for consistent 9-section calculation
    const reviewsSummary = v2.data
      ? { count: v2.data.reviews.count, avgRating: v2.data.reviews.avgRating }
      : undefined;
    const responseRateSummary = v2.data
      ? { totalQuestions: v2.data.responseRate.totalQuestions, answeredCount: v2.data.responseRate.answeredCount }
      : undefined;
    return calculateProfileCompleteness(providerProfile, meta, reviewsSummary, responseRateSummary).overall;
  }, [providerProfile, dashboardMetadata, v2.data]);

  // ── Drawer handlers ──

  const handleReachOut = useCallback(
    (family: Profile) => {
      // Allow all providers to reach out - verification is soft-nudged in the drawer

      if (!isProfileShareable(providerProfile)) {
        const gaps = getProfileCompletionGaps(providerProfile);
        setProfileGapWarning(gaps);
        setTimeout(() => gapWarningRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
        return;
      }
      setProfileGapWarning(null);
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
      setDrawerFamily(family);
    },
    [providerProfile],
  );

  const handleCloseDrawer = useCallback(() => {
    if (!sending) {
      setDrawerFamily(null);
      setSendError(null);
    }
  }, [sending]);

  // Handle sending a follow-up reminder (48-hour rule, max 1 per family)
  const handleSendReminder = useCallback(
    async (connectionId: string) => {
      if (!profileId || !isSupabaseConfigured() || sendingReminderId) return;

      setSendingReminderId(connectionId);

      try {
        const supabase = createClient();

        // Update the connection metadata to mark reminder as sent
        const { error } = await supabase
          .from("connections")
          .update({
            metadata: {
              provider_initiated: true,
              reminder_sent: true,
              reminder_sent_at: new Date().toISOString(),
            },
          })
          .eq("id", connectionId);

        if (error) throw error;

        // Update local state
        setReminderSentIds((prev) => new Set([...prev, connectionId]));

        // Optionally trigger a notification to the family (fire-and-forget)
        // This could be expanded with an API route similar to notify-reach-out
      } catch (err) {
        console.error("[olera] Failed to send reminder:", err);
      } finally {
        setSendingReminderId(null);
      }
    },
    [profileId, sendingReminderId],
  );

  // Handle archiving a declined connection (removes from view)
  const handleArchiveConnection = useCallback(
    async (connectionId: string) => {
      if (!isSupabaseConfigured()) return;

      try {
        const supabase = createClient();

        // Update the connection metadata to mark as archived
        const { error } = await supabase
          .from("connections")
          .update({
            metadata: {
              archived: true,
              archived_at: new Date().toISOString(),
            },
          })
          .eq("id", connectionId);

        if (error) throw error;

        // Update local state to hide the card immediately
        setArchivedConnectionIds((prev) => new Set([...prev, connectionId]));
      } catch (err) {
        console.error("[olera] Failed to archive connection:", err);
      }
    },
    [],
  );

  const handleSendFromDrawer = useCallback(
    async (toProfileId: string, message: string, shouldSaveAsDefault: boolean) => {
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
            message: message.trim() || null,
            metadata: { provider_initiated: true },
          });

        if (insertError) {
          if (
            insertError.code === "23505" ||
            insertError.message.includes("duplicate") ||
            insertError.message.includes("unique")
          ) {
            setContactedIds((prev) => new Set([...prev, toProfileId]));
            setDrawerFamily(null);
            return;
          }
          throw new Error(insertError.message);
        }

        // Notify family of reach-out (fire-and-forget)
        fetch("/api/matches/notify-reach-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toProfileId }),
        }).catch(() => {});

        // Increment free_responses_used only for free tier (not trial)
        if (membership && membership.status === "free") {
          const newCount = (membership.free_responses_used ?? 0) + 1;
          await supabase
            .from("memberships")
            .update({ free_responses_used: newCount })
            .eq("account_id", membership.account_id);

          await refreshAccountData();
        }

        // Persist default note
        if (shouldSaveAsDefault && message.trim()) {
          try {
            localStorage.setItem(DEFAULT_NOTE_KEY, message.trim());
          } catch {
            /* ignore */
          }
        } else if (!shouldSaveAsDefault) {
          try {
            localStorage.removeItem(DEFAULT_NOTE_KEY);
          } catch {
            /* ignore */
          }
        }

        // Mark as contacted and close drawer
        setContactedIds((prev) => new Set([...prev, toProfileId]));
        setDrawerFamily(null);
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
    [profileId, membership, refreshAccountData],
  );

  const fetchFamilies = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!profileId || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      // Only show loading skeleton on initial load, not during background refreshes
      // Also skip loading state if we've already fetched once (covers effect re-runs)
      const shouldShowLoading = !isBackgroundRefresh && !hasFetchedOnceRef.current;
      if (shouldShowLoading) {
        setLoading(true);
      }
      setFetchError(null);

      try {
        const supabase = createClient();

        // Fetch all families + provider's own connections (+ responded)
        const [familiesRes, connectionsRes, respondedRes, fullConnectionsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("id, display_name, city, state, lat, lng, type, care_types, metadata, image_url, slug, created_at", { count: "exact" })
            .eq("type", "family")
            .eq("is_active", true)
            .filter("metadata->care_post->>status", "eq", "active")
            .order("created_at", { ascending: false }),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted", "declined"]),
          supabase
            .from("connections")
            .select("to_profile_id")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .eq("status", "accepted"),
          // Full connection data for Reached Out tab (includes message, timestamps, metadata)
          // Include declined to show "Not a match" state
          supabase
            .from("connections")
            .select("id, to_profile_id, message, created_at, status, metadata")
            .eq("from_profile_id", profileId)
            .eq("type", "request")
            .in("status", ["pending", "accepted", "declined"])
            .order("created_at", { ascending: false }),
        ]);

        if (familiesRes.error) {
          throw new Error(familiesRes.error.message);
        }

        const fetchedFamilies = (familiesRes.data as Profile[]) || [];
        setFamilies(fetchedFamilies);
        setTotalCount(familiesRes.count || fetchedFamilies.length);
        setContactedIds(
          new Set(connectionsRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
        );
        setRespondedIds(
          new Set(respondedRes.data?.map((c: { to_profile_id: string }) => c.to_profile_id) || [])
        );

        // Process full connection data for Reached Out tab
        const connDataMap = new Map<string, {
          id: string;
          message: string | null;
          created_at: string;
          status: "pending" | "accepted" | "declined";
          reply_message?: string | null;
          replied_at?: string | null;
          reminder_sent?: boolean;
        }>();
        const reminderIds = new Set<string>();

        (fullConnectionsRes.data || []).forEach((conn: {
          id: string;
          to_profile_id: string;
          message: string | null;
          created_at: string;
          status: string;
          metadata: Record<string, unknown> | null;
        }) => {
          const meta = conn.metadata as {
            reply_message?: string;
            replied_at?: string;
            reminder_sent?: boolean;
          } | null;

          connDataMap.set(conn.to_profile_id, {
            id: conn.id,
            message: conn.message,
            created_at: conn.created_at,
            status: conn.status as "pending" | "accepted" | "declined",
            reply_message: meta?.reply_message || null,
            replied_at: meta?.replied_at || null,
            reminder_sent: meta?.reminder_sent || false,
          });

          if (meta?.reminder_sent) {
            reminderIds.add(conn.id);
          }
        });

        setConnectionData(connDataMap);
        setReminderSentIds(reminderIds);

        // Reach-out counts per family
        const familyIds = fetchedFamilies.map((f) => f.id);
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
          setReachOutCounts(counts);
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
        hasFetchedOnceRef.current = true;
      }
    },
    [profileId],
  );

  // Fetch families on mount or when profileId changes
  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // Poll for updates every 45 seconds (family profile changes, new listings)
  // Pass isBackgroundRefresh=true to avoid showing loading skeleton during refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFamilies(true);
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchFamilies]);

  // Reset to page 1 when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, modalFilters, activeTab]);

  // Persist filter preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("olera_matches_filters", JSON.stringify(modalFilters));
    } catch {
      // Ignore storage errors (e.g., quota exceeded, private browsing)
    }
  }, [modalFilters]);

  // Compute family counts for filter badges
  const familyCounts = useMemo(() => {
    const nonContactedFamilies = families.filter((f) => !contactedIds.has(f.id));
    const byUrgency: Record<string, number> = {};
    const byCareType: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    const byWhoNeedsCare: Record<string, number> = {};
    const bySchedule: Record<string, number> = {};
    let completeProfiles = 0;

    for (const family of nonContactedFamilies) {
      const meta = family.metadata as FamilyMetadata;

      // Urgency/Timeline
      const timeline = meta?.timeline || "exploring";
      byUrgency[timeline] = (byUrgency[timeline] || 0) + 1;

      // Care Types
      const careNeeds = meta?.care_needs || family.care_types || [];
      for (const need of careNeeds) {
        const normalized = need.toLowerCase().replace(/[\s-]+/g, "_");
        byCareType[normalized] = (byCareType[normalized] || 0) + 1;
      }

      // Payment Methods
      const payments = meta?.payment_methods || [];
      for (const payment of payments) {
        const normalized = payment.toLowerCase().replace(/[\s-]+/g, "_");
        byPayment[normalized] = (byPayment[normalized] || 0) + 1;
      }

      // Who Needs Care (stored in relationship_to_recipient)
      const relationship = (meta?.relationship_to_recipient || meta?.who_needs_care || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
      if (relationship) {
        byWhoNeedsCare[relationship] = (byWhoNeedsCare[relationship] || 0) + 1;
      }

      // Schedule
      const schedule = meta?.schedule_preference?.toLowerCase() || "";
      if (schedule) {
        bySchedule[schedule] = (bySchedule[schedule] || 0) + 1;
      }

      // Profile completeness (80%+ is "complete")
      const completeness = meta?.profile_completeness ?? 0;
      if (completeness >= 80) {
        completeProfiles++;
      }
    }

    return {
      byUrgency,
      byCareType,
      byPayment,
      byWhoNeedsCare,
      bySchedule,
      completeProfiles,
      totalProfiles: nonContactedFamilies.length,
    };
  }, [families, contactedIds]);

  // Filter + sort families based on active tab and modal filters
  const filteredFamilies = useMemo(() => {
    let result = families.filter((f) => !contactedIds.has(f.id));

    // Apply modal filters: urgency
    if (modalFilters.urgency.length > 0) {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        const timeline = meta?.timeline || "exploring";
        return modalFilters.urgency.includes(timeline);
      });
    }

    // Apply modal filters: care types
    if (modalFilters.careTypes.length > 0) {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        const careNeeds = meta?.care_needs || f.care_types || [];
        const normalizedNeeds = careNeeds.map((n) => n.toLowerCase().replace(/[\s-]+/g, "_"));
        return modalFilters.careTypes.some((ct) => normalizedNeeds.includes(ct));
      });
    }

    // Apply modal filters: payment methods
    if (modalFilters.paymentMethods.length > 0) {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        const payments = meta?.payment_methods || [];
        const normalizedPayments = payments.map((p) => p.toLowerCase().replace(/[\s-]+/g, "_"));
        return modalFilters.paymentMethods.some((pm) => normalizedPayments.includes(pm));
      });
    }

    // Apply modal filters: who needs care (stored in relationship_to_recipient)
    if (modalFilters.whoNeedsCare.length > 0) {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        // Data is stored as "Myself", "My parent", "My spouse", "Someone else"
        // Normalize to lowercase with underscores: "myself", "my_parent", "my_spouse", "someone_else"
        const relationship = (meta?.relationship_to_recipient || meta?.who_needs_care || "")
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
        return modalFilters.whoNeedsCare.includes(relationship);
      });
    }

    // Apply modal filters: schedule
    if (modalFilters.schedule.length > 0) {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        const schedule = meta?.schedule_preference?.toLowerCase() || "";
        return modalFilters.schedule.includes(schedule);
      });
    }

    // Apply modal filters: profile quality
    if (modalFilters.profileQuality === "complete") {
      result = result.filter((f) => {
        const meta = f.metadata as FamilyMetadata;
        const completeness = meta?.profile_completeness ?? 0;
        return completeness >= 80;
      });
    }

    // Apply distance filter (from modal) or "Near You" tab location filter
    const providerLat = providerProfile?.lat;
    const providerLng = providerProfile?.lng;

    if (activeTab === "near_you") {
      // Near You tab: filter to families near provider's location
      // Use distance filter if set, otherwise default to 50 miles
      const maxDistance = modalFilters.distance !== "any" ? parseInt(modalFilters.distance, 10) : 50;

      if (providerLat && providerLng) {
        result = result.filter((f) => {
          if (!f.lat || !f.lng) return false;
          const distance = haversineDistance(providerLat, providerLng, f.lat, f.lng);
          return distance <= maxDistance;
        });
      } else {
        // Fallback: filter by matching city only (state is too broad)
        const providerCity = providerProfile?.city?.toLowerCase();
        if (providerCity) {
          result = result.filter((f) => {
            const familyCity = f.city?.toLowerCase();
            return familyCity === providerCity;
          });
        }
        // If provider has no city, Near You will show empty (which is correct)
      }
    } else if (modalFilters.distance !== "any") {
      // Best Matches tab with distance filter applied
      const maxDistance = parseInt(modalFilters.distance, 10);
      if (providerLat && providerLng) {
        result = result.filter((f) => {
          if (!f.lat || !f.lng) return false;
          const distance = haversineDistance(providerLat, providerLng, f.lat, f.lng);
          return distance <= maxDistance;
        });
      }
    }

    // Sort based on active tab
    const sorted = [...result].sort((a, b) => {
      const metaA = a.metadata as FamilyMetadata;
      const metaB = b.metadata as FamilyMetadata;

      if (activeTab === "near_you") {
        // Near You: sort by recency
        const dateA = metaA?.care_post?.published_at || a.created_at;
        const dateB = metaB?.care_post?.published_at || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }

      // best_matches (default): most service overlap first, then urgent, then recent
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
  }, [families, contactedIds, modalFilters, activeTab, providerCareTypes, providerProfile]);

  // Paginate filtered families
  const totalPages = Math.ceil(filteredFamilies.length / PAGE_SIZE);
  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredFamilies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFamilies, currentPage]);

  // Compute new matches today for sidebar (must be before early returns for hooks rules)
  const newTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return families.filter((f) => {
      const meta = f.metadata as FamilyMetadata;
      const publishedAt = meta?.care_post?.published_at || f.created_at;
      return publishedAt && new Date(publishedAt).toDateString() === today;
    }).length;
  }, [families]);

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
            onClick={() => fetchFamilies()}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
      </div>
    );
  }

  // Get first name for greeting
  const firstName = providerProfile?.display_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      {/* Page header - outside grid so both columns align */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-display mb-0.5 lg:mb-1">
            Find families
          </h1>
          <p className="text-sm lg:text-[15px] text-gray-500">
            Connect with families looking for care in your area
          </p>
        </div>
      </div>

      {/* ── Main layout (matches Profile page grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* ── LEFT COLUMN: Banner + Filters + Content ── */}
        <div className="lg:col-span-2">
          {/* Discovery Banner */}
          <div className="mb-6">
            <DiscoveryBanner
              familyCount={families.filter((f) => !contactedIds.has(f.id)).length}
              firstName={firstName}
            />
          </div>

          {/* Tabs + Cards = one grouped stack */}
          <MatchesTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeFilterCount={countActiveFilters(modalFilters)}
            onFiltersClick={() => setIsFiltersModalOpen(true)}
          />

          {/* Active filter chips */}
          {countActiveFilters(modalFilters) > 0 && (
            <FilterChips
              filters={modalFilters}
              onRemove={(key, value) => {
                if (key === "distance") {
                  setModalFilters((prev) => ({ ...prev, distance: "any" }));
                } else if (key === "profileQuality") {
                  setModalFilters((prev) => ({ ...prev, profileQuality: "all" }));
                } else {
                  setModalFilters((prev) => ({
                    ...prev,
                    [key]: (prev[key as keyof typeof prev] as string[]).filter((v) => v !== value),
                  }));
                }
              }}
              onClearAll={() => setModalFilters(DEFAULT_FILTERS_STATE)}
            />
          )}

          {/* Content based on active tab */}
          {families.length === 0 ? (
            <MatchesEmptyState />
          ) : filteredFamilies.length === 0 ? (
            // Empty state - different message based on tab
            activeTab === "near_you" ? (
              <div className="text-center py-16 px-8">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-display font-bold text-gray-900 mb-1.5">
                  No families in {providerProfile?.city || "your area"} yet
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed mb-5">
                  We&apos;ll notify you when someone posts nearby. In the meantime, browse all families.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("best_matches")}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Browse all families
                </button>
              </div>
            ) : (
              <div className="text-center py-16 px-8">
                <div className="w-12 h-12 rounded-2xl bg-warm-50 border border-warm-100/60 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-warm-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                </div>
                <p className="text-[15px] font-display font-semibold text-gray-900 mb-1">
                  No families match your filters
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Try adjusting your filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => setModalFilters(DEFAULT_FILTERS_STATE)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              </div>
            )
          ) : (
                <>
                {profileGapWarning && (
                  <div ref={gapWarningRef} className="mt-4 mb-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">Complete your profile to reach out</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        Missing: {profileGapWarning.join(", ")}.{" "}
                        <Link href="/provider" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                          Update profile →
                        </Link>
                      </p>
                    </div>
                    <button type="button" onClick={() => setProfileGapWarning(null)} className="text-amber-400 hover:text-amber-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-2.5 mt-4">
                  {paginatedFamilies.map((family, index) => (
                    <FamilyMatchCard
                      key={family.id}
                      family={family}
                      hasFullAccess={hasFullAccess}
                      providerCareTypes={providerCareTypes}
                      contacted={contactedIds.has(family.id)}
                      reachOutCount={reachOutCounts.get(family.id) || 0}
                      onReachOut={handleReachOut}
                      animationDelay={index * 40}
                    />
                  ))}
                </div>
                </>
              )}

          {/* Pagination */}
          {filteredFamilies.length > PAGE_SIZE && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredFamilies.length}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="families"
                showItemCount={true}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Profile Snapshot + Sidebar (matches Profile page) ── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Profile Snapshot Card */}
            <ProfileSnapshotCard
              profile={providerProfile}
              completeness={profileCompleteness}
            />

            {/* My Outreach - tracking sent messages */}
            <MyOutreach
              families={families}
              connectionData={connectionData}
              archivedIds={archivedConnectionIds}
              reminderSentIds={reminderSentIds}
              onSendReminder={handleSendReminder}
              sendingReminderId={sendingReminderId}
            />

            {/* How it works */}
            <HowItWorks />
          </div>
        </div>
      </div>

      {/* ── Reach Out Drawer ── */}
      <ReachOutDrawer
        family={drawerFamily}
        isOpen={!!drawerFamily}
        onClose={handleCloseDrawer}
        onSend={handleSendFromDrawer}
        defaultMessage={reachOutNote}
        providerProfile={providerProfile}
        providerCareTypes={providerCareTypes}
        providerPaymentMethods={providerPaymentMethods}
        sending={sending}
        sendError={sendError}
        isVerified={isVerified}
        onVerifyClick={handleVerifyFromDrawer}
      />

      {/* ── Verification Modal ── */}
      <VerificationMethodModal
        isOpen={isVerificationModalOpen}
        onClose={closeVerificationModal}
        onSubmit={handleVerificationSubmit}
        onDismiss={handleVerificationDismiss}
        businessName={providerProfile?.display_name || "Your Business"}
        profileId={providerProfile?.id}
      />

      {/* ── Filters Modal ── */}
      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={modalFilters}
        onApply={setModalFilters}
        familyCounts={familyCounts}
        hasProviderCoordinates={!!(providerProfile?.lat && providerProfile?.lng)}
      />

      {/* ── Mobile FAB for Filters ── */}
      <button
        type="button"
        onClick={() => setIsFiltersModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        {countActiveFilters(modalFilters) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-white text-primary-600 text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {countActiveFilters(modalFilters)}
          </span>
        )}
      </button>
    </div>
    </div>
  );
}
