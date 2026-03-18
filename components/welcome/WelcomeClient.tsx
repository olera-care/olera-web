"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSavedProviders } from "@/hooks/use-saved-providers";

// ============================================================
// Types
// ============================================================

interface WelcomeClientProps {
  destination: string;
}

interface ProviderCard {
  id: string;
  display_name: string;
  image_url: string | null;
  care_types: string[];
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
    display_name: string;
    image_url: string | null;
  } | null;
}

// Placeholder data for when real providers aren't available
const PLACEHOLDER_PROVIDERS: ProviderCard[] = [
  { id: "placeholder-1", display_name: "Sunrise Senior Care", image_url: null, care_types: ["Assisted Living"] },
  { id: "placeholder-2", display_name: "Comfort Home Health", image_url: null, care_types: ["Home Care"] },
  { id: "placeholder-3", display_name: "Golden Years Living", image_url: null, care_types: ["Memory Care"] },
];

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
// Illustration Component — warm, human, connection-focused
// ============================================================

function MatchIllustration() {
  return (
    <div className="w-20 h-20 mx-auto">
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        {/* Warm background glow */}
        <circle cx="40" cy="40" r="38" fill="#F9EDE0" />
        <circle cx="40" cy="40" r="28" fill="#F2D8BD" fillOpacity="0.5" />

        {/* Two people connecting — warm and teal */}
        {/* Left person (warm) */}
        <circle cx="28" cy="32" r="7" fill="#E9BD91" />
        <path
          d="M18 50c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="#E9BD91"
          fillOpacity="0.6"
        />

        {/* Right person (teal) */}
        <circle cx="52" cy="32" r="7" fill="#5FA3A3" />
        <path
          d="M42 50c0-5.5 4.5-10 10-10s10 4.5 10 10"
          fill="#5FA3A3"
          fillOpacity="0.6"
        />

        {/* Connection heart/bridge between them */}
        <path
          d="M36 38 Q40 32 44 38"
          stroke="#D67F42"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Subtle sparkle */}
        <circle cx="40" cy="28" r="2" fill="#D67F42" opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
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
      className="group flex-shrink-0 w-[calc(50vw-24px)] sm:w-[280px] bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
    >
      {/* Image */}
      <div className="relative h-36 sm:h-44 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
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
      <div className="p-4">
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

        {/* Category tag */}
        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-full">
          {provider.provider_category}
        </span>

        {/* Location */}
        {location && (
          <p className="text-xs text-gray-500 mt-2">{location}</p>
        )}
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [connection, setConnection] = useState<ConnectionWithProvider | null>(null);
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [matches, setMatches] = useState<MatchProvider[]>([]);
  const [city, setCity] = useState<string | null>(null);

  // Check if should skip and load initial data
  useEffect(() => {
    async function init() {
      if (!activeProfile) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Check if onboarding already completed → skip
      if (account?.onboarding_completed === true) {
        router.replace(destination);
        return;
      }

      // Get city and state from profile
      setCity(activeProfile.city || null);
      const familyState = activeProfile.state;
      const familyCareTypes = activeProfile.care_types || [];

      // Check for connection record with provider info
      let connectedProviderId: string | null = null;
      try {
        const { data: connections } = await supabase
          .from("connections")
          .select(`
            id,
            to_profile:business_profiles!connections_to_profile_id_fkey(
              id, display_name, image_url
            )
          `)
          .eq("from_profile_id", activeProfile.id)
          .eq("type", "inquiry")
          .order("created_at", { ascending: false })
          .limit(1);

        if (connections && connections.length > 0) {
          const conn = connections[0] as ConnectionWithProvider;
          setConnection(conn);
          connectedProviderId = conn.to_profile?.id || null;
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch connection:", err);
      }

      // Fetch real providers from business_profiles (for activation card - not used in new design but kept for logic)
      try {
        let query = supabase
          .from("business_profiles")
          .select("id, display_name, image_url, care_types")
          .in("type", ["organization", "caregiver"])
          .eq("is_active", true);

        if (familyState) {
          query = query.eq("state", familyState);
        }

        if (connectedProviderId) {
          query = query.neq("id", connectedProviderId);
        }

        query = query.order("image_url", { ascending: false, nullsFirst: false });
        query = query.limit(10);

        const { data: providerData, error } = await query;

        if (!error && providerData && providerData.length > 0) {
          let filteredProviders = providerData as ProviderCard[];

          if (familyCareTypes.length > 0) {
            const withOverlap = filteredProviders.filter((p) =>
              p.care_types?.some((ct) => familyCareTypes.includes(ct))
            );
            const withoutOverlap = filteredProviders.filter(
              (p) => !p.care_types?.some((ct) => familyCareTypes.includes(ct))
            );
            filteredProviders = [...withOverlap, ...withoutOverlap];
          }

          const topProviders = filteredProviders.slice(0, 3);

          if (topProviders.length < 3) {
            const placeholdersNeeded = 3 - topProviders.length;
            const fillers = PLACEHOLDER_PROVIDERS.slice(0, placeholdersNeeded);
            setProviders([...topProviders, ...fillers]);
          } else {
            setProviders(topProviders);
          }
        } else {
          setProviders(PLACEHOLDER_PROVIDERS);
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch providers:", err);
        setProviders(PLACEHOLDER_PROVIDERS);
      }

      // Fetch matches for Section 3 horizontal scroll
      try {
        const res = await fetch("/api/matches/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 6 }),
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(data.providers?.slice(0, 6) || []);
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch matches:", err);
      }

      setLoading(false);
    }

    init();
  }, [activeProfile, account, destination, router]);

  // Complete onboarding and redirect (or show confirmation)
  const completeOnboarding = useCallback(async (activateMatches: boolean, showConfirmationAfter: boolean = false) => {
    setSaving(true);

    try {
      if (activateMatches) {
        await fetch("/api/care-post/activate-matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: city || undefined,
            state: activeProfile?.state || undefined,
          }),
        });
      }

      await fetch("/api/auth/create-profile", {
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

      await refreshAccountData?.();

      if (showConfirmationAfter) {
        setSaving(false);
        setShowConfirmation(true);
      } else {
        router.push(destination);
      }
    } catch (err) {
      console.error("[welcome] Error completing onboarding:", err);
      setSaving(false);
    }
  }, [city, activeProfile, account, refreshAccountData, router, destination]);

  const handleSkip = useCallback(() => {
    completeOnboarding(false);
  }, [completeOnboarding]);

  const handleActivate = useCallback(() => {
    completeOnboarding(true, true); // Show confirmation after activation
  }, [completeOnboarding]);

  const handleGoToInbox = useCallback(() => {
    router.push(destination);
  }, [router, destination]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ willChange: "transform" }} />
      </div>
    );
  }

  const cityDisplay = city || "your area";

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* ================================================================
          OPENING — dynamic greeting based on connection state
          ================================================================ */}
      <section className="px-4 sm:px-6 pt-10 sm:pt-16 pb-8 animate-fadeIn">
        <div className="max-w-xl mx-auto text-center">
          {connection?.to_profile?.display_name ? (
            <>
              <h1 className="text-[32px] sm:text-[40px] font-display font-bold text-gray-900 leading-[1.15] tracking-tight">
                You&apos;re connected with{" "}
                <span className="text-primary-600">{connection.to_profile.display_name}</span>.
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                We&apos;ll notify you when they respond.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[32px] sm:text-[40px] font-display font-bold text-gray-900 leading-[1.15] tracking-tight">
                Welcome to Olera.
              </h1>
              <p className="mt-4 text-lg text-gray-500">
                Let&apos;s find the right care for you.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ================================================================
          SECTION 1 — ACTIVATION CARD
          ================================================================ */}
      <section className="px-4 sm:px-6 pt-8 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden">
            <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
              {showConfirmation ? (
                /* ============ CONFIRMATION STATE ============ */
                <>
                  {/* Checkmark */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Confirmation text */}
                  <h2 className="mt-6 text-xl sm:text-2xl font-display font-bold text-gray-900 leading-tight">
                    You&apos;re on the list.
                  </h2>
                  <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                    Providers in <span className="text-primary-600 font-medium">{cityDisplay}</span> will start reaching out soon.
                  </p>

                  {/* Go to inbox button */}
                  <button
                    onClick={handleGoToInbox}
                    className="group"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: "52px",
                      marginTop: "28px",
                      padding: "0 24px",
                      backgroundColor: "#4d8a8a",
                      backgroundImage: "linear-gradient(to bottom, #5fa3a3, #4d8a8a)",
                      color: "#ffffff",
                      fontSize: "15px",
                      fontWeight: 600,
                      borderRadius: "12px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #6db3b3, #5fa3a3)";
                      e.currentTarget.style.boxShadow = "0 6px 10px -2px rgba(77, 138, 138, 0.25), 0 3px 6px -2px rgba(77, 138, 138, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundImage = "linear-gradient(to bottom, #5fa3a3, #4d8a8a)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(77, 138, 138, 0.2), 0 2px 4px -1px rgba(77, 138, 138, 0.1)";
                    }}
                  >
                    Go to my inbox
                  </button>
                </>
              ) : (
                /* ============ DEFAULT STATE ============ */
                <>
                  {/* Content stack — illustration, headline, subtext */}
                  <div className="space-y-5">
                    {/* Illustration */}
                    <MatchIllustration />

                    {/* Headline — simplified */}
                    <h2 className="text-xl sm:text-[22px] font-display font-bold text-gray-900 leading-snug">
                      {connection?.to_profile?.display_name
                        ? "Let more providers find you"
                        : "Let providers find you"
                      }
                    </h2>

                    {/* Subtext — shorter */}
                    <p className="text-[15px] text-gray-500 leading-relaxed">
                      Get matched with care providers in your area.
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

                    {/* Plain text link */}
                    <p className="mt-4">
                      <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 focus:outline-none focus:underline focus:text-gray-600"
                      >
                        No thanks, take me to my inbox
                      </button>
                    </p>
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
      <section className="px-4 sm:px-6 pt-2 pb-4">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">
            Explore the benefits center
          </h2>
          <BenefitsCard />
        </div>
      </section>

      {/* ================================================================
          SECTION 3 — PROVIDER RECOMMENDATIONS (horizontal scroll)
          ================================================================ */}
      <section className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-5">
            {city ? (
              <>
                Other providers in{" "}
                <span className="text-primary-600">{city}</span>
                {" "}you may like
              </>
            ) : (
              "Other providers you may like"
            )}
          </h2>

          {/* Horizontal scroll container — 2 cards visible + third peeking */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {matches.length > 0 ? (
              matches.map((provider) => (
                <div key={provider.provider_id} className="snap-start">
                  <ProviderScrollCard provider={provider} />
                </div>
              ))
            ) : (
              /* Placeholder cards when no matches available */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`placeholder-${i}`} className="snap-start flex-shrink-0 w-[calc(50vw-24px)] sm:w-[280px]">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="h-36 sm:h-44 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-primary-100/60 animate-pulse" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
