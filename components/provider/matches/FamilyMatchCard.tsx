"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Profile, FamilyMetadata } from "@/lib/types";

interface FamilyMatchCardProps {
  family: Profile;
  hasFullAccess: boolean;
  providerCareTypes: string[];
  contacted?: boolean;
  reachOutCount?: number;
  onReachOut: (family: Profile) => void;
  animationDelay?: number;
}

// ── Helpers ──

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #7fbfb5, #5a9e94)", // teal/mint
    "linear-gradient(135deg, #9683b5, #7c6a9a)", // purple/violet
    "linear-gradient(135deg, #7a8fa8, #5d7490)", // slate/blue
    "linear-gradient(135deg, #b59683, #9a7c6a)", // terracotta
    "linear-gradient(135deg, #a89683, #8a7a68)", // warm brown
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

function formatContactPref(pref: string): string {
  const map: Record<string, string> = {
    call: "calls",
    phone: "calls",
    text: "texts",
    sms: "texts",
    email: "email",
  };
  return map[pref.toLowerCase()] || pref;
}

function formatSchedulePref(pref: string): string {
  const map: Record<string, string> = {
    mornings: "Mornings",
    morning: "Mornings",
    afternoons: "Afternoons",
    afternoon: "Afternoons",
    evenings: "Evenings",
    evening: "Evenings",
    overnight: "Overnight",
    night: "Overnight",
    full_time: "Full-time",
    fulltime: "Full-time",
    part_time: "Part-time",
    parttime: "Part-time",
    flexible: "Flexible",
    weekends: "Weekends",
    weekdays: "Weekdays",
  };
  return map[pref.toLowerCase()] || pref;
}

function activityAgo(dateStr: string | null | undefined): { label: string; color: "green" | "amber" | "gray" } {
  if (!dateStr) return { label: "No activity yet", color: "gray" };

  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 5) return { label: "Online now", color: "green" };
  if (diffDays === 0) return { label: "Active today", color: "amber" };
  if (diffDays === 1) return { label: "Active 1d ago", color: "amber" };
  if (diffDays < 7) return { label: `Active ${diffDays}d ago`, color: "amber" };
  return { label: "No activity yet", color: "gray" };
}

/**
 * Calculate profile completeness based on filled fields.
 *
 * Weights aligned with admin calculation (lib/admin/profile-completeness.ts)
 * and portal calculation (components/portal/profile/completeness.ts).
 *
 * Total: 100 points
 * - Higher weights for enrichment fields (Steps 1-5)
 * - Lower weights for non-enrichment fields
 * - Name split: 5 for placeholder, +5 for real name
 */
function calculateCompleteness(family: Profile, meta: FamilyMetadata | null): number {
  // If explicitly set, use that value
  if (meta?.profile_completeness !== undefined) {
    return meta.profile_completeness;
  }

  let score = 0;

  // Check if name is real (not placeholder "Care Seeker" - case insensitive)
  const hasRealName = family.display_name?.trim() && family.display_name.toLowerCase() !== "care seeker";

  // Weights aligned with admin/portal calculations
  const weights = {
    // Basic Info (20)
    photo: 2,
    display_name: 5,       // Placeholder counts
    display_name_real: 5,  // Bonus for real name
    city: 8,               // Required for Go Live
    // Contact (24)
    email: 10,             // Always have this from CTA
    phone: 12,             // Enrichment Step 5
    contact_preference: 2,
    // Care Recipient (16)
    who_needs_care: 10,    // Enrichment Step 1
    age: 2,
    about_situation: 4,
    // Care Needs (28)
    care_types: 8,         // Required for Go Live
    care_needs: 6,         // Enrichment Step 3
    timeline: 12,          // Enrichment Step 2
    schedule_preference: 2,
    // Payment (12)
    payment_methods: 12,   // Enrichment Step 4
  };

  // Basic Info
  if (family.image_url?.trim()) score += weights.photo;
  if (family.display_name?.trim()) score += weights.display_name;
  if (hasRealName) score += weights.display_name_real;
  if (family.city?.trim()) score += weights.city;

  // Contact
  if (family.email?.trim()) score += weights.email;
  if (family.phone?.trim()) score += weights.phone;
  if (meta?.contact_preference) score += weights.contact_preference;

  // Care Recipient
  if (meta?.who_needs_care || meta?.relationship_to_recipient) score += weights.who_needs_care;
  if (meta?.age) score += weights.age;
  if (family.description?.trim() || meta?.about_situation?.trim()) score += weights.about_situation;

  // Care Needs
  if (family.care_types && family.care_types.length > 0) score += weights.care_types;
  if (meta?.care_needs && meta.care_needs.length > 0) score += weights.care_needs;
  if (meta?.timeline) score += weights.timeline;
  if (meta?.schedule_preference) score += weights.schedule_preference;

  // Payment
  if (meta?.payment_methods && meta.payment_methods.length > 0) score += weights.payment_methods;

  return Math.min(100, score);
}

