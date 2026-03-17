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
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  const imgSize = { sm: 28, md: 40, lg: 48 }[size];

  if (imageUrl) {
    return (
      <div className={`${sizeClasses} rounded-full overflow-hidden bg-gray-100 flex-shrink-0`}>
        <Image
          src={imageUrl}
          alt={name}
          width={imgSize}
          height={imgSize}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ background: avatarGradient(name) }}
    >
      <span className="font-semibold text-white">{getInitial(name)}</span>
    </div>
  );
}

/** Compact grid card for provider with staggered animation */
function ProviderGridCard({ provider, index }: { provider: ProviderMatch; index: number }) {
  const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")?.[0] || null;

  return (
    <div
      className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200/80 animate-card-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <ProviderAvatar name={provider.provider_name} imageUrl={imageUrl} size="lg" />
      <p className="mt-2.5 text-sm font-medium text-gray-900 text-center line-clamp-1">
        {provider.provider_name}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 text-center line-clamp-1">
        {provider.provider_category}
      </p>
      {/* Small interested badge with pulsing green dot */}
      <span className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-primary-700 bg-primary-50/80 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-subtle" />
        Interested
      </span>
    </div>
  );
}

/** Placeholder grid card with staggered animation */
function PlaceholderGridCard({ index }: { index: number }) {
  const names = ["Sunrise Senior Care", "Comfort Home Health", "Golden Years Living"];
  const types = ["Assisted Living", "Home Care", "Memory Care"];

  return (
    <div
      className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200/80 animate-card-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <ProviderAvatar name={names[index]} size="lg" />
      <p className="mt-2.5 text-sm font-medium text-gray-900 text-center line-clamp-1">
        {names[index]}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 text-center line-clamp-1">
        {types[index]}
      </p>
      {/* Small interested badge with pulsing green dot */}
      <span className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-primary-700 bg-primary-50/80 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-subtle" />
        Interested
      </span>
    </div>
  );
}

function BenefitsCard() {
  return (
    <Link
      href="/benefits/finder"
      className="group flex items-center gap-4 p-4 bg-gradient-to-r from-warm-50 to-vanilla-100 rounded-xl border border-warm-100/60 hover:border-warm-200 transition-all focus:outline-none focus:ring-2 focus:ring-warm-300 focus:ring-offset-2"
    >
      {/* Warm lightbulb icon */}
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-warm-100/60">
        <svg className="w-5 h-5 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900">Care may be covered</p>
        <p className="text-sm text-gray-500 mt-0.5">Find benefits you qualify for · 3 min</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-warm-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Headline with city accent in teal
  const headlineStart = "Providers in ";
  const headlineEnd = " are ready to reach out to you.";
  const cityDisplay = city || "your area";

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg">
            <Image
              src="/images/olera-logo.png"
              alt="Olera"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </Link>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6">
        <div className="max-w-[480px] mx-auto">
          {/* Provider Crumb — only if connection exists */}
          {connection?.to_profile && (
            <div className="flex items-center gap-2.5 pt-6 animate-fade-in">
              <ProviderAvatar
                name={connection.to_profile.display_name}
                imageUrl={connection.to_profile.image_url}
                size="sm"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {connection.to_profile.display_name}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-medium text-primary-600">Message sent</span>
            </div>
          )}

          {/* Headline — with 48px+ breathing room above, city in teal */}
          <h1 className="pt-12 font-serif text-display-sm sm:text-display-md text-gray-900 leading-tight tracking-tight">
            {headlineStart}
            <span className="text-primary-600">{cityDisplay}</span>
            {headlineEnd}
          </h1>

          {/* Provider Cards — 3-column grid with staggered entrance */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {matches.length > 0
              ? matches.map((provider, i) => (
                  <ProviderGridCard key={provider.provider_id} provider={provider} index={i} />
                ))
              : [0, 1, 2].map((i) => <PlaceholderGridCard key={i} index={i} />)}
          </div>

          {/* Primary Button */}
          <button
            onClick={handleActivate}
            disabled={saving}
            className="mt-8 w-full min-h-[52px] px-6 bg-gradient-to-b from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-[15px] rounded-xl transition-all duration-200 shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
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

          {/* Decline Link — plain text, no button styling */}
          <p className="mt-4 text-center">
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              No thanks, take me to my inbox
            </button>
          </p>

          {/* Divider */}
          <div className="mt-8 border-t border-gray-200" />

          {/* Benefits Card */}
          <div className="mt-6 pb-16 sm:pb-20">
            <BenefitsCard />
          </div>
        </div>
      </main>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* Staggered card entrance */
        @keyframes card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-card-in {
          opacity: 0;
          animation: card-in 0.4s ease-out forwards;
        }

        /* Subtle pulse for green dot */
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
