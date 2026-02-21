"use client";

import Image from "next/image";
import type { Provider } from "@/lib/types/provider";
import {
  parseProviderImages,
  getPrimaryImage,
  getCategoryDisplayName,
  formatLocation,
  formatPriceRange,
} from "@/lib/types/provider";

interface MatchCardProps {
  provider: Provider;
  index: number;
  total: number;
  onViewProfile: () => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[1px]">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 20 20"
          fill={i < Math.floor(rating) ? "#F4A261" : "#D1D5DB"}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function MatchCard({
  provider,
  index,
  total,
  onViewProfile,
}: MatchCardProps) {
  const images = parseProviderImages(provider.provider_images);
  const primaryImage = getPrimaryImage(provider);
  const location = formatLocation(provider);
  const categoryDisplay = getCategoryDisplayName(provider.provider_category);
  const rating = provider.google_rating || 0;

  const priceDisplay = formatPriceRange(provider);

  // Infer payment tags from category (olera-providers table lacks payment columns)
  const paymentTags: string[] = [];
  if (provider.lower_price || provider.upper_price) paymentTags.push("Private pay");
  const cat = provider.provider_category?.toLowerCase() || "";
  if (cat.includes("nursing home") || cat.includes("home health") || cat.includes("hospice")) {
    paymentTags.push("Medicare");
  }
  if (cat.includes("nursing home") || cat.includes("hospice")) {
    paymentTags.push("Medicaid");
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* Photo area */}
      <div className="relative h-[280px] bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={provider.provider_name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-6xl">🏠</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category + Name + Location — stacked compact */}
        <div className="absolute bottom-3 left-4 right-4 flex flex-col gap-0.5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-sm text-[11px] font-semibold text-white uppercase tracking-wide">
              {categoryDisplay}
            </span>
          </div>
          <p className="text-[20px] font-bold text-white drop-shadow-sm truncate">
            {provider.provider_name}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-white/85">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[15px]">{location}</span>
            </div>
          </div>
        </div>

        {/* Match counter */}
        <div className="absolute top-3.5 right-3.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/35 backdrop-blur-sm text-[11px] text-white/90">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Details section */}
      <div className="px-4 py-3">
        {/* Rating + view profile */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {/* Shield icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#199087"
              stroke="none"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline
                points="9 12 11 14 15 10"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[15px] font-bold text-gray-900">
              {rating.toFixed(1)}
            </span>
            <Stars rating={rating} />
          </div>
          <button
            onClick={onViewProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#199087"
              strokeWidth="2.5"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="text-sm text-primary-600 font-medium">
              View profile
            </span>
          </button>
        </div>

        {/* Pricing + payment tags — always shown for consistent card height */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[15px] font-bold text-gray-900">
            {priceDisplay || "Contact for pricing"}
          </span>
          {paymentTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
