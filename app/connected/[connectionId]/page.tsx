"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { PROVIDERS_TABLE } from "@/lib/types/provider";
import SimilarProvidersRow from "@/components/providers/SimilarProvidersRow";
import BrowseByCareTypeSection from "@/components/home/BrowseByCareTypeSection";


interface ProviderInfo {
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
}

function formatCategory(cat: string | null): string {
  if (!cat) return "";
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Deterministic gradient from provider name for personalized avatar fallback */
function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #199087, #0ea5e9)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #0891b2, #2dd4bf)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/** Get up to 2 initials from a name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function ConnectedPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const connectionId = params.connectionId as string;

  // Instant display from URL search params
  const nameFromParams = searchParams.get("name") || "";
  const slugFromParams = searchParams.get("slug") || "";
  const categoryFromParams = searchParams.get("category") || null;
  const cityFromParams = searchParams.get("city") || null;
  const stateFromParams = searchParams.get("state") || null;

  const [provider, setProvider] = useState<ProviderInfo>({
    name: nameFromParams,
    slug: slugFromParams,
    imageUrl: null,
    category: categoryFromParams,
    city: cityFromParams,
    state: stateFromParams,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProviderData() {
      if (!isSupabaseConfigured() || !connectionId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Get the connection to find to_profile_id
        const { data: connection } = await supabase
          .from("connections")
          .select("to_profile_id")
          .eq("id", connectionId)
          .single();

        if (!connection) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Get provider's business_profile
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("display_name, slug, image_url, category, care_types, city, state, source_provider_id")
          .eq("id", connection.to_profile_id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        let imageUrl = profile.image_url;
        let category = profile.category || profile.care_types?.[0] || null;
        let city = profile.city;
        let state = profile.state;

        // Fetch from iOS provider table if we're missing any data
        if (profile.source_provider_id && (!imageUrl || !category || !city || !state)) {
          const { data: iosProvider } = await supabase
            .from(PROVIDERS_TABLE)
            .select("provider_images, provider_logo, provider_category, provider_city, provider_state")
            .eq("provider_id", profile.source_provider_id)
            .single();

          if (iosProvider) {
            if (!imageUrl) {
              imageUrl = iosProvider.provider_logo ||
                iosProvider.provider_images?.split(" | ")?.[0] || null;
            }
            if (!category) category = iosProvider.provider_category;
            if (!city) city = iosProvider.provider_city;
            if (!state) state = iosProvider.provider_state;
          }
        }

        setProvider({
          name: profile.display_name || nameFromParams,
          slug: profile.slug || slugFromParams,
          imageUrl,
          category: category || categoryFromParams,
          city: city || cityFromParams,
          state: state || stateFromParams,
        });
      } catch (err) {
        console.error("[connected] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProviderData();
  }, [connectionId, nameFromParams, slugFromParams, categoryFromParams, cityFromParams, stateFromParams]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection not found</h1>
          <p className="text-gray-500 mb-6">This connection may have been removed or the link is invalid.</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Browse providers
          </Link>
        </div>
      </div>
    );
  }

  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);
  const initials = getInitials(provider.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section 1: Warm hero with success card */}
      <section className="relative overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-vanilla-100 via-primary-50/40 to-gray-50" />
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-200/20 rounded-full blur-3xl" />

        <div className="relative z-10 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            {/* Circular image with animated brand teal ring */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-8">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 144 144">
                {/* Track ring — light teal */}
                <circle cx="72" cy="72" r="68" fill="none" stroke="#e0f2f1" strokeWidth="3" />
                {/* Animated ring — brand teal */}
                <circle
                  cx="72" cy="72" r="68" fill="none"
                  stroke="#199087" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="427.26" strokeDashoffset="0"
                  className="animate-[draw_1s_ease-out_0.3s_both]"
                  transform="rotate(-90 72 72)"
                />
              </svg>

              {/* Provider image or personalized initials */}
              <div className="absolute inset-[8px] rounded-full overflow-hidden shadow-lg">
                {provider.imageUrl ? (
                  <Image src={provider.imageUrl} alt={provider.name} fill className="object-cover" sizes="136px" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: avatarGradient(provider.name) }}
                  >
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-wide">{initials}</span>
                  </div>
                )}
              </div>

              {/* Checkmark badge — brand teal */}
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center ring-[3px] ring-vanilla-100 shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Headline — serif display */}
            <h1 className="font-serif text-display-sm sm:text-display-md text-gray-900 mb-3">
              {loading && !provider.name ? "Connecting..." : "You\u2019re connected"}
            </h1>

            {/* Provider name — prominent */}
            {provider.name && (
              <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                with {provider.name}
              </p>
            )}

            {/* Warm subtitle */}
            <p className="text-base sm:text-lg text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
              {provider.name
                ? `We\u2019ve shared your profile. ${provider.name.split(" ")[0]} will be in touch soon.`
                : "We\u2019ve shared your profile. They\u2019ll be in touch soon."}
            </p>

            {/* Provider identity — category pill + location */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap mb-8">
              {category && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-white/80 backdrop-blur-sm border border-primary-100 px-3.5 py-1.5 rounded-full shadow-xs">
                  {category}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-100 px-3.5 py-1.5 rounded-full shadow-xs">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </span>
              )}
            </div>

            {/* CTA — brand teal */}
            <Link
              href={`/portal/inbox?id=${connectionId}`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base rounded-2xl transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
            >
              Start Messaging
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            {/* Secondary link */}
            <p className="mt-4 text-sm text-gray-400">
              or{" "}
              <Link href={`/provider/${provider.slug}`} className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2 decoration-primary-200 hover:decoration-primary-400 transition-colors">
                view their profile
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: You might also like */}
      <SimilarProvidersRow excludeSlug={provider.slug} />

      {/* Section 3: Browse by Care Type */}
      <BrowseByCareTypeSection />

      {/* Ring draw animation */}
      <style jsx global>{`
        @keyframes draw {
          from { stroke-dashoffset: 427.26; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ConnectedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConnectedPageContent />
    </Suspense>
  );
}
