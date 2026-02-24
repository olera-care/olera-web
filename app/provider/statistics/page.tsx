"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import { useProviderStats } from "@/hooks/useProviderStats";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function InquiryIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  iconBg,
  label,
  value,
  subtitle,
  comingSoon,
  locked,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  subtitle?: string;
  comingSoon?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            comingSoon ? "bg-gray-50 text-gray-300" : iconBg
          }`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {comingSoon && (
          <span className="ml-auto text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            Soon
          </span>
        )}
      </div>

      {comingSoon ? (
        <p className="text-[15px] text-gray-300 font-medium">Coming soon</p>
      ) : locked ? (
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-gray-200 blur-[5px] select-none pointer-events-none" aria-hidden>
            {value}
          </div>
          <Link
            href="/provider/pro"
            className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors ml-auto"
          >
            <LockIcon className="w-3.5 h-3.5" />
            Upgrade
          </Link>
        </div>
      ) : (
        <div className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </div>
      )}

      {subtitle && !comingSoon && !locked && (
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly Activity Chart (CSS bars)
// ---------------------------------------------------------------------------

function MonthlyChart({
  data,
  locked,
}: {
  data: { month: string; label: string; count: number }[];
  locked: boolean;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hasActivity = data.some((d) => d.count > 0);

  const chartContent = (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
        return (
          <div key={d.month} className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-8 shrink-0 text-right">
              {d.label}
            </span>
            <div className="flex-1 h-[22px] bg-gray-50 rounded-full overflow-hidden">
              {d.count > 0 && (
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, 8)}%` }}
                />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 w-8 text-right tabular-nums">
              {d.count}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 h-full">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-gray-900">
          Monthly inquiries
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">Last 6 months</p>
      </div>

      {locked ? (
        <div className="relative">
          <div className="blur-[6px] pointer-events-none select-none" aria-hidden>
            {chartContent}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 text-center shadow-sm border border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <LockIcon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[15px] font-medium text-gray-700 mb-1">
                Unlock activity insights
              </p>
              <Link
                href="/provider/pro"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                View plans &rarr;
              </Link>
            </div>
          </div>
        </div>
      ) : !hasActivity ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-gray-700">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Activity will appear here as families connect with you.
          </p>
        </div>
      ) : (
        chartContent
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Health Card
// ---------------------------------------------------------------------------

function ProfileHealthCard({
  overall,
  sections,
}: {
  overall: number;
  sections: { id: string; label: string; percent: number }[];
}) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-gray-900">
          Profile health
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Complete profiles receive more inquiries
        </p>
      </div>

      <div className="flex items-center gap-6 mb-5 flex-1">
        {/* Circular progress with proper positioning */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f9fafb"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-primary-500 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{overall}%</span>
          </div>
        </div>

        {/* Section breakdown */}
        <div className="flex-1 space-y-1.5">
          {sections.map((s) => {
            const done = s.percent >= 100;
            return (
              <div key={s.id} className="flex items-center gap-2">
                {done ? (
                  <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />
                )}
                <span className={`text-sm ${done ? "text-gray-700" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Link
        href="/provider"
        className="text-[15px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        Improve your profile &rarr;
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Breakdown (Pro only)
// ---------------------------------------------------------------------------

function ConnectionBreakdown({
  accepted,
  pending,
  declined,
  expired,
}: {
  accepted: number;
  pending: number;
  declined: number;
  expired: number;
}) {
  const total = accepted + pending + declined + expired;
  if (total === 0) return null;

  const segments = [
    { label: "Accepted", count: accepted, color: "bg-emerald-500", dot: "bg-emerald-500", text: "text-gray-700" },
    { label: "Pending", count: pending, color: "bg-amber-400", dot: "bg-amber-400", text: "text-gray-700" },
    { label: "Declined", count: declined, color: "bg-gray-300", dot: "bg-gray-300", text: "text-gray-500" },
    { label: "Expired", count: expired, color: "bg-gray-200", dot: "bg-gray-200", text: "text-gray-400" },
  ].filter((s) => s.count > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 h-full">
      <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
        Connection outcomes
      </h2>

      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden mb-4">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={`text-sm font-medium ${s.text}`}>
              {s.label}
            </span>
            <span className="text-sm text-gray-400 tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="animate-pulse">
        <div className="h-6 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-8" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-6">
            <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded mb-5" />
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-3.5 bg-gray-100 rounded" />
                  <div className="flex-1 h-[22px] bg-gray-50 rounded-full" />
                  <div className="w-8 h-3.5 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="h-5 w-28 bg-gray-200 rounded mb-5" />
            <div className="flex items-center gap-6">
              <div className="w-[100px] h-[100px] rounded-full bg-gray-50" />
              <div className="flex-1 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-100" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProviderStatisticsPage() {
  const profile = useProviderProfile();
  const { membership } = useAuth();
  const { metadata, loading: metaLoading } = useProviderDashboardData(profile);
  const stats = useProviderStats(profile?.id);

  const loading = !profile || metaLoading || stats.loading;

  if (loading) return <StatsSkeleton />;

  const meta = metadata as ExtendedMetadata;
  const completeness = calculateProfileCompleteness(profile, meta);

  const isPro =
    membership?.status === "active" || membership?.status === "past_due";

  // Review data
  const reviews = meta?.reviews || [];
  const reviewCount = meta?.review_count ?? reviews.length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const displayRating = meta?.rating ?? averageRating;
  const ratingSubtitle =
    reviewCount > 0
      ? `${displayRating.toFixed(1)} avg rating`
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-[15px] text-gray-500 mt-1">
          Track how your listing is performing on Olera.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<InquiryIcon />}
          iconBg="bg-primary-50 text-primary-600"
          label="Inquiries"
          value={stats.totalInquiries}
          subtitle={
            stats.pendingCount > 0
              ? `${stats.pendingCount} pending`
              : undefined
          }
        />
        <StatCard
          icon={<EyeIcon />}
          iconBg="bg-gray-50 text-gray-400"
          label="Profile views"
          value={0}
          comingSoon
        />
        <StatCard
          icon={<CheckCircleIcon />}
          iconBg="bg-emerald-50 text-emerald-600"
          label="Response rate"
          value={stats.responseRate !== null ? `${stats.responseRate}%` : "—"}
          subtitle={
            stats.responseRate !== null
              ? `${stats.acceptedCount} accepted`
              : undefined
          }
          locked={!isPro}
        />
        <StatCard
          icon={<StarIcon />}
          iconBg="bg-amber-50 text-amber-600"
          label="Reviews"
          value={reviewCount}
          subtitle={ratingSubtitle}
        />
      </div>

      {/* Two-column: Chart + Profile Health (+ Breakdown on Pro) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
          <MonthlyChart
            data={stats.monthlyInquiries}
            locked={!isPro}
          />

          {/* Connection Breakdown — Pro only, tucked under the chart */}
          {isPro && (
            <ConnectionBreakdown
              accepted={stats.acceptedCount}
              pending={stats.pendingCount}
              declined={stats.declinedCount}
              expired={stats.expiredCount}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <ProfileHealthCard
            overall={completeness.overall}
            sections={completeness.sections}
          />
        </div>
      </div>
    </div>
  );
}
