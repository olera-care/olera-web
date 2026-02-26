"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface ProviderDetailPanelProps {
  profile: Profile;
  onClose: () => void;
  className?: string;
}

function formatCategory(cat: string | null): string {
  if (!cat) return "";
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCareTypes(types: string[]): string[] {
  return types.map((t) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function ProviderDetailPanel({
  profile,
  onClose,
  className = "",
}: ProviderDetailPanelProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState(0);

  const profileHref =
    (profile.type === "organization" || profile.type === "caregiver") && profile.slug
      ? `/provider/${profile.slug}`
      : `/profile/${profile.id}`;

  // Fetch additional images from olera-providers if available
  useEffect(() => {
    const existing = profile.image_url ? [profile.image_url] : [];
    setImages(existing);
    setCurrentImage(0);

    if (!profile.source_provider_id || !isSupabaseConfigured()) return;

    const supabase = createClient();
    supabase
      .from("olera-providers")
      .select("provider_logo, provider_images")
      .eq("provider_id", profile.source_provider_id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const allImages: string[] = [];
        if (data.provider_logo) allImages.push(data.provider_logo);
        if (data.provider_images) {
          const split = (data.provider_images as string).split(" | ").filter(Boolean);
          allImages.push(...split);
        }
        // Dedupe
        const unique = [...new Set(allImages)].slice(0, 5);
        if (unique.length > 0) {
          setImages(unique);
          setCurrentImage(0);
        }
      });
  }, [profile.source_provider_id, profile.image_url]);

  const category = formatCategory(profile.category);
  const careTypes = formatCareTypes(profile.care_types || []);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <div className={`flex flex-col bg-white border-l border-gray-200 ${className}`}>
      {/* Header */}
      <div className="shrink-0 px-[44px] h-[68px] border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-gray-900">Details</h3>
        <button
          onClick={onClose}
          className="w-[44px] h-[44px] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Close details"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image carousel */}
        {images.length > 0 && (
          <div className="relative px-[44px] pt-5">
            <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentImage]}
              alt={profile.display_name}
              className="w-full aspect-[4/3] object-cover"
            />
            {images.length > 1 && (
              <>
                {currentImage > 0 && (
                  <button
                    onClick={() => setCurrentImage((p) => p - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {currentImage < images.length - 1 && (
                  <button
                    onClick={() => setCurrentImage((p) => p + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImage ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* Provider info */}
        <div className="px-[44px] py-5">
          <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">
            {profile.display_name}
          </h2>
          {category && (
            <p className="text-[15px] text-gray-500 mt-1">{category}</p>
          )}
          {location && (
            <p className="text-[15px] text-gray-500 mt-0.5">{location}</p>
          )}

          {/* Description */}
          {profile.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[15px] text-gray-600 leading-relaxed line-clamp-4">
                {profile.description}
              </p>
            </div>
          )}

          {/* Care types */}
          {careTypes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Services</h4>
              <div className="flex flex-wrap gap-1.5">
                {careTypes.map((ct) => (
                  <span
                    key={ct}
                    className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full"
                  >
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          {(profile.phone || profile.email || profile.website) && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h4>
              {profile.phone && (
                <div className="flex items-center gap-2.5 text-[15px] text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2.5 text-[15px] text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2.5 text-[15px] text-gray-600">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline truncate"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View full profile link */}
        <div className="px-[44px] pb-6">
          <Link
            href={profileHref}
            target="_blank"
            className="block w-full text-center py-3 text-[15px] font-semibold text-primary-600 border border-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-colors"
          >
            View full profile
          </Link>
        </div>
      </div>
    </div>
  );
}
