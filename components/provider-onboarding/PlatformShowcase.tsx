"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Provider } from "@/lib/types/provider";
import { getPrimaryImage } from "@/lib/types/provider";

// ============================================================
// Platform Showcase — Replaces profile card grid on onboard page
// Shows what providers can DO on Olera, not what they need to fill out
// ============================================================

interface PlatformShowcaseProps {
  provider: Provider;
  completenessPercent: number;
  /** Whether the user is authenticated — gates card navigation */
  isSignedIn: boolean;
  /** Called when an unauthenticated user clicks a card */
  onUnauthenticatedClick?: () => void;
}

// ── Individual Value Card ──

function ValueCard({
  href,
  headline,
  subtext,
  badge,
  icon,
  delay = 0,
  isSignedIn,
  onUnauthenticatedClick,
}: {
  href: string;
  headline: string;
  subtext: string;
  badge?: string;
  icon: React.ReactNode;
  delay?: number;
  isSignedIn: boolean;
  onUnauthenticatedClick?: () => void;
}) {
  const router = useRouter();

  // Single <div> for all states — avoids DOM swap + animation re-trigger when isSignedIn changes
  const handleClick = () => {
    if (isSignedIn) {
      router.push(href);
    } else {
      onUnauthenticatedClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
      className="group block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
      style={{
        animation: "card-enter 0.3s ease-out both",
        animationDelay: `${delay}ms`,
      }}
    >
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
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
      </div>

      {/* Subtle arrow — no text, just the chevron */}
      <div className="mt-4 flex items-center text-gray-300 group-hover:text-gray-500 transition-colors">
        <svg
          className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </div>
  );
}

// ── Listing Card (compact profile preview) ──

function ListingCard({
  provider,
  completenessPercent,
  delay = 0,
  isSignedIn,
  onUnauthenticatedClick,
}: {
  provider: Provider;
  completenessPercent: number;
  delay?: number;
  isSignedIn: boolean;
  onUnauthenticatedClick?: () => void;
}) {
  const router = useRouter();
  const primaryImage = getPrimaryImage(provider);

  const handleClick = () => {
    if (isSignedIn) {
      router.push("/provider");
    } else {
      onUnauthenticatedClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
      className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
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

        {/* Completeness + arrow */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-400">{completenessPercent}% complete</span>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transform group-hover:translate-x-0.5 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Icons ──

function FamiliesIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
  isSignedIn,
  onUnauthenticatedClick,
}: PlatformShowcaseProps) {
  const city = provider.city || "your area";

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
          href="/provider/matches"
          headline="Families in your area"
          subtext={`Families nearby in ${city} are looking for care`}
          icon={<FamiliesIcon />}
          delay={150}
          isSignedIn={isSignedIn}
          onUnauthenticatedClick={onUnauthenticatedClick}
        />

        <ValueCard
          href="/provider/medjobs/candidates"
          headline="Hire staff"
          subtext="Browse pre-screened healthcare students"
          badge="New"
          icon={<StaffIcon />}
          delay={210}
          isSignedIn={isSignedIn}
          onUnauthenticatedClick={onUnauthenticatedClick}
        />
      </div>

      {/* Listing card — full width below grid */}
      <ListingCard
        provider={provider}
        completenessPercent={completenessPercent}
        delay={390}
        isSignedIn={isSignedIn}
        onUnauthenticatedClick={onUnauthenticatedClick}
      />
    </div>
  );
}
