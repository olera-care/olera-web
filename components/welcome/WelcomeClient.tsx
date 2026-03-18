"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { PRE_AUTH_PAGE_KEY } from "@/components/auth/UnifiedAuthModal";

// ============================================================
// Types
// ============================================================

interface WelcomeClientProps {
  destination: string;
}

interface MatchProvider {
  provider_id: string;
  provider_name: string;
  provider_logo: string | null;
  provider_images: string | null;
  provider_category: string;
  city: string | null;
  state: string | null;
  google_rating: number | null;
}

interface ConnectionWithProvider {
  id: string;
  to_profile: {
    id: string;
    slug: string | null;
    display_name: string;
    image_url: string | null;
    city: string | null;
    state: string | null;
    category: string | null;
    metadata: {
      google_rating?: number;
      review_count?: number;
      lower_price?: number;
      upper_price?: number;
    } | null;
  } | null;
}

// ============================================================
// Helper Functions
// ============================================================

/** Deterministic gradient from name for personalized avatar fallback */
function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #5fa3a3, #7ab8b8)",
    "linear-gradient(135deg, #417272, #5fa3a3)",
    "linear-gradient(135deg, #4d8a8a, #7ab8b8)",
    "linear-gradient(135deg, #385e5e, #5fa3a3)",
    "linear-gradient(135deg, #5fa3a3, #96c8c8)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/** Get initials from a name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ============================================================
// Illustration — person being discovered by providers
// ============================================================

