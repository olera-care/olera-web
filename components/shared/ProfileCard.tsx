"use client";

import Link from "next/link";
import type {
  Profile,
  OrganizationMetadata,
  CaregiverMetadata,
  FamilyMetadata,
} from "@/lib/types";

// ============================================================
// Normalized card data — the common shape for all profile types
// ============================================================

export interface CardProfile {
  id: string;
  slug: string;
  type: Profile["type"];
  name: string;
  location: string | null;
  imageUrl: string | null;
  verified: boolean;
  careTypes: string[];
  /** Primary label shown above the name (e.g., "Assisted Living", "Private Caregiver") */
  category: string | null;
  /** Price or rate string (e.g., "$4,500/mo", "$25-35/hr") */
  priceLabel: string | null;
  /** Type-specific detail chips shown below care types */
  details: { label: string; value: string }[];
  /** Link target (e.g., "/provider/slug" or null for non-linkable cards) */
  href: string | null;
}

// ============================================================
// Adapter: Supabase Profile → CardProfile
// ============================================================

export function profileToCard(profile: Profile): CardProfile {
  const location = [profile.city, profile.state].filter(Boolean).join(", ") || null;
  const meta = profile.metadata;

  let category: string | null = null;
  let priceLabel: string | null = null;
  const details: { label: string; value: string }[] = [];

  if (profile.type === "organization") {
    const m = meta as OrganizationMetadata;
    category = formatCategory(profile.category);
    priceLabel = m?.price_range || null;
    if (m?.staff_count) details.push({ label: "Staff", value: `${m.staff_count} members` });
    if (m?.year_founded) details.push({ label: "Est.", value: String(m.year_founded) });
    if (m?.bed_count) details.push({ label: "Capacity", value: `${m.bed_count} beds` });
  } else if (profile.type === "caregiver") {
    const m = meta as CaregiverMetadata;
    category = "Private Caregiver";
    if (m?.hourly_rate_min && m?.hourly_rate_max) {
      priceLabel = `$${m.hourly_rate_min}–$${m.hourly_rate_max}/hr`;
    } else if (m?.hourly_rate_min) {
      priceLabel = `From $${m.hourly_rate_min}/hr`;
    }
    if (m?.years_experience) details.push({ label: "Experience", value: `${m.years_experience} yrs` });
    if (m?.certifications?.length) {
      details.push({ label: "Certs", value: m.certifications.slice(0, 2).join(", ") });
    }
    if (m?.availability) details.push({ label: "Availability", value: m.availability });
  } else if (profile.type === "family") {
    const m = meta as FamilyMetadata;
    category = "Family";
    if (m?.timeline) {
      const labels: Record<string, string> = {
        immediate: "Immediate",
        within_1_month: "Within 1 month",
        within_3_months: "Within 3 months",
        exploring: "Exploring options",
      };
      details.push({ label: "Timeline", value: labels[m.timeline] || m.timeline });
    }
    if (m?.budget_min || m?.budget_max) {
      const parts = [];
      if (m.budget_min) parts.push(`$${m.budget_min.toLocaleString()}`);
      if (m.budget_max) parts.push(`$${m.budget_max.toLocaleString()}`);
      priceLabel = parts.join("–") + "/mo";
    }
    if (m?.relationship_to_recipient) {
      details.push({ label: "Relationship", value: m.relationship_to_recipient });
    }
  }

  // Provider profiles link to their public page; families don't have public pages
  const href = profile.type !== "family" && profile.slug
    ? `/provider/${profile.slug}`
    : null;

  return {
    id: profile.id,
    slug: profile.slug,
    type: profile.type,
    name: profile.display_name,
    location,
    imageUrl: profile.image_url,
    verified: profile.claim_state === "claimed" && profile.verification_state === "verified",
    careTypes: profile.care_types || [],
    category,
    priceLabel,
    details,
    href,
  };
}

// ============================================================
// Category display names
// ============================================================

