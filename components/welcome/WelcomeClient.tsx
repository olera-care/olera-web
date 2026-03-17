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
// Illustration Component (from Matches empty state)
// ============================================================

function MatchIllustration() {
  return (
    <div className="w-28 h-28 mx-auto">
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

/** Horizontal scroll provider card (comparison style) */
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
      careTypes: [],
      image: imageUrl,
      rating: provider.google_rating ?? undefined,
    });
  };

  return (
    <Link
      href={`/provider/${provider.provider_id}`}
      className="flex-shrink-0 w-[280px] bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
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
          </div>
        )}

        {/* Heart save button — 44px touch target for WCAG compliance */}
        <button
          onClick={handleSave}
          className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1"
          aria-label={saved ? "Remove from saved" : "Save provider"}
        >
          <svg
            className={`w-5 h-5 transition-colors ${saved ? "text-red-500 fill-red-500" : "text-gray-600"}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Rating badge */}
        {provider.google_rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">
            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{provider.google_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{provider.provider_name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{provider.provider_category}</p>
        {location && <p className="text-xs text-gray-400 mt-1">{location}</p>}
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

      // Check if onboarding completed AND matches already active → skip
      const metadata = (activeProfile.metadata || {}) as Record<string, unknown>;
      const carePost = metadata.care_post as { status?: string } | undefined;

      if (account?.onboarding_completed && carePost?.status === "active") {
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

  // Complete onboarding and redirect
  const completeOnboarding = useCallback(async (activateMatches: boolean) => {
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
      router.push(destination);
    } catch (err) {
      console.error("[welcome] Error completing onboarding:", err);
      setSaving(false);
    }
  }, [city, activeProfile, account, refreshAccountData, router, destination]);

  const handleSkip = useCallback(() => {
    completeOnboarding(false);
  }, [completeOnboarding]);

  const handleActivate = useCallback(() => {
    completeOnboarding(true);
  }, [completeOnboarding]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cityDisplay = city || "your area";

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* ================================================================
          NAV — matches provider onboarding pattern
          ================================================================ */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>

            {/* Skip button — outlined style */}
            <button
              onClick={handleSkip}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================
          SECTION 1 — ACTIVATION CARD
          ================================================================ */}
      <section className="px-4 sm:px-6 pt-12 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden">
            <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
              {/* Label */}
              <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase mb-6">
                Find Your Match
              </p>

              {/* Illustration */}
              <MatchIllustration />

              {/* Headline */}
              <h1 className="mt-8 text-2xl sm:text-[28px] font-display font-bold text-gray-900 leading-tight">
                Providers in{" "}
                <span className="text-primary-600">{cityDisplay}</span>
                {" "}are ready to connect.
              </h1>

              {/* Subtext */}
              <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                Let them reach out — no searching required.
              </p>

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
                  marginTop: "28px",
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
          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2 — BENEFITS
          ================================================================ */}
      <section className="px-4 sm:px-6 pb-16">
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
      {matches.length > 0 && (
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-5">
              Other providers in{" "}
              <span className="text-primary-600">{cityDisplay}</span>
              {" "}you may like
            </h2>

            {/* Horizontal scroll container */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            >
              {matches.map((provider) => (
                <ProviderScrollCard key={provider.provider_id} provider={provider} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
