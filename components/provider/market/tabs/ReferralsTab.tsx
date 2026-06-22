"use client";

import { useEffect, useMemo, useState } from "react";
import type { BdTarget } from "../MarketDiagnostic";
import { getReferralGuidance } from "@/lib/market-diagnostic/referral-guidance";

const CAT_LABEL: Record<string, string> = {
  hospital: "Hospital",
  skilled_nursing: "Skilled nursing",
  hospice: "Hospice",
  assisted_living: "Assisted living",
  home_health: "Home health",
  elder_law: "Elder law",
  senior_resource: "Senior center",
  financial: "Financial advisor",
  faith: "Faith community",
};

// Tracking statuses (same as ReferralTargets.tsx)
type OutreachStatus = "to_contact" | "contacted" | "responded" | "referring" | "dismissed";

interface ReferralsTabProps {
  targets: BdTarget[];
  providerName?: string;
  city?: string;
  /** Called when outreach status is updated, so parent can sync other components */
  onStatusUpdate?: () => void;
}

export default function ReferralsTab({
  targets,
  providerName,
  city,
  onStatusUpdate,
}: ReferralsTabProps) {
  const [outreachStatus, setOutreachStatus] = useState<Record<string, OutreachStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showTracking, setShowTracking] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current outreach status
  useEffect(() => {
    let cancelled = false;
    fetch("/api/provider/market-outreach")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.outreach) {
          setIsLoading(false);
          return;
        }
        const next: Record<string, OutreachStatus> = {};
        for (const [id, v] of Object.entries(j.outreach as Record<string, { status: string }>)) {
          next[id] = v.status as OutreachStatus;
        }
        setOutreachStatus(next);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Find the current target (first one not "referring" or "dismissed")
  const currentTarget = useMemo(() => {
    for (const t of targets) {
      const status = outreachStatus[t.id] || "to_contact";
      if (status !== "referring" && status !== "dismissed") {
        return t;
      }
    }
    return null;
  }, [targets, outreachStatus]);

  // Progress stats
  const stats = useMemo(() => {
    let worked = 0;
    let referring = 0;
    let total = 0;
    for (const t of targets) {
      const s = outreachStatus[t.id] || "to_contact";
      if (s === "dismissed") continue;
      total++;
      if (s === "contacted" || s === "responded" || s === "referring") worked++;
      if (s === "referring") referring++;
    }
    return { worked, referring, total };
  }, [targets, outreachStatus]);

  // Update status
  const updateStatus = async (status: OutreachStatus) => {
    if (!currentTarget || saving) return;

    setSaving(true);

    // Optimistic update
    setOutreachStatus((prev) => ({ ...prev, [currentTarget.id]: status }));
    setShowTracking(false);

    try {
      const res = await fetch("/api/provider/market-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: currentTarget.id,
          targetName: currentTarget.name,
          status,
        }),
      });
      // Revert if server rejected the update
      if (!res.ok) {
        setOutreachStatus((prev) => ({ ...prev, [currentTarget.id]: "to_contact" }));
      } else {
        // Notify parent so other components can sync
        onStatusUpdate?.();
      }
    } catch {
      // Revert on network error
      setOutreachStatus((prev) => ({ ...prev, [currentTarget.id]: "to_contact" }));
    } finally {
      setSaving(false);
    }
  };

  // Handle call button click
  const handleCallClick = () => {
    setShowTracking(true);
  };

  const guidance = currentTarget ? getReferralGuidance(currentTarget.cat, providerName, city) : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#199087] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // No targets available - distinguish between "worked all" vs "none exist"
  if (!currentTarget) {
    const hasNoTargets = targets.length === 0;
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-8 text-center">
        <div className={`w-12 h-12 rounded-full ${hasNoTargets ? "bg-stone-100" : "bg-emerald-100"} flex items-center justify-center mx-auto mb-4`}>
          {hasNoTargets ? (
            <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </div>
        <p className="text-lg font-display font-semibold text-stone-900 mb-2">
          {hasNoTargets
            ? "No referral sources identified yet"
            : "You've worked all your referral sources"}
        </p>
        <p className="text-sm text-stone-500">
          {hasNoTargets
            ? "We're mapping referral sources in your area. Check back soon."
            : stats.referring > 0
              ? `${stats.referring} ${stats.referring === 1 ? "is" : "are"} now referring you. Nice work.`
              : "You've covered your local sources. Focus on the ones that responded."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8">
      {/* Label */}
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider text-center mb-3">
        Your move this week
      </p>

      {/* Headline */}
      <h2 className="text-[26px] sm:text-[30px] font-bold text-stone-900 tracking-tight leading-tight text-center mb-2">
        Get on {currentTarget.name}.
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-stone-500 text-center mb-6">
        {currentTarget.cat === "hospital"
          ? "Hospitals send patients home every week. One call gets you on their referral list."
          : currentTarget.cat === "skilled_nursing"
          ? "Rehab patients go home needing care. Be the agency they call."
          : currentTarget.cat === "hospice"
          ? "Hospice families need extra support. Be their trusted partner."
          : currentTarget.cat === "assisted_living"
          ? "Some residents need more care. Be their recommended provider."
          : "One call can open a steady stream of referrals."}
      </p>

      {/* Provider card with integrated guidance */}
      <div className="bg-stone-50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#199087]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#199087]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-900 truncate">{currentTarget.name}</p>
            <p className="text-sm text-stone-500">
              {CAT_LABEL[currentTarget.cat] || currentTarget.cat}
              {currentTarget.distanceMiles !== null && ` · ${currentTarget.distanceMiles} mi`}
            </p>
          </div>
        </div>

        {/* Guidance integrated into card */}
        {guidance && (
          <div className="mt-4">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Ask for
            </p>
            <p className="text-sm font-medium text-stone-900 mb-3">
              {guidance.askFor}
            </p>

            <button
              type="button"
              onClick={() => setShowScript(!showScript)}
              className="text-sm text-[#199087] hover:text-[#147a72] transition-colors flex items-center gap-1"
            >
              {showScript ? "Hide script" : "We wrote your script"}
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showScript ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showScript && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-stone-200/50">
                <p className="text-sm text-stone-700 leading-relaxed italic">
                  &ldquo;{guidance.opener}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call button + Tracking options */}
      {currentTarget.phone ? (
        <div className="space-y-4">
          {/* Call button - always visible */}
          <a
            href={`tel:${currentTarget.phone}`}
            onClick={handleCallClick}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium py-3.5 rounded-xl transition-colors"
          >
            Call {currentTarget.phone}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>

          {/* Tracking options - shown after first call click */}
          {showTracking && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-700 text-center">
                How did the call go?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus("contacted")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Left a message
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("responded")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Spoke with them
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("referring")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  They&apos;ll refer me
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("dismissed")}
                  disabled={saving}
                  className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Not a fit
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* No phone number - provide lookup */}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(currentTarget.name + " " + (city || ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium py-3.5 rounded-xl transition-colors"
          >
            Look up contact info
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          {/* Tracking options for no-phone targets */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-700 text-center">
              Already reached out?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStatus("contacted")}
                disabled={saving}
                className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Left a message
              </button>
              <button
                type="button"
                onClick={() => updateStatus("responded")}
                disabled={saving}
                className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Spoke with them
              </button>
              <button
                type="button"
                onClick={() => updateStatus("referring")}
                disabled={saving}
                className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                They&apos;ll refer me
              </button>
              <button
                type="button"
                onClick={() => updateStatus("dismissed")}
                disabled={saving}
                className="py-3 px-4 rounded-xl border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Not a fit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress footer - no border line */}
      <div className="mt-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full bg-[#199087] rounded-full transition-all duration-500"
              style={{ width: `${stats.total ? (stats.worked / stats.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 shrink-0">
            {stats.worked === 0
              ? `${stats.total} sources to work`
              : `${stats.worked} of ${stats.total} worked`}
            {stats.referring > 0 && ` · ${stats.referring} referring`}
          </p>
        </div>
      </div>
    </div>
  );
}
