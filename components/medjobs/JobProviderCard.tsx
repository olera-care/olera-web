"use client";

import Link from "next/link";
import Image from "next/image";

// Softer, more muted colors for logo fallbacks
const LOGO_COLORS = [
  "bg-slate-100 text-slate-600",
  "bg-stone-100 text-stone-600",
  "bg-zinc-100 text-zinc-600",
  "bg-neutral-100 text-neutral-600",
  "bg-gray-100 text-gray-600",
];

function getLogoColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

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
    <div className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="flex flex-col p-6 flex-1">
        {/* Logo + Name row */}
        <div className="flex items-start gap-4 mb-4">
          <Link
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0"
          >
            {provider.image_url ? (
              <Image
                src={provider.image_url}
                alt={provider.display_name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div
                className={`w-full h-full ${getLogoColor(provider.id)} flex items-center justify-center`}
              >
                <span className="text-lg font-medium">
                  {provider.display_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1 pt-0.5">
            <Link href={profileUrl} target="_blank" rel="noopener noreferrer">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors leading-tight line-clamp-1">
                {provider.display_name}
              </h3>
            </Link>
            {categoryLabel && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {categoryLabel}
              </p>
            )}
          </div>
        </div>

        {/* Key info — clean layout */}
        <div className="space-y-2 mb-4">
          {/* Location */}
          {location && (
            <p className="text-sm text-gray-500">{location}</p>
          )}

          {/* Description */}
          {provider.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {provider.description}
            </p>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom row: Care types + Action */}
        <div className="pt-4 border-t border-gray-100">
          {/* Care types - subtle */}
          {careTypes.length > 0 && (
            <p className="text-xs text-gray-400 mb-3 line-clamp-1">
              {careTypes.slice(0, 3).join(" · ")}
              {careTypes.length > 3 && ` +${careTypes.length - 3}`}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between">
            <Link
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              View profile
            </Link>
            {isRequested ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
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
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
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
