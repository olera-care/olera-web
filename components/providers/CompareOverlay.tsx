"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CompareProvider } from "./CompareBottomSheet";

interface CompareOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: CompareProvider;
  similarProviders: CompareProvider[];
  onSaveComparison?: () => void;
}

/**
 * Desktop comparison overlay - Zillow-style full-height panel.
 * Opens on top of the provider page with left/right margins showing the underlying page.
 */
export default function CompareOverlay({
  isOpen,
  onClose,
  currentProvider,
  similarProviders,
  onSaveComparison,
}: CompareOverlayProps) {
  // All providers: current first, then similar (max 2)
  const allProviders = [currentProvider, ...similarProviders.slice(0, 2)];

  // Extract first name for headline
  const firstName = (() => {
    const cleanName = currentProvider.name?.replace(/^\([^)]+\)\s*/, "") || "";
    return cleanName.split(/\s/)[0] || currentProvider.name?.split(/\s/)[0] || "Provider";
  })();

  // Location string
  const locationStr = [currentProvider.city, currentProvider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [currentProvider.category, locationStr].filter(Boolean).join(" · ");

  // Calculate badges
  const badges = calculateBadges(allProviders);

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Overlay panel - full height, with left/right margins */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[calc(100%-80px)] max-w-6xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-6 h-16 border-b border-gray-200 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {firstName}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {firstName} next to {similarProviders.length} nearby home{similarProviders.length !== 1 ? "s" : ""}.
            </h1>
            <p className="text-gray-500">
              {categoryLocationStr} · Reviews, pricing, services side by side
            </p>
          </div>

          {/* Comparison Table */}
          <div className="px-8 pb-8">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Provider Headers */}
              <div
                className="grid border-b border-gray-200"
                style={{ gridTemplateColumns: `180px repeat(${allProviders.length}, 1fr)` }}
              >
                {/* Empty corner cell */}
                <div className="p-4 bg-gray-50" />

                {/* Provider columns */}
                {allProviders.map((provider, index) => (
                  <div
                    key={provider.id}
                    className={`p-4 ${index === 0 ? "bg-[#4a7c72]/5" : "bg-white"} ${
                      index < allProviders.length - 1 ? "border-r border-gray-200" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {provider.image ? (
                        <Image
                          src={provider.image}
                          alt={provider.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                          <span className="text-lg font-semibold text-amber-700">
                            {provider.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Name and location */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/provider/${provider.slug}`}
                          className="text-[15px] font-bold text-gray-900 leading-tight hover:text-primary-600 transition-colors"
                        >
                          {provider.name}
                        </Link>
                        <p className="text-sm text-gray-500 truncate">
                          {[provider.city, provider.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Rating row */}
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50/50 rounded-lg">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">
                          {provider.rating?.toFixed(1) || "—"}
                        </span>
                        <span className="text-sm text-gray-500">
                          · {provider.reviewCount || 0}
                        </span>
                      </div>
                      {badges[provider.id] && (
                        <span className="ml-auto text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {badges[provider.id]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Rows */}
              <CompareRow
                label="MONTHLY COST"
                providers={allProviders}
                getValue={(p) => (
                  <div>
                    <span className="text-[15px] font-semibold text-gray-900">
                      {p.priceRange || "—"}
                    </span>
                    {p.priceRange && (
                      <p className="text-sm text-gray-500">Estimated range</p>
                    )}
                  </div>
                )}
              />

              <CompareRow
                label="CARE SERVICES"
                providers={allProviders}
                getValue={(p) => (
                  <span className="text-[15px] text-gray-900">
                    {p.services?.slice(0, 4).join(", ") || "—"}
                  </span>
                )}
              />

              <CompareRow
                label="SPECIALTY"
                providers={allProviders}
                getValue={(p) => (
                  <span className="text-[15px] text-gray-900">
                    {p.specialty || p.category || "—"}
                  </span>
                )}
              />

              <CompareRow
                label="AVAILABILITY"
                providers={allProviders}
                getValue={(p) => (
                  <span
                    className={`text-[15px] ${
                      p.availability?.toLowerCase().includes("waitlist")
                        ? "text-gray-500 italic"
                        : "text-gray-900"
                    }`}
                  >
                    {p.availability || "—"}
                  </span>
                )}
                isLast
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">Save this comparison</span>
            {" · "}
            Message any of them when you&apos;re ready
          </p>
          <button
            type="button"
            onClick={onSaveComparison}
            className="flex items-center gap-2 px-6 py-3 bg-[#4a7c72] hover:bg-[#3d6860] text-white rounded-xl font-semibold transition-colors"
          >
            Save this comparison
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare Row Component
// ─────────────────────────────────────────────────────────────────────────────

function CompareRow({
  label,
  providers,
  getValue,
  isLast = false,
}: {
  label: string;
  providers: CompareProvider[];
  getValue: (provider: CompareProvider) => React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`grid ${!isLast ? "border-b border-gray-200" : ""}`}
      style={{ gridTemplateColumns: `180px repeat(${providers.length}, 1fr)` }}
    >
      {/* Label cell */}
      <div className="p-4 bg-gray-50 flex items-start">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c72]">
          {label}
        </span>
      </div>

      {/* Value cells */}
      {providers.map((provider, index) => (
        <div
          key={provider.id}
          className={`p-4 ${index === 0 ? "bg-[#4a7c72]/5" : "bg-white"} ${
            index < providers.length - 1 ? "border-r border-gray-200" : ""
          }`}
        >
          {getValue(provider)}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge Calculation
// ─────────────────────────────────────────────────────────────────────────────

function calculateBadges(providers: CompareProvider[]): Record<string, string | null> {
  const badges: Record<string, string | null> = {};

  providers.forEach((p) => {
    badges[p.id] = null;
  });

  if (providers.length < 2) return badges;

  // Find highest rated
  const withRatings = providers.filter((p) => p.rating != null);
  if (withRatings.length > 0) {
    const highest = withRatings.reduce((a, b) => (a.rating! > b.rating! ? a : b));
    badges[highest.id] = "HIGHEST RATED";
  }

  // Find best price (lowest starting price)
  const withPrices = providers.filter((p) => p.priceRange);
  if (withPrices.length > 0) {
    const parseMinPrice = (range: string) => {
      const match = range.match(/\$?([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : Infinity;
    };
    const cheapest = withPrices.reduce((a, b) =>
      parseMinPrice(a.priceRange!) < parseMinPrice(b.priceRange!) ? a : b
    );
    if (!badges[cheapest.id]) {
      badges[cheapest.id] = "BEST PRICE";
    }
  }

  // Find most services
  const withServices = providers.filter((p) => p.services && p.services.length > 0);
  if (withServices.length > 0) {
    const most = withServices.reduce((a, b) =>
      (a.services?.length || 0) > (b.services?.length || 0) ? a : b
    );
    if (!badges[most.id]) {
      badges[most.id] = "MOST SERVICES";
    }
  }

  return badges;
}
