"use client";

import Link from "next/link";
import Image from "next/image";

function formatCategory(category: string | null): string {
  if (!category) return "";
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface JobProviderData {
  id: string;
  slug: string;
  display_name: string;
  city: string | null;
  state: string | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  care_types: string[];
}

interface JobProviderCardProps {
  provider: JobProviderData;
  isRequested: boolean;
  canRequest: boolean;
  onRequestInterview: () => void;
}

export default function JobProviderCard({
  provider,
  isRequested,
  canRequest,
  onRequestInterview,
}: JobProviderCardProps) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const categoryLabel = formatCategory(provider.category);
  const careTypes = provider.care_types || [];
  const profileUrl = `/provider/${provider.slug}`;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div className="flex">
        {/* Image - left side */}
        <div className="w-32 sm:w-40 min-h-[140px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
          {provider.image_url ? (
            <Image
              src={provider.image_url}
              alt={provider.display_name}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                <span className="text-lg font-bold text-primary-400">
                  {(provider.display_name || "")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content - right side */}
        <div className="flex-1 p-4 sm:p-5 min-w-0 flex flex-col">
          {/* Location */}
          {location && (
            <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{location}</p>
          )}

          {/* Name */}
          <Link href={profileUrl} target="_blank" rel="noopener noreferrer">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1 hover:text-gray-700 transition-colors">
              {provider.display_name}
            </h3>
          </Link>

          {/* Category */}
          {categoryLabel && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{categoryLabel}</p>
          )}

          {/* Care types as tags */}
          {careTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {careTypes.slice(0, 3).map((ct) => (
                <span
                  key={ct}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {ct}
                </span>
              ))}
              {careTypes.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full">
                  +{careTypes.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-3" />

          {/* Action row - only view profile + button */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            <Link
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              View profile →
            </Link>
            {isRequested ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Requested
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRequestInterview();
                }}
                disabled={!canRequest}
                className="px-4 py-2 text-sm font-semibold text-primary-600 rounded-lg ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Request Interview
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
