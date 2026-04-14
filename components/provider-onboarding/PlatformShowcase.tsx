import Image from "next/image";
import type { Provider } from "@/lib/types/provider";
import { getPrimaryImage } from "@/lib/types/provider";

// ============================================================
// Platform Showcase — Replaces profile card grid on onboard page
// Shows what providers can DO on Olera, not what they need to fill out
// These cards are purely informational — no navigation
// ============================================================

interface PlatformShowcaseProps {
  provider: Provider;
  completenessPercent: number;
  /** Called when user clicks the reviews card - triggers claim flow */
  onReviewsClick?: () => void;
  /** Called when user clicks the hire staff card - triggers claim flow */
  onHireStaffClick?: () => void;
}

// ── Individual Value Card (static, non-interactive) ──

function ValueCard({
  headline,
  subtext,
  badge,
  icon,
  delay = 0,
  onClick,
}: {
  headline: string;
  subtext: string;
  badge?: string;
  icon: React.ReactNode;
  delay?: number;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-display font-semibold text-gray-900">
            {headline}
          </h3>
          {badge && (
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{subtext}</p>
      </div>

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-100 p-6 text-left w-full hover:shadow-md hover:border-gray-200 transition-all duration-200"
        style={{
          animation: "card-enter 0.3s ease-out both",
          animationDelay: `${delay}ms`,
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6"
      style={{
        animation: "card-enter 0.3s ease-out both",
        animationDelay: `${delay}ms`,
      }}
    >
      {content}
    </div>
  );
}

// ── Listing Card (opens public profile in new tab) ──

function ListingCard({
  provider,
  completenessPercent,
  delay = 0,
}: {
  provider: Provider;
  completenessPercent: number;
  delay?: number;
}) {
  const primaryImage = getPrimaryImage(provider);
  const profileUrl = `/provider/${provider.slug || provider.provider_id}`;

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200"
      style={{
        animation: "card-enter 0.3s ease-out both",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Provider image or initials */}
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={provider.provider_name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 border border-primary-100/60">
            <span className="text-lg font-display font-bold text-primary-700">
              {provider.provider_name
                .split(/\s+/)
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-display font-semibold text-gray-900 truncate">
            {provider.provider_name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {[provider.provider_category, provider.city ? `${provider.city}, ${provider.state}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Completeness + external link indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-gray-400">{completenessPercent}%</span>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  );
}

// ── Icons ──

function ReviewsIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

// ── Main Component ──

export default function PlatformShowcase({
  provider,
  completenessPercent,
  onReviewsClick,
  onHireStaffClick,
}: PlatformShowcaseProps) {
  return (
    <div className="space-y-4 mt-2">
      {/* Section label — subtle, not competing */}
      <p
        className="text-xs font-medium text-gray-300 tracking-widest uppercase"
        style={{ animation: "card-enter 0.3s ease-out both", animationDelay: "100ms" }}
      >
        What you can do
      </p>

      {/* Value cards — 2-column, balanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ValueCard
          headline="Get more reviews"
          subtext="Request reviews from clients"
          icon={<ReviewsIcon />}
          delay={150}
          onClick={onReviewsClick}
        />

        <ValueCard
          headline="Hire staff"
          subtext="Browse pre-screened healthcare students"
          badge="New"
          icon={<StaffIcon />}
          delay={210}
          onClick={onHireStaffClick}
        />
      </div>

      {/* Listing card — full width below grid */}
      <ListingCard
        provider={provider}
        completenessPercent={completenessPercent}
        delay={390}
      />
    </div>
  );
}
