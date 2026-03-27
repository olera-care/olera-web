"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { useSavedBenefits } from "@/hooks/use-saved-benefits";
import { PRE_AUTH_PAGE_KEY } from "@/components/auth/UnifiedAuthModal";
import CompactProviderCard from "@/components/providers/CompactProviderCard";
import type { Provider } from "@/components/providers/ProviderCard";
import { useProfileCompleteness } from "@/components/portal/profile/completeness";
import ProfileWizard from "@/components/welcome/ProfileWizard";
import BenefitsWizard from "@/components/welcome/BenefitsWizard";
import GoLiveModal from "@/components/welcome/GoLiveModal";
import type { FamilyMetadata } from "@/lib/types";

// ============================================================
// Types
// ============================================================

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

interface WelcomeClientProps {
  destination: string;
  initialProviders?: MatchProvider[];
  initialCity?: string | null;
}

interface ConnectionWithProvider {
  id: string;
  from_profile_id?: string;
  metadata?: {
    thread?: Array<{
      from_profile_id: string;
      text: string;
      created_at: string;
      is_auto_reply?: boolean;
    }>;
    [key: string]: unknown;
  } | null;
  to_profile: {
    id: string;
    slug: string | null;
    source_provider_id: string | null;
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

// ============================================================
// Confetti Celebration Component
// ============================================================

function ConfettiCelebration() {
  // More refined, premium confetti colors (Olera teal, warm gold, soft purple, rose)
  const colors = ['#199087', '#199087', '#10b981', '#f59e0b', '#d4a574', '#a78bfa', '#f472b6'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Generate confetti pieces - varied shapes for visual interest */}
      {Array.from({ length: 60 }).map((_, i) => {
        const color = colors[i % colors.length];
        const left = 10 + Math.random() * 80; // Keep within 10-90% to avoid edge clustering
        const delay = Math.random() * 0.8;
        const duration = 2.5 + Math.random() * 1.5;
        const size = 5 + Math.random() * 7;
        const rotation = Math.random() * 360;
        const swayAmount = 15 + Math.random() * 30;
        const swayDirection = Math.random() > 0.5 ? 1 : -1;

        // Varied shapes: circles, squares, rectangles (confetti strips)
        const shapeType = Math.random();
        const isCircle = shapeType < 0.3;
        const isStrip = shapeType > 0.7;

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: isStrip ? `${size * 0.4}px` : `${size}px`,
              height: isStrip ? `${size * 1.8}px` : `${size}px`,
              backgroundColor: color,
              borderRadius: isCircle ? '50%' : '2px',
              transform: `rotate(${rotation}deg)`,
              animation: `confetti-fall-${swayDirection > 0 ? 'right' : 'left'} ${duration}s ease-out ${delay}s forwards`,
              ['--sway' as string]: `${swayAmount * swayDirection}px`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall-right {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) translateX(var(--sway)) rotate(180deg);
          }
          50% {
            transform: translateY(50vh) translateX(0) rotate(360deg);
          }
          75% {
            transform: translateY(75vh) translateX(calc(var(--sway) * -0.5)) rotate(540deg);
          }
          100% {
            transform: translateY(100vh) translateX(var(--sway)) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes confetti-fall-left {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) translateX(calc(var(--sway) * -1)) rotate(-180deg);
          }
          50% {
            transform: translateY(50vh) translateX(0) rotate(-360deg);
          }
          75% {
            transform: translateY(75vh) translateX(calc(var(--sway) * 0.5)) rotate(-540deg);
          }
          100% {
            transform: translateY(100vh) translateX(calc(var(--sway) * -1)) rotate(-720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

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
  const searchParams = useSearchParams();
  const { account, activeProfile, refreshAccountData, user, isLoading: authLoading } = useAuth();

  // URL params for instant connection (from guest connection flow)
  const connectionIdParam = searchParams.get("connection");
  const providerSlugParam = searchParams.get("provider");
  const scrollRef = useRef<HTMLDivElement>(null);
  const providerScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // NO loading gate — page renders immediately. Auth resolves in background.
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [connection, setConnection] = useState<ConnectionWithProvider | null>(null);

  // Client-side provider fetching (replaces server-side to avoid blocking page render)
  const [matches, setMatches] = useState<MatchProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  // hasInitialized removed — page renders immediately without auth gate
  const [preAuthPage, setPreAuthPage] = useState<string | null>(null);

  // Fetch providers client-side (non-blocking, below the fold)
  useEffect(() => {
    async function fetchProviders() {
      try {
        const supabase = createClient();
        const userCity = activeProfile?.city || null;
        if (userCity) setCity(userCity);

        const query = supabase
          .from("olera-providers")
          .select("provider_id, provider_name, provider_logo, provider_images, provider_category, city, state, google_rating")
          .eq("deleted", false)
          .not("google_rating", "is", null)
          .gte("google_rating", 4.0)
          .not("provider_images", "is", null)
          .order("google_rating", { ascending: false })
          .order("provider_name", { ascending: true })
          .limit(6);

        if (userCity) query.eq("city", userCity);
        const { data } = await query;
        if (data?.length) {
          setMatches(data as MatchProvider[]);
        } else if (userCity) {
          // Fallback to national if city has no results
          const { data: national } = await supabase
            .from("olera-providers")
            .select("provider_id, provider_name, provider_logo, provider_images, provider_category, city, state, google_rating")
            .eq("deleted", false)
            .not("google_rating", "is", null)
            .gte("google_rating", 4.0)
            .not("provider_images", "is", null)
            .order("google_rating", { ascending: false })
            .order("provider_name", { ascending: true })
            .limit(6);
          if (national?.length) setMatches(national as MatchProvider[]);
        }
      } catch (err) {
        console.error("[welcome] Provider fetch failed:", err);
      } finally {
        setProvidersLoading(false);
      }
    }
    fetchProviders();
  // Re-fetch when profile loads (may have city now)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.city]);

  // Profile wizard state
  const [profileWizardOpen, setProfileWizardOpen] = useState(false);

  // Benefits wizard state
  const [benefitsWizardOpen, setBenefitsWizardOpen] = useState(false);

  // Profile activation state (for "Go Live" action)
  const [activatingProfile, setActivatingProfile] = useState(false);

  // Go Live modal state (shown from Matches card or after profile wizard)
  const [goLiveModalOpen, setGoLiveModalOpen] = useState(false);

  // Track if user has viewed benefits (for gamification)
  const [hasViewedBenefits, setHasViewedBenefits] = useState(false);

  // Track if user has completed the onboarding (made a Go Live decision)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Track if user JUST went live (for immediate UI feedback before auth state refreshes)
  const [justWentLive, setJustWentLive] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  // Track if this is a returning user
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Check localStorage on mount for benefits view status, celebration, and visit tracking
  useEffect(() => {
    try {
      const viewed = localStorage.getItem("olera_viewed_benefits");
      if (viewed === "true") {
        setHasViewedBenefits(true);
      }
      const completed = localStorage.getItem("olera_completed_onboarding");
      if (completed === "true") {
        setHasCompletedOnboarding(true);
      }
      const celebrated = localStorage.getItem("olera_onboarding_celebrated");
      if (celebrated === "true") {
        setCelebrationShown(true);
      }

      // Visit tracking for "Welcome back" messaging
      const lastVisit = localStorage.getItem("olera_welcome_last_visit");
      const now = Date.now();

      if (lastVisit) {
        const hoursSinceLastVisit = (now - parseInt(lastVisit, 10)) / (1000 * 60 * 60);
        // Consider "returning" if more than 1 hour since last visit
        if (hoursSinceLastVisit > 1) {
          setIsReturningUser(true);
        }
      }

      // Update last visit timestamp
      localStorage.setItem("olera_welcome_last_visit", now.toString());
    } catch { /* localStorage not available */ }
  }, []);

  // Profile completeness tracking
  const { percentage: profilePercentage, firstIncompleteStep } = useProfileCompleteness(
    activeProfile ?? null,
    user?.email
  );

  // Saved benefits tracking
  const { savedCount: benefitsSavedCount } = useSavedBenefits();

  // Profile live status — aligned with Matches page logic
  // Uses metadata.care_post.status === "active" (set by /api/care-post/activate-matches)
  // Also considers justWentLive for immediate UI feedback before auth state refreshes
  const carePostStatus = ((activeProfile?.metadata as FamilyMetadata)?.care_post?.status) || null;
  const isProfileLive = carePostStatus === "active" || justWentLive;

  // Go Live validation — minimum data required for meaningful matching
  // Providers filter by location and care types, so we require both
  const hasLocation = Boolean(activeProfile?.city && activeProfile?.state);
  const hasCareTypes = Boolean(activeProfile?.care_types && activeProfile.care_types.length > 0);
  const canGoLive = hasLocation && hasCareTypes;
  const goLiveMissingItems: string[] = [];
  if (!hasLocation) goLiveMissingItems.push("location");
  if (!hasCareTypes) goLiveMissingItems.push("care needs");

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

  // Fetch connection data immediately if connection ID is in URL
  // This runs independently of auth state to speed up initial load
  useEffect(() => {
    if (!connectionIdParam || connection) return;

    async function fetchConnection() {
      const supabase = createClient();
      try {
        // Fetch connection directly by ID - no need to wait for activeProfile
        // Include metadata to check if user has sent messages
        const { data: conn } = await supabase
          .from("connections")
          .select(`
            id,
            metadata,
            from_profile_id,
            to_profile:business_profiles!connections_to_profile_id_fkey(
              id, slug, source_provider_id, display_name, image_url, city, state, category, metadata
            )
          `)
          .eq("id", connectionIdParam)
          .single();

        if (conn?.to_profile) {
          let enrichedConn = conn as ConnectionWithProvider;

          // Enrich with iOS data in parallel
          const iosKey = conn.to_profile.source_provider_id || conn.to_profile.slug;
          if (iosKey) {
            const { data: iosData } = await supabase
              .from("olera-providers")
              .select("provider_logo, provider_images, google_rating, review_count, lower_price, upper_price")
              .eq("provider_id", iosKey)
              .single();

            if (iosData) {
              const iosImage = iosData.provider_logo || iosData.provider_images?.split(" | ")[0] || null;
              enrichedConn = {
                ...enrichedConn,
                to_profile: {
                  ...enrichedConn.to_profile!,
                  image_url: enrichedConn.to_profile!.image_url || iosImage,
                  metadata: {
                    ...((enrichedConn.to_profile!.metadata || {}) as Record<string, unknown>),
                    ...(iosData.google_rating ? { google_rating: iosData.google_rating } : {}),
                    ...(iosData.review_count ? { review_count: iosData.review_count } : {}),
                    ...(iosData.lower_price ? { lower_price: iosData.lower_price } : {}),
                    ...(iosData.upper_price ? { upper_price: iosData.upper_price } : {}),
                  },
                },
              };
            }
          }

          setConnection(enrichedConn);

          // Clear localStorage now that we have the real data
          try {
            localStorage.removeItem("olera_pending_connection");
          } catch {
            // localStorage not available
          }
          if (enrichedConn.to_profile?.city) {
            setCity(enrichedConn.to_profile.city);
          }
          return; // Successfully fetched, exit early
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch connection from DB:", err);
      }
      // Fallback: Use localStorage data if DB fetch failed (e.g., RLS blocked due to no session yet)
      try {
        const stored = localStorage.getItem("olera_pending_connection");
        if (stored) {
          const pending = JSON.parse(stored);
          if (pending.connectionId === connectionIdParam) {
            console.log("[welcome] Using localStorage fallback for connection");
            // Create a minimal connection object from localStorage + iOS data
            const supabase = createClient();
            const providerSlug = pending.providerSlug || providerSlugParam;
            // Use providerId for iOS lookup, fall back to slug
            const lookupId = pending.providerId || providerSlug;

            // Try to get provider info from olera-providers
            const { data: iosData } = await supabase
              .from("olera-providers")
              .select("provider_id, provider_name, provider_logo, provider_images, google_rating, review_count, lower_price, upper_price, city, state, provider_category")
              .eq("provider_id", lookupId)
              .single();

            if (iosData) {
              const iosImage = iosData.provider_logo || iosData.provider_images?.split(" | ")[0] || null;
              const fallbackConn: ConnectionWithProvider = {
                id: connectionIdParam!, // Safe: guard above checks connectionIdParam exists
                to_profile: {
                  id: "", // Unknown, but not needed for display
                  slug: providerSlug,
                  source_provider_id: iosData.provider_id,
                  display_name: iosData.provider_name || pending.providerName || "Provider",
                  image_url: iosImage,
                  city: iosData.city,
                  state: iosData.state,
                  category: iosData.provider_category,
                  metadata: {
                    google_rating: iosData.google_rating,
                    review_count: iosData.review_count,
                    lower_price: iosData.lower_price,
                    upper_price: iosData.upper_price,
                  },
                },
              };
              setConnection(fallbackConn);
              if (iosData.city) {
                setCity(iosData.city);
              }
            } else if (pending.providerName) {
              // Even if iOS data not found, show something
              const fallbackConn: ConnectionWithProvider = {
                id: connectionIdParam!, // Safe: guard above checks connectionIdParam exists
                to_profile: {
                  id: "",
                  slug: providerSlug,
                  source_provider_id: null,
                  display_name: pending.providerName,
                  image_url: null,
                  city: null,
                  state: null,
                  category: null,
                  metadata: null,
                },
              };
              setConnection(fallbackConn);
            }
          }
        }
      } catch (lsErr) {
        console.error("[welcome] localStorage fallback failed:", lsErr);
      }
    }

    fetchConnection();
  }, [connectionIdParam, connection, providerSlugParam]);

  // Background: fetch most recent connection for returning users (non-blocking)
  useEffect(() => {
    if (authLoading || !activeProfile || connectionIdParam || connection) return;

    async function fetchRecentConnection() {
      try {
        const supabase = createClient();
        const { data: connections } = await supabase
          .from("connections")
          .select(`
            id,
            to_profile:business_profiles!connections_to_profile_id_fkey(
              id, slug, source_provider_id, display_name, image_url, city, state, category, metadata
            )
          `)
          .eq("from_profile_id", activeProfile!.id)
          .eq("type", "inquiry")
          .order("created_at", { ascending: false })
          .limit(1);

        if (connections?.[0]) {
          let conn = connections[0] as ConnectionWithProvider;

          // Enrich with iOS provider data
          if (conn.to_profile) {
            const iosKey = conn.to_profile.source_provider_id || conn.to_profile.slug;
            if (iosKey) {
              const { data: iosData } = await supabase
                .from("olera-providers")
                .select("provider_logo, provider_images, google_rating, review_count, lower_price, upper_price")
                .eq("provider_id", iosKey)
                .single();

              if (iosData) {
                const iosImage = iosData.provider_logo || iosData.provider_images?.split(" | ")[0] || null;
                conn = {
                  ...conn,
                  to_profile: {
                    ...conn.to_profile,
                    image_url: conn.to_profile.image_url || iosImage,
                    metadata: {
                      ...((conn.to_profile.metadata || {}) as Record<string, unknown>),
                      ...(iosData.google_rating ? { google_rating: iosData.google_rating } : {}),
                      ...(iosData.review_count ? { review_count: iosData.review_count } : {}),
                      ...(iosData.lower_price ? { lower_price: iosData.lower_price } : {}),
                      ...(iosData.upper_price ? { upper_price: iosData.upper_price } : {}),
                    },
                  },
                };
              }
            }
          }

          setConnection(conn);
          if (conn.to_profile?.city) setCity(conn.to_profile.city);
        }
      } catch (err) {
        console.error("[welcome] Failed to fetch connection:", err);
      }
    }

    fetchRecentConnection();
  }, [activeProfile, authLoading, connectionIdParam, connection]);

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
              city: city || activeProfile?.city || undefined,
              state: activeProfile?.state || undefined,
              careTypes: activeProfile?.care_types?.length ? activeProfile.care_types : undefined,
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

  // Navigate to inbox with a specific provider, marking onboarding complete first
  const handleStartConversation = useCallback(async (providerId: string) => {
    setNavigating(true);
    try {
      // Mark onboarding as complete so middleware doesn't redirect back
      await fetch("/api/auth/ensure-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_onboarding_complete: true }),
      });
      // Refresh account data to update local state
      await refreshAccountData();
    } catch {
      // Continue anyway - worst case they see welcome page again
    }
    router.push(`/portal/inbox?provider=${providerId}`);
  }, [router, refreshAccountData]);

  const handleViewMatches = useCallback(() => {
    setNavigating(true);
    router.push("/portal/matches");
  }, [router]);

  const handleBrowseProviders = useCallback(() => {
    setNavigating(true);
    router.push("/browse");
  }, [router]);

  // Provider scroll navigation
  const updateScrollButtons = useCallback(() => {
    if (providerScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = providerScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollProviders = useCallback((direction: "left" | "right") => {
    if (providerScrollRef.current) {
      const scrollAmount = 300;
      providerScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 350);
    }
  }, [updateScrollButtons]);

  // Gamification: attention moves through cards as user completes steps
  // 1. Profile card pulses until profile >= 50% complete
  // 2. Matches card pulses until profile is live
  // NOTE: These calculations and the useEffect MUST be before any conditional returns
  // to avoid the "Rendered more hooks than during the previous render" error
  const profileComplete = profilePercentage >= 50;
  // Show "All Set" page when user has made a Go Live decision (either went live or explicitly skipped)
  // The profile percentage is for gamification/progress tracking, not a gate for the celebration
  const allStepsComplete = isProfileLive || hasCompletedOnboarding;

  // Trigger celebration only when user actually goes live (not when they skip)
  useEffect(() => {
    if (isProfileLive && !celebrationShown && !showCelebration) {
      setShowCelebration(true);
      setCelebrationShown(true);
      try {
        localStorage.setItem("olera_onboarding_celebrated", "true");
      } catch { /* localStorage not available */ }
      // Auto-hide celebration after 4 seconds
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isProfileLive, celebrationShown, showCelebration]);

  const cityDisplay = city || "your area";
  const userName = activeProfile?.display_name?.split(" ")[0] || account?.display_name?.split(" ")[0];
  const isConnected = !!connection?.to_profile?.display_name;

  // Detect if user has sent a message (not auto-reply) to the connected provider
  const connectionThread = connection?.metadata?.thread || [];
  const userProfileId = activeProfile?.id;
  const hasUserMessaged = connectionThread.some(
    (msg) => msg.from_profile_id === userProfileId && !msg.is_auto_reply
  );

  // Determine if this is a fresh connection (URL has connection param) vs returning user
  const isFreshConnection = !!connectionIdParam;

  // Decide what to show in the top card area
  // - Fresh connection + hasn't messaged: Show full connection card
  // - Has messaged: Hide the connection card (they're engaged)
  // - Returning user + not fresh + profile incomplete: Show "Pick up where you left off"
  // - Returning user + profile done but not live: Hide card, focus on step cards
  const showConnectionCard = isConnected && !hasUserMessaged && isFreshConnection;
  const showPickUpWhereLeftOff = isConnected && !isFreshConnection && !hasUserMessaged && !allStepsComplete;

  const needsProfileAttention = !profileComplete;
  const needsBenefitsAttention = false; // Benefits is optional, not part of core onboarding
  const needsMatchesAttention = profileComplete && !isProfileLive;

  // Toggle this to switch between new and old version during development
  const USE_NEW_VERSION = true;

  // Time-aware greeting with "Welcome back" for returning users
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const greeting = isReturningUser || allStepsComplete
    ? (userName ? `Welcome back, ${userName}` : "Welcome back")
    : (userName ? `${getTimeGreeting()}, ${userName}` : getTimeGreeting());

  const subtitle = allStepsComplete
    ? "Your care journey continues"
    : isReturningUser
      ? "Pick up where you left off"
      : isFreshConnection
        ? "You\u2019re off to a great start"
        : "Welcome to Olera";

  // ================================================================
  // NEW VERSION — Building on top (Connected State first)
  // ================================================================
  if (USE_NEW_VERSION) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        {/* Main content container */}
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          {/* ============================================================
              HEADER — Bold greeting, Airbnb "Trips" energy
              ============================================================ */}
          <section className="pt-10 sm:pt-14 pb-8">
            <p className="text-text-sm text-gray-400 tracking-wide">
              {greeting}
            </p>
            <h1 className="mt-1 text-[28px] sm:text-[32px] font-semibold text-gray-900 leading-tight tracking-tight">
              {subtitle}
            </h1>
          </section>

          {/* ============================================================
              TOP CARD — Context-aware based on user journey state
              - Fresh connection: Show provider card with "Start conversation"
              - Returning user (connected, not messaged): Show "Pick up where you left off"
              - Has messaged: Hide card (they're engaged)
              - New user (no connection): Show welcome card
              ============================================================ */}
          {showConnectionCard && connection?.to_profile ? (() => {
            const provider = connection.to_profile;
            const providerFirstName = provider.display_name.split(" ")[0];
            const location = [provider.city, provider.state].filter(Boolean).join(", ");
            const clampedPercentage = Math.min(Math.max(profilePercentage, 0), 100);

            return (
              <section className="pb-10">
                {/* Provider card — side-by-side: square image left, content right */}
                <div className="rounded-2xl border border-gray-200/60 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Provider image — square, no crop distortion */}
                    <div className="relative w-full sm:w-[200px] aspect-square sm:aspect-auto sm:min-h-[220px] flex-shrink-0 bg-gray-100">
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
                          <span className="text-4xl font-bold text-white/80">
                            {getInitials(provider.display_name)}
                          </span>
                        </div>
                      )}
                      {/* Connected badge */}
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[12px] font-medium text-gray-900">Connected</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col min-w-0">
                      <h2 className="text-text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
                        {provider.display_name}
                      </h2>
                      {location && (
                        <p className="text-text-sm text-gray-400 mt-0.5">{location}</p>
                      )}

                      <p className="text-text-sm text-gray-500 mt-4">
                        Help {providerFirstName} prepare for your conversation
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-900 rounded-full transition-all duration-500"
                            style={{ width: `${clampedPercentage}%` }}
                          />
                        </div>
                        <span className="text-text-xs font-medium text-gray-400 tabular-nums">{clampedPercentage}%</span>
                      </div>

                      {/* Spacer + CTA */}
                      <div className="flex-1 min-h-3" />
                      <button
                        onClick={() => setProfileWizardOpen(true)}
                        className="mt-4 w-full h-11 rounded-xl text-text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
                      >
                        Complete your profile
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })() : showPickUpWhereLeftOff && connection?.to_profile ? (
            /* ============================================================
               RETURNING USER CARD — "Pick up where you left off"
               For users who connected but came back without the connection URL param
               ============================================================ */
            <section className="pb-8">
              <div className="rounded-2xl border border-gray-200/60 p-5">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {connection.to_profile.image_url ? (
                      <Image
                        src={connection.to_profile.image_url}
                        alt={connection.to_profile.display_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: avatarGradient(connection.to_profile.display_name) }}
                      >
                        <span className="text-sm font-bold text-white">
                          {getInitials(connection.to_profile.display_name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-sm font-medium text-gray-900 line-clamp-1">
                      {connection.to_profile.display_name}
                    </p>
                    <p className="text-text-xs text-gray-400 mt-0.5">Your connection</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartConversation(connection.to_profile!.id)}
                    disabled={navigating}
                    className="px-4 py-2 text-text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {navigating ? "..." : "Message"}
                  </button>
                </div>
              </div>
            </section>
          ) : !isConnected && !allStepsComplete ? (
            /* ============================================================
               FRESH STATE CARD — Welcome card for new users without connection
               Hidden when all steps complete
               ============================================================ */
            <section className="pb-10">
              <div className="rounded-2xl border border-gray-200/60 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image — square on mobile, side panel on desktop */}
                  <div className="relative w-full sm:w-[200px] aspect-[4/3] sm:aspect-auto sm:min-h-[200px] flex-shrink-0 bg-gray-100">
                    <Image
                      src="/images/for-providers/hero.jpg"
                      alt="Caregiver helping a senior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col min-w-0">
                    <h2 className="text-text-lg font-semibold text-gray-900">
                      Finding Care Made Simple
                    </h2>
                    <p className="mt-1.5 text-text-sm text-gray-400 leading-relaxed">
                      One profile connects you with qualified providers in your area.
                    </p>
                    <div className="flex-1 min-h-3" />
                    <button
                      onClick={() => setProfileWizardOpen(true)}
                      className="mt-4 w-full sm:w-auto sm:self-start px-6 h-11 rounded-xl text-text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
                    >
                      Get started
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Confetti celebration */}
          {showCelebration && <ConfettiCelebration />}

          {/* ============================================================
              ACTION STEPS — Clean, flat list. No timeline chrome.
              ============================================================ */}
          <section className="pb-12">
              <div className="space-y-3">
                {/* Card 1: Profile */}
                <div className="relative">
                  {allStepsComplete ? (
                    <Link
                      href="/portal/profile"
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">Profile</p>
                        <p className="text-text-xs text-gray-400 mt-0.5">{profilePercentage}% complete</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setProfileWizardOpen(true)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${profileComplete ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        {profileComplete ? (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-text-sm font-medium text-gray-400">1</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">
                          {profileComplete ? "Profile looking good" : "Complete your profile"}
                        </p>
                        <p className="text-text-xs text-gray-400 mt-0.5">{profilePercentage}% complete</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Card 2: Matches */}
                <div className="relative">
                  {isProfileLive ? (
                    <Link
                      href="/portal/matches"
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">Matches</p>
                        <p className="text-text-xs text-gray-400 mt-0.5">Providers can discover you</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ) : hasCompletedOnboarding ? (
                    <Link
                      href="/portal/matches"
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">Go live</p>
                        <p className="text-text-xs text-gray-400 mt-0.5">Let providers find you</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : canGoLive ? (
                    <button
                      onClick={() => setGoLiveModalOpen(true)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-text-sm font-medium text-gray-400">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">
                          {isConnected && connection?.to_profile?.display_name
                            ? `Let providers like ${connection.to_profile.display_name.split(' ')[0]} find you`
                            : "Go live & get matched"}
                        </p>
                        <p className="text-text-xs text-gray-400 mt-0.5">
                          {isConnected ? "More providers can discover you" : "Let providers discover you"}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 opacity-50">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-text-sm font-medium text-gray-300">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-400">Go live & get matched</p>
                        <p className="text-text-xs text-gray-300 mt-0.5">Complete your profile first</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 3: Benefits — appears after going live OR when user skipped */}
                {(isProfileLive || hasCompletedOnboarding) && (
                  <div className="relative">
                    <Link
                      href="/benefits/finder"
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isProfileLive ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <svg className={`w-5 h-5 ${isProfileLive ? 'text-amber-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-sm font-medium text-gray-900">Explore benefits</p>
                        <p className="text-text-xs text-gray-400 mt-0.5">Find programs you may qualify for</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
          </section>

          {/* ============================================================
              PROVIDER RECOMMENDATIONS — Full width, aligned with main card
              ============================================================ */}
          {matches.length > 0 && (
            <section className="pb-20 pt-4">
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-text-md font-medium text-gray-900">
                  {allStepsComplete ? 'Recommended for you' : 'Providers near you'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollProviders("left")}
                    disabled={!canScrollLeft}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Scroll left"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => scrollProviders("right")}
                    disabled={!canScrollRight}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Scroll right"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable provider cards — using Olera's CompactProviderCard */}
              <div
                ref={providerScrollRef}
                onScroll={updateScrollButtons}
                className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {matches.map((provider) => {
                  // Map olera-providers data to Provider interface
                  const imageUrl = provider.provider_logo || provider.provider_images?.split(" | ")?.[0] || "";
                  const location = [provider.city, provider.state].filter(Boolean).join(", ");

                  const mappedProvider: Provider = {
                    id: provider.provider_id,
                    slug: provider.provider_id,
                    name: provider.provider_name,
                    image: imageUrl,
                    address: location,
                    rating: provider.google_rating || 0,
                    priceRange: "",
                    primaryCategory: provider.provider_category,
                    careTypes: [provider.provider_category],
                    highlights: [],
                    verified: false,
                  };

                  return (
                    <div key={provider.provider_id} className="flex-shrink-0 w-[220px]">
                      <CompactProviderCard provider={mappedProvider} />
                    </div>
                  );
                })}
              </div>

              {/* Browse all link */}
              <div className="mt-4 text-center">
                <Link
                  href="/browse"
                  className="text-text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Browse all providers
                </Link>
              </div>
            </section>
          )}

          {/* Loading state for providers */}
          {providersLoading && (
            <section className="pb-20">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[220px]">
                    <div className="aspect-[4/3] rounded-xl bg-gray-100 animate-pulse" />
                    <div className="mt-2.5 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Profile Wizard */}
        {profileWizardOpen && activeProfile && (
          <ProfileWizard
            profile={activeProfile}
            userEmail={user?.email}
            onClose={() => setProfileWizardOpen(false)}
            onComplete={() => {
              // Profile wizard done - user stays on welcome page
              // The Matches card will be highlighted to prompt them to go live
              refreshAccountData();
              setProfileWizardOpen(false);
            }}
            onStepSaved={() => {
              // Refresh profile data after each step so percentage updates live
              refreshAccountData();
            }}
          />
        )}

        {benefitsWizardOpen && (
          <BenefitsWizard
            profile={activeProfile}
            onClose={() => setBenefitsWizardOpen(false)}
            onComplete={() => {
              refreshAccountData();
              setBenefitsWizardOpen(false);
            }}
          />
        )}

        {/* Go Live Modal — shown when clicking Matches card */}
        <GoLiveModal
          isOpen={goLiveModalOpen}
          onClose={() => setGoLiveModalOpen(false)}
          onGoLive={async () => {
            setActivatingProfile(true);
            try {
              const res = await fetch("/api/care-post/activate-matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  city: city || activeProfile?.city || undefined,
                  state: activeProfile?.state || undefined,
                }),
              });
              if (res.ok) {
                // Immediately show live state in UI (don't wait for auth refresh)
                setJustWentLive(true);
                await refreshAccountData?.();
                // Mark onboarding complete and persist
                setHasCompletedOnboarding(true);
                try {
                  localStorage.setItem("olera_completed_onboarding", "true");
                } catch { /* localStorage not available */ }
                setGoLiveModalOpen(false);
                // Stay on welcome page - will now show "All Set" view with live state
              }
            } catch (err) {
              console.error("[welcome] Failed to activate profile:", err);
            } finally {
              setActivatingProfile(false);
            }
          }}
          onSkip={async () => {
            // Mark onboarding complete in database so user can navigate freely
            try {
              await fetch("/api/auth/ensure-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mark_onboarding_complete: true }),
              });
            } catch (err) {
              console.error("[welcome] Failed to mark onboarding complete:", err);
            }
            // Also update local state
            setHasCompletedOnboarding(true);
            try {
              localStorage.setItem("olera_completed_onboarding", "true");
            } catch { /* localStorage not available */ }
            refreshAccountData?.();
            setGoLiveModalOpen(false);
            // Stay on welcome page - will now show "All Set" view (without LIVE badge)
          }}
        />
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
        @keyframes card-glow {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(25, 144, 135, 0.08),
              0 4px 20px rgba(25, 144, 135, 0.08),
              0 8px 32px rgba(25, 144, 135, 0.04);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(25, 144, 135, 0.12),
              0 6px 28px rgba(25, 144, 135, 0.12),
              0 12px 40px rgba(25, 144, 135, 0.06);
          }
        }
        .active-card {
          border: 2px solid #199087 !important;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.1),
            0 8px 24px rgba(0,0,0,0.08) !important;
        }
        .active-card:hover {
          border-color: #147a72 !important;
          box-shadow:
            0 6px 16px rgba(0,0,0,0.12),
            0 12px 32px rgba(0,0,0,0.1) !important;
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
