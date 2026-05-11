"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";

export interface CompareProvider {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  services?: string[];
  specialty?: string | null;
  availability?: string | null;
}

interface CompareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: CompareProvider;
  similarProviders: CompareProvider[];
  onSaveComparison?: () => void;
}

/**
 * Mobile comparison bottom sheet with horizontal swipeable cards.
 * Shows current provider + 2 similar providers side by side.
 */
export default function CompareBottomSheet({
  isOpen,
  onClose,
  currentProvider,
  similarProviders,
  onSaveComparison,
}: CompareBottomSheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // All providers: current first, then similar
  const allProviders = [currentProvider, ...similarProviders.slice(0, 2)];
  const totalProviders = allProviders.length;

  // Extract first name
  const firstName = (() => {
    const cleanName = currentProvider.name?.replace(/^\([^)]+\)\s*/, "") || "";
    return cleanName.split(/\s/)[0] || currentProvider.name?.split(/\s/)[0] || "Provider";
  })();

  // Location string
  const locationStr = [currentProvider.city, currentProvider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [currentProvider.category, locationStr].filter(Boolean).join(" · ");

  // Calculate badges for providers (highest rated, best price, most services)
  const badges = calculateBadges(allProviders);

  // Handle scroll to update current index
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    // Card width is 85vw + gap (12px)
    const cardWidth = window.innerWidth * 0.85 + 12;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(newIndex, totalProviders - 1));
  };

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    // Card width is 85vw + gap (12px)
    const cardWidth = window.innerWidth * 0.85 + 12;
    scrollRef.current.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  // Reset scroll position when sheet opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "instant" });
      setCurrentIndex(0);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="fullscreen">
      <div className="flex flex-col h-full -mx-5 -mt-2">
        {/* Header */}
        <div className="px-5 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {firstName} next to {similarProviders.length} nearby home{similarProviders.length !== 1 ? "s" : ""}
          </h2>
          {categoryLocationStr && (
            <p className="text-sm text-gray-500 mt-1">{categoryLocationStr}</p>
          )}
        </div>

        {/* Swipe indicator */}
        <div className="px-5 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Provider <span className="text-gray-900">{currentIndex + 1}</span> of {totalProviders} · Swipe to see more
          </p>
        </div>

        {/* Horizontal scrolling cards */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-3 px-5 pb-4">
            {allProviders.map((provider, index) => (
              <CompareCard
                key={provider.id}
                provider={provider}
                isCurrentProvider={index === 0}
                badge={badges[provider.id]}
              />
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 py-3">
          {allProviders.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-gray-900" : "bg-gray-300"
              }`}
              aria-label={`Go to provider ${index + 1}`}
            />
          ))}
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-4 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onSaveComparison}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#4a7c72] hover:bg-[#3d6860] text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            Save this comparison
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            Message any of them when you&apos;re ready
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface CompareCardProps {
  provider: CompareProvider;
  isCurrentProvider: boolean;
  badge?: string | null;
}

function CompareCard({ provider, isCurrentProvider, badge }: CompareCardProps) {
  const locationStr = [provider.city, provider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [provider.category, locationStr].filter(Boolean).join(" · ");

  // Format services for display (truncate if too many)
  const servicesDisplay = provider.services?.slice(0, 3).join(", ") || "—";

  return (
    <div
      className={`flex-shrink-0 w-[85vw] snap-center rounded-2xl border-2 p-4 bg-white ${
        isCurrentProvider ? "border-[#4a7c72]" : "border-gray-200"
      }`}
    >
      {/* Provider header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        {provider.image ? (
          <Image
            src={provider.image}
            alt={provider.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-lg object-cover bg-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-lg font-semibold text-amber-700">
              {provider.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Name and location */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
            {provider.name}
          </h3>
          {categoryLocationStr && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{categoryLocationStr}</p>
          )}
        </div>
      </div>

      {/* Rating row with badge */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-amber-50/50 rounded-lg">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-lg font-bold text-gray-900">
            {provider.rating?.toFixed(1) || "—"}
          </span>
          <span className="text-sm text-gray-500">
            · {provider.reviewCount || 0} review{provider.reviewCount !== 1 ? "s" : ""}
          </span>
        </div>
        {badge && (
          <span className="ml-auto text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </span>
        )}
      </div>

      {/* Comparison rows */}
      <div className="space-y-0 divide-y divide-gray-100">
        <CompareRow label="EST. MONTHLY" value={provider.priceRange || "—"} />
        <CompareRow label="SERVICES" value={servicesDisplay} />
        <CompareRow label="SPECIALTY" value={provider.specialty || "—"} />
        <CompareRow label="AVAILABILITY" value={provider.availability || "—"} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare Row Component
// ─────────────────────────────────────────────────────────────────────────────

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
        {label}
      </span>
      <span className="text-[15px] text-gray-900 text-right ml-4">
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge Calculation
// ─────────────────────────────────────────────────────────────────────────────

function calculateBadges(providers: CompareProvider[]): Record<string, string | null> {
  const badges: Record<string, string | null> = {};

  // Initialize all as null
  providers.forEach(p => { badges[p.id] = null; });

  if (providers.length < 2) return badges;

  // Find highest rated
  const withRatings = providers.filter(p => p.rating != null);
  if (withRatings.length > 0) {
    const highest = withRatings.reduce((a, b) => (a.rating! > b.rating! ? a : b));
    badges[highest.id] = "HIGHEST RATED";
  }

  // Find best price (lowest starting price)
  const withPrices = providers.filter(p => p.priceRange);
  if (withPrices.length > 0) {
    const parseMinPrice = (range: string) => {
      const match = range.match(/\$?([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : Infinity;
    };
    const cheapest = withPrices.reduce((a, b) =>
      parseMinPrice(a.priceRange!) < parseMinPrice(b.priceRange!) ? a : b
    );
    // Only assign if not already highest rated
    if (!badges[cheapest.id]) {
      badges[cheapest.id] = "BEST PRICE";
    }
  }

  // Find most services
  const withServices = providers.filter(p => p.services && p.services.length > 0);
  if (withServices.length > 0) {
    const most = withServices.reduce((a, b) =>
      (a.services?.length || 0) > (b.services?.length || 0) ? a : b
    );
    // Only assign if not already has a badge
    if (!badges[most.id]) {
      badges[most.id] = "MOST SERVICES";
    }
  }

  return badges;
}
