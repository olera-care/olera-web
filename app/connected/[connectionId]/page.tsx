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

/* ─────────────────────────────────────────────
 * Option A — Provider Spotlight
 * Large image, "Request Sent" pill, category badge,
 * location, generous whitespace
 * ───────────────────────────────────────────── */
function CardOptionA({ provider, loading, connectionId }: {
  provider: ProviderInfo;
  loading: boolean;
  connectionId: string;
}) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
      {/* Provider image — large, square with subtle gradient overlay */}
      <div className="relative">
        {provider.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.imageUrl}
              alt={provider.name}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-primary-50 via-primary-100 to-emerald-50 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        )}

        {/* "Request Sent" pill — floating on image */}
        <div className="absolute top-5 left-5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Request Sent
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pt-7 pb-8">
        <h1 className="text-[22px] font-bold text-gray-900 leading-tight mb-1">
          {loading && !provider.name ? "Connecting..." : "You're connected"}
        </h1>
        <p className="text-[15px] text-gray-500 mb-5">
          Your care request has been sent successfully.
        </p>

        {/* Provider identity row */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-2xl">
          {provider.imageUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={provider.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{provider.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {category && (
                <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                  {category}
                </span>
              )}
              {location && (
                <span className="text-xs text-gray-500">{location}</span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/portal/inbox?id=${connectionId}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Start Messaging
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Secondary link */}
        <Link
          href={provider.slug ? `/provider/${provider.slug}` : "/browse"}
          className="block text-center mt-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          View provider profile
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Option B — Split Card
 * Banner image at top with checkmark overlay,
 * category as title, location subtitle,
 * conversational copy
 * ───────────────────────────────────────────── */
function CardOptionB({ provider, loading, connectionId }: {
  provider: ProviderInfo;
  loading: boolean;
  connectionId: string;
}) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
      {/* Banner with overlay */}
      <div className="relative h-48">
        {provider.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.imageUrl}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-emerald-400" />
        )}

        {/* Floating checkmark badge */}
        <div className="absolute top-5 right-5 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Provider name on image */}
        <div className="absolute bottom-4 left-6 right-6">
          <p className="text-white/80 text-sm font-medium truncate">{provider.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pt-6 pb-8">
        {/* Category as title with location */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Connected</span>
          </div>
          {category && (
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{category}</h1>
          )}
          {!category && (
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Care Provider</h1>
          )}
          {location && (
            <p className="text-[15px] text-gray-500 mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-5" />

        {/* Conversational copy */}
        <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
          {loading && !provider.name
            ? "Sending your request..."
            : "Your care request is on its way. Send a message to introduce yourself and learn more about their services."
          }
        </p>

        {/* CTA */}
        <Link
          href={`/portal/inbox?id=${connectionId}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Send a Message
        </Link>

        {/* Browse more */}
        <Link
          href="/browse"
          className="block text-center mt-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Browse more providers
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Option C — Compact Celebration
 * Circular image with animated emerald ring +
 * checkmark badge, "You're connected" headline,
 * category pill + location inline, minimal copy
 * ───────────────────────────────────────────── */
function CardOptionC({ provider, loading, connectionId }: {
  provider: ProviderInfo;
  loading: boolean;
  connectionId: string;
}) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
      <div className="px-8 pt-10 pb-8 text-center">
        {/* Circular image with animated ring */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          {/* Animated ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="#d1fae5"
              strokeWidth="3"
            />
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="326.73"
              strokeDashoffset="0"
              className="animate-[draw_1s_ease-out_0.3s_both]"
              transform="rotate(-90 56 56)"
            />
          </svg>

          {/* Provider image */}
          <div className="absolute inset-[6px] rounded-full overflow-hidden bg-gray-100">
            {provider.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={provider.imageUrl}
                alt={provider.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-emerald-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>

          {/* Checkmark badge */}
          <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center ring-[3px] ring-white shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {loading && !provider.name ? "Connecting..." : "You're connected"}
        </h1>

        {/* Provider identity — inline pills */}
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

        {/* CTA */}
        <Link
          href={`/portal/inbox?id=${connectionId}`}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Start Messaging
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Design toggle (temporary — for comparison)
 * ───────────────────────────────────────────── */
const OPTION_LABELS = ["A · Spotlight", "B · Split Card", "C · Celebration"] as const;

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
  const [activeOption, setActiveOption] = useState(0);

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

  const cardProps = { provider, loading, connectionId };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Design toggle — temporary for comparison */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center gap-1">
          {OPTION_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveOption(i)}
              className={[
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeOption === i
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Success Card */}
      <section className="pt-10 pb-4">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {activeOption === 0 && <CardOptionA {...cardProps} />}
          {activeOption === 1 && <CardOptionB {...cardProps} />}
          {activeOption === 2 && <CardOptionC {...cardProps} />}
        </div>
      </section>

      {/* Section 2: You might also like */}
      <SimilarProvidersRow excludeSlug={provider.slug} />

      {/* Section 3: Browse by Care Type */}
      <BrowseByCareTypeSection />

      {/* CSS animation for Option C ring */}
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
