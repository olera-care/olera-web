"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchProviderCard from "@/components/portal/matches/MatchProviderCard";
import InterestedCardCompact from "@/components/portal/matches/InterestedCardCompact";
import {
  useInterestedProviders,
  type InterestedProvider,
} from "@/hooks/useInterestedProviders";
import type {
  OrganizationMetadata,
  CaregiverMetadata,
} from "@/lib/types";

interface InterestedTabContentProps {
  profileId: string;
  hasCarePost: boolean;
  familyLat?: number | null;
  familyLng?: number | null;
  variant?: "desktop" | "mobile";
}

function getPriceRange(profile: InterestedProvider["providerProfile"]): string | null {
  if (!profile) return null;
  const meta = profile.metadata as (OrganizationMetadata & CaregiverMetadata & Record<string, unknown>) | null;
  if (!meta) return null;
  if (meta.hourly_rate_min && meta.hourly_rate_max) {
    return `$${meta.hourly_rate_min}–$${meta.hourly_rate_max}/hr`;
  }
  if (meta.hourly_rate_min) return `From $${meta.hourly_rate_min}/hr`;
  if (meta.price_range) return meta.price_range;
  const lower = meta.lower_price as number | undefined;
  const upper = meta.upper_price as number | undefined;
  if (lower && upper) return `$${lower}–$${upper}/hr`;
  if (lower) return `From $${lower}/hr`;
  return null;
}

