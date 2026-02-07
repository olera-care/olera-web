"use client";

import Link from "next/link";
// Re-export adapter and types from the shared (server-compatible) module
// so existing client-side imports continue to work.
export { profileToCard, formatCategory } from "@/lib/profile-card";
export type { CardProfile } from "@/lib/profile-card";
import type { CardProfile } from "@/lib/profile-card";

// ============================================================
// Type-based avatar colors
// ============================================================

const TYPE_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  organization: { bg: "bg-primary-100", text: "text-primary-600", gradient: "from-primary-50 to-primary-200" },
  caregiver: { bg: "bg-secondary-100", text: "text-secondary-600", gradient: "from-secondary-50 to-secondary-200" },
  family: { bg: "bg-warm-100", text: "text-warm-600", gradient: "from-warm-50 to-warm-200" },
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
          <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
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
