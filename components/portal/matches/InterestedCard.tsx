"use client";

import { useState } from "react";
import Link from "next/link";
import { avatarGradient } from "@/components/portal/ConnectionDetailContent";
import type { InterestedProvider } from "@/hooks/useInterestedProviders";
import type {
  ProfileCategory,
  OrganizationMetadata,
  CaregiverMetadata,
} from "@/lib/types";

interface InterestedCardProps {
  item: InterestedProvider;
  onReconsider?: (id: string) => void;
  isDeclined?: boolean;
  familyLat?: number | null;
  familyLng?: number | null;
  isExpanded?: boolean;
  onExpand?: (id: string) => void;
  onCollapse?: () => void;
  onDecline?: (id: string) => void;
  onAccept?: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isAccepted?: boolean;
  onDismiss?: (id: string) => void;
  isDeclinedConfirm?: boolean;
  onUndoDecline?: (id: string) => void;
  onDoneDecline?: (id: string, reasons: string[]) => void;
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CATEGORY_LABELS: Record<string, string> = {
  home_care_agency: "Home Care Agency",
  home_health_agency: "Home Health Agency",
  hospice_agency: "Hospice Agency",
  independent_living: "Independent Living",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  inpatient_hospice: "Inpatient Hospice",
  rehab_facility: "Rehab Facility",
  adult_day_care: "Adult Day Care",
  wellness_center: "Wellness Center",
  private_caregiver: "Private Caregiver",
};

function getCategoryLabel(category: ProfileCategory | null | undefined, type: string | undefined): string {
  if (category && CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  if (type === "caregiver") return "Private Caregiver";
  if (type === "organization") return "Care Provider";
  return "Care Provider";
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
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

function getPricingLabel(profile: InterestedProvider["providerProfile"]): string | null {
  if (!profile) return null;
  const meta = profile.metadata as (OrganizationMetadata & CaregiverMetadata) | null;
  if (!meta) return null;
  if (meta.hourly_rate_min && meta.hourly_rate_max) {
    return `$${meta.hourly_rate_min}–$${meta.hourly_rate_max}/hr`;
  }
  if (meta.hourly_rate_min) return `From $${meta.hourly_rate_min}/hr`;
  if (meta.price_range) return meta.price_range;
  return "Contact for rates";
}

export default function InterestedCard({
  item,
  onReconsider,
  isDeclined = false,
  familyLat,
  familyLng,
  isExpanded = false,
  onExpand,
  onCollapse,
  onDecline,
  onAccept,
  isAccepting = false,
  isDeclining = false,
  isAccepted = false,
  onDismiss,
  isDeclinedConfirm = false,
  onUndoDecline,
  onDoneDecline,
}: InterestedCardProps) {
  const profile = item.providerProfile;
  const name = profile?.display_name || "Unknown Provider";
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const imageUrl = profile?.image_url;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const viewed = (item.metadata as Record<string, unknown>)?.viewed === true;
  const matchReasons = ((item.metadata as Record<string, unknown>)?.match_reasons as string[]) || [];
  const reachOutNote = (item.metadata as Record<string, unknown>)?.reach_out_note as string | undefined;
  const dateLabel = formatRelativeDate(item.created_at);
  const categoryLabel = getCategoryLabel(
    profile?.category as ProfileCategory | null,
    profile?.type
  );

  // Provider care types
  const careTypes = profile?.care_types || [];

  // Count how many match reasons relate to services (used for "X services match")
  const matchCount = matchReasons.length;

  // Distance computation
  const providerLat = profile?.lat;
  const providerLng = profile?.lng;
  const driveTime =
    familyLat != null && familyLng != null && providerLat != null && providerLng != null
      ? estimateDriveTime(haversineDistance(familyLat, familyLng, providerLat, providerLng))
      : null;

  // Provider metadata for expanded view
  const providerMeta = profile?.metadata as (OrganizationMetadata & CaregiverMetadata) | null;
  const isVerified = profile?.verification_state === "verified";
  const pricingLabel = getPricingLabel(profile);
  const profileSlug = profile?.slug;
  const providerCity = profile?.city;

  // "Why they're a good fit" reasons
  const fitReasons: string[] = [];
  if (matchCount > 0) {
    fitReasons.push(`Offers ${matchCount} service${matchCount !== 1 ? "s" : ""} you're looking for`);
  }
  if (driveTime) {
    fitReasons.push(`Located ${driveTime} from your area`);
  }
  if (providerMeta?.years_experience) {
    fitReasons.push(
      `${providerMeta.years_experience}+ years${providerCity ? ` serving the ${providerCity} area` : " of experience"}`
    );
  }
  if (providerMeta?.year_founded) {
    const years = new Date().getFullYear() - providerMeta.year_founded;
    if (years > 0 && fitReasons.length < 3) {
      fitReasons.push(
        `${years}+ years${providerCity ? ` serving the ${providerCity} area` : " in operation"}`
      );
    }
  }

  // ── Accepted / Connected state ──
  if (isAccepted) {
    return (
      <div className="bg-white rounded-2xl border border-l-[3px] border-l-primary-400 border-gray-200/80 shadow-sm overflow-hidden">
        <div className="px-7 py-10 text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>

          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
            You&apos;re connected!
          </h3>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-[420px] mx-auto mb-6">
            Your details have been shared with this provider. They&apos;ll see your care post and can reply directly.
          </p>

          {/* Provider mini card */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200/80 rounded-2xl px-5 py-3 shadow-sm mb-6">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
                style={{ background: avatarGradient(name) }}
              >
                {initials}
              </div>
            )}
            <span className="text-[15px] font-semibold text-gray-900">{name}</span>
          </div>

          {/* Go to inbox button */}
          <div className="mb-3">
            <Link
              href="/portal/inbox"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[15px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              Go to inbox
            </Link>
          </div>

          {/* Keep reviewing link */}
          <button
            type="button"
            onClick={() => onDismiss?.(item.id)}
            className="text-[14px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            or keep reviewing providers
          </button>
        </div>
      </div>
    );
  }

  // ── Declined feedback state ──
  if (isDeclinedConfirm) {
    return <DeclineFeedbackCard item={item} name={name} initials={initials} onUndo={onUndoDecline} onDone={onDoneDecline} />;
  }

  return (
    <div
      className={[
        "bg-white rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]",
        isExpanded
          ? "border-l-[3px] border-l-primary-400 border-gray-300 shadow-lg shadow-gray-900/[0.06] ring-1 ring-gray-200/60"
          : isDeclined
            ? "border-gray-200/80 opacity-55"
            : "border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300",
      ].join(" ")}
    >
      {/* ── Card body ── */}
      <div className="p-7">
        {/* Header: avatar + type/name/location + new badge + time */}
        <div className="flex items-start gap-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-sm"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[15px] font-bold text-white shadow-sm"
              style={{ background: avatarGradient(name) }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
              {categoryLabel}
            </p>
            <h3
              className={[
                "text-lg font-display leading-tight truncate",
                isDeclined
                  ? "font-medium text-gray-400"
                  : "font-bold text-gray-900",
              ].join(" ")}
            >
              {name}
            </h3>
            {location && (
              <p className={`flex items-center gap-1 text-[13px] mt-0.5 ${isDeclined ? "text-gray-400" : "text-gray-500"}`}>
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {!isDeclined && !viewed && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-600 border border-green-200 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                New
              </span>
            )}
            <span className="text-[13px] text-gray-400 tabular-nums">
              {dateLabel}
            </span>
          </div>
        </div>

        {/* ── Message from provider ── */}
        {reachOutNote && !isDeclined && (
          <div className="mt-5 bg-gray-50/80 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Their message to you
            </p>
            <p className={`text-[15px] text-gray-700 leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
              {reachOutNote}
            </p>
          </div>
        )}

        {/* ── Description fallback if no note ── */}
        {!reachOutNote && profile?.description && !isDeclined && (
          <div className="mt-5 bg-gray-50/80 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              About this provider
            </p>
            <p className={`text-[15px] text-gray-600 leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
              {profile.description}
            </p>
          </div>
        )}

        {/* ── Match stats row ── */}
        {!isDeclined && (matchCount > 0 || driveTime) && (
          <div className="flex items-center gap-5 mt-5">
            {matchCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="font-semibold text-gray-700">{matchCount} service{matchCount !== 1 ? "s" : ""}</span>{" "}
                match
              </span>
            )}
            {driveTime && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="font-semibold text-gray-700">{driveTime}</span> from you
              </span>
            )}
          </div>
        )}

        {/* ── Care type pills ── */}
        {careTypes.length > 0 && !isDeclined && (
          <div className="flex flex-wrap gap-2 mt-4">
            {careTypes.slice(0, isExpanded ? 8 : 4).map((ct) => {
              const isMatched = matchReasons.some(
                (r) => r.toLowerCase() === ct.toLowerCase()
              );
              return (
                <span
                  key={ct}
                  className={[
                    "inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full border",
                    isMatched
                      ? "border-[#F5F4F1] text-gray-700 bg-[#F5F4F1]"
                      : "border-warm-100 text-gray-500 bg-white",
                  ].join(" ")}
                >
                  {isMatched && (
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  {ct}
                </span>
              );
            })}
            {!isExpanded && careTypes.length > 4 && (
              <span className="text-[13px] text-gray-400 self-center pl-1">
                +{careTypes.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Expanded detail section (grid animation) ── */}
      {!isDeclined && (
        <div
          className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className={`border-t border-warm-100/60 bg-gradient-to-b from-vanilla-50/40 to-warm-50/20 transition-[opacity,transform] ${isExpanded ? "duration-400 delay-150 opacity-100 translate-y-0" : "duration-200 opacity-0 translate-y-1"}`}>
              <div className="px-7 py-6">
                {/* Why they're a good fit */}
                {fitReasons.length > 0 && (
                  <>
                    <h4 className="text-[17px] font-display font-bold text-gray-900 mb-4">
                      Why they&apos;re a good fit
                    </h4>
                    <div className="space-y-3 mb-6">
                      {fitReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <p className="text-[15px] text-gray-700 leading-relaxed">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* View full profile link */}
                {profileSlug && (
                  <Link
                    href={`/provider/${profileSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary-600 hover:text-primary-700 transition-colors mb-6"
                  >
                    View full profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                )}

                {/* Info cards: Pricing + Background Check */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200/80 bg-white px-5 py-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Pricing
                    </p>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {pricingLabel || "Contact for rates"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200/80 bg-white px-5 py-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Background check
                    </p>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1.5">
                          Verified
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : (
                        "Unverified"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      {!isDeclined ? (
        isExpanded ? (
          /* Expanded footer: hint + Decline + Start conversation */
          <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4 flex items-center justify-between gap-4">
            <p className="text-[13px] text-gray-400 min-w-0">
              Starting a conversation doesn&apos;t commit you
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onDecline?.(item.id)}
                disabled={isDeclining || isAccepting}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-[14px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
              >
                {isDeclining ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  "Decline"
                )}
              </button>
              <button
                type="button"
                onClick={() => onAccept?.(item.id)}
                disabled={isAccepting || isDeclining}
                className="group inline-flex items-center gap-2 pl-5 pr-6 py-2.5 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 text-white text-[14px] font-semibold shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] disabled:opacity-70 transition-all duration-200"
              >
                {isAccepting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                )}
                {isAccepting ? "Connecting\u2026" : "Start conversation"}
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed footer: View details */
          <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4 flex items-center justify-between">
            <p className="text-[13px] text-gray-400">
              Review details before connecting
            </p>
            <button
              type="button"
              onClick={() => onExpand?.(item.id)}
              className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-gradient-to-b from-primary-500 to-primary-600 rounded-full px-5 py-2.5 shadow-[0_1px_3px_rgba(25,144,135,0.3),0_1px_2px_rgba(25,144,135,0.2)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_3px_8px_rgba(25,144,135,0.35),0_1px_3px_rgba(25,144,135,0.25)] active:scale-[0.97] transition-all duration-200"
            >
              View details
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )
      ) : onReconsider ? (
        <div className="bg-warm-50/40 border-t border-warm-100/60 px-7 py-4">
          <button
            type="button"
            onClick={() => onReconsider(item.id)}
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-4 py-2 transition-colors"
          >
            Reconsider
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Decline feedback sub-component ──

const DECLINE_REASONS = [
  "Too far away",
  "Services don't match",
  "Pricing concerns",
  "Already found care",
];

function DeclineFeedbackCard({
  item,
  name,
  initials,
  onUndo,
  onDone,
}: {
  item: InterestedProvider;
  name: string;
  initials: string;
  onUndo?: (id: string) => void;
  onDone?: (id: string, reasons: string[]) => void;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-7 py-6">
        {/* Provider header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-[14px] font-bold text-warm-400 bg-warm-100/60"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-display font-bold text-gray-900 truncate">
              {name}
            </h3>
            <p className="text-[13px] text-gray-400">
              You declined this provider
            </p>
          </div>
        </div>

        {/* Feedback question */}
        <p className="text-[15px] text-gray-600 mb-4">
          Help us improve &mdash; why wasn&apos;t this a fit?
        </p>

        {/* Reason pills */}
        <div className="flex flex-wrap gap-2.5">
          {DECLINE_REASONS.map((reason) => {
            const isSelected = selectedReasons.includes(reason);
            return (
              <button
                key={reason}
                type="button"
                onClick={() => toggleReason(reason)}
                className={[
                  "text-[14px] font-medium px-4 py-2 rounded-full border transition-all duration-150",
                  isSelected
                    ? "border-gray-300 bg-gray-100 text-gray-800"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {reason}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-7 py-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onUndo?.(item.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
          Undo
        </button>
        <button
          type="button"
          onClick={() => onDone?.(item.id, selectedReasons)}
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-gray-900 hover:bg-gray-800 active:scale-[0.97] transition-all duration-200"
        >
          Done
        </button>
      </div>
    </div>
  );
}
