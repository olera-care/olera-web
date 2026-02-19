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
 * Version 1 — "Radiant"
 * Soft teal ambient glow behind avatar, brand-colored
 * animated ring with pulse, teal gradient CTA,
 * provider identity in a frosted mini-card
 * ───────────────────────────────────────────── */
function CardV1({ provider, loading, connectionId }: {
  provider: ProviderInfo;
  loading: boolean;
  connectionId: string;
}) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);

  return (
    <div className="relative bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
      {/* Subtle teal gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-primary-50/80 via-primary-50/30 to-transparent pointer-events-none" />

      <div className="relative px-8 pt-12 pb-9 text-center">
        {/* Avatar with ambient glow + animated teal ring */}
        <div className="relative w-[120px] h-[120px] mx-auto mb-7">
          {/* Ambient glow */}
          <div className="absolute inset-[-12px] rounded-full bg-primary-200/40 blur-xl animate-[glow-pulse_3s_ease-in-out_infinite]" />

          {/* Animated ring — brand teal */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
            {/* Track ring */}
            <circle cx="60" cy="60" r="56" fill="none" stroke="#e0f2f1" strokeWidth="3" />
            {/* Animated fill ring */}
            <circle
              cx="60" cy="60" r="56" fill="none"
              stroke="#199087" strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray="351.86" strokeDashoffset="0"
              className="animate-[draw_1.2s_ease-out_0.3s_both]"
              transform="rotate(-90 60 60)"
            />
          </svg>

          {/* Provider image */}
          <div className="absolute inset-[6px] rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-white shadow-sm">
            {provider.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <svg className="w-11 h-11 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>

          {/* Checkmark badge — brand teal */}
          <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center ring-[3px] ring-white shadow-md animate-[badge-pop_0.4s_ease-out_1.2s_both]">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Status + headline */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 animate-[glow-pulse_2s_ease-in-out_infinite]" />
          <span className="text-xs font-bold text-primary-700 uppercase tracking-widest">Connected</span>
        </div>
        <h1 className="text-[26px] font-bold text-gray-900 leading-tight mb-1.5">
          {loading && !provider.name ? "Connecting..." : "You're all set"}
        </h1>
        <p className="text-[15px] text-gray-400 mb-6">
          Your care request was sent successfully
        </p>

        {/* Provider identity — frosted mini-card */}
        <div className="inline-flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-2xl px-5 py-3.5 mb-8">
          {provider.imageUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={provider.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div className="text-left min-w-0">
            {category && (
              <p className="text-sm font-semibold text-gray-900">{category}</p>
            )}
            {location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </p>
            )}
          </div>
        </div>

        {/* CTA — teal gradient */}
        <div>
          <Link
            href={`/portal/inbox?id=${connectionId}`}
            className="inline-flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-[0_4px_16px_rgba(25,144,135,0.3)] hover:shadow-[0_6px_24px_rgba(25,144,135,0.4)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Start Messaging
          </Link>
        </div>

        {/* Secondary */}
        <Link
          href={provider.slug ? `/provider/${provider.slug}` : "/browse"}
          className="block text-center mt-3.5 text-sm font-medium text-gray-400 hover:text-primary-600 transition-colors"
        >
          View full profile
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Version 2 — "Luminous"
 * Full teal hero header with provider avatar
 * breaking the boundary, clean white lower section,
 * category/location chips, Apple-like clarity
 * ───────────────────────────────────────────── */
function CardV2({ provider, loading, connectionId }: {
  provider: ProviderInfo;
  loading: boolean;
  connectionId: string;
}) {
  const location = [provider.city, provider.state].filter(Boolean).join(", ");
  const category = formatCategory(provider.category);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] overflow-hidden max-w-lg mx-auto">
      {/* Teal hero header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-teal-400 px-8 pt-10 pb-16 text-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-32 h-32 rounded-full bg-white/[0.07]" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/[0.05]" />
        <div className="absolute top-8 left-10 w-2 h-2 rounded-full bg-white/30 animate-[float_4s_ease-in-out_infinite]" />
        <div className="absolute top-16 right-16 w-1.5 h-1.5 rounded-full bg-white/20 animate-[float_5s_ease-in-out_1s_infinite]" />

        {/* Checkmark icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-[badge-pop_0.4s_ease-out_0.3s_both]">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-[22px] font-bold text-white leading-tight mb-1">
          {loading && !provider.name ? "Connecting..." : "You're connected"}
        </h1>
        <p className="text-white/70 text-sm">
          Your care request was sent successfully
        </p>
      </div>

      {/* Avatar breaking the boundary */}
      <div className="relative -mt-12 mb-5 flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white ring-[4px] ring-white shadow-lg">
            {provider.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          {/* Online-style indicator */}
          <div className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center ring-[3px] ring-white">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-9 text-center">
        {/* Provider identity — horizontal chip layout */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-1.5">
          {category && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 px-3.5 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {category}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </span>
          )}
        </div>

        {/* Provider name (subtle) */}
        <p className="text-[13px] text-gray-400 mb-7 truncate px-4">{provider.name}</p>

        {/* Divider with dot accent */}
        <div className="flex items-center gap-3 mb-7 px-4">
          <div className="flex-1 h-px bg-gray-100" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary-300" />
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Conversational nudge */}
        <p className="text-[15px] text-gray-500 leading-relaxed mb-7 px-2">
          Send a message to introduce yourself and learn more about their care services.
        </p>

        {/* CTA — teal with icon */}
        <Link
          href={`/portal/inbox?id=${connectionId}`}
          className="flex items-center justify-center gap-2.5 w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-[0_4px_16px_rgba(25,144,135,0.25)] hover:shadow-[0_6px_24px_rgba(25,144,135,0.35)]"
        >
          Start Messaging
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Browse more */}
        <Link
          href="/browse"
          className="block text-center mt-3.5 text-sm font-medium text-gray-400 hover:text-primary-600 transition-colors"
        >
          Browse more providers
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Benchmark — Original Celebration (Option C)
 * ───────────────────────────────────────────── */
function CardBenchmark({ provider, loading, connectionId }: {
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
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="52" fill="none" stroke="#d1fae5" strokeWidth="3" />
            <circle
              cx="56" cy="56" r="52" fill="none"
              stroke="#10b981" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="326.73" strokeDashoffset="0"
              className="animate-[draw_1s_ease-out_0.3s_both]"
              transform="rotate(-90 56 56)"
            />
          </svg>
          <div className="absolute inset-[6px] rounded-full overflow-hidden bg-gray-100">
            {provider.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-emerald-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center ring-[3px] ring-white shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {loading && !provider.name ? "Connecting..." : "You're connected"}
        </h1>

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

        <p className="text-sm text-gray-400 mb-6 truncate px-4">{provider.name}</p>

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
const OPTION_LABELS = ["V1 · Radiant", "V2 · Luminous", "Benchmark"] as const;

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
          {activeOption === 0 && <CardV1 {...cardProps} />}
          {activeOption === 1 && <CardV2 {...cardProps} />}
          {activeOption === 2 && <CardBenchmark {...cardProps} />}
        </div>
      </section>

      {/* Section 2: You might also like */}
      <SimilarProvidersRow excludeSlug={provider.slug} />

      {/* Section 3: Browse by Care Type */}
      <BrowseByCareTypeSection />

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes draw {
          from { stroke-dashoffset: 351.86; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes badge-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
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
