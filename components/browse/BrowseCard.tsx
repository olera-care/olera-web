"use client";

import Link from "next/link";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { type ProviderCardData, getCategoryDisplayName } from "@/lib/types/provider";

interface BrowseCardProps {
  provider: ProviderCardData;
}

export default function BrowseCard({ provider }: BrowseCardProps) {
  const { isSaved: checkSaved, toggleSave } = useSavedProviders();
  const isSaved = checkSaved(provider.id);

  const careTypeLabels = provider.careTypes
    .map((ct) => getCategoryDisplayName(ct))
    .filter(Boolean);
  const displayedTypes = careTypeLabels.slice(0, 2);
  const extraCount = careTypeLabels.length - displayedTypes.length;

  return (
    <Link
      href={`/provider/${provider.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-36 sm:w-48 lg:w-52 flex-shrink-0 bg-gray-200">
        <img
          src={provider.image}
          alt={provider.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {provider.badge && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-600 text-white shadow-sm">
              {provider.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        {/* Address + Heart */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-gray-500 truncate">{provider.address}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave({
                providerId: provider.id,
                slug: provider.slug,
                name: provider.name,
                location: provider.address,
                careTypes: [provider.primaryCategory],
                image: provider.image,
                rating: provider.rating || undefined,
              });
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label={isSaved ? "Remove from saved" : "Save provider"}
          >
            <svg
              className={`w-[18px] h-[18px] transition-colors ${
                isSaved ? "text-red-500" : "text-gray-400 group-hover:text-gray-500"
              }`}
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Provider Name */}
        <h3 className="font-bold font-serif text-lg text-gray-900 group-hover:text-primary-700 transition-colors truncate">
          {provider.name}
        </h3>

        {/* Care Type Pills */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {displayedTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 bg-gray-50"
            >
              {type}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-gray-400">+{extraCount} more</span>
          )}
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Footer: Pricing + Rating */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Estimated Pricing</p>
            <p className="text-sm font-semibold text-gray-900">{provider.priceRange}</p>
          </div>
          {provider.rating > 0 && (
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-warning-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {provider.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
