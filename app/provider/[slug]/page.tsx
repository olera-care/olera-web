import Image from "next/image";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, OrganizationMetadata, CaregiverMetadata, GoogleReviewsData, CMSData, AiTrustSignals, StaffInfo } from "@/lib/types";
import { resolveProvider, resolveProviderForMeta, getClaimedAccount } from "@/lib/providers";
import { DesktopCTAVariantRouter, MobileCTAVariantRouter } from "@/components/providers/CTAVariantRouter";
import StudentProviderCTA from "@/components/medjobs/StudentProviderCTA";
import { buildOpportunity, readOpportunityProfile } from "@/lib/medjobs/opportunity";
import { DEMAND_PROFILE_KEY } from "@/lib/medjobs/eligibility";
import { readRequirements, DEMAND_SHAPE_OPTIONS, PRN_OPTIONS } from "@/lib/medjobs/hiring-needs-questions";
import ProviderHeroGallery from "@/components/providers/ProviderHeroGallery";
import Breadcrumbs from "@/components/providers/Breadcrumbs";
import ExpandableText from "@/components/providers/ExpandableText";
import CompactProviderCard from "@/components/providers/CompactProviderCard";
import SaveButton from "@/components/providers/SaveButton";
import ShareButton from "@/components/providers/ShareButton";
import CareServicesList from "@/components/providers/CareServicesList";
import QASectionWithVariant from "@/components/providers/QASectionWithVariant";
import SectionNav from "@/components/providers/SectionNav";
import type { SectionItem } from "@/components/providers/SectionNav";
import ClaimBadge from "@/components/providers/ClaimBadge";
import MobileGalleryActionBar from "@/components/providers/MobileGalleryActionBar";
import MobileProviderTopNav from "@/components/providers/MobileProviderTopNav";
import MobilePricingTooltip from "@/components/providers/MobilePricingTooltip";
import MobileClaimTooltip from "@/components/providers/MobileClaimTooltip";
import { MobileManageLink } from "@/components/providers/MobileManageLink";
import PriceEstimate from "@/components/providers/PriceEstimate";
import PricingEducationBadge from "@/components/providers/PricingEducationBadge";
import { getPricingConfig, getRegionalEstimate } from "@/lib/pricing-config";
import { getProfileCategoryFallbackImage } from "@/lib/types/provider";
import ManagePageCTA from "@/components/providers/ManagePageCTA";
import SectionEmptyState from "@/components/providers/SectionEmptyState";
import ReviewsSection from "@/components/providers/ReviewsSection";
import CMSQualitySection from "@/components/providers/CMSQualitySection";
import AiTrustSignalsSection from "@/components/providers/AiTrustSignalsSection";
import ScrollToConnectionCard from "@/components/providers/ScrollToConnectionCard";
import ManagedUtmCapture from "@/components/providers/ManagedUtmCapture";
import FloorPlanCarousel from "@/components/providers/FloorPlanCarousel";
import AccommodationsSection from "@/components/providers/AccommodationsSection";
import AmenitiesSection from "@/components/providers/AmenitiesSection";
import NeighborhoodMap from "@/components/providers/NeighborhoodMap";
import type { NearbyCategory } from "@/components/providers/NeighborhoodMap";
import DiningCarousel from "@/components/providers/DiningCarousel";
import MorningStarContent, { MorningStarAbout } from "@/components/providers/custom/MorningStarContent";
import { LeadCaptureSheetWrapper } from "@/components/providers/lead-capture";
import BenefitsDiscoveryModule from "@/components/providers/BenefitsDiscoveryModule";
import type { BenefitsProgram } from "@/components/providers/BenefitsDiscoveryModule";
import { BenefitsArmGate, AgentOutreachSlot } from "@/components/providers/IntakeVariantSlots";
import { getTopProvidersByCityAndCategory } from "@/lib/agent-outreach-providers";
import { PROFILE_CAT_TO_SUPABASE_CAT } from "@/lib/types/provider";
import { getTopProgramsForState, getAllProgramIds, getEnrichedProgram } from "@/lib/program-data";
import {
  getInitials,
  formatCategory,
  getCategoryDescription,
  getCategoryServices,
  getSimilarProviders,
  getSuggestedQuestions,
} from "@/lib/provider-utils";
import { normalizeQuestion } from "@/lib/qa-utils";

// Cache provider detail pages for 1 hour (ISR) — reduces Supabase query volume
export const revalidate = 3600;
import { buildHighlights, normalizeCareLabel, type HighlightItem, type HighlightIconType } from "@/lib/provider-highlights";
import { resolveProviderTags } from "@/lib/provider-tags";
import { groupPhotos, pickHeroImages, type GroupedPhoto } from "@/lib/photo-categories";
import PhotoTourWrapper from "@/components/providers/PhotoTourWrapper";
import { getServiceClient } from "@/lib/admin";
import { ViewTracker } from "@/components/analytics/ViewTracker";

// ============================================================
// Dynamic Metadata (SEO title, description, OG, canonical)
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await resolveProviderForMeta(slug, await createClient());

  if (!provider) {
    return { title: "Provider Not Found | Olera" };
  }

  const name = provider.provider_name;
  const category = provider.provider_category || "Senior Care";
  const city = provider.city;
  const state = provider.state;
  const locationComma = [city, state].filter(Boolean).join(", ");
  const locationSpace = [city, state].filter(Boolean).join(" ");

  // Match v1.0 title format exactly to preserve SERP CTR during migration
  // v1: "{Name}, {City} {State}: Pricing & Availability | Olera.care"
  const title = locationSpace
    ? `${name}, ${locationSpace}: Pricing & Availability | Olera.care`
    : `${name}: Pricing & Availability | Olera.care`;
  const description = provider.provider_description
    ? provider.provider_description.slice(0, 160).trimEnd() + (provider.provider_description.length > 160 ? "..." : "")
    : `Find details, reviews, and pricing for ${name}, a ${category} provider${locationComma ? ` in ${locationComma}` : ""}. Compare options on Olera.`;

  const images: string[] = [];
  if (provider.provider_images) {
    const first = provider.provider_images.split(" | ")[0];
    if (first) images.push(first);
  } else if (provider.provider_logo) {
    images.push(provider.provider_logo);
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://olera.care/provider/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://olera.care/provider/${slug}`,
      siteName: "Olera",
      type: "website",
      ...(images.length > 0 && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images.length > 0 && { images }),
    },
  };
}

// Extended metadata type that includes mock-specific fields
interface ExtendedMetadata extends OrganizationMetadata, CaregiverMetadata {
  rating?: number;
  review_count?: number;
  images?: string[];
  staff?: StaffInfo;
  badge?: string;
  accepted_payments?: string[];
  pricing_details?: { service: string; rate: string; rateType: string }[];
  staff_screening?: { background_checked: boolean; licensed: boolean; insured: boolean };
  reviews?: { name: string; rating: number; date: string; comment: string; relationship?: string }[];
  community_score?: number;
  value_score?: number;
  info_score?: number;
  price_min?: number;
  price_max?: number;
  price_unit?: "HOUR" | "MONTH";
}

// --- Inline SVG icon components ---

function StarIcon({ className, filled = true }: { className?: string; filled?: boolean }) {
  return filled ? (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ) : (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Icon for each highlight type — matches Olera 1.0 Figma
function HighlightIcon({ icon, className }: { icon: HighlightIconType; className?: string }) {
  switch (icon) {
    case "shield":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "badge":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "star":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "house":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      );
    case "people":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "medical":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      );
    default: // "sparkle"
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
  }
}


// ============================================================
// Page Component
// ============================================================

