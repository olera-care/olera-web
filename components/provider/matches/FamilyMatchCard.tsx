"use client";

import { useMemo } from "react";
import type { Profile, FamilyMetadata } from "@/lib/types";

interface FamilyMatchCardProps {
  family: Profile;
  hasFullAccess: boolean;
  providerCareTypes: string[];
  providerPaymentMethods: string[];
  providerLat?: number | null;
  providerLng?: number | null;
  contacted?: boolean;
  reachOutCount?: number;
  onReachOut: (family: Profile) => void;
}

// ── Helpers ──

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function blurName(name: string): string {
  if (!name) return "***";
  return name.charAt(0) + "***";
}

function avatarGradient(name: string): string {
  // Warm/purple tones to avoid green overload on the page
  const gradients = [
    "linear-gradient(135deg, #8b7355, #a08060)", // warm brown
    "linear-gradient(135deg, #7c6a9a, #9683b5)", // soft purple
    "linear-gradient(135deg, #6b7c8a, #8a9ba8)", // slate blue
    "linear-gradient(135deg, #9a7c6a, #b59683)", // terracotta
    "linear-gradient(135deg, #7a6b8a, #968bb5)", // lavender
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
  const minutes = Math.round(miles / 0.5);
  if (minutes < 1) return "1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

const TIMELINE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  immediate: { label: "Immediate", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  within_1_month: { label: "Within 1 month", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  within_3_months: { label: "Within 3 months", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  exploring: { label: "Exploring", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
};

export default function FamilyMatchCard({
  family,
  hasFullAccess,
  providerCareTypes,
  providerPaymentMethods,
  providerLat,
  providerLng,
  contacted = false,
  reachOutCount = 0,
  onReachOut,
}: FamilyMatchCardProps) {
  const meta = family.metadata as FamilyMetadata;
  const displayName = family.display_name || "Family";
  const firstName = displayName.split(/\s+/)[0];
  const initials = getInitials(displayName);
  const location = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const careNeeds = meta?.care_needs || family.care_types || [];
  const paymentMethods = meta?.payment_methods || [];
  const publishedAt = meta?.care_post?.published_at;

  // Calculate match reasons
  const matchReasons = useMemo(() => {
    const reasons: { icon: string; text: string }[] = [];

    // Service match
    const matchingServices = careNeeds.filter((need) =>
      providerCareTypes.some((service) => service.toLowerCase() === need.toLowerCase())
    );
    if (matchingServices.length > 0) {
      reasons.push({
        icon: "services",
        text: matchingServices.length === 1
          ? `Looking for ${matchingServices[0]}`
          : `Looking for ${matchingServices.length} services you offer`,
      });
    } else if (careNeeds.length > 0) {
      reasons.push({
        icon: "services",
        text: `Looking for ${careNeeds.slice(0, 2).join(", ")}${careNeeds.length > 2 ? ` +${careNeeds.length - 2}` : ""}`,
      });
    }

    // Distance - only show if we can calculate drive time (avoid duplicate location)
    if (providerLat && providerLng && family.lat && family.lng) {
      const distance = haversineDistance(providerLat, providerLng, family.lat, family.lng);
      const driveTime = estimateDriveTime(distance);
      reasons.push({
        icon: "location",
        text: `${driveTime} drive from you`,
      });
    }
    // Don't show location as a match reason - it's already in the header

    // Payment match
    const matchingPayments = paymentMethods.filter((method) =>
      providerPaymentMethods.some((pm) => pm.toLowerCase() === method.toLowerCase())
    );
    if (matchingPayments.length > 0) {
      reasons.push({
        icon: "payment",
        text: `Pays with ${matchingPayments[0]} — you accept`,
      });
    } else if (paymentMethods.length > 0) {
      reasons.push({
        icon: "payment",
        text: `Pays with ${paymentMethods[0]}`,
      });
    }

    return reasons.slice(0, 3);
  }, [careNeeds, paymentMethods, providerCareTypes, providerPaymentMethods, providerLat, providerLng, family.lat, family.lng]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contacted) {
      onReachOut(family);
    }
  };

  return (
    <div
      className={`group flex flex-col h-full min-h-[340px] bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
        contacted
          ? "border-gray-200/60 opacity-60"
          : "border-gray-200/80 hover:shadow-lg hover:border-gray-300/80 hover:-translate-y-0.5 cursor-pointer"
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white shadow-sm"
            style={{ background: hasFullAccess ? avatarGradient(displayName) : "#9ca3af" }}
          >
            {hasFullAccess ? initials : "?"}
          </div>

          {/* Name + Location */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-semibold text-gray-900 truncate leading-tight group-hover:text-primary-700 transition-colors">
              {hasFullAccess ? displayName : blurName(displayName)}
            </h3>
            {location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="truncate">{hasFullAccess ? location : "***"}</span>
              </div>
            )}
          </div>

          {/* Timeline badge + time */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {timeline && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${timeline.border} ${timeline.color} ${timeline.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${timeline.dot} animate-pulse`} />
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
      </div>

      {/* Match Reasons */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Match details
        </p>
        <div className="space-y-2">
          {matchReasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                {reason.icon === "services" && (
                  <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
                {reason.icon === "location" && (
                  <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )}
                {reason.icon === "payment" && (
                  <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{reason.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 mt-auto">
        {contacted ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            You reached out
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="w-full px-4 py-3 bg-gradient-to-b from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Reach out to {hasFullAccess ? firstName : "Family"}
          </button>
        )}

        {/* Competition indicator */}
        {!contacted && reachOutCount === 0 && (
          <p className="text-xs text-center text-amber-600 font-medium mt-2">
            Be the first to connect!
          </p>
        )}
        {!contacted && reachOutCount > 0 && reachOutCount < 4 && (
          <p className="text-xs text-center text-gray-400 mt-2">
            {reachOutCount} provider{reachOutCount !== 1 ? "s" : ""} reached out
          </p>
        )}
      </div>
    </div>
  );
}
