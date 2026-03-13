"use client";

interface CardTopSectionProps {
  priceRange: string | null;
  oleraScore: number | null;
  reviewCount: number | undefined;
  responseTime: string | null;
  hideResponseTime?: boolean;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill={filled ? "#9ca3af" : "#e5e7eb"}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
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
  oleraScore,
  reviewCount,
  responseTime,
  hideResponseTime,
}: CardTopSectionProps) {
  const hasPrice = !!priceRange;
  const hasScore = oleraScore != null && oleraScore > 0;

  // If nothing to show, don't render the section at all
  if (!hasPrice && !hasScore && (!responseTime || hideResponseTime)) {
    return null;
  }

  return (
    <div className="px-5 pt-4 pb-3">
      <div className="flex justify-between items-center">
        {/* Price — de-emphasized */}
        {hasPrice ? (
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

        {/* Score — de-emphasized */}
        {hasScore && (
          <button
            onClick={() => scrollToSection("reviews")}
            className="text-right cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1">
              <div className="flex gap-px items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <StarIcon key={i} filled={i < Math.round(oleraScore)} />
                ))}
              </div>
              <span className="text-[13px] text-gray-500 font-medium">
                {oleraScore.toFixed(1)}
              </span>
              <span className="text-[12px] text-gray-400">
                ({reviewCount ?? 0})
              </span>
            </div>
          </button>
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