export default async function ProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  // MedJobs student context — families board → student-view of the provider:
  // hiring banner + "Request interview" CTA, family-only sections hidden.
  const sp = searchParams ? await searchParams : undefined;
  const isStudentContext = sp?.ctx === "medjobs-student";
  const studentCampus = typeof sp?.campus === "string" ? sp.campus : null;

  // --- Data fetching ---
  let profile: Profile | null = null;
  let googleReviewsData: GoogleReviewsData | null = null;
  let cmsData: CMSData | null = null;
  let aiTrustSignals: AiTrustSignals | null = null;
  let providerPlaceId: string | null = null;
  let rawProviderId: string | null = null;
  let parentOrganization: { name: string; url?: string } | null = null;
  let providerSource: "ios" | "bp" = "ios";

  // Resolve the provider through the canonical front door (lib/providers).
  // The resolver returns data only; control flow (notFound/permanentRedirect)
  // stays here at the page boundary so those framework throws aren't swallowed.
  // See plans/provider-data-foundation.md (Step 1).
  const supabase = await createClient();
  const resolved = await resolveProvider(slug, supabase);
  if (resolved.kind === "gone") notFound();
  if (resolved.kind === "redirect") permanentRedirect(resolved.to);
  if (resolved.kind === "active") {
    const p = resolved.provider;
    profile = p.profile;
    googleReviewsData = p.googleReviewsData;
    cmsData = p.cmsData;
    aiTrustSignals = p.aiTrustSignals;
    providerPlaceId = p.placeId;
    rawProviderId = p.rawProviderId;
    parentOrganization = p.parentOrganization;
    providerSource = p.source === "account" ? "bp" : "ios";
  }

  if (!profile) {
    notFound();
  }

  // --- Data extraction ---
  const meta = profile.metadata as ExtendedMetadata;
  // Build priceRange from multiple possible sources:
  // 1. Pre-formatted price_range string (from formatIOSPriceRange)
  // 2. hourly_rate_min/max (legacy home care format)
  // 3. price_min/max with price_unit (fallback, e.g. when price_range wasn't set)
  // 4. Regional estimate (state/metro average) for non-Tier 3 categories
  const priceUnitSuffix = meta?.price_unit === "HOUR" ? "/hr" : "/mo";
  const priceRange = (() => {
    // Primary: pre-formatted string from formatPriceRange
    if (meta?.price_range) return meta.price_range;

    // Legacy hourly format
    if (meta?.hourly_rate_min != null && meta?.hourly_rate_max != null) {
      if (meta.hourly_rate_max > meta.hourly_rate_min) {
        return `$${meta.hourly_rate_min}-${meta.hourly_rate_max}/hr`;
      }
      if (meta.hourly_rate_max === meta.hourly_rate_min) {
        return `$${meta.hourly_rate_min}/hr`;
      }
      // Invalid: max < min, fall through
    }

    // Direct price_min/max fallback
    if (meta?.price_min != null && meta?.price_max != null) {
      if (meta.price_max > meta.price_min) {
        return `$${meta.price_min.toLocaleString()}-${meta.price_max.toLocaleString()}${priceUnitSuffix}`;
      }
      if (meta.price_max === meta.price_min) {
        return `$${meta.price_min.toLocaleString()}${priceUnitSuffix}`;
      }
      // Invalid: max < min, fall through
    }

    // Single price fallbacks
    if (meta?.price_min != null) {
      return `From $${meta.price_min.toLocaleString()}${priceUnitSuffix}`;
    }
    if (meta?.price_max != null) {
      return `Up to $${meta.price_max.toLocaleString()}${priceUnitSuffix}`;
    }

    // Regional estimate fallback (match card behavior)
    // Only for non-Tier 3 categories (Tier 3 = Medicare/Medicaid covered)
    const tierConfig = profile.category ? getPricingConfig(profile.category) : null;
    if (tierConfig?.tier !== 3 && profile.state) {
      const regional = getRegionalEstimate(
        profile.category || "",
        profile.state,
        profile.city ?? undefined
      );
      if (regional) {
        return regional.formatted;
      }
    }

    return null;
  })();

  const rating = meta?.rating;
  let images =
    meta?.images && meta.images.length > 0
      ? meta.images
      : profile.image_url
        ? [profile.image_url]
        : [];
  // Category override — must happen before categoryLabel is computed
  if (profile.slug === "emerald-oaks") {
    profile.category = "independent_living";
  }

  const heroFallbackImage = getProfileCategoryFallbackImage(profile.category, profile.id);
  let staff = meta?.staff;
  let acceptedPayments = meta?.accepted_payments || [];

  const categoryLabel = formatCategory(profile.category);
  const locationStr = [profile.city, profile.state].filter(Boolean).join(", ");
  const pricingConfig = profile.category ? getPricingConfig(profile.category) : null;

  // Outreach arm needs top 3 same-city same-category providers (server-fetched
  // for SSR + audit trail). Only fetch when we have enough context; gate
  // component handles empty arrays gracefully. Cached 10min by (city, state,
  // category) so adjacent provider pages share lookups.
  const outreachCategoryString = profile.category ? PROFILE_CAT_TO_SUPABASE_CAT[profile.category] : null;
  const canFetchOutreachCandidates = !!(profile.city && profile.state && outreachCategoryString);

  // --- Parallel data fetching (claim state, similar providers, Q&A, reviews, outreach candidates) ---
  const [claimResult, similarProviders, qaResult, outreachCandidates] = await Promise.all([
    // 1. Actual claim state (iOS data always says "unclaimed")
    profile.source_provider_id
      ? getClaimedAccount(profile.source_provider_id, supabase)
      : Promise.resolve(null),

    // 2. Similar providers for Compare section AND multi_provider card stack
    // (same data source, transformed for card stack format below)
    getSimilarProviders(profile.category, profile.source_provider_id || profile.id, profile.state, 3),

    // 4. Q&A pairs + review count
    (async () => {
      try {
        const db = getServiceClient();
        const [qaResponse, reviewResponse, askedResponse] = await Promise.all([
          db
            .from("provider_questions")
            .select("id, question, answer, asker_name, created_at")
            .eq("provider_id", profile.slug)
            .eq("is_public", true)
            .eq("answer_status", "published")  // Only show published answers (not pending verification)
            .in("status", ["approved", "answered"])
            .not("answer", "is", null)
            .order("created_at", { ascending: false })
            .limit(20),
          db
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .eq("provider_id", profile.id)
            .eq("status", "published"),
          // All questions ever asked here (any status) — used to tally repeats
          // so suggested chips can de-prioritize already-asked topics and
          // answered threads can show "N people asked this".
          db
            .from("provider_questions")
            .select("question")
            .eq("provider_id", profile.slug)
            .limit(2000),
        ]);
        const suggestionStats: Record<string, number> = {};
        for (const row of (askedResponse.data || []) as { question: string }[]) {
          const key = normalizeQuestion(row.question);
          if (key) suggestionStats[key] = (suggestionStats[key] || 0) + 1;
        }
        return {
          questions: (qaResponse.data || []).filter((q: { answer: string | null }) => q.answer && q.answer.trim().length > 0),
          reviewCount: reviewResponse.count ?? 0,
          suggestionStats,
        };
      } catch {
        return { questions: [], reviewCount: 0, suggestionStats: {} as Record<string, number> };
      }
    })(),

    // 5. Outreach arm candidates (top 3 same-city, same-category providers).
    // Returns [] when context is missing or no candidates exist; gate handles.
    canFetchOutreachCandidates
      ? getTopProvidersByCityAndCategory({
          city: profile.city!,
          state: profile.state!,
          category: outreachCategoryString!,
          excludeProviderId: profile.source_provider_id || profile.id,
          limit: 3,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  // Transform Compare section providers to card stack format
  // (same data, different shape - eliminates duplicate queries)
  const similarProvidersForMulti = similarProviders.providers.map((p) => {
    // Parse "City, State" format from address field
    const addressParts = p.address?.split(", ") || [];
    const city = addressParts[0] || null;
    const state = addressParts[1] || null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.image || null,
      rating: p.rating || null,
      priceRange: p.priceRange || null,
      city,
      state,
      distanceMiles: null, // Could calculate if we had lat/lng on Provider type
    };
  });

  let actualClaimState = profile.claim_state;
  let claimAccountId: string | null = profile.account_id;
  // For native business_profiles, use profile.verification_state directly
  // For iOS providers, this may be undefined but claimResult will override
  let actualVerificationState: string | null = profile.verification_state ?? null;
  let claimMeta: ExtendedMetadata | null = null;
  if (claimResult) {
    actualClaimState = claimResult.claim_state;
    claimAccountId = claimResult.account_id;
    actualVerificationState = claimResult.verification_state ?? actualVerificationState;

    // Only overlay editorial metadata if the claim is verified.
    // Unverified providers' edits should not appear on the public page.
    // badge_approved is an admin override that grants verified status.
    const claimMetadataRaw = claimResult.metadata as Record<string, unknown> | null;
    const badgeApprovedOverride = claimMetadataRaw?.badge_approved === true;
    const isVerifiedClaim =
      claimResult.claim_state === "claimed" &&
      (claimResult.verification_state === "verified" ||
       claimResult.verification_state === "not_required" ||
       badgeApprovedOverride);

    if (isVerifiedClaim) {
      // Overlay the editorial fields the provider edits in their dashboard but
      // that don't exist on the directory row — owner story, payment types,
      // staff screening, itemized pricing. This makes a directory-linked CLAIMED
      // provider's public page show the same editorial data as an account-first
      // provider (Chunk 4 Step 2). iOS/directory metadata has none of these.
      claimMeta = claimResult.metadata as ExtendedMetadata | null;
      if (claimMeta?.staff) staff = claimMeta.staff;
      if (claimMeta?.accepted_payments) acceptedPayments = claimMeta.accepted_payments;
    }
  }

  // Compute tri-state badge display: "unclaimed" | "verified" | "claimed"
  // - "verified": provider is claimed AND verified (admin-approved, self-verified, or high-trust auto-verified)
  // - "claimed": provider is claimed but NOT yet verified (pending verification, unverified, or rejected)
  // - "unclaimed": provider is not claimed (unclaimed, pending claim, rejected claim, or archived)
  const badgeApproved = (claimMeta as Record<string, unknown> | null)?.badge_approved === true;
  const computeBadgeDisplayState = (): "unclaimed" | "verified" | "claimed" => {
    if (actualClaimState !== "claimed") return "unclaimed";
    if (actualVerificationState === "verified" ||
        actualVerificationState === "not_required" ||
        badgeApproved) return "verified";
    return "claimed"; // claimed but not verified
  };
  const displayClaimState = computeBadgeDisplayState();

  const answeredQuestions = qaResult.questions as { id: string; question: string; answer: string; asker_name: string; created_at: string }[];
  const realReviewCount = qaResult.reviewCount;
  const suggestionStats = (qaResult.suggestionStats ?? {}) as Record<string, number>;

  const pricingDetails = claimMeta?.pricing_details ?? meta?.pricing_details ?? [];
  const staffScreening = claimMeta?.staff_screening ?? meta?.staff_screening;

  // === Review Data Sources (properly separated) ===
  // 1. Real reviews come from the reviews table (realReviewCount from DB query above)
  // 2. Demo reviews are for testing only (clearly marked in UI)
  // 3. Google rating is external data (read-only)
  const isDemoProfile = meta?.demo_mode === true;
  // Support both new demo_reviews and legacy reviews field for backwards compatibility
  const demoReviews = meta?.demo_reviews || meta?.reviews || [];
  // Only use demo reviews if the profile is in demo mode OR it's a seeded profile
  // Real providers (claimed_from_directory) should not show demo reviews
  const shouldShowDemoReviews = isDemoProfile || profile.source === "seeded";
  const reviewsToShow = shouldShowDemoReviews ? demoReviews : [];

  // Use real review count from database for CTA display
  const reviewCount = realReviewCount;

  // Google rating (external, read-only) - stored in google_metadata
  const googleRating = meta?.google_metadata?.rating ?? null;

  // --- Non-blocking background tasks (view tracking + on-demand backfill) ---
  if (rawProviderId) {
    const db = getServiceClient();
    // Task 6: Update last_viewed_at (debounced: only if >24h stale)
    db.from("olera-providers")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("provider_id", rawProviderId)
      .or("last_viewed_at.is.null,last_viewed_at.lt." + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(() => { /* fire and forget */ });

    // Task 7: On-demand backfill if provider has place_id but no cached reviews
    if (providerPlaceId && !googleReviewsData) {
      fetch(new URL("/api/internal/backfill-google-review", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: rawProviderId, place_id: providerPlaceId, source: providerSource }),
      }).catch(() => { /* fire and forget */ });
    }
  }

  // --- Boolean flags for real data availability ---
  const hasRating = rating != null;
  const hasPriceRange = priceRange != null;
  const hasStaff = staff != null;
  const hasReviews = reviewsToShow.length > 0 || realReviewCount > 0;
  const hasStaffScreening = staffScreening != null &&
    (staffScreening.background_checked || staffScreening.licensed || staffScreening.insured);
  const hasAcceptedPayments = acceptedPayments.length > 0;

  const rawCareTypes = (profile.care_types ?? []).map(normalizeCareLabel);
  const careServices: string[] = [...rawCareTypes];
  if (profile.category) {
    const inferred = getCategoryServices(profile.category);
    const existing = new Set(careServices.map((s) => s.toLowerCase()));
    for (const s of inferred) {
      if (!existing.has(s.toLowerCase())) careServices.push(s);
    }
  }

  // Build highlights: data-driven waterfall (trust signals → social proof → CMS → screening → capability)
  const highlights: HighlightItem[] = buildHighlights({
    trustSignals: aiTrustSignals,
    googleReviews: googleReviewsData,
    cmsData,
    staffScreening,
    careTypes: profile.care_types,
    category: profile.category,
  });

  // Prepare benefits data for this provider's state (server-side, keeps client bundle small)
  const benefitsData = profile.state ? getTopProgramsForState(profile.state, 3) : null;
  let benefitsAllPrograms: BenefitsProgram[] = [];
  if (benefitsData) {
    const allIds = getAllProgramIds(benefitsData.stateId);
    benefitsAllPrograms = allIds
      .map((id) => getEnrichedProgram(benefitsData.stateId, id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        tagline: p.tagline,
        savingsRange: p.savingsRange,
        programType: p.programType,
        structuredEligibility: p.structuredEligibility
          ? {
              ageRequirement: p.structuredEligibility.ageRequirement,
              incomeTable: p.structuredEligibility.incomeTable,
            }
          : undefined,
      }));
  }
  const hasBenefitsData = !!(benefitsData && benefitsData.programs.length > 0);

  // ============================================================
  // Custom provider content — slug-based overrides
  // ============================================================
  const isEmeraldOaks = profile.slug === "emerald-oaks";
  const isMorningStar = profile.slug === "morningstar-assisted-living-memory-care-at-west-san-jose";

  // Resolve category tags for hero/card display and filtering
  // Provider tag IDs and featured selections will come from DB;
  // hardcoded per-provider overrides for now.
  const providerTagIds: string[] = isEmeraldOaks
    ? ["pet-friendly", "restaurant-style-dining", "fitness-center-pool", "movie-theater",
       "transportation-provided", "on-site-salon-spa", "maintenance-free-living",
       "social-activity-calendar", "guest-suites"]
    : (meta?.amenities as string[]) ?? [];
  const featuredTagIds: string[] | undefined = isEmeraldOaks
    ? ["pet-friendly", "restaurant-style-dining"]
    : undefined;
  const providerTags = resolveProviderTags(
    profile.category ?? "",
    providerTagIds,
    featuredTagIds,
  );

  // About section — badges and standout (provider-editable fields)
  // Will come from DB; hardcoded for Emerald Oaks launch.
  const providerBadges: { title: string; subtitle: string; imageSrc?: string; badgeColor?: string }[] = isEmeraldOaks
    ? [
        { title: "NATIONALLY RATED", subtitle: "Best Independent Living", badgeColor: "#C5A44E" },
        { title: "HIGH PERFORMING", subtitle: "in 3 Service Areas", badgeColor: "#4A6FA5" },
      ]
    : [];
  const providerStandout: { heading: string; points: string[] } | null = isEmeraldOaks
    ? {
        heading: "What makes this place special",
        points: [
          "Signature Freedom Dining program with a chef-led kitchen, restaurant-style meals, and an all-day bistro",
          "Full-size movie theater, fitness center, heated pool, and on-site salon and spa",
        ],
      }
    : null;

  // Nearby places — will come from DB (batch Overpass lookup per address).
  // Hardcoded per provider for now.
  const nearbyPlacesMap: Record<string, NearbyCategory[]> = {
    "emerald-oaks": [
      { label: "Hospital", icon: "hospital", places: [
        { name: "Methodist Stone Oak Hospital", distance: "3.4 mi", lat: 29.6127, lng: -98.4572 },
        { name: "Laurel Ridge Treatment Center", distance: "2.4 mi", lat: 29.6050, lng: -98.5100 },
      ]},
      { label: "Pharmacy", icon: "pharmacy", places: [
        { name: "CVS Pharmacy", distance: "2.1 mi", lat: 29.6250, lng: -98.4700 },
        { name: "H-E-B Pharmacy", distance: "3.2 mi", lat: 29.6100, lng: -98.4500 },
      ]},
      { label: "Grocery", icon: "grocery", places: [
        { name: "H-E-B", distance: "3.2 mi", lat: 29.6100, lng: -98.4500 },
        { name: "Trader Joe's", distance: "5.1 mi", lat: 29.5850, lng: -98.4950 },
      ]},
      { label: "Dining", icon: "dining", places: [
        { name: "The Village at Stone Oak", distance: "2.8 mi", lat: 29.6220, lng: -98.4850 },
      ]},
      { label: "Parks", icon: "parks", places: [
        { name: "Hardberger Park", distance: "10 mi", lat: 29.5230, lng: -98.5320 },
      ]},
      { label: "Place of Worship", icon: "worship", places: [
        { name: "Oak Hills Church", distance: "4.2 mi", lat: 29.5550, lng: -98.5550 },
      ]},
    ],
    "tradition-senior-living-lp": [
      { label: "Hospital", icon: "hospital", places: [
        { name: "UT Southwestern Medical Center", distance: "2.1 mi", lat: 32.8369, lng: -96.8418 },
        { name: "Parkland Memorial Hospital", distance: "3.4 mi", lat: 32.8121, lng: -96.8379 },
      ]},
      { label: "Pharmacy", icon: "pharmacy", places: [
        { name: "CVS Pharmacy", distance: "0.8 mi", lat: 32.8430, lng: -96.8320 },
        { name: "Walgreens", distance: "1.2 mi", lat: 32.8560, lng: -96.8350 },
      ]},
      { label: "Grocery", icon: "grocery", places: [
        { name: "Whole Foods Market", distance: "1.5 mi", lat: 32.8380, lng: -96.8220 },
        { name: "Tom Thumb", distance: "1.8 mi", lat: 32.8550, lng: -96.8200 },
      ]},
      { label: "Dining", icon: "dining", places: [
        { name: "Lovers Seafood & Market", distance: "0.6 mi", lat: 32.8510, lng: -96.8380 },
        { name: "Meso Maya", distance: "1.3 mi", lat: 32.8420, lng: -96.8250 },
      ]},
      { label: "Parks", icon: "parks", places: [
        { name: "Reverchon Park", distance: "1.1 mi", lat: 32.8010, lng: -96.8130 },
        { name: "Bachman Lake Park", distance: "2.8 mi", lat: 32.8650, lng: -96.8700 },
      ]},
      { label: "Place of Worship", icon: "worship", places: [
        { name: "Highland Park United Methodist", distance: "1.4 mi", lat: 32.8380, lng: -96.8010 },
      ]},
    ],
  };
  const nearbyPlaces: NearbyCategory[] = nearbyPlacesMap[profile.slug] ?? [];

  // Grouped photo tour — per-provider photo data mapped to category slots.
  // Will come from DB eventually; hardcoded for Emerald Oaks launch.
  const groupedPhotos: GroupedPhoto[] = isEmeraldOaks
    ? [
        // Exterior
        { src: "/providers/emerald-oaks/photos/exterior.webp", categoryId: "exterior" },
        { src: "/providers/emerald-oaks/photos/exterior-patio.png", categoryId: "exterior" },
        // Bathroom
        { src: "/providers/emerald-oaks/photos/bathroom.png", categoryId: "bathroom" },
        // Full Kitchen
        { src: "/providers/emerald-oaks/photos/kitchen.webp", categoryId: "full-kitchen" },
        // Bedroom
        { src: "/providers/emerald-oaks/photos/bedroom.webp", categoryId: "bedroom" },
        // Dining
        { src: "/providers/emerald-oaks/photos/dining-area.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/chef.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/salad-bar.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/salmon.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/steak.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/steak-shrimp.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/creme-brulee.webp", categoryId: "dining" },
        { src: "/providers/emerald-oaks/dining/shortcake.webp", categoryId: "dining" },
        // Amenities (fitness, theater, lounges)
        { src: "/providers/emerald-oaks/amenities/fitness-center.png", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/amenities/pool-table.png", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/photos/fitness.webp", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/photos/theater.webp", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/photos/salon.webp", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/amenities/socializing.webp", categoryId: "amenities" },
        { src: "/providers/emerald-oaks/amenities/theatre.webp", categoryId: "amenities" },
      ]
    : [];

  const photoGroups = groupPhotos(profile.category ?? "", groupedPhotos);

  // Override hero images from grouped photos when available
  if (groupedPhotos.length > 0) {
    images = pickHeroImages(profile.category ?? "", groupedPhotos, 5);
  }

  if (isMorningStar) {
    images = [
      "/providers/morningstar-west-san-jose/google-1.webp",
      "/providers/morningstar-west-san-jose/bistro.png",
      "/providers/morningstar-west-san-jose/theatre.png",
      "/providers/morningstar-west-san-jose/art-studio.png",
      "/providers/morningstar-west-san-jose/fitness.png",
    ];
  }

  // ============================================================
  // Section navigation items — only show tabs for visible sections
  // ============================================================
  const hasGoogleReviews = (googleReviewsData?.reviews?.length ?? 0) > 0;
  const sectionItems: SectionItem[] = isMorningStar
    ? [
        { id: "reviews", label: "Reviews" },
        { id: "faq", label: "FAQs" },
        { id: "pricing", label: "Pricing" },
        { id: "care", label: "Care" },
        { id: "staffing", label: "Staffing" },
        { id: "safety", label: "Safety" },
        { id: "memory-care", label: "Memory Care" },
        { id: "neighborhood", label: "Neighborhood" },
      ]
    : [
        { id: "reviews", label: "Reviews" },
        { id: "faq", label: "FAQs" },
        { id: "about", label: "About" },
        ...(isEmeraldOaks ? [
          { id: "accommodations", label: "Accommodations" },
          { id: "dining", label: "Dining" },
        ] : []),
        { id: "amenities", label: "Amenities" },
        { id: "neighborhood", label: "Neighborhood" },
      ];

  // ============================================================
  // Render
  // ============================================================

  // ── JSON-LD structured data ──
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      ...(categoryLabel
        ? [{ "@type": "ListItem", position: 2, name: categoryLabel, item: `https://olera.care/browse?type=${profile.category}` }]
        : []),
      ...(profile.city && profile.state
        ? [{ "@type": "ListItem", position: categoryLabel ? 3 : 2, name: `${profile.city}, ${profile.state}`, item: `https://olera.care/browse?type=${profile.category}&q=${encodeURIComponent(`${profile.city}, ${profile.state}`)}` }]
        : []),
      { "@type": "ListItem", position: (categoryLabel ? 3 : 2) + (profile.city ? 1 : 0), name: profile.display_name, item: `https://olera.care/provider/${profile.slug}` },
    ],
  };

  const localBusinessJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.display_name,
    url: `https://olera.care/provider/${profile.slug}`,
    ...(profile.description && { description: profile.description.slice(0, 300) }),
    ...(profile.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: profile.address,
        addressLocality: profile.city,
        addressRegion: profile.state,
        ...(profile.zip && { postalCode: profile.zip }),
      },
    }),
    ...(profile.lat != null && profile.lng != null && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: profile.lat,
        longitude: profile.lng,
      },
    }),
    ...(profile.phone && { telephone: profile.phone }),
    ...(images.length > 0 && { image: images[0] }),
    // Franchise affiliation (migration 101) — lets Google associate this
    // location with the broader trusted brand. Only emitted when the provider
    // was confidently classified against the franchise dictionary.
    ...(parentOrganization?.name && {
      parentOrganization: {
        "@type": "Organization",
        name: parentOrganization.name,
        ...(parentOrganization.url && { url: parentOrganization.url }),
      },
    }),
    // Google requires AggregateRating.reviewCount to be a positive integer.
    // Only emit the block when there's a real rating AND at least one review —
    // otherwise the entire review snippet is rejected as invalid structured data.
    ...(googleReviewsData &&
      googleReviewsData.rating > 0 &&
      googleReviewsData.review_count != null &&
      googleReviewsData.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: googleReviewsData.rating,
        bestRating: 5,
        worstRating: 1,
        reviewCount: googleReviewsData.review_count,
      },
    }),
    // Suppress priceRange in schema for Tier 3 unless provider explicitly entered pricing
    ...(priceRange && (pricingConfig?.tier !== 3 || (meta?.price_min != null)) && { priceRange }),
    ...(meta?.price_min != null && meta?.price_max != null && {
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "USD",
        minPrice: meta.price_min,
        maxPrice: meta.price_max,
        unitText: meta.price_unit || "MONTH",
      },
    }),
    ...(reviewsToShow.length > 0 && {
      review: reviewsToShow.slice(0, 5).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        datePublished: r.date,
        reviewBody: r.comment,
      })),
    }),
    // OfferCatalog — maps the list of services offered to schema.org Offers.
    // Uses careServices (real care_types padded with category-inferred defaults).
    ...(careServices.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Care Services",
        itemListElement: careServices.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: service,
          },
        })),
      },
    }),
    // sameAs — identity assertion linking this Olera page to the same
    // entity on Google Maps via the place_id. Helps search engines
    // understand the two listings describe the same business.
    ...(providerPlaceId && {
      sameAs: [
        `https://www.google.com/maps/place/?q=place_id:${providerPlaceId}`,
      ],
    }),
  };

  // FAQPage schema — only emitted when real answered Q&A pairs exist
  const faqJsonLd = answeredQuestions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answeredQuestions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <ViewTracker providerId={slug} />
      <ManagedUtmCapture />

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Mobile Provider Top Nav - always sticky on mobile */}
      <MobileProviderTopNav />

      {/* Mobile nav spacer - accounts for fixed nav height + safe area on mobile */}
      <div
        className="md:hidden"
        style={{ height: "calc(56px + env(safe-area-inset-top, 0px))" }}
        aria-hidden="true"
      />

      {/* ===== Hero Zone — White on mobile, Vanilla on desktop ===== */}
      <div className="bg-white md:bg-vanilla-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-6 pb-4 md:pb-8">

          {/* Breadcrumbs */}
          <Breadcrumbs
            category={profile.category}
            city={profile.city}
            state={profile.state}
            providerName={profile.display_name}
          />

          {/* ── Hero (full width, above the grid) ── */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Gallery */}
            <div className="flex-shrink-0 relative w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] md:w-[448px] -mx-4 sm:-mx-6 md:mx-0">
              <ProviderHeroGallery
                images={images}
                providerName={profile.display_name}
                category={profile.category}
                fallbackImage={heroFallbackImage}
              />
              {photoGroups.length > 0 && (
                <PhotoTourWrapper
                  groups={photoGroups}
                  providerName={profile.display_name}
                  totalCount={groupedPhotos.length}
                />
              )}
              <MobileGalleryActionBar
                provider={{
                  providerId: profile.slug,
                  slug: profile.slug,
                  name: profile.display_name,
                  location: locationStr,
                  careTypes: profile.care_types || [],
                  image: images[0] || null,
                  rating: rating || undefined,
                }}
              />
              {/* Badge always shows regardless of images - positioned over gallery/fallback */}
              <div className="absolute top-4 left-4 z-20">
                <ClaimBadge
                  displayState={displayClaimState}
                  providerName={profile.display_name}
                  claimUrl={`/provider/onboarding?org=${profile.slug}`}
                />
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Mobile eyebrow - category above name */}
              {categoryLabel && (
                <p className="md:hidden text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1">
                  {categoryLabel}
                </p>
              )}
              {/* Name + Save */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight font-display text-left w-full md:w-auto">
                  {profile.display_name}
                </h1>
                <div className="hidden md:flex items-center gap-2">
                  <SaveButton
                    provider={{
                      providerId: profile.slug,
                      slug: profile.slug,
                      name: profile.display_name,
                      location: locationStr,
                      careTypes: profile.care_types || [],
                      image: images[0] || null,
                      rating: rating || undefined,
                    }}
                    variant="pill"
                  />
                  <ShareButton name={profile.display_name} />
                </div>
              </div>

              {/* ── Mobile identity layout ── */}
              <div className="md:hidden">
                {/* Row 1: Location (City, State) */}
                {locationStr && (
                  <p className="text-sm text-gray-500 mt-1">{locationStr}</p>
                )}

                {/* Row 2: Highlights only (category is now eyebrow above name) */}
                {(() => {
                  const categoryLower = categoryLabel?.toLowerCase() || "";
                  const filteredHighlights = highlights
                    .filter((h) => h.label.toLowerCase() !== categoryLower)
                    .slice(0, 2)
                    .map((h) => h.label);
                  return filteredHighlights.length > 0 ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {filteredHighlights.join(" · ")}
                    </p>
                  ) : null;
                })()}

                {/* Row 3: Rating & Reviews box (centered, subtle border) - only shown if reviews exist */}
                {(() => {
                  const displayRating = googleReviewsData?.rating ?? rating;
                  const displayReviewCount = googleReviewsData?.review_count ?? 0;
                  const hasReviews = displayRating != null && displayReviewCount > 0;

                  // Don't render the reviews box if no reviews
                  if (!hasReviews) return null;

                  return (
                    <div className="flex items-center justify-center mt-4 py-5 border border-gray-100 rounded-xl">
                      <div className="flex items-center justify-center gap-6">
                        {/* Left: Rating + stars */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-2xl font-bold text-gray-900">{displayRating!.toFixed(1)}</span>
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= Math.round(displayRating!) ? "text-amber-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-gray-200" />

                        {/* Right: Review count */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-2xl font-bold text-gray-900">{displayReviewCount}</span>
                          <span className="text-xs text-gray-500 mt-1">Google reviews</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Mobile Claim Status Section ── */}
                <div className="mt-4 text-left">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {displayClaimState === "verified" && staff?.image ? (
                        <Image
                          src={staff.image}
                          alt={staff.name || "Manager"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : displayClaimState === "verified" && staff?.name ? (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-500">
                            {getInitials(staff.name)}
                          </span>
                        </div>
                      ) : displayClaimState === "claimed" ? (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                      )}
                      {/* Verification badge - only show for verified state */}
                      {displayClaimState === "verified" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      {displayClaimState === "verified" ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-primary-600 tracking-wide">VERIFIED</span>
                            <MobileClaimTooltip content="This listing has been verified and is managed by the owner. Information is kept up to date." />
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Managed by <span className="font-semibold text-gray-900">{staff?.name || profile.display_name}</span>
                          </p>
                        </>
                      ) : displayClaimState === "claimed" ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400 tracking-wide">CLAIMED</span>
                            <MobileClaimTooltip content="This listing has been claimed. If you're the owner, you can manage this page." />
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Are you the owner?{" "}
                            <MobileManageLink
                              providerName={profile.display_name}
                              providerSlug={profile.slug}
                              providerId={profile.id}
                              sourceProviderId={profile.source_provider_id}
                              providerEmail={profile.email}
                              providerCity={profile.city}
                              providerState={profile.state}
                              claimState={actualClaimState}
                              claimAccountId={claimAccountId}
                            />
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400 tracking-wide">UNCLAIMED</span>
                            <MobileClaimTooltip content="This listing has not been claimed by its owner yet. Information shown is from public sources." />
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Are you the owner?{" "}
                            <MobileManageLink
                              providerName={profile.display_name}
                              providerSlug={profile.slug}
                              providerId={profile.id}
                              sourceProviderId={profile.source_provider_id}
                              providerEmail={profile.email}
                              providerCity={profile.city}
                              providerState={profile.state}
                              claimState={actualClaimState}
                              claimAccountId={claimAccountId}
                            />
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Desktop identity layout (unchanged) ── */}
              <div className="hidden md:block">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-sm text-gray-500">
                  {categoryLabel && (
                    <>
                      <span className="text-gray-700 font-medium">{categoryLabel}</span>
                      {(locationStr || hasRating) && <span className="text-gray-300">·</span>}
                    </>
                  )}
                  {locationStr && (
                    <>
                      <span>{locationStr}</span>
                      {hasRating && <span className="text-gray-300">·</span>}
                    </>
                  )}
                  {hasRating && rating != null && (
                    <span className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                      <span>on Google</span>
                    </span>
                  )}
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-teal-700 bg-teal-50 rounded-full px-2.5 py-1 font-medium">Updated May 2026</span>
                </div>

                {!isStudentContext && (pricingConfig?.tier === 3 && !hasPriceRange ? (
                  <div className="mt-1">
                    <PricingEducationBadge
                      category={profile.category!}
                      providerName={profile.display_name}
                      city={profile.city ?? undefined}
                      state={profile.state ?? undefined}
                    />
                  </div>
                ) : hasPriceRange ? (
                  <PriceEstimate
                    priceRange={priceRange!}
                    category={profile.category ?? undefined}
                    providerName={profile.display_name}
                    city={profile.city ?? undefined}
                    state={profile.state ?? undefined}
                  />
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Contact for pricing</p>
                ))}

                {profile.address && (
                  <p className="text-sm text-gray-400 mt-0.5">{profile.address}</p>
                )}
              </div>

              {/* Highlight badges + social proof stats */}
              {/* Hidden on mobile for cleaner hero, shown on desktop */}
              {(highlights.length > 0 || providerTags.featured.length > 0) && (
                <div id="highlights" className="scroll-mt-20 hidden md:block">
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-full py-1.5 px-3 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
                      <span className="text-sm text-green-700 font-medium">Accepting residents</span>
                    </div>
                    {providerTags.featured.map((tag) => (
                      <div key={tag.id} className="bg-white border border-gray-200 rounded-full py-1.5 px-3">
                        <span className="text-sm text-gray-600">{tag.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── "Manage this page" CTA — only for unclaimed/claimed, not verified ── */}
              {displayClaimState !== "verified" && (
                <div className="hidden md:block">
                <ManagePageCTA
                  providerSlug={profile.slug}
                  providerName={profile.display_name}
                  providerId={profile.id}
                  sourceProviderId={profile.source_provider_id}
                  providerEmail={profile.email}
                  providerCity={profile.city}
                  providerState={profile.state}
                  isClaimed={actualClaimState === "claimed"}
                  claimAccountId={claimAccountId}
                />
                </div>
              )}

              {/* About moved to content zone, before Reviews */}

              {/* Managed by — only show when staff data exists, hidden on mobile */}
              {hasStaff && (
                <div className="hidden md:flex items-center gap-2.5 mt-4">
                  <div className="relative flex-shrink-0">
                    {staff?.image ? (
                      <Image src={staff.image} alt={staff.name || profile.display_name} width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-gray-500">{getInitials(staff?.name || profile.display_name)}</span>
                      </div>
                    )}
                    <svg className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-[#198087]" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="10" r="10" fill="white" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    Managed by: <span className="font-medium text-gray-700">{staff?.name || profile.display_name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ===== Content Zone — White Background ===== */}
      <div className="bg-white" data-spotlight-zone>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:py-10">

        {/* -- Two-Column Grid (content + sticky sidebar) -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ========== Left Column ========== */}
          <div className="lg:col-span-2">

            {/* Section Navigation — inline nav with bottom border */}
            <SectionNav sections={sectionItems} />

            {/* ══════════════════════════════════════════
                Content Sections (1.0 order)
               ══════════════════════════════════════════ */}
            <div data-spotlight-parent>

              {/* ── About this opportunity (student context only) ── */}
              {isStudentContext && (() => {
                const oppMeta = (profile.metadata ?? null) as unknown as Record<string, unknown> | null;
                const oppProfile = readOpportunityProfile(oppMeta);
                const demand = (oppMeta?.[DEMAND_PROFILE_KEY] ?? null) as {
                  coverage_buckets?: string[];
                  demand_shape?: "regular" | "varies" | "unpredictable";
                  prn_open?: "yes" | "maybe" | "no";
                } | null;
                const opp = buildOpportunity({
                  careText: categoryLabel ?? profile.category,
                  isClaimed: providerSource === "bp",
                  coverageBuckets: demand?.coverage_buckets,
                  profile: oppProfile,
                });
                const shapeLabel = demand?.demand_shape
                  ? DEMAND_SHAPE_OPTIONS.find((o) => o.value === demand.demand_shape)?.label ?? null
                  : null;
                const prnLabel = demand?.prn_open
                  ? PRN_OPTIONS.find((o) => o.value === demand.prn_open)?.label ?? null
                  : null;
                const req = readRequirements(oppMeta);
                const reqLabels: string[] = [
                  ...(req.background_check ? ["Background check"] : []),
                  ...(req.drug_test ? ["Drug test"] : []),
                  ...(req.transportation ? ["Reliable transportation (license + insurance)"] : []),
                ];
                return (
                  <div className="py-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">About this opportunity</h2>
                    <p className="text-base font-semibold text-gray-900">{opp.roleLabel}</p>
                    <p className="mt-4 text-sm font-medium text-gray-500">What you&apos;d do</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-0.5">
                      {opp.tasks.map((t) => (<li key={t}>{t}</li>))}
                    </ul>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">When</p>
                        <p className="text-sm text-gray-700">{opp.when}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pay</p>
                        <p className="text-sm text-gray-700">{opp.pay}</p>
                      </div>
                      {shapeLabel && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Schedule</p>
                          <p className="text-sm text-gray-700">{shapeLabel}</p>
                        </div>
                      )}
                      {prnLabel && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Open to PRN (on-call)</p>
                          <p className="text-sm text-gray-700">{prnLabel}</p>
                        </div>
                      )}
                    </div>
                    {(opp.certifications || opp.skills) && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">Who we&apos;re looking for</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {[...(opp.certifications ?? []), ...(opp.skills ?? [])].map((r) => (
                            <span key={r} className="inline-block rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {reqLabels.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500">Requirements</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {reqLabels.map((r) => (
                            <span key={r} className="inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-800">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-4 text-sm font-medium text-emerald-700">
                      Counts toward your 120 patient-care hours.
                    </p>
                    {opp.note && <p className="mt-2 text-xs text-gray-500">{opp.note}</p>}
                  </div>
                );
              })()}

              {/* ── MorningStar custom layout ── */}
              {isMorningStar ? (
                <>
                  <MorningStarAbout />

                  <div id="reviews" className="scroll-mt-20 border-t border-gray-200">
                    <ReviewsSection
                      providerId={profile.slug}
                      providerSlug={profile.slug}
                      providerName={profile.display_name}
                      mockReviews={reviewsToShow}
                      isDemoMode={shouldShowDemoReviews && reviewsToShow.length > 0}
                      googleReviewsData={googleReviewsData}
                      placeId={providerPlaceId}
                      hideBorder
                    />
                  </div>

                  <div id="faq" className="py-8 scroll-mt-20 border-t border-gray-200">
                    <QASectionWithVariant
                      providerId={profile.slug}
                      providerName={profile.display_name}
                      providerImage={images[0]}
                      providerSlug={profile.slug}
                      providerLocation={profile.city && profile.state ? `${profile.city}, ${profile.state}` : ""}
                      providerCareTypes={profile.care_types || []}
                      providerRating={rating}
                      providerPriceRange={priceRange ?? undefined}
                      providerCity={profile.city ?? undefined}
                      providerState={profile.state ?? undefined}
                      questions={answeredQuestions.map((q) => ({
                        id: q.id,
                        question: q.question,
                        answer: q.answer,
                        asker_name: q.asker_name,
                        created_at: q.created_at,
                      }))}
                      suggestedQuestions={getSuggestedQuestions(profile.category)}
                      hasBenefitsData={hasBenefitsData && !!benefitsData}
                      similarProvidersForMulti={similarProvidersForMulti}
                      alternativeProviders={outreachCandidates}
                      providerCategory={outreachCategoryString}
                    />
                  </div>

                  <MorningStarContent />

                  <div className="py-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Disclaimer</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      We strive to keep this page accurate and current, but some details may not be up to date. To confirm whether {profile.display_name} is the right fit for you or your loved one, please verify all information directly with the provider by submitting a connect request or contacting them.
                    </p>
                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Are you the owner of this business?</p>
                      <a
                        href={`/provider/onboarding?org=${profile.slug}`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Manage this page <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </>
              ) : (
              <>

              {/* ── What families are saying (above services when reviews exist) ── */}
              {(googleReviewsData?.reviews?.length ?? 0) > 0 && (
                <div id="reviews" className="scroll-mt-20">
                  <ReviewsSection
                    providerId={profile.slug}
                    providerSlug={profile.slug}
                    providerName={profile.display_name}
                    mockReviews={reviewsToShow}
                    isDemoMode={shouldShowDemoReviews && reviewsToShow.length > 0}
                    googleReviewsData={googleReviewsData}
                    placeId={providerPlaceId}
                    heading={isStudentContext ? "About this provider" : undefined}
                    hideBorder
                  />
                </div>
              )}

              {/* ── Customer Questions & Answers (family-facing; hidden in student context) ── */}
              {!isStudentContext && (
              <div id="qa" className={`py-8 scroll-mt-20 ${(googleReviewsData?.reviews?.length ?? 0) > 0 ? "border-t border-gray-200" : ""}`}>
                <QASectionWithVariant
                  providerId={profile.slug}
                  providerName={profile.display_name}
                  providerImage={images[0]}
                  providerSlug={profile.slug}
                  providerLocation={profile.city && profile.state ? `${profile.city}, ${profile.state}` : ""}
                  providerCareTypes={profile.care_types || []}
                  providerRating={rating}
                  providerPriceRange={priceRange ?? undefined}
                  providerCity={profile.city ?? undefined}
                  providerState={profile.state ?? undefined}
                  questions={answeredQuestions.map((q) => ({
                    id: q.id,
                    question: q.question,
                    answer: q.answer,
                    asker_name: q.asker_name,
                    created_at: q.created_at,
                  }))}
                  suggestedQuestions={getSuggestedQuestions(profile.category)}
                  suggestionStats={suggestionStats}
                  hasBenefitsData={hasBenefitsData && !!benefitsData}
                  similarProvidersForMulti={similarProvidersForMulti}
                  alternativeProviders={outreachCandidates}
                  providerCategory={outreachCategoryString}
                />

                {canFetchOutreachCandidates && outreachCandidates.length > 0 && (
                  <AgentOutreachSlot
                    sourceProviderId={profile.slug}
                    sourceProviderName={profile.display_name}
                    city={profile.city!}
                    state={profile.state!}
                    category={outreachCategoryString!}
                    topProviders={outreachCandidates}
                  />
                )}
              </div>
              )}

              {/* ── About (description + badges + standout) ── */}
              <div id="about" className="py-8 border-t border-gray-200 scroll-mt-20">
                {/* Part 1: Description */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900 font-display">About {profile.display_name}</h2>
                  {isEmeraldOaks && (
                    <div className="flex items-center gap-2">
                      <a href="https://www.facebook.com/EmeraldOaksRetirement" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Facebook">
                        <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href="https://www.instagram.com/emeraldoaksretirement" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Instagram">
                        <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                      </a>
                      <a href="https://rlcommunities.com/communities/texas/emerald-oaks-retirement/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Website">
                        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                      </a>
                    </div>
                  )}
                </div>
                <ExpandableText
                  text={profile.description || (profile.category ? getCategoryDescription(profile.category, profile.display_name, locationStr || null) : "")}
                  maxLength={400}
                />

                {/* Part 2: Awards and accolades — collapses when empty */}
                {providerBadges.length > 0 && (
                  <div className="mt-6 border border-amber-300/70 rounded-xl px-5 py-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                      {providerBadges.map((badge) => (
                        <div key={badge.title} className="flex items-center gap-3">
                          {badge.imageSrc ? (
                            <Image
                              src={badge.imageSrc}
                              alt={badge.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain shrink-0"
                            />
                          ) : (
                            <svg className="w-11 h-11 shrink-0" viewBox="0 0 44 48" fill="none">
                              <path d="M22 0L44 10V24C44 37.2 34.8 45.6 22 48C9.2 45.6 0 37.2 0 24V10L22 0Z" fill={badge.badgeColor ?? "#C5A44E"} />
                              <path d="M22 8l2.4 5h5.6l-4 3.5 1.5 5.5-5.5-3.5-5.5 3.5 1.5-5.5-4-3.5h5.6z" fill="white" />
                              <rect x="8" y="28" width="28" height="8" rx="1" fill="white" opacity="0.9" />
                              <text x="22" y="34.5" textAnchor="middle" fontSize="5" fontWeight="700" fill={badge.badgeColor ?? "#C5A44E"} fontFamily="system-ui">AWARD</text>
                            </svg>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-wide text-gray-900 uppercase">{badge.title}</span>
                            <span className="text-sm text-gray-500">{badge.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Part 3: What makes this place special — collapses when empty */}
                {providerStandout && (
                  <div className="mt-6 bg-teal-50/50 border border-teal-100 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                      <h3 className="text-base font-semibold text-teal-900">{providerStandout.heading}</h3>
                    </div>
                    <ul className="space-y-2">
                      {providerStandout.points.map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                          <span className="text-sm text-teal-800 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ── Accommodations ── */}
              {isEmeraldOaks && (
              <div id="accommodations" className="scroll-mt-20 py-8 border-t border-gray-200">
                <AccommodationsSection
                  sharedFeatures={[
                    "Full Kitchen",
                    "Wheelchair Accessible Showers",
                    "Air Conditioned",
                    "Wi-Fi/High-Speed Internet",
                    "Cable or Satellite TV",
                    "Handicap Accessible",
                    "Ground Floor Units",
                    "Garden View",
                    "Respite or Short Term Stays Offered",
                  ]}
                  units={[
                    {
                      name: "Studio",
                      price: "$4,020",
                      sqft: "566 Sq. Ft.",
                      floorPlans: [
                        { label: "Studio", sqft: "566 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/studio-2.jpg" },
                      ],
                    },
                    {
                      name: "1 Bedroom",
                      price: "$3,880",
                      sqft: "588–759 Sq. Ft.",
                      floorPlans: [
                        { label: "1 Bed (A)", sqft: "694 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/1-bed-a.jpg" },
                        { label: "1 Bed (AC)", sqft: "650 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/1-bed-ac.jpg" },
                        { label: "1 Bed (B)", sqft: "759 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/1-bed-b.jpg" },
                        { label: "1 Bed (BC)", sqft: "706 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/1-bed-bc.jpg" },
                        { label: "1 Bed (C)", sqft: "588 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/1-bed-c.jpg" },
                      ],
                    },
                    {
                      name: "2 Bedroom",
                      price: "$5,800",
                      sqft: "1,013–1,138 Sq. Ft.",
                      floorPlans: [
                        { label: "2 Bed (A)", sqft: "1,114 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/2-bed-a.jpg" },
                        { label: "2 Bed (B)", sqft: "1,138 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/2-bed-b.jpg" },
                        { label: "2 Bed (C)", sqft: "1,013 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/2-bed-c.jpg" },
                      ],
                    },
                    {
                      name: "3 Bedroom",
                      sqft: "1,206 Sq. Ft.",
                      floorPlans: [
                        { label: "3 Bed (A)", sqft: "1,206 Sq. Ft.", img: "/providers/emerald-oaks/floor-plans/3-bed-a.jpg" },
                      ],
                    },
                  ]}
                  disclaimer="Prices quoted are monthly rental charges and are provided by the community. Actual prices may differ due to one-time fees, timing, and care services required. For the best price estimate, please contact Emerald Oaks directly."
                  providerName="Emerald Oaks"
                />
              </div>
              )}

              {/* ── Dining ── */}
              {isEmeraldOaks && (
              <div id="dining" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Dining</h2>
                <p className="text-base text-gray-600 mb-5">Signature Freedom Dining offers chef-prepared meals served resort-style throughout the day, with flexible hours and multiple dining settings, all included in monthly rent.</p>
                <DiningCarousel images={[
                  { src: "/providers/emerald-oaks/dining/steak.webp", alt: "Chef-prepared steak" },
                  { src: "/providers/emerald-oaks/dining/chef.webp", alt: "Chef-prepared meals" },
                  { src: "/providers/emerald-oaks/dining/salad.webp", alt: "Fresh chicken berry salad" },
                  { src: "/providers/emerald-oaks/dining/steak-shrimp.webp", alt: "Steak and shrimp" },
                  { src: "/providers/emerald-oaks/dining/salmon.webp", alt: "Salmon entrée" },
                  { src: "/providers/emerald-oaks/dining/salad-bar.webp", alt: "Salad bar" },
                  { src: "/providers/emerald-oaks/dining/creme-brulee.webp", alt: "Crème brûlée" },
                  { src: "/providers/emerald-oaks/dining/shortcake.webp", alt: "Strawberry shortcake" },
                ]} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2 mt-6">
                  {[
                    "Flexible Dining Hours",
                    "Sunday Brunch",
                    "24-Hour Chef's Pantry",
                    "Tableside Service",
                    "Meal Delivery for Daily Meals",
                    "Casual Buffet",
                    "Professional Chefs",
                    "Fresh, Healthy Ingredients",
                    "Share meals with friends and family anytime, with affordable meal rates",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* ── Amenities ── */}
              {isEmeraldOaks ? (
              <AmenitiesSection
                highlightPhoto={{
                  src: "/providers/emerald-oaks/photos/amenities-highlight.png",
                  alt: "Residents enjoying the fitness center at Emerald Oaks",
                }}
                categories={[
                {
                  heading: "Fitness & Wellness",
                  icon: "fitness",
                  items: [
                    "Fitness Center",
                    "Walking Paths",
                    "Health & Wellness Programs",
                    "Ageless Grace Brain Fitness Program",
                    "Raised Garden Beds",
                  ],
                },
                {
                  heading: "Social & Recreation",
                  icon: "social",
                  items: [
                    "Arts & Crafts Room",
                    "Billiards & Game Room",
                    "Library",
                    "Computer Center",
                    "Daily Social Activities",
                    "Main Street Shops & Gathering Spaces",
                    "Full-Size Movie Theater",
                  ],
                },
                {
                  heading: "Services & Convenience",
                  icon: "services",
                  items: [
                    "Weekly Housekeeping",
                    "On-Call Maintenance",
                    "On-Site Salon & Spa",
                    "Scheduled Transportation",
                    "Bus Outings",
                    "On-Site Bank Branch",
                    "Pharmacy Delivery",
                    "Gift Shop",
                    "Grocery Shopping Service",
                    "Guest Suite for Visiting Family",
                    "Valet & Resident Parking",
                  ],
                },
                {
                  heading: "Safety & Support",
                  icon: "safety",
                  items: [
                    "24/7 Concierge",
                    "Emergency Alert Systems",
                    "Live-In On-Site Management",
                  ],
                },
                {
                  heading: "Pet Friendly",
                  icon: "pet",
                  items: [
                    "Dogs & Cats Welcome",
                    "Landscaped Dog-Walking Grounds",
                  ],
                },
              ]} />
              ) : careServices.length > 0 && (
              <AmenitiesSection categories={careServices.map((s) => {
                // Map care service labels to amenity icons
                const lower = s.toLowerCase();
                let icon: import("@/components/providers/AmenitiesSection").AmenityIcon = "services";
                if (lower.includes("fitness") || lower.includes("wellness") || lower.includes("pool")) icon = "fitness";
                else if (lower.includes("social") || lower.includes("community") || lower.includes("event")) icon = "community";
                else if (lower.includes("recreation") || lower.includes("activit")) icon = "recreation";
                else if (lower.includes("meal") || lower.includes("dining") || lower.includes("food")) icon = "meals";
                else if (lower.includes("housekeep") || lower.includes("laundry")) icon = "housekeeping";
                else if (lower.includes("transport") || lower.includes("shuttle")) icon = "transportation";
                else if (lower.includes("maintenance") || lower.includes("repair")) icon = "maintenance";
                else if (lower.includes("concierge") || lower.includes("front desk")) icon = "concierge";
                else if (lower.includes("safety") || lower.includes("security") || lower.includes("emergency") || lower.includes("independent")) icon = "independent";
                else if (lower.includes("pet")) icon = "pet";
                return { heading: s, icon, items: [] };
              })} />
              )}

              {/* ── Neighborhood ── */}
              <div id="neighborhood" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-1">What&apos;s nearby</h2>
                {profile.address ? (
                  <p className="text-sm text-gray-500 mb-1">{profile.address}{profile.city ? `, ${profile.city}` : ""}{profile.state ? `, ${profile.state}` : ""}</p>
                ) : profile.city && profile.state ? (
                  <p className="text-sm text-gray-500 mb-1">{profile.city}, {profile.state}</p>
                ) : null}

                <NeighborhoodMap
                  providerName={profile.display_name}
                  center={{ lat: profile.lat ?? 0, lng: profile.lng ?? 0 }}
                  address={[profile.address, profile.city, profile.state].filter(Boolean).join(", ")}
                  categories={nearbyPlaces}
                />
              </div>

              {/* ── Benefits Discovery ── */}
              {/* Wrapped in BenefitsArmGate so the section disappears for the
                  40% of visitors in the outreach or multi_provider arms of the
                  5-way intake A/B. The 60% in the 3 benefits arms see the existing
                  module unchanged (with its internal mod-3 copy A/B). */}
              {!isStudentContext && hasBenefitsData && benefitsData && (
                <BenefitsArmGate>
                  <div id="benefits" className="py-8 scroll-mt-20 border-t border-gray-200">
                    <BenefitsDiscoveryModule
                      providerState={profile.state!}
                      stateId={benefitsData.stateId}
                      stateName={benefitsData.stateName}
                      providerName={profile.display_name}
                      providerSlug={profile.slug}
                      providerCareTypes={profile.care_types}
                      providerCategory={profile.category}
                      topPrograms={benefitsData.programs.map((p) => ({
                        id: p.id,
                        name: p.name,
                        shortName: p.shortName,
                        tagline: p.tagline,
                        savingsRange: p.savingsRange,
                      }))}
                      allPrograms={benefitsAllPrograms}
                      entrySource={`/provider/${profile.slug}`}
                    />
                  </div>
                </BenefitsArmGate>
              )}

              {/* ── Staff Screening — hidden when no real data ── */}
              {hasStaffScreening && (
                <div id="screening" className="py-8 scroll-mt-20 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Staff Screening</h2>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    {[
                      { label: "Background Checked", verified: staffScreening!.background_checked },
                      { label: "Licensed", verified: staffScreening!.licensed },
                      { label: "Insured", verified: staffScreening!.insured },
                    ].filter(item => item.verified).map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5">
                        <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <span className="text-base text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── What families are saying (below Q&A when no reviews — empty state;
                    hidden in student context, the "be first to review" prompt is family-facing) ── */}
              {!isStudentContext && (googleReviewsData?.reviews?.length ?? 0) === 0 && (
                <div id="reviews" className="scroll-mt-20">
                  <ReviewsSection
                    providerId={profile.slug}
                    providerSlug={profile.slug}
                    providerName={profile.display_name}
                    mockReviews={reviewsToShow}
                    isDemoMode={shouldShowDemoReviews && reviewsToShow.length > 0}
                    googleReviewsData={googleReviewsData}
                    placeId={providerPlaceId}
                  />
                </div>
              )}

              {/* ── CMS Quality & Safety — only show 4/5 and 5/5 publicly (lower scores used for ranking only) ── */}
              {cmsData && cmsData.overall_rating && cmsData.overall_rating >= 4 && (
                <div className="py-8 border-t border-gray-200">
                  <CMSQualitySection cmsData={cmsData} />
                </div>
              )}

              {/* ── AI Verified Credentials ── */}
              {aiTrustSignals && aiTrustSignals.summary_score > 0 && (
                <div className="py-8 border-t border-gray-200">
                  <AiTrustSignalsSection signals={aiTrustSignals} />
                </div>
              )}

              {/* ── Payment & Insurance — hidden when no real data ── */}
              {hasAcceptedPayments && (
                <div id="payment" className="py-8 scroll-mt-20 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Acceptable Payment / Insurance Options</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {acceptedPayments.map((payment) => (
                      <div key={payment} className="flex items-center justify-between py-3 px-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-base text-primary-600 font-medium">{payment}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-base text-gray-500">
                    For clarity and guidance,{" "}
                    <ScrollToConnectionCard entryPoint="book_consultation" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      Book a consultation
                    </ScrollToConnectionCard>
                  </p>
                </div>
              )}

              {/* ── Facility Manager — hidden when no staff data ── */}
              {hasStaff && (
                <div id="team" className="py-8 border-t border-gray-200 scroll-mt-20">
                  <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Facility manager</h2>
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="border border-gray-100 rounded-2xl px-6 pt-8 pb-6 text-center w-full md:w-52 md:flex-shrink-0 shadow-md">
                      <div className="relative mx-auto mb-5 w-24 h-24">
                        {staff!.image ? (
                          <Image src={staff!.image} alt={staff!.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-3xl font-bold text-gray-500">{getInitials(staff!.name)}</span>
                          </div>
                        )}
                        {displayClaimState === "verified" && (
                          <svg className="absolute bottom-0 right-0 w-6 h-6 text-[#198087]" viewBox="0 0 20 20" fill="currentColor">
                            <circle cx="10" cy="10" r="10" fill="white" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-base font-bold text-gray-900">{staff!.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{staff!.position}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Care motivation</h3>
                      <ExpandableText text={staff!.care_motivation || staff!.bio} maxLength={200} />
                      {/* Desktop: button in care motivation column with spacing to align with card bottom */}
                      <ScrollToConnectionCard entryPoint="message_host" className="hidden md:inline-block mt-6 px-6 py-2.5 text-sm font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        Message {staff!.name.split(" ")[0]}
                      </ScrollToConnectionCard>
                    </div>
                  </div>
                  {/* Mobile: button full-width below */}
                  <ScrollToConnectionCard entryPoint="message_host" className="md:hidden w-full mt-6 px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-center">
                    Message {staff!.name.split(" ")[0]}
                  </ScrollToConnectionCard>
                  <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
                    <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75" />
                    </svg>
                    To help protect your family, the Olera team vet facility managers for information accuracy.
                  </div>
                </div>
              )}

              {/* ── Disclaimer ── */}
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Disclaimer</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We strive to keep this page accurate and current, but some details may not be up to date. To confirm whether {profile.display_name} is the right fit for you or your loved one, please verify all information directly with the provider by submitting a connect request or contacting them.
                </p>
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Are you the owner of this business?</p>
                  <a
                    href={`/provider/onboarding?org=${profile.slug}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Manage this page <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>

              </>
              )}

            </div>
          </div>

          {/* ========== Right Column — Sticky Sidebar (hidden on mobile) ========== */}
          <div className="hidden md:block lg:col-span-1 self-stretch">
            <div id="connection-card" className="sticky top-24">
              {isStudentContext ? (
                <StudentProviderCTA
                  surface="sidebar"
                  providerId={profile.id}
                  providerName={profile.display_name}
                  providerSlug={profile.slug}
                  providerSource={providerSource}
                  city={profile.city}
                  state={profile.state}
                  campus={studentCampus}
                />
              ) : (
              <DesktopCTAVariantRouter
                providerId={profile.id}
                providerName={profile.display_name}
                providerSlug={profile.slug}
                priceRange={priceRange}
                reviewCount={googleReviewsData?.review_count ?? reviewCount}
                phone={profile.phone}
                acceptedPayments={acceptedPayments}
                careTypes={profile.care_types ?? []}
                city={profile.city}
                state={profile.state}
                responseTime={null}
                providerCategory={profile.category}
                providerCity={profile.city}
                providerState={profile.state}
                providerImage={images[0] || null}
                rating={googleReviewsData?.rating ?? rating}
                highlights={highlights.map((h) => h.label)}
                similarProviders={similarProviders.providers.slice(0, 2).map((p) => ({
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  image: p.image || null,
                  category: profile.category,
                  city: p.address?.split(", ")[0] || null,
                  state: p.address?.split(", ")[1] || null,
                  rating: p.rating || null,
                  reviewCount: p.reviewCount || null,
                  priceRange: p.priceRange || null,
                  services: p.careTypes || [],
                  highlights: p.highlights || [],
                }))}
              />
              )}
            </div>
          </div>
        </div>

        {/* ===== Nearby Communities / Compare Providers (hidden in student context) ===== */}
        {!isStudentContext && similarProviders.providers.length > 0 && (
          <div id="nearby" className="border-t border-gray-200 pt-8 mt-4 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">
              {similarProviders.isLocal
                ? <>Compare {profile.display_name}{locationStr ? ` of ${locationStr}` : ""} to the best local options</>
                : <>Compare {profile.display_name} to top-rated {categoryLabel ?? "similar"} providers</>
              }
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarProviders.providers.map((provider) => (
                <CompactProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Mobile sticky bottom CTA — opens bottom sheet with ConnectionCard */}
      {isStudentContext ? (
        <StudentProviderCTA
          surface="mobile"
          providerId={profile.id}
          providerName={profile.display_name}
          providerSlug={profile.slug}
          providerSource={providerSource}
          city={profile.city}
          state={profile.state}
          campus={studentCampus}
        />
      ) : (
      <MobileCTAVariantRouter
        providerName={profile.display_name}
        priceRange={priceRange}
        pricingTier={pricingConfig?.tier}
        pricingDisclaimer={pricingConfig?.disclaimer({
          providerName: profile.display_name,
          city: profile.city ?? undefined,
          state: profile.state ?? undefined,
        })}
        providerId={profile.id}
        providerSlug={profile.slug}
        reviewCount={googleReviewsData?.review_count ?? reviewCount}
        phone={profile.phone}
        acceptedPayments={acceptedPayments}
        careTypes={profile.care_types ?? []}
        providerCategory={profile.category}
        providerCity={profile.city}
        providerState={profile.state}
        providerImage={images[0] || null}
        rating={googleReviewsData?.rating ?? rating}
        highlights={highlights.map((h) => h.label)}
        similarProviders={similarProviders.providers.slice(0, 2).map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          image: p.image || null,
          category: profile.category, // Use same category as current provider
          city: p.address?.split(", ")[0] || null,
          state: p.address?.split(", ")[1] || null,
          rating: p.rating || null,
          reviewCount: p.reviewCount || null,
          priceRange: p.priceRange || null,
          services: p.careTypes || [],
          highlights: p.highlights || [],
        }))}
      />
      )}

      {/* Lead capture sheet (unified modal for mobile + desktop) */}
      {!isStudentContext && (
      <LeadCaptureSheetWrapper
        providerId={profile.id}
        providerName={profile.display_name}
        providerSlug={profile.slug}
        providerCity={profile.city}
        providerState={profile.state}
        providerCategory={profile.category}
        staff={staff ? {
          name: staff.name,
          role: staff.position,
          image: staff.image || null,
        } : null}
      />
      )}
    </div>
  );
}