function formatCategory(category: string | null): string | null {
  if (!category) return null;
  const map: Record<string, string> = {
    assisted_living: "Assisted Living",
    independent_living: "Independent Living",
    memory_care: "Memory Care",
    nursing_home: "Skilled Nursing",
    home_care_agency: "Home Care",
    home_health_agency: "Home Health",
    hospice_agency: "Hospice",
    inpatient_hospice: "Inpatient Hospice",
    rehab_facility: "Rehabilitation",
    adult_day_care: "Adult Day Care",
    wellness_center: "Wellness Center",
    private_caregiver: "Private Caregiver",
  };
  return map[category] || category;
}

// ============================================================
// Type-based avatar colors
// ============================================================

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  organization: { bg: "bg-primary-100", text: "text-primary-600" },
  caregiver: { bg: "bg-secondary-100", text: "text-secondary-600" },
  family: { bg: "bg-warm-100", text: "text-warm-600" },
};

// ============================================================
// ProfileCard component
// ============================================================

interface ProfileCardProps {
  card: CardProfile;
  /** "standard" for browse/discovery grids, "compact" for sidebar similar providers */
  variant?: "standard" | "compact";
  /** When true, blurs name and location (paywall) */
  blurred?: boolean;
  /** Optional slot for action buttons (ConnectButton, etc.) */
  actions?: React.ReactNode;
}

export default function ProfileCard({
  card,
  variant = "standard",
  blurred = false,
  actions,
}: ProfileCardProps) {
  const colors = TYPE_COLORS[card.type] || TYPE_COLORS.organization;
  const displayedCareTypes = card.careTypes.slice(0, 2);
  const remainingCount = Math.max(0, card.careTypes.length - 2);

  const nameDisplay = blurred
    ? card.name.charAt(0) + "•••••"
    : card.name;
  const locationDisplay = blurred
    ? "••••, ••"
    : card.location;

  if (variant === "compact") {
    const inner = (
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image or avatar */}
        <div className="relative h-36 bg-gray-100">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${colors.bg} flex items-center justify-center`}>
              <span className={`text-3xl font-bold ${colors.text} opacity-60`}>
                {card.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          {card.category && (
            <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">
              {card.category}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {nameDisplay}
          </h3>
          {locationDisplay && (
            <p className="text-xs text-gray-500 truncate">{locationDisplay}</p>
          )}
        </div>
      </div>
    );

    if (card.href) {
      return <Link href={card.href}>{inner}</Link>;
    }
    return inner;
  }

  // Standard variant
  const cardContent = (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200 flex flex-col h-full">
      {/* Image or avatar */}
      <div className="relative h-48 bg-gray-200">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-${card.type === "organization" ? "primary" : card.type === "caregiver" ? "secondary" : "warm"}-50 to-${card.type === "organization" ? "primary" : card.type === "caregiver" ? "secondary" : "warm"}-200 flex items-center justify-center`}>
            <span className={`text-4xl font-bold ${colors.text} opacity-40`}>
              {card.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Verified badge */}
        {card.verified && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary-600 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {card.category && (
          <p className="text-primary-600 text-xs font-semibold uppercase tracking-wider mb-1">
            {card.category}
          </p>
        )}

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
          {nameDisplay}
        </h3>

        {/* Location */}
        {locationDisplay && (
          <p className="text-gray-500 text-sm mt-1">{locationDisplay}</p>
        )}

        {/* Price */}
        {card.priceLabel && (
          <div className="mt-2">
            <p className="text-gray-900 font-semibold text-sm">{card.priceLabel}</p>
          </div>
        )}

        {/* Detail chips */}
        {card.details.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {card.details.map((d) => (
              <span key={d.label} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{d.label}:</span> {d.value}
              </span>
            ))}
          </div>
        )}

        {/* Care types */}
        {displayedCareTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {displayedCareTypes.map((ct) => (
              <span
                key={ct}
                className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full"
              >
                {ct}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                +{remainingCount} more
              </span>
            )}
          </div>
        )}

        {/* Spacer + link text for linkable cards without explicit actions */}
        {!actions && card.href && (
          <div className="mt-auto pt-3">
            <span className="text-primary-600 font-medium text-sm">
              View profile →
            </span>
          </div>
        )}

        {/* Actions slot */}
        {actions && (
          <div className="mt-auto pt-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in link only if no actions (clicking actions inside a link causes issues)
  if (card.href && !actions) {
    return (
      <Link href={card.href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
