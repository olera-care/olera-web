"use client";

import { useState } from "react";
import Link from "next/link";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { type ProviderCardData, getCategoryDisplayName } from "@/lib/types/provider";

interface BrowseCardProps {
  provider: ProviderCardData;
}

export default function BrowseCard({ provider }: BrowseCardProps) {
  const { isSaved: checkSaved, toggleSave } = useSavedProviders();
  const isSaved = checkSaved(provider.id);
  const [imgFailed, setImgFailed] = useState(false);

  const careTypeLabel = getCategoryDisplayName(provider.careTypes[0]) || provider.primaryCategory;
  const displayedHighlights = provider.highlights?.slice(0, 3) || [];

  return (
    <Link
      href={`/provider/${provider.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/10] bg-gray-100">
        {!imgFailed ? (
          <img
            src={provider.image}
            alt={provider.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}

        {/* Heart — top right */}
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
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors shadow-sm"
          aria-label={isSaved ? "Remove from saved" : "Save provider"}
        >
          <svg
            className={`w-[18px] h-[18px] transition-colors ${
              isSaved ? "text-primary-600" : "text-gray-500"
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

        {/* Badge — bottom left */}
        {provider.badge && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-600 text-white shadow-sm">
              {provider.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 flex flex-col">
        {/* Name + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold font-serif text-text-lg text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1 flex-1">
            {provider.name}
          </h3>
          {provider.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Category + Location */}
        <p className="text-text-sm text-gray-500 mt-0.5">
          {careTypeLabel} · {provider.address}
        </p>

        {/* Highlights */}
        {displayedHighlights.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
            {displayedHighlights.map((h) => (
              <span key={h} className="flex items-center gap-1 text-text-sm text-gray-600">
                <svg className="w-3 h-3 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-1.5" />

        {/* Price */}
        <p className="text-text-md font-bold text-gray-900 mt-2">{provider.priceRange}</p>
      </div>
    </Link>
  );
}
