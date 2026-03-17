"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// Types
// ============================================================

interface WelcomeClientProps {
  destination: string;
}

interface ProviderMatch {
  provider_id: string;
  provider_name: string;
  provider_logo: string | null;
  provider_images: string | null;
  provider_category: string;
}

interface ConnectionWithProvider {
  id: string;
  to_profile: {
    id: string;
    display_name: string;
    image_url: string | null;
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

/** Get first initial from a name */
function getInitial(name: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

// ============================================================
// Helper Components
// ============================================================

function ProviderAvatar({
  name,
  imageUrl,
  size = "md"
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm"
    ? "w-7 h-7 text-xs"
    : "w-12 h-12 text-base";

  if (imageUrl) {
    return (
      <div className={`${sizeClasses} rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-white shadow-sm`}>
        <Image
          src={imageUrl}
          alt={name}
          width={size === "sm" ? 28 : 48}
          height={size === "sm" ? 28 : 48}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}
      style={{ background: avatarGradient(name) }}
    >
      <span className="font-semibold text-white">{getInitial(name)}</span>
    </div>
  );
}

function ProviderCard({ provider }: { provider: ProviderMatch }) {
  const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")?.[0] || null;

  return (
    <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <ProviderAvatar name={provider.provider_name} imageUrl={imageUrl} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
          {provider.provider_name}
        </p>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {provider.provider_category}
        </p>
      </div>
      <span className="px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full flex-shrink-0 border border-primary-100">
        Interested
      </span>
    </div>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  const names = ["Sunrise Senior Care", "Comfort Home Health", "Golden Years Living"];
  const types = ["Assisted Living", "Home Care", "Memory Care"];

  return (
    <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <ProviderAvatar name={names[index]} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
          {names[index]}
        </p>
        <p className="text-sm text-gray-500 truncate mt-0.5">{types[index]}</p>
      </div>
      <span className="px-2.5 py-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full flex-shrink-0 border border-primary-100">
        Interested
      </span>
    </div>
  );
}

function BenefitsCard() {
  return (
    <Link
      href="/benefits/finder"
      className="group flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50/80 to-vanilla-100 rounded-2xl border border-primary-100/60 hover:border-primary-200 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
    >
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-primary-100/40">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900">Care may be covered</p>
        <p className="text-sm text-gray-500 mt-0.5">Find benefits you qualify for · 3 min</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function WelcomeClient({ destination }: WelcomeClientProps) {
  const router = useRouter();
  const { account, activeProfile, refreshAccountData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState<ConnectionWithProvider | null>(null);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
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

      // Get city from profile
      setCity(activeProfile.city || null);

      // Check for connection record with provider info
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
          setConnection(connections[0] as ConnectionWithProvider);
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch connection:", err);
      }

      // Fetch matches for provider cards
      try {
        const res = await fetch("/api/matches/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 3 }),
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(data.providers?.slice(0, 3) || []);
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
        // Activate matches
        await fetch("/api/care-post/activate-matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: city || undefined,
            state: activeProfile?.state || undefined,
          }),
        });
      }

      // Mark onboarding complete via create-profile
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

      // Refresh auth state
      await refreshAccountData?.();

      // Redirect to destination
      router.push(destination);
    } catch (err) {
      console.error("[welcome] Error completing onboarding:", err);
      setSaving(false);
    }
  }, [city, activeProfile, account, refreshAccountData, router, destination]);

  // Handle skip / decline
  const handleSkip = useCallback(() => {
    completeOnboarding(false);
  }, [completeOnboarding]);

  // Handle activate matches
  const handleActivate = useCallback(() => {
    completeOnboarding(true);
  }, [completeOnboarding]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const headline = city
    ? `Providers in ${city} are ready to reach out to you.`
    : "Providers near you are ready to reach out to you.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-100 via-gray-50 to-gray-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg">
            <Image
              src="/images/olera-logo.svg"
              alt="Olera"
              width={80}
              height={24}
              priority
            />
          </Link>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 min-h-[44px] px-3 -mr-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-[480px] mx-auto space-y-8">
          {/* Provider Crumb — only if connection exists */}
          {connection?.to_profile && (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <ProviderAvatar
                name={connection.to_profile.display_name}
                imageUrl={connection.to_profile.image_url}
                size="sm"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {connection.to_profile.display_name}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-semibold text-primary-600">Message sent</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="font-serif text-display-sm sm:text-display-md text-gray-900 leading-tight tracking-tight">
            {headline}
          </h1>

          {/* Provider Cards */}
          <div className="space-y-3">
            {matches.length > 0
              ? matches.map((provider) => (
                  <ProviderCard key={provider.provider_id} provider={provider} />
                ))
              : [0, 1, 2].map((i) => <PlaceholderCard key={i} index={i} />)}
          </div>

          {/* Primary Button */}
          <button
            onClick={handleActivate}
            disabled={saving}
            className="w-full min-h-[52px] px-6 bg-gradient-to-b from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-[15px] rounded-xl transition-all duration-200 shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Yes, let providers find me"
            )}
          </button>

          {/* Decline Link */}
          <div className="text-center">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 min-h-[44px] px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              No thanks, take me to my inbox
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Benefits Card */}
          <BenefitsCard />
        </div>
      </main>

      {/* Fade-in animation for provider crumb */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
