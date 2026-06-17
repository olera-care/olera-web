"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * FamilyCard — the student board's card, the mirror of CandidateCard in the
 * student's direction. Students browse "families hiring near you," so the card
 * leads with the care opportunity (the need a family has) and names the agency
 * quietly as "through {agency}" — honest about the employer-of-record while
 * speaking the student's mental model. Same 3-col grid visual as the provider
 * board for a consistent two-sided design.
 */

export interface FamilyData {
  id: string;
  slug: string;
  display_name: string;
  city: string | null;
  state: string | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  care_types: string[];
}

function formatCategory(category: string | null): string {
  if (!category) return "";
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CARE_OPPORTUNITY_LABELS: Record<string, string> = {
  home_care: "In-home senior care",
  in_home_care: "In-home senior care",
  non_medical_home_care: "In-home senior care",
  home_health: "Home health care",
  assisted_living: "Assisted living care",
  memory_care: "Memory care",
  nursing_home: "Skilled nursing care",
  skilled_nursing: "Skilled nursing care",
  hospice: "Hospice & end-of-life care",
  adult_day_care: "Adult day care",
  adult_day: "Adult day care",
  independent_living: "Senior living support",
  senior_living: "Senior living support",
  residential_care: "Residential senior care",
};

function careOpportunityLabel(category: string | null, careTypes: string[]): string {
  if (category && CARE_OPPORTUNITY_LABELS[category]) return CARE_OPPORTUNITY_LABELS[category];
  if (category) return formatCategory(category);
  if (careTypes.length > 0) return careTypes[0];
  return "Senior care";
}

const AVATAR_COLORS = [
  "bg-slate-100 text-slate-600",
  "bg-stone-100 text-stone-600",
  "bg-zinc-100 text-zinc-600",
  "bg-neutral-100 text-neutral-600",
  "bg-gray-100 text-gray-600",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface FamilyCardProps {
  family: FamilyData;
  isRequested?: boolean;
  canRequest?: boolean;
  onRequestInterview?: () => void;
  /** Renders the "Demo" treatment — sample listings shown when a campus has no
   *  real partners hiring yet. Suppresses the request action + location line. */
  isDemo?: boolean;
}

export default function FamilyCard({
  family,
  isRequested = false,
  canRequest = false,
  onRequestInterview,
  isDemo = false,
}: FamilyCardProps) {
  const careTypes = family.care_types || [];
  const opportunityLabel = careOpportunityLabel(family.category, careTypes);
  const location = [family.city, family.state].filter(Boolean).join(", ");
  const profileUrl = `/provider/${family.slug}`;

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isDemo
          ? "border-dashed border-slate-200 hover:border-slate-300"
          : "border-gray-200/80 hover:border-gray-300"
      }`}
    >
      {isDemo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-700 rounded-full">
            Demo
          </span>
        </div>
      )}

      <div className="flex flex-col p-6 flex-1">
        {/* Icon + opportunity row */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm shrink-0">
            {family.image_url ? (
              <Image src={family.image_url} alt={opportunityLabel} fill className="object-cover" sizes="56px" />
            ) : (
              <div className={`w-full h-full ${getAvatarColor(family.id)} flex items-center justify-center`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {/* Care opportunity — lead with the need, not the agency */}
            <h3 className="text-lg font-semibold text-gray-900 leading-tight truncate">
              {opportunityLabel}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {isDemo ? "Hiring near you" : location || "Near you"}
            </p>
          </div>
        </div>

        {/* The agency placing you, named honestly */}
        <p className="text-sm text-gray-500 mb-3 truncate">through {family.display_name}</p>

        {/* Care-type chips */}
        {careTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {careTypes.slice(0, 3).map((ct) => (
              <span key={ct} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {ct}
              </span>
            ))}
            {careTypes.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                +{careTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom action row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {isDemo ? (
            <span className="text-sm text-gray-400">Sample opportunity</span>
          ) : (
            <>
              <Link
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                View profile →
              </Link>
              {isRequested ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Requested
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onRequestInterview}
                  disabled={!canRequest}
                  className="px-4 py-2 text-sm font-semibold text-primary-600 rounded-lg ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Request interview
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
