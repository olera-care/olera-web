"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
      {/* Section 1: Success Card */}
      <section className="pt-12 pb-4">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
            <div className="px-8 pt-10 pb-8 text-center">
              {/* Circular image with animated brand teal ring */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
                  {/* Track ring — light teal */}
                  <circle cx="56" cy="56" r="52" fill="none" stroke="#e0f2f1" strokeWidth="3" />
                  {/* Animated ring — brand teal */}
                  <circle
                    cx="56" cy="56" r="52" fill="none"
                    stroke="#199087" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="326.73" strokeDashoffset="0"
                    className="animate-[draw_1s_ease-out_0.3s_both]"
                    transform="rotate(-90 56 56)"
                  />
                </svg>

                {/* Provider image or personalized initials */}
                <div className="absolute inset-[6px] rounded-full overflow-hidden">
                  {provider.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: avatarGradient(provider.name) }}
                    >
                      <span className="text-2xl font-bold text-white tracking-wide">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Checkmark badge — brand teal */}
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center ring-[3px] ring-white shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {loading && !provider.name ? "Connecting..." : "You're connected"}
              </h1>

              {/* Provider identity — category pill + location */}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-3 mb-2">
                {category && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                    {category}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location}
                  </span>
                )}
              </div>

              {/* Provider name (subtle) */}
              <p className="text-sm text-gray-400 mb-6 truncate px-4">{provider.name}</p>

              {/* CTA — brand teal */}
              <Link
                href={`/portal/inbox?id=${connectionId}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-[0_4px_16px_rgba(25,144,135,0.25)] hover:shadow-[0_6px_24px_rgba(25,144,135,0.35)]"
              >
                Start Messaging
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
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
          from { stroke-dashoffset: 326.73; }
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