// Timeline tag configuration - gray bg with colored text/dot
const TIMELINE_CONFIG: Record<string, { label: string; textColor: string; dotColor: string }> = {
  // New values
  as_soon_as_possible: { label: "Needs care ASAP", textColor: "text-red-600", dotColor: "bg-red-500" },
  within_a_month: { label: "Needs care in ~1 month", textColor: "text-amber-600", dotColor: "bg-amber-500" },
  in_a_few_months: { label: "Needs care in 2-3 months", textColor: "text-teal-600", dotColor: "bg-teal-500" },
  just_researching: { label: "Just exploring", textColor: "text-gray-500", dotColor: "bg-gray-400" },
  // Legacy values (map to new display)
  immediate: { label: "Needs care ASAP", textColor: "text-red-600", dotColor: "bg-red-500" },
  within_1_month: { label: "Needs care in ~1 month", textColor: "text-amber-600", dotColor: "bg-amber-500" },
  within_3_months: { label: "Needs care in 2-3 months", textColor: "text-teal-600", dotColor: "bg-teal-500" },
  exploring: { label: "Just exploring", textColor: "text-gray-500", dotColor: "bg-gray-400" },
};

// Who needs care display
function formatWhoNeedsCare(value: string | undefined): string | null {
  if (!value) return null;
  const mapping: Record<string, string> = {
    myself: "For themselves",
    my_parent: "For a parent",
    my_spouse: "For a spouse",
    someone_else: "For someone",
  };
  return mapping[value] || null;
}

// Completeness color config - three tiers for visual clarity
function getCompletenessColors(percent: number): { dot: string; text: string } {
  if (percent >= 70) return { dot: "#2a7a6e", text: "#2a7a6e" }; // green/teal - good
  if (percent >= 40) return { dot: "#b86e1a", text: "#b86e1a" }; // amber - partial
  return { dot: "#9ca3af", text: "#6b7280" }; // gray - minimal
}