export default function InterestedTabContent({
  profileId,
  hasCarePost,
  familyLat,
  familyLng,
  variant = "desktop",
}: InterestedTabContentProps) {
  const router = useRouter();
  const { pending, declined, loading, updateLocal } =
    useInterestedProviders(profileId);
  const [declinedExpanded, setDeclinedExpanded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(timer);
  }, [actionError]);

  // ── Handle message sent (accept + send message) ──
  const handleMessage = useCallback(
    async (providerId: string, message: string) => {
      // Find the connection for this provider
      const item = pending.find((c) => c.providerProfile?.id === providerId);
      if (!item) return;

      setActionError(null);
      try {
        // Accept the connection and send the message
        const res = await fetch("/api/connections/respond-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: item.id,
            action: "accept",
            message,
          }),
        });
        if (!res.ok) {
          setActionError("Couldn't send message. Please try again.");
          return;
        }

        // Remove from pending and redirect to inbox
        updateLocal(item.id, "remove");
        router.push(`/portal/inbox?id=${item.id}`);
      } catch {
        setActionError("Couldn't send message. Please try again.");
      }
    },
    [pending, updateLocal, router]
  );

  // ── Decline ──
  const handleDecline = useCallback(
    async (connectionId: string) => {
      setActionError(null);
      try {
        const res = await fetch("/api/connections/respond-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId, action: "decline" }),
        });
        if (!res.ok) {
          setActionError("Couldn't decline. Please try again.");
          return;
        }

        // Move to declined
        const item = pending.find((c) => c.id === connectionId);
        if (item) {
          const meta = (item.metadata || {}) as Record<string, unknown>;
          updateLocal(connectionId, {
            status: "declined",
            metadata: { ...meta, declined_at: new Date().toISOString() },
          } as Partial<InterestedProvider>);
        }
      } catch {
        setActionError("Couldn't decline. Please try again.");
      }
    },
    [pending, updateLocal]
  );

  const handleReconsider = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        const res = await fetch("/api/connections/respond-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: id, action: "reconsider" }),
        });
        if (!res.ok) {
          setActionError("Couldn't reconsider. Please try again.");
          return;
        }

        // Optimistic update: move back to pending
        const item = declined.find((c) => c.id === id);
        if (item) {
          const meta = (item.metadata || {}) as Record<string, unknown>;
          const { declined_at, ...restMeta } = meta as Record<string, unknown> & { declined_at?: unknown };
          updateLocal(id, {
            status: "pending",
            metadata: { ...restMeta, viewed: true },
          } as Partial<InterestedProvider>);
        }
      } catch {
        setActionError("Couldn't reconsider. Please try again.");
      }
    },
    [declined, updateLocal]
  );

  // ── Loading state ──
  if (loading) {
    if (variant === "mobile") {
      return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 px-5 py-4 border-b border-warm-100/60 last:border-b-0 animate-pulse"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-28 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="h-5 w-10 bg-gray-100 rounded-full" />
                <div className="h-3 w-6 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-7"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-20 bg-gray-50 rounded-xl mt-5 w-full" />
            <div className="flex gap-2 mt-5">
              <div className="h-7 w-24 bg-gray-100 rounded-full" />
              <div className="h-7 w-20 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty states ──
  if (pending.length === 0 && declined.length === 0) {
    if (!hasCarePost) {
      return (
        <div className="py-12 text-center">
          <div
            className="w-14 h-14 rounded-full bg-warm-100/60 flex items-center justify-center text-2xl mx-auto mb-5"
            style={{ animation: "emptyFloat 3s ease-in-out infinite" }}
          >
            📝
          </div>
          <h3 className="text-base font-display font-bold text-gray-900">
            Share your care profile first
          </h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[320px] mx-auto">
            Once your care profile is live, providers in your area can see it and
            reach out to you.
          </p>
          <style jsx>{`
            @keyframes emptyFloat {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-6px);
              }
            }
          `}</style>
        </div>
      );
    }

    return (
      <div className="py-8">
        {/* Animated illustration */}
        <div className="relative w-full max-w-[320px] h-[180px] mx-auto mb-6">
          {/* Decorative background blobs */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-primary-100/40 to-primary-50/20 blur-xl"
            style={{ animation: "pulse 4s ease-in-out infinite" }}
          />

          {/* Central phone/notification illustration */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-28 rounded-2xl bg-white border-2 border-gray-200 shadow-lg"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            {/* Screen content */}
            <div className="absolute inset-2 rounded-xl bg-gradient-to-b from-primary-50 to-white overflow-hidden">
              {/* Notification bars */}
              <div className="mt-3 mx-2 space-y-2">
                <div className="h-2 w-full rounded bg-gray-200/80" />
                <div className="h-2 w-3/4 rounded bg-gray-200/60" />
              </div>
            </div>
            {/* Notification dot */}
            <div
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-sm"
              style={{ animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }}
            />
          </div>

          {/* Floating provider avatars */}
          <div
            className="absolute left-[15%] top-[20%] w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-md flex items-center justify-center text-white text-xs font-bold"
            style={{ animation: "floatLeft 4s ease-in-out infinite" }}
          >
            JM
          </div>
          <div
            className="absolute right-[15%] top-[30%] w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-md flex items-center justify-center text-white text-xs font-bold"
            style={{ animation: "floatRight 3.5s ease-in-out infinite 0.5s" }}
          >
            SK
          </div>
          <div
            className="absolute left-[25%] bottom-[15%] w-8 h-8 rounded-full bg-gradient-to-br from-warm-400 to-warm-500 shadow-md flex items-center justify-center text-white text-[10px] font-bold"
            style={{ animation: "floatLeft 3s ease-in-out infinite 1s" }}
          >
            AL
          </div>
          <div
            className="absolute right-[22%] bottom-[20%] w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 shadow-md flex items-center justify-center text-white text-xs font-bold"
            style={{ animation: "floatRight 4.5s ease-in-out infinite 0.3s" }}
          >
            TC
          </div>

          {/* Connection lines (dashed) */}
          <svg className="absolute inset-0 w-full h-full opacity-30" style={{ animation: "fadeInOut 3s ease-in-out infinite" }}>
            <line x1="25%" y1="35%" x2="45%" y2="45%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary-400" />
            <line x1="75%" y1="40%" x2="55%" y2="45%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary-400" />
          </svg>
        </div>

        {/* Text content */}
        <div className="text-center">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
            Providers are looking at your profile
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[340px] mx-auto mb-6">
            Care providers in your area are reviewing profiles like yours.
          </p>

          {/* What to expect cards */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-primary-50/80 to-white border border-primary-100/60">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Get notified</p>
                <p className="text-[11px] text-gray-500">We&apos;ll email you</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-warm-50/80 to-white border border-warm-100/60">
              <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-warm-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Usually 3–5 days</p>
                <p className="text-[11px] text-gray-500">For first response</p>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) translateY(0); }
            50% { transform: translate(-50%, -50%) translateY(-8px); }
          }
          @keyframes floatLeft {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(-5px) translateY(-10px); }
          }
          @keyframes floatRight {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(5px) translateY(-8px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.6; transform: translateX(-50%) scale(1.1); }
          }
          @keyframes ping {
            0% { transform: scale(1); opacity: 1; }
            75%, 100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  // ── Mobile card list ──
  if (variant === "mobile") {
    return (
      <div>
        {/* Error message */}
        {actionError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-100/60">
            <p className="text-[13px] text-rose-600 font-medium text-center">
              {actionError}
            </p>
          </div>
        )}

        {/* Pending cards */}
        {pending.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mb-5">
            {pending.map((item) => (
              <InterestedCardCompact
                key={item.id}
                item={item}
                familyLat={familyLat}
                familyLng={familyLng}
              />
            ))}
          </div>
        )}

        {/* If no pending but some declined */}
        {pending.length === 0 && declined.length > 0 && (
          <div className="py-10 text-center mb-4">
            <p className="text-[14px] text-gray-500 leading-relaxed">
              No pending providers. Check declined providers below if
              you&apos;d like to reconsider.
            </p>
          </div>
        )}

        {/* Declined collapsible section */}
        {declined.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setDeclinedExpanded(!declinedExpanded)}
              className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-3"
            >
              <svg
                className={[
                  "w-4 h-4 transition-transform duration-200",
                  declinedExpanded ? "rotate-90" : "",
                ].join(" ")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Declined ({declined.length})
            </button>

            {declinedExpanded && (
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden opacity-55">
                {declined.map((item) => (
                  <InterestedCardCompact
                    key={item.id}
                    item={item}
                    familyLat={familyLat}
                    familyLng={familyLng}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Desktop card list ──
  return (
    <div>
      {/* Error message */}
      {actionError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50/80 border border-rose-100/60">
          <p className="text-[13px] text-rose-600 font-medium text-center">
            {actionError}
          </p>
        </div>
      )}

      {/* Pending cards */}
      {pending.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {pending.map((item) => {
            const profile = item.providerProfile;
            const meta = profile?.metadata as (OrganizationMetadata & CaregiverMetadata & Record<string, unknown>) | null;
            const matchReasons = ((item.metadata as Record<string, unknown>)?.match_reasons as string[]) || [];
            return (
              <MatchProviderCard
                key={item.id}
                provider={{
                  id: profile?.id || item.from_profile_id,
                  name: profile?.display_name || "Provider",
                  slug: profile?.slug || undefined,
                  image: profile?.image_url,
                  category: profile?.category || profile?.care_types?.[0] || "Care Provider",
                  city: profile?.city,
                  state: profile?.state,
                  rating: (meta?.google_rating as number) || null,
                  priceRange: getPriceRange(profile),
                }}
                interestedMessage={item.message || (item.metadata as Record<string, unknown>)?.reach_out_note as string}
                interestedAt={item.created_at}
                connectionId={item.id}
                matchReasons={matchReasons}
                onMessage={handleMessage}
                onDecline={handleDecline}
              />
            );
          })}
        </div>
      )}

      {/* If no pending but some declined */}
      {pending.length === 0 && declined.length > 0 && (
        <div className="py-8 text-center mb-4">
          <p className="text-sm text-gray-500">
            No pending providers. Check declined providers below if
            you&apos;d like to reconsider.
          </p>
        </div>
      )}

      {/* Declined collapsible section */}
      {declined.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setDeclinedExpanded(!declinedExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <svg
              className={[
                "w-4 h-4 transition-transform duration-200",
                declinedExpanded ? "rotate-90" : "",
              ].join(" ")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Declined ({declined.length})
          </button>

          {declinedExpanded && (
            <div className="space-y-3">
              {declined.map((item) => {
                const profile = item.providerProfile;
                return (
                  <DeclinedProviderRow
                    key={item.id}
                    name={profile?.display_name || "Provider"}
                    image={profile?.image_url}
                    location={[profile?.city, profile?.state].filter(Boolean).join(", ")}
                    onReconsider={() => handleReconsider(item.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Declined provider row ──
function DeclinedProviderRow({
  name,
  image,
  location,
  onReconsider,
}: {
  name: string;
  image?: string | null;
  location?: string;
  onReconsider: () => void;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200/80 opacity-60 hover:opacity-80 transition-opacity">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-10 h-10 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0 text-xs font-bold text-warm-500">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-600 truncate">{name}</p>
        {location && (
          <p className="text-xs text-gray-400 truncate">{location}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onReconsider}
        className="text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
      >
        Reconsider
      </button>
    </div>
  );
}
