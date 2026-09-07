"use client";

/**
 * ProviderRow - Individual provider row in the growth tracking list
 *
 * Shows provider name, source, claim date, verification status,
 * profile completeness, eligibility badges, and engagement metrics.
 */

import type { ProviderGrowthWithProfile } from "@/lib/provider-growth/queries";
import {
  CLAIM_SOURCE_LABELS,
  CLAIM_SOURCE_COLORS,
  PIPELINE_STAGE_LABELS,
  ADS_STATUS_LABELS,
  MEDJOBS_STATUS_LABELS,
  type ClaimSource,
  type PipelineStage,
  type AdsStatus,
  type MedjobsStatus,
} from "@/lib/provider-growth/stages";
import { EligibilityBadges } from "./EligibilityBadges";

interface ProviderRowProps {
  provider: ProviderGrowthWithProfile;
  onClick: () => void;
  selected?: boolean;
}

export function ProviderRow({ provider, onClick, selected }: ProviderRowProps) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        selected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Provider info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">
              {provider.display_name || "Unnamed Provider"}
            </h3>
            <VerificationBadge state={provider.verification_state} />
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {provider.city && provider.state && (
              <span>{provider.city}, {provider.state}</span>
            )}
            {provider.claim_source && (
              <>
                <span className="text-gray-300">·</span>
                <SourceBadge source={provider.claim_source as ClaimSource} />
              </>
            )}
            {provider.claimed_at && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{timeAgo(provider.claimed_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Status indicators */}
        <div className="flex items-center gap-3">
          {/* Profile completeness */}
          <div className="text-center">
            <ProfileProgress value={provider.profile_completeness || 0} />
            <div className="text-[10px] text-gray-400 mt-0.5">Profile</div>
          </div>

          {/* Eligibility badges */}
          <div>
            <EligibilityBadges
              adsEligible={provider.ads_eligible}
              medjobsEligible={provider.medjobs_eligible}
              medjobsUniversity={provider.medjobs_catchment_university}
            />
          </div>

          {/* Conversion status */}
          <div className="flex gap-1">
            {provider.ads_status !== "none" && (
              <StatusBadge
                type="ads"
                status={provider.ads_status as AdsStatus}
              />
            )}
            {provider.medjobs_status !== "none" && (
              <StatusBadge
                type="medjobs"
                status={provider.medjobs_status as MedjobsStatus}
              />
            )}
          </div>
        </div>

        {/* Right: Meeting/pitch info */}
        <div className="text-right text-sm">
          {provider.pipeline_stage === "meeting_scheduled" && provider.meeting_scheduled_at && (
            <div>
              <div className="text-blue-600 font-medium">Meeting</div>
              <div className="text-xs text-gray-400">
                {formatDate(provider.meeting_scheduled_at)}
              </div>
            </div>
          )}
          {provider.pipeline_stage === "pitched" && provider.pitched_at && (
            <div>
              <div className="text-indigo-600 font-medium">Pitched</div>
              <div className="text-xs text-gray-400">
                {timeAgo(provider.pitched_at)}
              </div>
            </div>
          )}
          {provider.notes && (
            <div className="text-xs text-gray-400 truncate max-w-[120px]" title={provider.notes}>
              {provider.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerificationBadge({ state }: { state: string | null }) {
  if (!state || state === "unverified") return null;

  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${
        styles[state] || "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {state === "verified" ? "Verified" : state === "pending" ? "Pending" : state}
    </span>
  );
}

function SourceBadge({ source }: { source: ClaimSource }) {
  const label = CLAIM_SOURCE_LABELS[source] || source;
  const colorClass = CLAIM_SOURCE_COLORS[source] || "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClass}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({
  type,
  status,
}: {
  type: "ads" | "medjobs";
  status: AdsStatus | MedjobsStatus;
}) {
  const label = type === "ads"
    ? ADS_STATUS_LABELS[status as AdsStatus]
    : MEDJOBS_STATUS_LABELS[status as MedjobsStatus];

  const colorClass = status === "subscribed"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : type === "ads"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-purple-50 text-purple-700 border-purple-200";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClass}`}
    >
      {type === "ads" ? "Ads" : "MJ"}: {label.split(" ")[0]}
    </span>
  );
}

function ProfileProgress({ value }: { value: number }) {
  const color =
    value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-gray-400";

  return (
    <div className={`text-sm font-medium ${color}`}>
      {value}%
    </div>
  );
}

function timeAgo(isoDate: string | undefined | null): string {
  if (!isoDate) return "—";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  if (isToday) {
    return `Today ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (isTomorrow) {
    return `Tomorrow ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
