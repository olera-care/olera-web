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
import AmenitiesSection from "@/components/providers/AmenitiesSection";
import NeighborhoodMap from "@/components/providers/NeighborhoodMap";
import type { NearbyCategory } from "@/components/providers/NeighborhoodMap";
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
import { resolveProviderCategoryTags, type ResolvedProviderTags, type CategoryTag } from "@/lib/provider-category-tags";
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
  const images =
    meta?.images && meta.images.length > 0
      ? meta.images
      : profile.image_url
        ? [profile.image_url]
        : [];
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
  const genericHighlights: HighlightItem[] = buildHighlights({
    trustSignals: aiTrustSignals,
    googleReviews: googleReviewsData,
    cmsData,
    staffScreening,
    careTypes: profile.care_types,
    category: profile.category,
  });

  // Category-specific tags — replaces generic highlights when available.
  // Tags are a controlled vocabulary per category (not free text) so they
  // double as search filters and SEO facets.
  const categoryTags: ResolvedProviderTags | null = resolveProviderCategoryTags(
    profile.category ?? "",
    null,  // tagIds — will come from DB; null = all tags apply
    null,  // featuredIds — will come from DB; null = use category defaults
  );

  // Use category tags for hero chips when available; fall back to generic highlights.
  // Category tags exclude redundant chips like "Memory Care" and "Highly Rated"
  // since the category and Google rating are already shown elsewhere in the header.
  const highlights: HighlightItem[] = categoryTags
    ? categoryTags.featured.map((t) => ({ label: t.label, icon: t.icon }))
    : genericHighlights;

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
  const isAvalonFortWorth = profile.slug === "avalon-memory-care-tx-fort-worth";

  // Nearby places — will come from DB (batch Overpass lookup per address).
  // Hardcoded per provider for now.
  const nearbyPlacesMap: Record<string, NearbyCategory[]> = {
    "avalon-memory-care-tx-fort-worth": [
      { label: "Hospital", icon: "hospital", places: [
        { name: "Medical City Fort Worth", distance: "5.2 mi", lat: 32.7608, lng: -97.3588 },
        { name: "JPS Health Network", distance: "7.8 mi", lat: 32.7465, lng: -97.3308 },
      ]},
      { label: "Pharmacy", icon: "pharmacy", places: [
        { name: "CVS Pharmacy", distance: "1.8 mi", lat: 32.8170, lng: -97.4030 },
        { name: "Walgreens", distance: "2.3 mi", lat: 32.8090, lng: -97.3980 },
      ]},
      { label: "Doctor's Office", icon: "hospital", places: [
        { name: "Baylor Scott & White Clinic", distance: "3.4 mi", lat: 32.8100, lng: -97.3950 },
        { name: "Texas Health Family Care", distance: "4.1 mi", lat: 32.8250, lng: -97.3850 },
      ]},
    ],
  };
  const nearbyPlaces: NearbyCategory[] = nearbyPlacesMap[profile.slug] ?? [];

  // Grouped photo tour — per-provider photo data mapped to category slots.
  // Will come from DB eventually; hardcoded for launch providers.
  const groupedPhotos: GroupedPhoto[] = isAvalonFortWorth
    ? [
        // Accommodation
        { src: "/providers/avalon-fort-worth/accommodation/bedroom.webp", categoryId: "accommodation" },
        { src: "/providers/avalon-fort-worth/accommodation/bathroom.png", categoryId: "accommodation" },
        { src: "/providers/avalon-fort-worth/accommodation/floor-plan-1.jpg", categoryId: "accommodation" },
        { src: "/providers/avalon-fort-worth/accommodation/floor-plan-2.jpg", categoryId: "accommodation" },
        // Lifestyle
        { src: "/providers/avalon-fort-worth/lifestyle/dining.webp", categoryId: "lifestyle" },
        { src: "/providers/avalon-fort-worth/lifestyle/music.webp", categoryId: "lifestyle" },
        { src: "/providers/avalon-fort-worth/lifestyle/porch.webp", categoryId: "lifestyle" },
        { src: "/providers/avalon-fort-worth/lifestyle/celebration.png", categoryId: "lifestyle" },
        { src: "/providers/avalon-fort-worth/lifestyle/residents.png", categoryId: "lifestyle" },
        // Community
        { src: "/providers/avalon-fort-worth/exterior/building.jpg", categoryId: "community" },
        { src: "/providers/avalon-fort-worth/exterior/residents-outside.webp", categoryId: "community" },
        { src: "/providers/avalon-fort-worth/exterior/outside.png", categoryId: "community" },
        { src: "/providers/avalon-fort-worth/lifestyle/staff.png", categoryId: "community" },
      ]
    : [];

  const photoGroups = groupedPhotos.length > 0
    ? groupPhotos(profile.category ?? "", groupedPhotos)
    : [];

  // ============================================================
  // Section navigation items — only show tabs for visible sections
  // ============================================================
  const sectionItems: SectionItem[] = [];
  const hasGoogleReviews = (googleReviewsData?.reviews?.length ?? 0) > 0;

  if (isAvalonFortWorth) {
    // Memory care category nav
    sectionItems.push({ id: "reviews", label: "Reviews" });
    sectionItems.push({ id: "qa", label: "FAQs" });
    sectionItems.push({ id: "about", label: "About" });
    sectionItems.push({ id: "care-approach", label: "Care" });
    sectionItems.push({ id: "care-team", label: "Staff" });
    sectionItems.push({ id: "safety", label: "Safety" });
    sectionItems.push({ id: "life-enrichment", label: "Life Enrichment" });
    sectionItems.push({ id: "pricing", label: "Payment" });
  } else {
    // Default nav for other categories
    sectionItems.push({ id: "highlights", label: "Highlights" });
    if (hasGoogleReviews) sectionItems.push({ id: "reviews", label: "Reviews" });
    sectionItems.push({ id: "qa", label: "Q&A" });
    if (hasBenefitsData) sectionItems.push({ id: "benefits", label: "Benefits" });
    sectionItems.push({ id: "services", label: "Services" });
    if (!hasGoogleReviews) sectionItems.push({ id: "reviews", label: "Reviews" });
    if (cmsData?.overall_rating && cmsData.overall_rating >= 4) sectionItems.push({ id: "quality", label: "Quality" });
    if (aiTrustSignals && aiTrustSignals.summary_score > 0) sectionItems.push({ id: "trust-signals", label: "Verified" });
    sectionItems.push({ id: "about", label: "About" });
    if (pricingDetails.length > 0) sectionItems.push({ id: "pricing", label: "Pricing" });
    if (hasAcceptedPayments) sectionItems.push({ id: "payment", label: "Payment" });
  }

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
    // Category-specific tags as schema keywords for SEO faceting.
    // Each tag's seoFacet + location produces a rankable search phrase.
    ...(categoryTags && categoryTags.all.length > 0 && {
      keywords: categoryTags.all.map((t) =>
        [t.seoFacet, profile.city, profile.state].filter(Boolean).join(" in "),
      ).join(", "),
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
              {images.length > 0 && (
                <div className="absolute top-4 left-4 z-20 hidden md:block">
                  <ClaimBadge
                    claimState={displayClaimState}
                    providerName={profile.display_name}
                    claimUrl={`/provider/onboarding?org=${profile.slug}`}
                  />
                </div>
              )}
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
                  {isAvalonFortWorth && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-teal-700 bg-teal-50 rounded-full px-2.5 py-1 font-medium">Updated June 2026</span>
                    </>
                  )}
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

              {/* Highlight badges — data-driven, variable count (1-4 items) */}
              {/* Hidden on mobile for cleaner hero, shown on desktop */}
              {highlights.length > 0 && (
                <div id="highlights" className="scroll-mt-20 hidden md:block">
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {isAvalonFortWorth && (
                      <div className="bg-green-50 border border-green-200 rounded-full py-1.5 px-3 flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
                        <span className="text-sm text-green-700 font-medium">Accepting residents</span>
                      </div>
                    )}
                    {highlights.map((h) => (
                      <div key={h.label} className="bg-white border border-gray-200 rounded-full py-1.5 px-3 flex items-center gap-2">
                        <HighlightIcon icon={h.icon} className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{h.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── "Manage this page" CTA — hidden on mobile for cleaner hero ── */}
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

              {/* Managed by — only show when staff data exists, hidden on mobile */}
              {hasStaff && (
                <div className="hidden md:flex items-center gap-2.5 mt-4">
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

            {/* Section Navigation — inline bar, desktop only */}
            {sectionItems.length > 0 && (
              <div className="mb-6">
                <SectionNav sections={sectionItems} />
              </div>
            )}

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
                // Surface what the provider entered in their "Hire more
                // caregivers" block: demand shape, PRN openness, and requirements.
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

                {/* Outreach arm of the 5-way intake A/B. Slot itself renders
                    null for the ~80% not in the outreach arm, so no wrapping div
                    here — it would leave a phantom mt-6 gap. The module owns
                    its own top margin. See IntakeVariantSlots.tsx. */}
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

              {/* ── About ── */}
              <div id="about" className="py-8 scroll-mt-20 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-gray-900 font-display">About {isAvalonFortWorth ? profile.display_name : ""}</h2>
                  {isAvalonFortWorth && (
                    <div className="flex items-center gap-2">
                      <a href="https://avalonmemorycare.com/location/fort-worth/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Website">
                        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                      </a>
                    </div>
                  )}
                </div>
                <ExpandableText
                  text={profile.description || (profile.category ? getCategoryDescription(profile.category, profile.display_name, locationStr || null) : "")}
                  maxLength={isAvalonFortWorth ? 400 : 300}
                />

                {/* Awards & Badges — Avalon Fort Worth */}
                {isAvalonFortWorth && (
                  <div className="mt-6 border border-amber-300/70 rounded-xl px-5 py-4">
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                      {[
                        { title: "NATIONAL AWARD WINNER", subtitle: "IBM National Award", badgeColor: "#C5A44E" },
                        { title: "BEST OF SENIOR LIVING", subtitle: "A Place for Mom, 2024", badgeColor: "#3B8EA5" },
                      ].map((badge) => (
                        <div key={badge.title} className="flex items-center gap-3">
                          <svg className="w-11 h-11 shrink-0" viewBox="0 0 44 48" fill="none">
                            <path d="M22 0L44 10V24C44 37.2 34.8 45.6 22 48C9.2 45.6 0 37.2 0 24V10L22 0Z" fill={badge.badgeColor} />
                            <path d="M22 8l2.4 5h5.6l-4 3.5 1.5 5.5-5.5-3.5-5.5 3.5 1.5-5.5-4-3.5h5.6z" fill="white" />
                            <rect x="8" y="28" width="28" height="8" rx="1" fill="white" opacity="0.9" />
                            <text x="22" y="34.5" textAnchor="middle" fontSize="5" fontWeight="700" fill={badge.badgeColor} fontFamily="system-ui">AWARD</text>
                          </svg>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-wide text-gray-900 uppercase">{badge.title}</span>
                            <span className="text-sm text-gray-500">{badge.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What makes this place special — Avalon */}
                {isAvalonFortWorth && (
                  <div className="mt-6 bg-teal-50/50 border border-teal-100 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                      <h3 className="text-base font-semibold text-teal-900">What makes this place special</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Boutique-style, ranch-level homes with secured patios and backyards, not an institutional facility",
                        "Specialized exclusively in memory care since 1995, with a focus on reducing medications and preserving dignity",
                        "Intentionally small communities that foster a family atmosphere and reduce feelings of loneliness",
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-2.5">
                          <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                          <span className="text-sm text-teal-800 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ── Benefits Discovery ── */}
              {/* Wrapped in BenefitsArmGate so the section disappears for the
                  40% of visitors in the outreach or multi_provider arms of the
                  5-way intake A/B. The 60% in the 3 benefits arms see the existing
                  module unchanged (with its internal mod-3 copy A/B). */}
              {!isAvalonFortWorth && !isStudentContext && hasBenefitsData && benefitsData && (
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

              {/* ── Care Services (hidden for Avalon — replaced by custom sections) ── */}
              {!isAvalonFortWorth && (
              <div id="services" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Care Services</h2>
                <CareServicesList services={careServices} initialCount={6} />
              </div>
              )}

              {/* ── Staff Screening — hidden when no real data, hidden for Avalon ── */}
              {!isAvalonFortWorth && hasStaffScreening && (
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
                    hidden in student context and Avalon, the "be first to review" prompt is family-facing) ── */}
              {!isAvalonFortWorth && !isStudentContext && (googleReviewsData?.reviews?.length ?? 0) === 0 && (
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
              {!isAvalonFortWorth && cmsData && cmsData.overall_rating && cmsData.overall_rating >= 4 && (
                <div className="py-8 border-t border-gray-200">
                  <CMSQualitySection cmsData={cmsData} />
                </div>
              )}

              {/* ── AI Verified Credentials (non-Avalon — shown inline here) ── */}
              {!isAvalonFortWorth && aiTrustSignals && aiTrustSignals.summary_score > 0 && (
                <div className="py-8 border-t border-gray-200">
                  <AiTrustSignalsSection signals={aiTrustSignals} />
                </div>
              )}

              {/* ── Condition-Specific Care (Memory Care) ── */}
              {isAvalonFortWorth && (() => {
                // Provider-supplied specialty (editable in portal)
                const specialtyHeading = "Specialized in Alzheimer's and dementia care";
                const specialtyDescription = "Avalon provides holistic, individualized care in a secure, family-style home setting with a focus on preserving dignity, autonomy, and quality of life at every stage.";

                // Conditions this provider confirms (each is a searchable term)
                const supportedConditions = [
                  "Alzheimer's disease",
                  "Vascular dementia",
                  "Lewy body dementia",
                  "Frontotemporal dementia",
                  "Parkinson's dementia",
                  "Stroke-related cognitive decline",
                  "Comorbidities & complex cases",
                  "Behavioral & mental health needs",
                  "Mobility assistance",
                  "Daily living support (ADLs)",
                  "Visual impairment",
                  "Hearing impairment",
                  "Post-surgery recovery",
                  "Respite / short-term stays",
                ];

                return (
                  <div id="care-approach" className="py-8 scroll-mt-20 border-t border-gray-200">
                    {/* Part 1: Primary specialty */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      <h2 className="text-2xl font-bold text-gray-900 font-display">{specialtyHeading}</h2>
                    </div>
                    <p className="text-base text-gray-600 leading-relaxed mb-5">{specialtyDescription}</p>

                    {/* Specialized conditions — collapses if empty */}
                    {supportedConditions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-3">Specialized in conditions</h3>
                        <div className="flex flex-wrap gap-2">
                          {supportedConditions.map((condition) => (
                            <span key={condition} className="bg-teal-50 text-sm text-teal-800 rounded-lg px-3 py-1.5">{condition}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Care Team & Staffing (Memory Care) ── */}
              {isAvalonFortWorth && (
              <div id="care-team" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Care Team & Staffing</h2>
                <p className="text-base text-gray-600 mb-5">Avalon keeps homes intentionally small, roughly 20 residents each, with a 1-to-5 staff-to-resident ratio compared to the 1-to-15 common at larger facilities. Low staff turnover means residents are cared for by experienced caregivers who know them personally.</p>

                {/* Key stats callout */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-teal-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xl font-bold text-teal-800">1:5</p>
                    <p className="text-xs text-teal-700 font-medium">Staff-to-resident ratio</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xl font-bold text-teal-800">~20</p>
                    <p className="text-xs text-teal-700 font-medium">Residents per home</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xl font-bold text-teal-800">24/7</p>
                    <p className="text-xs text-teal-700 font-medium">On-site staffing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">On-Site Team</h3>
                    </div>
                    <ul className="space-y-3">
                      {["RN staff on-site at each home", "Dementia-trained caregivers (not agency temps)", "Low turnover, experienced staff who stay", "Trained to handle behavioral changes & disease progression"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">Care Partnerships</h3>
                    </div>
                    <ul className="space-y-3">
                      {["Hospice & house call physician partnerships", "Medication management with minimal-use philosophy", "Individualized care plan reviews with families", "Regular family communication & progress updates"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              )}

              {/* ── Safety & Accommodations (Memory Care) ── */}
              {isAvalonFortWorth && (
              <div id="safety" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Safety & Accommodations</h2>
                <p className="text-base text-gray-600 mb-5">Purpose-built, ranch-level homes designed for secure, comfortable living, not an institutional facility.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">Security</h3>
                    </div>
                    <ul className="space-y-3">
                      {["Magnetic door locks & 24/7 monitoring", "Emergency alert systems", "Secured patios & landscaped backyards", "Wandering prevention technology"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">Accommodations</h3>
                    </div>
                    <ul className="space-y-3">
                      {["Private rooms with personalized décor", "Ranch-style, one-level homes", "Comfortable furnishings", "Housekeeping & laundry included"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              )}

              {/* ── Life Enrichment (Memory Care) ── */}
              {isAvalonFortWorth && (
              <div id="life-enrichment" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Life Enrichment</h2>
                <p className="text-base text-gray-600 mb-5">Avalon&apos;s life enrichment programming is designed to preserve abilities, spark joy, and foster connection with activities tailored to each resident&apos;s interests and cognitive level.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">Creative & Social</h3>
                    </div>
                    <ul className="space-y-3">
                      {["Musical performances & sing-alongs", "Baking & cooking activities", "Arts & crafts projects", "Group social gatherings"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 3.75V16.5" /></svg>
                      <h3 className="text-sm font-bold text-teal-700 tracking-wide uppercase">Dining & Wellness</h3>
                    </div>
                    <ul className="space-y-3">
                      {["Three daily home-cooked meals", "Special dietary accommodations", "Gentle exercise & movement programs", "Outdoor walks in secured courtyard"].map((item) => (
                        <li key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-medium text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              )}

              {/* ── Cost of Care (Memory Care) ── */}
              {isAvalonFortWorth && (
                <div id="pricing" className="py-8 scroll-mt-20 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Payment and Finances</h2>
                  <p className="text-base text-gray-600 mb-5">Monthly rates are based on each resident&apos;s assessed care level. The standard rate is all-inclusive (room, meals, activities, and 24/7 care) with add-ons available for private rooms and specialized care needs.</p>

                  {/* Base rate + what's included */}
                  <div className="bg-gray-50 rounded-xl px-5 py-4 mb-4">
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {hasPriceRange ? priceRange : "Contact for pricing"}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">Area estimate. Actual rate determined by care assessment.</p>

                    <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-3">What&apos;s included in the standard rate</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {["Private or shared room", "Three daily home-cooked meals", "24/7 care & security", "All life enrichment activities", "Housekeeping & laundry", "Medication management"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="rounded-xl border border-gray-200 px-5 py-4 mb-4">
                    <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-3">Available add-ons</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {["Private room upgrade", "Specialized care for higher acuity", "Respite / short-term stays", "Hospice coordination"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & financial support */}
                  <div className="rounded-xl border border-gray-200 px-5 py-4">
                    <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-3">Payment & financial support</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Private Pay", "Long-Term Care Insurance", "Veterans Benefits (Aid & Attendance)", "Payment plans available", "Financial planning support"].map((type) => (
                        <span key={type} className="bg-gray-100 text-sm text-gray-700 rounded-lg px-3 py-1.5">{type}</span>
                      ))}
                    </div>
                  </div>

                  <ScrollToConnectionCard entryPoint="custom_quote" className="w-full md:w-auto mt-5 px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Get a custom quote
                  </ScrollToConnectionCard>
                </div>
              )}

              {/* ── Neighborhood Map (Memory Care) ── */}
              {isAvalonFortWorth && (
              <div className="py-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-display mb-1">What&apos;s nearby</h3>
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
              )}

              {/* ── Verified Credentials (Avalon — at the very bottom) ── */}
              {isAvalonFortWorth && aiTrustSignals && aiTrustSignals.summary_score > 0 && (
                <div className="py-8 border-t border-gray-200">
                  <AiTrustSignalsSection signals={aiTrustSignals} />
                </div>
              )}

              {/* ── Detailed Pricing ── */}
              {pricingDetails.length > 0 && (
                <div id="pricing" className="py-8 scroll-mt-20 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 font-display mb-5">Prices at {profile.display_name}</h2>
                  <div className="space-y-2">
                    {pricingDetails.map((item) => (
                      <div
                        key={item.service}
                        className="flex items-center justify-between py-3.5 px-4 bg-gray-50 rounded-lg"
                      >
                        <span className="text-base font-medium text-gray-900">{item.service}</span>
                        <span className="text-base font-semibold text-gray-900">
                          {item.rate} <span className="font-normal text-gray-500">/{item.rateType.replace("per ", "")}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <ScrollToConnectionCard entryPoint="custom_quote" className="w-full md:w-auto mt-6 px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    Get a custom quote
                  </ScrollToConnectionCard>
                  {pricingConfig && (
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                      {pricingConfig.disclaimer({
                        providerName: profile.display_name,
                        city: profile.city ?? undefined,
                        state: profile.state ?? undefined,
                      })}
                      {pricingConfig.coverageNote && (
                        <> {pricingConfig.coverageNote({
                          providerName: profile.display_name,
                          city: profile.city ?? undefined,
                          state: profile.state ?? undefined,
                        })}</>
                      )}
                    </p>
                  )}
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

        {/* ===== Compare Providers (hidden in student context) ===== */}
        {!isStudentContext && similarProviders.providers.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mt-4">
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
