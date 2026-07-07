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
import MobileClaimLink from "@/components/providers/MobileClaimLink";
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
import PhotoTourWrapper, { ViewPhotosButton } from "@/components/providers/PhotoTourWrapper";
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
        return `$${meta.price_min.toLocaleString("en-US")}-${meta.price_max.toLocaleString("en-US")}${priceUnitSuffix}`;
      }
      if (meta.price_max === meta.price_min) {
        return `$${meta.price_min.toLocaleString("en-US")}${priceUnitSuffix}`;
      }
      // Invalid: max < min, fall through
    }

    // Single price fallbacks
    if (meta?.price_min != null) {
      return `From $${meta.price_min.toLocaleString("en-US")}${priceUnitSuffix}`;
    }
    if (meta?.price_max != null) {
      return `Up to $${meta.price_max.toLocaleString("en-US")}${priceUnitSuffix}`;
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
    profile.care_types = ["Independent Living"];
    profile.display_name = "Emerald Oaks Retirement Resort";
    profile.description = "Emerald Oaks is an independent living community in Yuba City, CA offering studio, one-bedroom, and two-bedroom floor plans. Residents enjoy chef-prepared meals, a heated pool, fitness center, full-size movie theater, and on-site salon. The community is pet-friendly and provides scheduled transportation.";
    (profile.metadata as Record<string, unknown>).accepting_residents = true;
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
    // Overlay the editorial fields the provider edits in their dashboard but
    // that don't exist on the directory row — owner story, payment types,
    // staff screening, itemized pricing. This makes a directory-linked CLAIMED
    // provider's public page show the same editorial data as an account-first
    // provider (Chunk 4 Step 2). iOS/directory metadata has none of these.
    claimMeta = claimResult.metadata as ExtendedMetadata | null;
    if (claimMeta?.staff) staff = claimMeta.staff;
    if (claimMeta?.accepted_payments) acceptedPayments = claimMeta.accepted_payments;
  }

  // Only show "Claimed" badge when provider is BOTH claimed AND verified
  // This prevents the trust signal from appearing before verification is complete
  const displayClaimState = (actualClaimState === "claimed" && actualVerificationState === "verified")
    ? "claimed"
    : "unclaimed";

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
  const isAtriaWestchase = profile.slug === "atria-westchase-houston-tx";
  const isMorningStar = profile.slug === "morningstar-assisted-living-memory-care-at-west-san-jose";
  const isRedesignedProvider = isEmeraldOaks || isAtriaWestchase;

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
    : isAtriaWestchase
    ? [
        { title: "QUALITY ENHANCEMENT", subtitle: "Award Winner", badgeColor: "#B8860B" },
        { title: "BEST SENIOR LIVING", subtitle: "Caring Living Magazine", badgeColor: "#1A1A1A" },
        { title: "20 YEARS", subtitle: "Staff Tenure", badgeColor: "#6B8E23" },
      ]
    : [];
  const providerStandout: { heading: string; points: { text: string; icon: string }[] } | null = isEmeraldOaks
    ? {
        heading: "What makes this place special",
        points: [
          { text: "Signature Freedom Dining program with a chef-led kitchen, restaurant-style meals, and an all-day bistro", icon: "dining" },
          { text: "Full-size movie theater, fitness center, heated pool, and on-site salon and spa", icon: "amenities" },
          { text: "Pet-friendly community welcoming your furry companions", icon: "pet" },
        ],
      }
    : isAtriaWestchase
    ? {
        heading: "What makes this place special",
        points: [
          { text: "Courtyard, patio, and resident garden space", icon: "amenities" },
          { text: "Full-service salon and spa", icon: "amenities" },
          { text: "Comfortable gathering areas, including a worship space, library, and movie theater", icon: "amenities" },
        ],
      }
    : null;

  // Nearby places — will come from DB (batch Overpass lookup per address).
  // Hardcoded per provider for now.
  const nearbyPlacesMap: Record<string, NearbyCategory[]> = {
    "emerald-oaks": [
      { label: "Hospital", icon: "hospital", places: [
        { name: "Rideout Regional Medical Center", distance: "3.2 mi", lat: 39.1404, lng: -121.5915 },
        { name: "Fremont Medical Center", distance: "4.1 mi", lat: 39.1560, lng: -121.5830 },
      ]},
      { label: "Pharmacy", icon: "pharmacy", places: [
        { name: "CVS Pharmacy", distance: "1.4 mi", lat: 39.1340, lng: -121.6070 },
        { name: "Rite Aid", distance: "1.8 mi", lat: 39.1370, lng: -121.6010 },
      ]},
      { label: "Grocery", icon: "grocery", places: [
        { name: "Raley's", distance: "1.6 mi", lat: 39.1350, lng: -121.6050 },
        { name: "Walmart Supercenter", distance: "2.4 mi", lat: 39.1310, lng: -121.5970 },
      ]},
      { label: "Dining", icon: "dining", places: [
        { name: "Casa Lupe", distance: "1.1 mi", lat: 39.1285, lng: -121.6150 },
        { name: "Sutter Buttes Brewing", distance: "3.5 mi", lat: 39.1405, lng: -121.5900 },
      ]},
      { label: "Parks", icon: "parks", places: [
        { name: "Regency Park", distance: "0.6 mi", lat: 39.1210, lng: -121.6280 },
        { name: "Sam Brannan Park", distance: "1.9 mi", lat: 39.1320, lng: -121.6100 },
      ]},
      { label: "Place of Worship", icon: "worship", places: [
        { name: "Hillcrest Baptist Church", distance: "0.5 mi", lat: 39.1270, lng: -121.6210 },
        { name: "St. Isidore Catholic Church", distance: "1.7 mi", lat: 39.1360, lng: -121.6040 },
      ]},
    ],
    "atria-westchase-houston-tx": [
      { label: "Hospital", icon: "hospital", places: [
        { name: "Houston Methodist West Hospital", distance: "4.8 mi", lat: 29.7358, lng: -95.6533 },
        { name: "Memorial Hermann Memorial City", distance: "3.6 mi", lat: 29.7741, lng: -95.5579 },
      ]},
      { label: "Pharmacy", icon: "pharmacy", places: [
        { name: "CVS Pharmacy", distance: "0.9 mi", lat: 29.7350, lng: -95.5650 },
        { name: "Walgreens", distance: "1.2 mi", lat: 29.7380, lng: -95.5700 },
      ]},
      { label: "Grocery", icon: "grocery", places: [
        { name: "H-E-B", distance: "1.5 mi", lat: 29.7330, lng: -95.5620 },
        { name: "Kroger", distance: "2.1 mi", lat: 29.7400, lng: -95.5750 },
      ]},
      { label: "Dining", icon: "dining", places: [
        { name: "Churrascos", distance: "0.8 mi", lat: 29.7360, lng: -95.5640 },
        { name: "Perry's Steakhouse", distance: "1.4 mi", lat: 29.7390, lng: -95.5680 },
      ]},
      { label: "Parks", icon: "parks", places: [
        { name: "Briar Meadow Park", distance: "0.5 mi", lat: 29.7310, lng: -95.5580 },
        { name: "Terry Hershey Park", distance: "2.3 mi", lat: 29.7550, lng: -95.6100 },
      ]},
      { label: "Place of Worship", icon: "worship", places: [
        { name: "St. Thomas More Catholic Church", distance: "1.1 mi", lat: 29.7290, lng: -95.5610 },
        { name: "Westchase Church of Christ", distance: "1.6 mi", lat: 29.7370, lng: -95.5730 },
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
    : isAtriaWestchase
    ? [
        // Exterior
        { src: "/providers/atria-westchase/photos/exterior-evening.png", categoryId: "exterior" },
        { src: "/providers/atria-westchase/photos/exterior-day.png", categoryId: "exterior" },
        // Dining
        { src: "/providers/atria-westchase/photos/dining-room.png", categoryId: "dining" },
        // Living room / unit
        { src: "/providers/atria-westchase/photos/living-room.png", categoryId: "bedroom" },
        // Bedroom
        { src: "/providers/atria-westchase/photos/bedroom.png", categoryId: "bedroom" },
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
        ...(isEmeraldOaks ? [
          { id: "accommodations", label: "Accommodations" },
          { id: "dining", label: "Dining" },
        ] : []),
        ...(isAtriaWestchase ? [
          { id: "care-services", label: "Care Services" },
          { id: "accommodations", label: "Accommodations" },
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

          {/* Breadcrumbs + Save/Share bar */}
          <div className="flex items-center justify-between">
            <Breadcrumbs
              category={profile.category}
              city={profile.city}
              state={profile.state}
              providerName={profile.display_name}
            />
          </div>

          {/* ── Photo Grid ── */}
          {/* Mobile: swipeable carousel */}
          <div className="md:hidden relative w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] -mx-4 sm:-mx-6">
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
          </div>

          {/* Desktop: Provider name + manage CTA + Save/Share above photos */}
          <div className="hidden md:flex md:items-center md:gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight font-display">
              {profile.display_name}
            </h1>
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
            <div className="ml-auto flex items-center gap-4">
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
                variant="pill-quiet"
              />
              <ShareButton name={profile.display_name} variant="text" />
            </div>
          </div>

          {/* Desktop: Zillow-style 1 large + 4 small grid */}
          <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-[2.5/1] relative">
            {/* Claim badge overlay */}
            {images.length > 0 && (
              <div className="absolute top-4 left-4 z-20">
                <ClaimBadge
                  displayState={displayClaimState}
                  providerName={profile.display_name}
                  claimUrl={`/provider/onboarding?org=${profile.slug}`}
                />
              </div>
            )}
            {/* Large hero photo */}
            <div className="col-span-2 row-span-2 relative bg-gray-100">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={`${profile.display_name} — main photo`}
                  fill
                  sizes="50vw"
                  priority
                  className="object-cover"
                />
              ) : heroFallbackImage ? (
                <Image
                  src={heroFallbackImage}
                  alt={profile.display_name}
                  fill
                  sizes="50vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-warm-50 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-400">{profile.display_name.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
            {/* 4 smaller photos */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative bg-gray-100">
                {images[i] ? (
                  <Image
                    src={images[i]}
                    alt={`${profile.display_name} — photo ${i + 1}`}
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50" />
                )}
                {/* "See all photos" on the last cell */}
                {i === 4 && photoGroups.length > 0 && (
                  <div className="absolute inset-0 flex items-end justify-end p-3">
                    <PhotoTourWrapper
                      groups={photoGroups}
                      providerName={profile.display_name}
                      totalCount={groupedPhotos.length}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Details below photos ── */}
          <div className="flex flex-col md:mt-3">
            {/* ── Desktop: Info strip ── */}
            <div className="hidden md:block mt-1">
              {/* Location */}
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {[locationStr, profile.address].filter(Boolean).join(" · ")}
              </p>

              {/* Price */}
              {priceRange && (
                <p className="text-xl font-bold text-gray-900 mt-3">
                  Est. {priceRange}
                </p>
              )}

              {/* Facts line */}
              <div className="flex items-center gap-6 mt-2">
                {categoryLabel && (
                  <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                    {categoryLabel}
                  </span>
                )}
                {hasRating && rating != null && (
                  <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                    <StarIcon className="w-5 h-5 text-amber-400" />
                    {rating.toFixed(1)} on Google
                  </span>
                )}
                {(() => {
                  const m = meta as Record<string, unknown>;
                  const status = m?.availability_status as string | undefined;
                  const spots = m?.available_spots as number | undefined;

                  // Provider set a specific number of spots
                  if (spots && spots > 0) return (
                    <span className="flex items-center gap-2 text-base text-green-700 font-semibold bg-green-50 rounded-full px-3 py-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {spots} {spots === 1 ? "spot" : "spots"} available
                    </span>
                  );

                  // Explicitly accepting
                  if (status === "accepting" || m?.accepting_residents === true) return (
                    <span className="flex items-center gap-2 text-base text-green-700 font-semibold bg-green-50 rounded-full px-3 py-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Accepting residents
                    </span>
                  );

                  // Explicitly not accepting
                  if (status === "not_accepting") return (
                    <span className="flex items-center gap-2 text-base text-red-700 font-semibold bg-red-50 rounded-full px-3 py-1">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      Not accepting residents
                    </span>
                  );

                  // Default: unknown
                  return (
                    <span className="flex items-center gap-2 text-base text-gray-600 font-semibold bg-gray-100 rounded-full px-3 py-1">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Inquire about availability
                    </span>
                  );
                })()}
              </div>

              {/* Last updated */}
              <p className="text-xs text-gray-400 mt-3">
                Last updated {new Date(profile.updated_at || profile.created_at || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>

              {/* Managed by */}
              {hasStaff && (
                <div className="flex items-center gap-2.5 mt-4">
                  <div className="relative flex-shrink-0">
                    {staff!.image ? (
                      <Image src={staff!.image} alt={staff!.name} width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-gray-500">{getInitials(staff!.name)}</span>
                      </div>
                    )}
                    {displayClaimState === "claimed" && (
                      <svg className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-[#198087]" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="10" fill="white" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Managed by: <span className="font-medium text-gray-700">{staff!.name}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col">
            {/* Mobile eyebrow - category above name */}
            {categoryLabel && (
              <p className="md:hidden text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1 mt-3">
                {categoryLabel}
              </p>
            )}
            {/* Name (mobile only — desktop name is above photos) */}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight font-display text-left md:hidden">
              {profile.display_name}
            </h1>

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
                      {displayClaimState === "claimed" && staff?.image ? (
                        <Image
                          src={staff.image}
                          alt={staff.name || "Manager"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : displayClaimState === "claimed" && staff?.name ? (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-500">
                            {getInitials(staff.name)}
                          </span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {/* Verification badge */}
                      {displayClaimState === "claimed" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      {displayClaimState === "claimed" ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-primary-600 tracking-wide">CLAIMED</span>
                            <MobileClaimTooltip content="This business has been verified and is actively managed by its owner on Olera." />
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Managed by <span className="font-semibold text-gray-900">{staff?.name || profile.display_name}</span>
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
                            />
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>


            </div>{/* end details column */}
          </div>{/* end stacked wrapper */}

        </div>
      </div>

      {/* ===== Content Zone — White Background ===== */}
      <div className="bg-white" data-spotlight-zone>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:py-10">

        {/* ── About + CTA side-by-side (desktop only) ── */}
        <div className="hidden md:flex md:gap-10 md:items-start mb-10">
          {/* Left: About + badges + standout */}
          <div className="flex-1 min-w-0">
          <div id="about" className="scroll-mt-20">
            <h2 className="text-3xl font-bold text-gray-900 font-display mb-3">About {profile.display_name}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {profile.description || (profile.category ? getCategoryDescription(profile.category, profile.display_name, locationStr || null) : "")}
            </p>

            {/* Badges */}
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

            {/* What makes this place special */}
            {providerStandout && (
              <div className="mt-6 bg-teal-50/50 border border-teal-100 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                  <h3 className="text-xl font-bold text-gray-900">{providerStandout.heading}</h3>
                </div>
                <ul className="space-y-2">
                  {providerStandout.points.map((point) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      dining: (
                        <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.25V6.75a3 3 0 10-6 0v1.5" /></svg>
                      ),
                      pet: (
                        <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.35 3c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74S6.8 5.7 6.8 4.74C6.8 3.78 7.49 3 8.35 3zm7.3 0c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74s-1.55-.78-1.55-1.74c0-.96.69-1.74 1.55-1.74zm-10.6 4c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74S3.5 9.7 3.5 8.74C3.5 7.78 4.19 7 5.05 7zm13.9 0c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74s-1.55-.78-1.55-1.74c0-.96.69-1.74 1.55-1.74zM12 10c2.21 0 4 1.79 4 4 0 1.5-.83 2.8-2.05 3.47-.58.32-1.24.53-1.95.53s-1.37-.21-1.95-.53A3.997 3.997 0 018 14c0-2.21 1.79-4 4-4z" /></svg>
                      ),
                      amenities: (
                        <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                      ),
                    };
                    return (
                      <li key={point.text} className="flex items-start gap-2.5">
                        {iconMap[point.icon] || <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        <span className="text-sm text-gray-900 leading-relaxed">{point.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          </div>

          {/* Right: CTA card (hidden for redesigned providers — they use sticky sidebar instead) */}
          <div className={`w-[380px] flex-shrink-0 ${isRedesignedProvider ? "hidden" : ""}`}>
            <div id="connection-card-hero">
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

        {/* Section Navigation — sticky divider between intro and detail sections */}
        <SectionNav sections={sectionItems} />

        {/* -- Content Column -- */}
        <div className={`grid gap-8 items-start ${isRedesignedProvider ? "grid-cols-1 lg:grid-cols-[1fr_340px]" : "grid-cols-1"}`}>

          {/* ========== Main Content ========== */}
          <div>

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

              {/* ── About (description + badges + standout) — hidden on desktop (shown in hero) ── */}
              <div id="about-mobile" className="py-8 border-t border-gray-200 scroll-mt-20 md:hidden">
                {/* Part 1: Description */}
                <h2 className="text-3xl font-bold text-gray-900 font-display mb-3">About {profile.display_name}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.description || (profile.category ? getCategoryDescription(profile.category, profile.display_name, locationStr || null) : "")}
                </p>

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
                      <h3 className="text-xl font-bold text-gray-900">{providerStandout.heading}</h3>
                    </div>
                    <ul className="space-y-2">
                      {providerStandout.points.map((point) => {
                        const mIconMap: Record<string, React.ReactNode> = {
                          dining: (
                            <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.25V6.75a3 3 0 10-6 0v1.5" /></svg>
                          ),
                          pet: (
                            <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.35 3c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74S6.8 5.7 6.8 4.74C6.8 3.78 7.49 3 8.35 3zm7.3 0c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74s-1.55-.78-1.55-1.74c0-.96.69-1.74 1.55-1.74zm-10.6 4c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74S3.5 9.7 3.5 8.74C3.5 7.78 4.19 7 5.05 7zm13.9 0c.86 0 1.55.78 1.55 1.74 0 .96-.69 1.74-1.55 1.74s-1.55-.78-1.55-1.74c0-.96.69-1.74 1.55-1.74zM12 10c2.21 0 4 1.79 4 4 0 1.5-.83 2.8-2.05 3.47-.58.32-1.24.53-1.95.53s-1.37-.21-1.95-.53A3.997 3.997 0 018 14c0-2.21 1.79-4 4-4z" /></svg>
                          ),
                          amenities: (
                            <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                          ),
                        };
                        return (
                          <li key={point.text} className="flex items-start gap-2.5">
                            {mIconMap[point.icon] || <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>}
                            <span className="text-sm text-gray-900 leading-relaxed">{point.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* ── Accommodations ── */}
              {isEmeraldOaks && (
              <div id="accommodations" className="scroll-mt-20 py-8 border-t border-gray-200">
                <AccommodationsSection
                  description="Our thoughtfully designed floor plans offer the perfect blend of comfort, style, and functionality, from cozy studios to spacious three-bedrooms. Each home is designed to fit your lifestyle, with the freedom to personalize and make the space your own."
                  sharedFeatures={[
                    "Full Kitchen",
                    "In-Unit Washer and Dryer",
                    "Individual Climate Control",
                    "Private Patio or Balcony",
                    "Spacious Closets",
                    "Custom Cabinetry",
                    "Carpet and Window Treatments",
                    "Wheelchair Accessible Units",
                    "Paid Utilities",
                    "Cable TV and Wi-Fi",
                    "Choice of Floor Plan",
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
                    <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.25V6.75a3 3 0 10-6 0v1.5" /></svg>
                    Dining
                  </h2>
                  <ViewPhotosButton categoryId="dining" />
                </div>
                <p className="text-base text-gray-600 mb-5">Signature Freedom Dining offers chef-prepared meals served resort-style throughout the day, with flexible hours and multiple dining settings, all included in monthly rent.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">
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
                      <span className="text-[15px] text-gray-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* ── Care Services (Atria Westchase) ── */}
              {isAtriaWestchase && (
              <div id="care-services" className="scroll-mt-20 py-8 border-t border-gray-200">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5 mb-3">
                    <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    Care Services
                  </h2>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Help is always nearby</p>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Assisted living provides a social setting with support for daily living, including help with bathing, grooming, and incontinence. At Atria Westchase, a licensed on-site nurse provides each resident with a thorough care assessment, which helps ensure residents receive appropriate care with the appropriate staff levels.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {[
                    {
                      subtitle: "Daily Living Support",
                      items: ["Mobility Assistance", "Personal Grooming", "Meal Escorts"],
                    },
                    {
                      subtitle: "Medication & Health",
                      items: ["Medication Management", "Insulin Reminders", "Telehealth Access"],
                    },
                    {
                      subtitle: "Around-the-Clock Care",
                      items: ["24/7 Support", "Licensed Nurse On-Site"],
                    },
                  ].map((group) => (
                    <div key={group.subtitle}>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">{group.subtitle}</h3>
                      {group.items.map((item) => (
                        <div key={item} className="flex items-start gap-3 py-1.5">
                          <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="currentColor" d="M8 12.5l2.5 2.5 5-5" />
                          </svg>
                          <span className="text-[15px] text-gray-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* ── Care Team & Staffing (Atria Westchase) ── */}
              {isAtriaWestchase && (
              <div className="scroll-mt-20 py-8 border-t border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5 mb-3">
                  <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  Care Team & Staffing
                </h2>
                <p className="text-base text-gray-600 leading-relaxed mb-6">
                  At Atria Westchase, a licensed nurse is on-site to provide thorough care assessments, ensuring each resident receives personalized attention from staff who know them well.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  {/* On-site team */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      On-site team
                    </h3>
                    {[
                      "Licensed nurse on-site",
                      "Trained caregivers (not agency temps)",
                      "Low turnover, experienced staff",
                      "Staff trained in behavioral changes",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 py-1.5">
                        <svg className="w-4 h-4 text-teal-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[15px] text-gray-800">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Care partnerships */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      Care partnerships
                    </h3>
                    {[
                      "Hospice & house call physician partnerships",
                      "Medication management oversight",
                      "Individualized care plan reviews",
                      "Regular family communication & updates",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 py-1.5">
                        <svg className="w-4 h-4 text-teal-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[15px] text-gray-800">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">1:5</p>
                      <p className="text-sm font-semibold text-gray-700">Staff-to-resident ratio</p>
                      <p className="text-xs text-gray-500">Versus 1:15 at many larger facilities</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">~120</p>
                      <p className="text-sm font-semibold text-gray-700">Residents</p>
                      <p className="text-xs text-gray-500">Community-style setting</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24/7</p>
                      <p className="text-sm font-semibold text-gray-700">On-site staffing</p>
                      <p className="text-xs text-gray-500">Awake staff, day and night</p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* ── Accommodations (Atria Westchase) ── */}
              {isAtriaWestchase && (
              <div id="accommodations" className="scroll-mt-20 py-8 border-t border-gray-200">
                <AccommodationsSection
                  description="The studio, one-, and two-bedroom senior housing floor plans at Atria Westchase include a kitchen or kitchenette, individual thermostat control, walk-in shower and emergency alert system. Your flexible monthly lease includes amenities like chef-prepared meals, housekeeping service and an engaging social calendar."
                  sharedFeaturesLabel="Included in the rate"
                  sharedFeatures={[
                    "Private or shared room",
                    "24/7 care & security",
                    "Housekeeping & laundry",
                    "Chef-prepared meals",
                    "Utilities included",
                    "Emergency call system",
                  ]}
                  units={[
                    {
                      name: "Memory Care Studio",
                      sqft: "15'5\" x 11'3\"",
                      floorPlans: [
                        { label: "Memory Care Studio", sqft: "15'5\" x 11'3\"", img: "/providers/atria-westchase/floor-plans/studio-memory-care.png" },
                      ],
                    },
                    {
                      name: "Studio Deluxe",
                      sqft: "19' x 11'6\"",
                      floorPlans: [
                        { label: "Studio Deluxe", sqft: "19' x 11'6\"", img: "/providers/atria-westchase/floor-plans/studio-deluxe.png" },
                      ],
                    },
                    {
                      name: "1 Bedroom",
                      sqft: "12' x 14'",
                      floorPlans: [
                        { label: "One Bedroom A", sqft: "12' x 14'", img: "/providers/atria-westchase/floor-plans/one-bedroom-a.png" },
                      ],
                    },
                    {
                      name: "2 Bedroom",
                      sqft: "2 Bed / 2 Bath",
                      floorPlans: [
                        { label: "Two Bedroom", sqft: "2 Bed / 2 Bath", img: "/providers/atria-westchase/floor-plans/two-bedroom.png" },
                      ],
                    },
                  ]}
                  disclaimer="Prices and availability are subject to change. Please contact Atria Westchase directly for the most current pricing and floor plan options."
                  providerName="Atria Westchase"
                />
              </div>
              )}

              {/* ── Amenities ── */}
              {(isEmeraldOaks || isAtriaWestchase) ? (<>
              {isEmeraldOaks && (
              <AmenitiesSection
                headerAction={<ViewPhotosButton categoryId="amenities" />}
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
                  heading: "Pet Friendly",
                  icon: "pet",
                  items: [
                    "Dogs & Cats Welcome",
                    "Landscaped Dog-Walking Grounds",
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
                  heading: "Languages Spoken",
                  icon: "languages",
                  items: [
                    "English",
                    "Spanish",
                    "German",
                  ],
                },
              ]} />
              )}
              {isAtriaWestchase && (
              <AmenitiesSection categories={[
                {
                  heading: "Community & Outdoor Spaces",
                  icon: "community",
                  items: [
                    "Private Dining Room",
                    "Courtyard",
                    "Patio",
                    "Resident Garden",
                    "Library",
                    "Movie Theater",
                    "Wi-Fi",
                    "Parking",
                    "Pets Welcome",
                    "Daily Activities",
                    "Volunteer Programs",
                  ],
                },
                {
                  heading: "Services & Support",
                  icon: "services",
                  items: [
                    "Housekeeping",
                    "Laundry Service",
                    "Salon",
                    "Transportation",
                    "Newspaper Delivery",
                    "Online Payments",
                    "24-Hour Staff",
                    "Dementia Support",
                    "Emergency Alerts",
                    "On-site PT/OT",
                  ],
                },
                {
                  heading: "Dining",
                  icon: "meals",
                  items: [
                    "3 Daily Meals",
                    "Flexible Hours",
                    "Snacks Available",
                    "Dietary Options",
                    "Restaurant-Style",
                    "Vegetarian Options",
                    "Guests Welcome",
                  ],
                },
              ]} />
              )}
              </>) : careServices.length > 0 && (
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
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
                    <svg className="w-7 h-7 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    What&apos;s nearby
                  </h2>
                  {(() => {
                    const hasCloseMedical = nearbyPlaces.find((c) => c.label === "Hospital")?.places.some((p) => parseFloat(p.distance) <= 5);
                    const hasCloseShopping = nearbyPlaces.find((c) => c.label === "Grocery")?.places.some((p) => parseFloat(p.distance) <= 5);
                    const parts: string[] = [];
                    if (hasCloseMedical) parts.push("medical care");
                    if (hasCloseShopping) parts.push("shopping");
                    if (parts.length === 0) return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Close to {parts.join(" and ")}
                      </span>
                    );
                  })()}
                </div>
                {profile.address ? (
                  <p className="text-sm text-gray-900 mb-1">{profile.address}{profile.city ? `, ${profile.city}` : ""}{profile.state ? `, ${profile.state}` : ""}</p>
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

              {/* ── Payment and Finances (Atria Westchase) ── */}
              {isAtriaWestchase && (
              <div className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5 mb-6">
                  <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Payment and Finances
                </h2>

                {/* Included in the rate */}
                <h3 className="text-base font-bold text-gray-900 mb-1">Included in the rate</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mb-6">
                  {[
                    "Private or shared room",
                    "Three daily home-cooked meals",
                    "24/7 care & security",
                    "All life enrichment activities",
                    "Housekeeping & laundry",
                    "Medication management",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 py-2">
                      <svg className="w-4 h-4 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[15px] text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Available add-ons */}
                <h3 className="text-base font-bold text-gray-900 mb-1">Available add-ons</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mb-6">
                  {[
                    "Private room upgrade",
                    "Specialized care for higher acuity",
                    "Respite / short-term stays",
                    "Hospice coordination",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 py-2">
                      <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span className="text-[15px] text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Ways to pay */}
                <h3 className="text-base font-bold text-gray-900 mb-1">Ways to pay</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mb-6">
                  {[
                    { icon: "card", label: "Private pay" },
                    { icon: "shield", label: "Long-term care insurance" },
                    { icon: "star", label: "VA benefits" },
                    { icon: "calendar", label: "Payment plans" },
                    { icon: "chart", label: "Financial planning support" },
                  ].map((item) => {
                    const icons: Record<string, React.ReactNode> = {
                      card: <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>,
                      shield: <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
                      star: <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
                      calendar: <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
                      chart: <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
                    };
                    return (
                      <div key={item.label} className="flex items-center gap-3 py-1.5">
                        {icons[item.icon]}
                        <span className="text-[15px] font-medium text-gray-800">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Benefits finder CTA */}
                <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">Not sure how you&apos;ll pay for care?</p>
                    <p className="text-sm text-gray-600 mt-1">Answer a few questions to see what benefits and assistance your family may qualify for.</p>
                  </div>
                  <a
                    href="/benefits"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shrink-0 ml-6"
                  >
                    Benefits finder
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              </div>
              )}

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
                        {displayClaimState === "claimed" && (
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

          {/* ========== Right Column — Sticky Sidebar ========== */}
          <div className={`${isRedesignedProvider ? "hidden lg:block" : "hidden"} self-stretch`}>
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
