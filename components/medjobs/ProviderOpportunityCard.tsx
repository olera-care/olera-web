"use client";

import { useMemo, useState } from "react";
import IdealCaregiverModal from "@/components/medjobs/IdealCaregiverModal";
import {
  readOpportunityProfile,
  opportunityCompleteness,
  type OpportunityProfile,
} from "@/lib/medjobs/opportunity";
import { DEMAND_PROFILE_KEY } from "@/lib/medjobs/eligibility";

/**
 * ProviderOpportunityCard — the unified provider profile header.
 *
 * Profile and opportunity are ONE thing: "About you" (directory data) plus
 * "Your ideal caregiver" (the optional enrichment fields). There is no
 * "go live" gate — the provider is always live from their eligibility answers;
 * a completeness bar simply nudges enrichment for better matches.
 */
export default function ProviderOpportunityCard({
  displayName,
  metadata,
  profileId,
}: {
  displayName: string;
  metadata: Record<string, unknown> | null | undefined;
  profileId?: string;
}) {
  const [editing, setEditing] = useState(false);
  // Local copy so the bar + summary update immediately after a save, without a
  // full auth-context refresh.
  const [profile, setProfile] = useState<OpportunityProfile>(() => readOpportunityProfile(metadata));

  const coverage = useMemo(() => {
    const demand = metadata?.[DEMAND_PROFILE_KEY] as { coverage_buckets?: string[] } | undefined;
    return demand?.coverage_buckets ?? [];
  }, [metadata]);

  const pct = opportunityCompleteness(profile, coverage);
  const tags = [
    ...(profile.certifications ?? []),
    ...(profile.skills ?? []),
    ...(profile.hours_per_week ? [profile.hours_per_week.replace("_", "–").replace("plus", "+") + " hrs/wk"] : []),
    ...(profile.pay_min && profile.pay_max ? [`$${profile.pay_min}–$${profile.pay_max}/hr`] : []),
  ];

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{displayName}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live now — students near you can see this
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
        >
          {tags.length ? "Edit" : "Add details"}
        </button>
      </div>

      {/* Completeness bar — nudge, never a gate. */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Profile completeness</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 && (
          <p className="mt-2 text-xs text-gray-500">
            Add a certification or hours to improve your matches.
          </p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Your ideal caregiver</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700">{t}</span>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <IdealCaregiverModal
          initial={profile}
          profileId={profileId}
          onClose={() => setEditing(false)}
          onSaved={async (saved) => {
            // Reflect the just-saved values locally (server merged them too).
            setProfile((p) => ({ ...p, ...saved }));
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