function DiscoveryIllustration() {
  return (
    <div className="w-24 h-24 mx-auto">
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
        {/* Soft background glow */}
        <circle cx="48" cy="48" r="40" fill="#199087" fillOpacity="0.08" />
        <circle cx="48" cy="48" r="28" fill="#199087" fillOpacity="0.12" />

        {/* Person silhouette - warm, approachable */}
        <circle cx="48" cy="36" r="10" fill="#199087" fillOpacity="0.9" />
        <path
          d="M32 62c0-8.837 7.163-16 16-16s16 7.163 16 16"
          stroke="#199087"
          strokeWidth="3"
          strokeLinecap="round"
          fill="#199087"
          fillOpacity="0.15"
        />

        {/* Connection dots - representing providers finding you */}
        <circle cx="22" cy="40" r="4" fill="#199087" fillOpacity="0.4">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="74" cy="40" r="4" fill="#199087" fillOpacity="0.4">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="28" cy="58" r="3" fill="#199087" fillOpacity="0.3">
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite" begin="0.25s" />
        </circle>
        <circle cx="68" cy="58" r="3" fill="#199087" fillOpacity="0.3">
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite" begin="0.75s" />
        </circle>

        {/* Subtle connection lines */}
        <path d="M26 40 L38 38" stroke="#199087" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M70 40 L58 38" stroke="#199087" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function BenefitsCard() {
  return (
    <Link
      href="/benefits/finder"
      className="group flex items-center gap-4 p-4 bg-gradient-to-r from-warm-50 to-vanilla-100 rounded-xl border border-warm-100/60 hover:border-warm-200 transition-all focus:outline-none focus:ring-2 focus:ring-warm-300 focus:ring-offset-2"
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-warm-100/60">
        <svg className="w-5 h-5 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[15px] font-semibold text-gray-900">Care may be covered</p>
        <p className="text-sm text-gray-500 mt-0.5">Find benefits you qualify for · 3 min</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-warm-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/** Horizontal scroll provider card (comparison style matching ProviderCard) */
function ProviderScrollCard({ provider }: { provider: MatchProvider }) {
  const { isSaved, toggleSave } = useSavedProviders();
  const saved = isSaved(provider.provider_id);
  const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")?.[0] || null;
  const location = [provider.city, provider.state].filter(Boolean).join(", ");

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave({
      providerId: provider.provider_id,
      slug: provider.provider_id,
      name: provider.provider_name,
      location: location,
      careTypes: [provider.provider_category],
      image: imageUrl,
      rating: provider.google_rating ?? undefined,
    });
  };

  return (
    <Link
      href={`/provider/${provider.provider_id}`}
      className="group w-[280px] min-w-[280px] bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
    >
      {/* Image */}
      <div className="relative h-40 sm:h-48 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={provider.provider_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: avatarGradient(provider.provider_name) }}>
              <span className="text-xl font-bold text-white">{getInitials(provider.provider_name)}</span>
            </div>
            <span className="text-xs font-medium text-primary-400 mt-2">{provider.provider_category}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

        {/* Heart save button — 44px touch target for WCAG compliance */}
        <button
          onClick={handleSave}
          className={`absolute top-2 right-2 w-11 h-11 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1 ${saved ? "scale-105" : ""}`}
          aria-label={saved ? "Remove from saved" : "Save provider"}
        >
          <svg
            className={`w-5 h-5 transition-all ${saved ? "text-primary-600 fill-primary-600" : "text-gray-400 hover:text-primary-600"}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] group-hover:text-primary-700 transition-colors line-clamp-2 flex-1 leading-snug">
            {provider.provider_name}
          </h3>
          {provider.google_rating && provider.google_rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">{provider.google_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Category · Location */}
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
          {provider.provider_category}{location ? ` · ${location}` : ""}
        </p>

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Pricing */}
        <p className="text-sm font-bold text-gray-900 mt-3">Contact for pricing</p>
      </div>
    </Link>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function WelcomeClient({ destination }: WelcomeClientProps) {
  const router = useRouter();
  const { account, activeProfile, refreshAccountData } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [connection, setConnection] = useState<ConnectionWithProvider | null>(null);
  const [matches, setMatches] = useState<MatchProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [preAuthPage, setPreAuthPage] = useState<string | null>(null);

  // Read pre-auth page from localStorage on mount (for "Skip for now" redirect)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRE_AUTH_PAGE_KEY);
      if (stored && stored !== "/welcome" && !stored.startsWith("/portal") && !stored.startsWith("/admin")) {
        setPreAuthPage(stored);
        // Clear it so it's not reused on future visits
        localStorage.removeItem(PRE_AUTH_PAGE_KEY);
      }
    } catch { /* localStorage not available */ }
  }, []);

  // Check if should skip and load initial data
  useEffect(() => {
    async function init() {
      if (!activeProfile) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Check if onboarding already completed → skip (only on first load)
      if (!hasInitialized && account?.onboarding_completed === true) {
        router.replace(destination);
        return;
      }
      setHasInitialized(true);

      // Get city and state from profile
      setCity(activeProfile.city || null);
      const familyState = activeProfile.state;
      const familyCareTypes = activeProfile.care_types || [];

      // Fetch connection info — this is quick and needed for the main UI
      let connectedProviderCity: string | null = null;
      try {
        const { data: connections } = await supabase
          .from("connections")
          .select(`
            id,
            to_profile:business_profiles!connections_to_profile_id_fkey(
              id, slug, display_name, image_url, city, state, category, metadata
            )
          `)
          .eq("from_profile_id", activeProfile.id)
          .eq("type", "inquiry")
          .order("created_at", { ascending: false })
          .limit(1);

        if (connections && connections.length > 0) {
          const conn = connections[0] as ConnectionWithProvider;
          setConnection(conn);
          connectedProviderCity = conn.to_profile?.city || null;
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch connection:", err);
      }

      // Determine city for recommendations
      const recommendationCity = connectedProviderCity || activeProfile.city;
      if (recommendationCity) {
        setCity(recommendationCity);
      }

      // Show the main UI immediately — don't wait for provider recommendations
      setLoading(false);

      // Fetch provider recommendations in the background (non-blocking)
      // If city is available, filter by city; otherwise fetch top-rated nationally
      (async () => {
        try {
          let query = supabase
            .from("olera-providers")
            .select("provider_id, provider_name, provider_logo, provider_images, provider_category, city, state, google_rating")
            .eq("deleted", false)
            .not("google_rating", "is", null)
            .gte("google_rating", 4.0)
            .not("provider_images", "is", null)
            .order("google_rating", { ascending: false })
            .limit(6);

          // Filter by city if available
          if (recommendationCity) {
            query = query.eq("city", recommendationCity);
          }

          const { data: providerMatches, error: matchError } = await query;

          if (!matchError && providerMatches && providerMatches.length > 0) {
            setMatches(providerMatches as MatchProvider[]);
          } else if (recommendationCity) {
            // City search returned no results — fallback to national
            const { data: nationalMatches } = await supabase
              .from("olera-providers")
              .select("provider_id, provider_name, provider_logo, provider_images, provider_category, city, state, google_rating")
              .eq("deleted", false)
              .not("google_rating", "is", null)
              .gte("google_rating", 4.0)
              .not("provider_images", "is", null)
              .order("google_rating", { ascending: false })
              .limit(6);

            if (nationalMatches && nationalMatches.length > 0) {
              setMatches(nationalMatches as MatchProvider[]);
            }
          }
        } catch (err) {
          console.error("[welcome] Failed to fetch provider recommendations:", err);
        } finally {
          setProvidersLoading(false);
        }
      })();
    }

    init();
  }, [activeProfile, account, destination, router, hasInitialized]);

  // Complete onboarding and redirect (or show confirmation)
  const completeOnboarding = useCallback(async (activateMatches: boolean, showConfirmationAfter: boolean = false, customRedirect?: string) => {
    setSaving(true);

    try {
      // Build the profile update request
      const profileRequest = fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "family",
          displayName: activeProfile?.display_name || account?.display_name || "Family",
          city: city || activeProfile?.city || undefined,
          state: activeProfile?.state || undefined,
          isAddingProfile: true,
        }),
      });

      if (activateMatches) {
        // Run both API calls in parallel for faster completion
        console.log("[welcome] Activating matches with city:", city, "state:", activeProfile?.state);
        const [activateRes, profileRes] = await Promise.all([
          fetch("/api/care-post/activate-matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              city: city || undefined,
              state: activeProfile?.state || undefined,
            }),
          }),
          profileRequest,
        ]);

        if (!activateRes.ok) {
          const errorData = await activateRes.json().catch(() => ({}));
          console.error("[welcome] Failed to activate matches:", activateRes.status, errorData);
        } else {
          const successData = await activateRes.json();
          console.log("[welcome] Matches activated successfully:", successData);
        }

        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          console.error("[welcome] Failed to update profile:", profileRes.status, errorData);
        }
      } else {
        // Just complete the profile update
        const profileRes = await profileRequest;
        if (!profileRes.ok) {
          const errorData = await profileRes.json().catch(() => ({}));
          console.error("[welcome] Failed to update profile:", profileRes.status, errorData);
        }
      }

      // Refresh account data in background — don't wait for it
      refreshAccountData?.();

      if (showConfirmationAfter) {
        setSaving(false);
        setShowConfirmation(true);
      } else {
        router.push(customRedirect || destination);
      }
    } catch (err) {
      console.error("[welcome] Error completing onboarding:", err);
      setSaving(false);
    }
  }, [city, activeProfile, account, refreshAccountData, router, destination]);

  const handleSkip = useCallback(() => {
    if (connection) {
      // Connected user: go to their intended destination (inbox)
      completeOnboarding(false);
    } else {
      // Fresh account: go back to where they were before signup (or landing page)
      completeOnboarding(false, false, preAuthPage || "/");
    }
  }, [completeOnboarding, connection, preAuthPage]);

  const handleActivate = useCallback(() => {
    completeOnboarding(true, true); // Show confirmation after activation
  }, [completeOnboarding]);

  const handleGoToInbox = useCallback(() => {
    setNavigating(true);
    router.push(destination);
  }, [router, destination]);

  const handleViewMatches = useCallback(() => {
    setNavigating(true);
    router.push("/portal/matches");
  }, [router]);

  const handleBrowseProviders = useCallback(() => {
    setNavigating(true);
    router.push("/browse");
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ willChange: "transform" }} />
      </div>
    );
  }

  const cityDisplay = city || "your area";
  const userName = activeProfile?.display_name?.split(" ")[0] || account?.display_name?.split(" ")[0];
  const isConnected = !!connection?.to_profile?.display_name;

  // Toggle this to switch between new and old version during development
  const USE_NEW_VERSION = true;

  // Time-aware greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = userName ? `${getTimeGreeting()}, ${userName}` : getTimeGreeting();

  // ================================================================
  // NEW VERSION — Building on top (Connected State first)
  // ================================================================
  if (USE_NEW_VERSION) {
    return (
      <div className="min-h-screen bg-white">
        {/* Main content container */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ============================================================
              HEADER — Time-aware greeting + Welcome message
              ============================================================ */}
          <section className="pt-8 sm:pt-12 pb-6 sm:pb-8">
            <h1 className="text-[26px] sm:text-[30px] font-semibold text-gray-900 tracking-tight leading-tight">
              {greeting}
            </h1>
            <p className="mt-0.5 text-base sm:text-lg text-gray-500">
              Welcome to Olera
            </p>
          </section>

          {/* ============================================================
              CONNECTION CARD — Provider they're connected with
              ============================================================ */}
          {isConnected && connection?.to_profile && (() => {
            const provider = connection.to_profile;
            const location = [provider.city, provider.state].filter(Boolean).join(", ");
            const hasRatingOrPricing = provider.metadata?.google_rating || provider.metadata?.lower_price;

            return (
              <section className="pb-8">
                {/* Card container */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Provider Image — taller aspect on mobile, fixed width on desktop */}
                    <div className="relative w-full sm:w-[220px] aspect-[16/10] sm:aspect-auto sm:min-h-[200px] flex-shrink-0 bg-gray-100">
                      {provider.image_url ? (
                        <Image
                          src={provider.image_url}
                          alt={provider.display_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: avatarGradient(provider.display_name) }}
                        >
                          <span className="text-4xl font-bold text-white">
                            {getInitials(provider.display_name)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col min-w-0">
                      {/* Provider Name — with line clamp for long names */}
                      <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900 leading-tight line-clamp-2">
                        {provider.display_name}
                      </h2>

                      {/* Location · Category */}
                      <p className="mt-1.5 text-[15px] text-gray-500 line-clamp-1">
                        {location || provider.category || "Care Provider"}
                        {location && provider.category && (
                          <span className="text-gray-300"> · </span>
                        )}
                        {location && provider.category && (
                          <span>{provider.category}</span>
                        )}
                      </p>

                      {/* Rating & Pricing row — only show if data exists */}
                      {hasRatingOrPricing && (
                        <>
                          <div className="my-4 border-t border-gray-100" />
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            {provider.metadata?.google_rating && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-semibold text-gray-900">
                                  {provider.metadata.google_rating.toFixed(1)}
                                </span>
                                {provider.metadata.review_count && (
                                  <span className="text-gray-400">
                                    ({provider.metadata.review_count})
                                  </span>
                                )}
                              </div>
                            )}
                            {provider.metadata?.lower_price && (
                              <div className="text-gray-600">
                                <span className="font-medium text-gray-900">
                                  ${provider.metadata.lower_price.toLocaleString()}
                                  {provider.metadata.upper_price && (
                                    <span>–${provider.metadata.upper_price.toLocaleString()}</span>
                                  )}
                                </span>
                                <span className="text-gray-400">/mo</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Spacer — pushes button to bottom on desktop */}
                      <div className="flex-1 min-h-4" />

                      {/* Message Button — full width on mobile, right-aligned on desktop */}
                      <div className="mt-4 sm:mt-5 flex sm:justify-end">
                        <Link
                          href={`/portal/inbox?provider=${provider.id}`}
                          className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-[15px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ============================================================
              MORE CONTENT — Will build below
              ============================================================ */}
          <div className="pb-16">
            {!isConnected && (
              <p className="text-sm text-gray-400">Fresh account state — no connection yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================================================================
  // OLD VERSION — REFERENCE (set USE_NEW_VERSION = false to render)
  // ================================================================
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle warm gradient background accent */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-warm-50/40 via-vanilla-50/20 to-transparent pointer-events-none" />

      {/* ================================================================
          OPENING — personalized greeting
          ================================================================ */}
      <section className="relative px-4 sm:px-6 pt-10 sm:pt-14 pb-6 animate-fadeIn">
        <div className="max-w-xl mx-auto text-center">
          {connection?.to_profile?.display_name ? (
            <>
              <h1 className="text-[32px] sm:text-[40px] font-display font-bold text-gray-900 leading-[1.15] tracking-tight">
                You&apos;re connected{userName ? `, ${userName}` : ""}.
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Explore more providers and benefits you may qualify for.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[32px] sm:text-[40px] font-display font-bold text-gray-900 leading-[1.15] tracking-tight">
                {userName ? `Welcome, ${userName}.` : "Welcome to Olera."}
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Let&apos;s find the right care for you.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 1 — ACTIVATION CARD
          ================================================================ */}
      <section className="relative px-4 sm:px-6 pt-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
            <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
              {showConfirmation ? (
                /* ============ CONFIRMATION STATE — celebratory ============ */
                <>
                  {/* Animated checkmark with glow */}
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-20" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Celebratory text */}
                  <h2 className="mt-6 text-2xl sm:text-[26px] font-display font-bold text-gray-900 leading-snug">
                    You&apos;re all set!
                  </h2>
                  <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
                    Providers in <span className="text-primary-600 font-semibold">{cityDisplay}</span> can now see your profile.<br className="hidden sm:inline" />
                    We&apos;ll notify you when someone reaches out.
                  </p>

                  {/* Action buttons */}
                  <div className="mt-7 space-y-3">
                    {/* Primary: View matches profile */}
                    <button
                      onClick={handleViewMatches}
                      disabled={navigating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: "100%",
                        minHeight: "52px",
                        padding: "0 24px",
                        backgroundColor: "#4d8a8a",
                        backgroundImage: "linear-gradient(to bottom, #5fa3a3, #4d8a8a)",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: 600,
                        borderRadius: "12px",
                        border: "none",
                        cursor: navigating ? "not-allowed" : "pointer",
                        opacity: navigating ? 0.7 : 1,
                        boxShadow: "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!navigating) {
                          e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #6db3b3, #5fa3a3)";
                          e.currentTarget.style.boxShadow = "0 6px 10px -2px rgba(77, 138, 138, 0.25), 0 3px 6px -2px rgba(77, 138, 138, 0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #5fa3a3, #4d8a8a)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)";
                      }}
                    >
                      {navigating ? (
                        <>
                          <svg style={{ animation: "spin 1s linear infinite", height: "16px", width: "16px" }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Loading...
                        </>
                      ) : (
                        "View my matches"
                      )}
                    </button>

                    {/* Secondary: Context-aware button */}
                    {connection ? (
                      <button
                        onClick={handleGoToInbox}
                        disabled={navigating}
                        className="w-full min-h-[48px] px-6 text-[15px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {navigating ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          "Go to my inbox"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleBrowseProviders}
                        disabled={navigating}
                        className="w-full min-h-[48px] px-6 text-[15px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {navigating ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          "Browse providers"
                        )}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* ============ DEFAULT STATE ============ */
                <>
                  {/* Content stack — clean, minimal */}
                  <div>
                    {/* Illustration */}
                    <DiscoveryIllustration />

                    {/* Headline */}
                    <h2 className="mt-6 text-xl sm:text-[22px] font-display font-bold text-gray-900 leading-snug">
                      {connection?.to_profile?.display_name
                        ? "Let more providers find you"
                        : "Let providers find you"
                      }
                    </h2>

                    {/* Subtext */}
                    <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">
                      Share your care needs once. Providers in your area<br className="hidden sm:inline" /> will reach out to you directly.
                    </p>
                  </div>

                  {/* Action stack */}
                  <div className="mt-7">
                    {/* Primary CTA with explicit inline styles */}
                    <button
                      onClick={handleActivate}
                      disabled={saving}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        minHeight: "52px",
                        padding: "0 24px",
                      backgroundColor: "#4d8a8a",
                      backgroundImage: "linear-gradient(to bottom, #5fa3a3, #4d8a8a)",
                      color: "#ffffff",
                      fontSize: "15px",
                      fontWeight: 600,
                      borderRadius: "12px",
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.5 : 1,
                      boxShadow: "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #6db3b3, #5fa3a3)";
                        e.currentTarget.style.boxShadow = "0 6px 10px -2px rgba(77, 138, 138, 0.25), 0 3px 6px -2px rgba(77, 138, 138, 0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #5fa3a3, #4d8a8a)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)";
                    }}
                  >
                    {saving ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <svg style={{ animation: "spin 1s linear infinite", height: "16px", width: "16px" }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Yes, let providers find me"
                    )}
                    </button>

                    {/* Secondary option — equally valid */}
                    <button
                      onClick={handleSkip}
                      disabled={saving}
                      className="mt-3 w-full min-h-[48px] px-6 text-[15px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                    >
                      {connection ? "Take me to my inbox" : "I'll explore on my own"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2 — BENEFITS
          ================================================================ */}
      <section className="relative px-4 sm:px-6 pt-2 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            While you&apos;re here
          </p>
          <BenefitsCard />
        </div>
      </section>

      {/* ================================================================
          SECTION 3 — PROVIDER RECOMMENDATIONS (horizontal scroll)
          ================================================================ */}
      <section className="relative pt-10 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with View all button */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900">
                {city ? (
                  <>Top-rated providers in {city}</>
                ) : (
                  "Top-rated providers"
                )}
              </h2>
              <p className="text-gray-500 mt-1">
                Highly reviewed care providers {city ? `near ${city}` : "in your area"}
              </p>
            </div>
            {matches.length > 0 && (
              <Link
                href="/browse"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors flex-shrink-0"
              >
                View all providers
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Horizontal scroll container — 2 cards visible + third peeking */}
          {matches.length > 0 ? (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {matches.map((provider) => (
                <div key={provider.provider_id} className="snap-start flex-shrink-0">
                  <ProviderScrollCard provider={provider} />
                </div>
              ))}
            </div>
          ) : providersLoading ? (
            /* Loading skeleton placeholders */
            <div
              className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`placeholder-${i}`} className="w-[280px] min-w-[280px]">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                    <div className="h-40 sm:h-48 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-primary-100/60 animate-pulse" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state — no providers to show */
            <div className="bg-gradient-to-br from-gray-50 to-primary-50/30 rounded-2xl border border-gray-200/60 p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Find providers near you</h3>
              <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
                Browse our network of trusted care providers and find the right match for your needs.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
              >
                Browse all providers
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Mobile View all button — only show when we have provider cards */}
          {matches.length > 0 && (
            <div className="mt-6 sm:hidden">
              <Link
                href="/browse"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
              >
                View all providers
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Animations and scrollbar hiding */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        /* Hide scrollbar for horizontal scroll containers */
        [style*="scrollbar-width: none"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