export default function FamilyMatchCard({
  family,
  hasFullAccess,
  providerCareTypes,
  contacted = false,
  reachOutCount = 0,
  onReachOut,
  animationDelay = 0,
}: FamilyMatchCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const meta = (family.metadata || {}) as FamilyMetadata;
  const displayName = family.display_name || "Family";
  const initials = getInitials(displayName);
  const location = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const paymentMethods = meta?.payment_methods || [];
  const publishedAt = meta?.care_post?.published_at || family.created_at;
  const lastActiveAt = meta?.last_active_at;
  const familyDescription = meta?.about_situation?.trim();

  // Extract additional metadata fields
  const age = meta?.age;
  const contactPreference = meta?.contact_preference;
  const schedulePreference = meta?.schedule_preference;

  // Deduplicate care needs by lowercase, keep first occurrence's casing
  const careNeeds = useMemo(() => {
    const raw = meta?.care_needs || family.care_types || [];
    const seen = new Set<string>();
    return raw.filter((need) => {
      const lower = need.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [meta?.care_needs, family.care_types]);

  // Calculate profile completeness and determine card state
  // Aligned with cron threshold: ≥60% is "ready", <60% is "building"
  const completeness = calculateCompleteness(family, meta);
  const cardState: "full" | "partial" =
    completeness >= 60 ? "full" : "partial";

  // Completeness chip colors
  const completenessColors = getCompletenessColors(completeness);

  // Tooltip hover handlers
  const handleTooltipMouseEnter = () => {
    tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
  };
  const handleTooltipMouseLeave = () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setShowTooltip(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  // Activity status
  const activity = activityAgo(lastActiveAt);
  const isOnline = activity.color === "green";

  // Services matched
  const matchingServices = useMemo(() => {
    return careNeeds.filter((need) =>
      providerCareTypes.some((service) => service.toLowerCase() === need.toLowerCase())
    );
  }, [careNeeds, providerCareTypes]);

  // Who needs care display
  const whoNeedsCare = formatWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contacted) {
      onReachOut(family);
    }
  };

  return (
    <div
      className={`group bg-white rounded-[14px] border overflow-hidden ${
        contacted
          ? "border-[#e4edea] opacity-60 cursor-default"
          : "border-[#e4edea] hover:border-[#a8d4cf] cursor-pointer card-hover-shadow"
      }`}
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${animationDelay}ms both`,
      }}
      onClick={handleClick}
    >
      {/* META BAR - Plain text, no pill */}
      <div className="px-5 py-3">
        <span className="text-[13px] text-gray-500">
          <span className="font-semibold text-gray-700">Posted</span> {timeAgo(publishedAt)}
          <span className="mx-1.5 text-gray-400">·</span>
          {reachOutCount === 0 ? (
            <span className="font-semibold text-[#2a7a6e]">Be first to connect</span>
          ) : (
            <span>{reachOutCount} provider{reachOutCount !== 1 ? "s" : ""} reached out</span>
          )}
        </span>
      </div>

      <div className="p-5">
        {/* NAME ROW - Avatar + Name/Location stacked */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar with optional online dot */}
          <div className="relative shrink-0">
            {family.image_url ? (
              <Image
                src={family.image_url}
                alt={displayName}
                width={44}
                height={44}
                className="w-11 h-11 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: avatarGradient(displayName) }}
              >
                {initials}
              </div>
            )}
            {/* Online indicator dot */}
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#38b068] rounded-full border-2 border-white" />
            )}
          </div>

          {/* Name + Location stacked */}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 leading-snug truncate">
              {hasFullAccess ? displayName : displayName.split(" ")[0]}
            </h3>
            <p className="text-sm font-medium text-gray-600">
              {hasFullAccess ? location : (family.city || "Nearby")}
            </p>
          </div>
        </div>

        {/* INLINE SPECS - Age, who needs care, preferences */}
        {(whoNeedsCare || age || contactPreference || schedulePreference) && (
          <p className="text-[13px] sm:text-sm text-gray-500 mb-4 leading-relaxed">
            {whoNeedsCare && <span>{whoNeedsCare}</span>}
            {whoNeedsCare && age && <span className="text-gray-400"> - </span>}
            {age && <span>Age {age}</span>}
            {(whoNeedsCare || age) && (contactPreference || schedulePreference) && <span className="text-gray-400"> - </span>}
            {contactPreference && <span>Prefers {formatContactPref(contactPreference)}</span>}
            {contactPreference && schedulePreference && <span className="text-gray-400">, </span>}
            {schedulePreference && <span>{formatSchedulePref(schedulePreference)}</span>}
          </p>
        )}

        {/* FAMILY DESCRIPTION - Upwork style: regular weight, dark, readable */}
        {familyDescription && (
          <p
            className="text-[14px] sm:text-[15px] text-gray-700 leading-[1.7] mb-4"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {familyDescription}
          </p>
        )}

        {/* TIMELINE - Plain colored text with dot (no pill) */}
        {timeline && (
          <p className={`flex items-center gap-1.5 text-[13px] font-medium mb-3 ${timeline.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${timeline.dotColor}`} />
            {timeline.label}
          </p>
        )}

        {/* TAGS ROW - Care needs only */}
        {careNeeds.length > 0 && (
          <div className="relative mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-6">
              {careNeeds.map((need) => (
                <span
                  key={need}
                  className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200 whitespace-nowrap shrink-0"
                >
                  {need}
                </span>
              ))}
            </div>
            {/* Scroll indicator */}
            {careNeeds.length > 2 && (
              <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-white via-white/90 pointer-events-none flex items-center justify-end pr-1">
                <span className="text-gray-400 text-lg font-light">&rsaquo;</span>
              </div>
            )}
          </div>
        )}

        {/* TRUST SIGNALS - Clean bottom row */}
        <div className="flex items-center justify-between text-[13px] pt-3 border-t border-gray-100">
          {/* Profile completeness - colored dot with percentage */}
          <div
            className="relative flex items-center gap-1.5"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: completenessColors.dot }}
            />
            <span style={{ color: completenessColors.text }}>
              Profile {completeness}%
            </span>

            {/* Tooltip */}
            {showTooltip && (
              <div
                className="absolute bottom-full left-0 mb-2 z-50"
                style={{ minWidth: "220px", maxWidth: "260px" }}
              >
                <div
                  className="relative bg-[#141918] text-white rounded-lg px-3.5 py-3 shadow-xl"
                  style={{ fontSize: "12px", lineHeight: "1.6" }}
                >
                  {cardState === "full" && (
                    <>
                      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                        Match quality
                      </p>
                      <p className="text-white/90 mb-2.5">
                        {matchingServices.length > 0 ? (
                          <>Strong match — needs {matchingServices.length} {matchingServices.length === 1 ? "service" : "services"} you offer.</>
                        ) : (
                          <>Strong match — detailed profile shared.</>
                        )}
                      </p>
                      <div className="border-t border-white/10 pt-2.5">
                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                          Tip
                        </p>
                        <p className="text-white/70">
                          Reference their care needs in your message.
                        </p>
                      </div>
                    </>
                  )}
                  {cardState === "partial" && (
                    <>
                      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                        Match quality
                      </p>
                      <p className="text-white/90 mb-2.5">
                        New to Olera — still building their profile.
                      </p>
                      <div className="border-t border-white/10 pt-2.5">
                        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">
                          Tip
                        </p>
                        <p className="text-white/70">
                          Keep it warm and friendly. Early outreach builds trust.
                        </p>
                      </div>
                    </>
                  )}
                  <div
                    className="absolute -bottom-1.5 left-4 w-0 h-0"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid #141918",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment methods - plain text */}
          {paymentMethods.length > 0 && (
            <span className="text-gray-500 truncate ml-4">
              Pays: {paymentMethods.join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Animation keyframes and hover styles */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-hover-shadow {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover-shadow:hover {
          box-shadow: 0 4px 12px rgba(42, 122, 110, 0.08);
        }
      `}</style>
    </div>
  );
}
