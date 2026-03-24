"use client";

import PricingEducationBadge from "@/components/providers/PricingEducationBadge";
import { getPricingConfig } from "@/lib/pricing-config";

interface CardTopSectionProps {
  priceRange: string | null;
  reviewCount: number | undefined;
  responseTime: string | null;
  hideResponseTime?: boolean;
  /** Provider category — enables Tier 3 education badge */
  category?: string | null;
}

function ZapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber-500"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CardTopSection({
  priceRange,
  reviewCount,
  responseTime,
  hideResponseTime,
  category,
}: CardTopSectionProps) {
  const hasPrice = !!priceRange;
  const config = category ? getPricingConfig(category) : null;
  const isTier3 = config?.tier === 3;

  // If nothing to show, don't render the section at all
  if (!hasPrice && !isTier3 && (!responseTime || hideResponseTime)) {
    return null;
  }

  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex justify-between items-center">
        {/* Price — de-emphasized, or education badge for Tier 3 */}
        {isTier3 && !hasPrice ? (
          <PricingEducationBadge category={category!} compact />
        ) : hasPrice ? (
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-left cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-[13px] text-gray-500 font-medium">
              {priceRange}
            </p>
          </button>
        ) : (
          <p className="text-[13px] text-gray-400 font-medium">
            Contact for pricing
          </p>
        )}
      </div>

      {/* Response time banner */}
      {responseTime && !hideResponseTime && (
        <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-amber-50 rounded-lg">
          <ZapIcon />
          <span className="text-sm text-gray-700 font-medium">
            Usually responds within {responseTime}
          </span>
        </div>
      )}
    </div>
  );
}
