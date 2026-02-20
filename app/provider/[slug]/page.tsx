import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, OrganizationMetadata, CaregiverMetadata } from "@/lib/types";
import { iosProviderToProfile } from "@/lib/mock-providers";
import type { Provider as IOSProvider } from "@/lib/types/provider";
import ConnectionCard from "@/components/providers/connection-card";
import ProviderHeroGallery from "@/components/providers/ProviderHeroGallery";
import Breadcrumbs from "@/components/providers/Breadcrumbs";
import ExpandableText from "@/components/providers/ExpandableText";
import CompactProviderCard from "@/components/providers/CompactProviderCard";
import SaveButton from "@/components/providers/SaveButton";
import CareServicesList from "@/components/providers/CareServicesList";
import QASectionV2 from "@/components/providers/QASectionV2";
import SectionNav from "@/components/providers/SectionNav";
import type { SectionItem } from "@/components/providers/SectionNav";
import ClaimBadge from "@/components/providers/ClaimBadge";
import {
  getInitials,
  formatCategory,
  getSimilarProviders,
  getDefaultQA,
} from "@/lib/provider-utils";

// Extended metadata type that includes mock-specific fields
interface ExtendedMetadata extends OrganizationMetadata, CaregiverMetadata {
  rating?: number;
  review_count?: number;
  images?: string[];
  staff?: { name: string; position: string; bio: string; image: string };
  badge?: string;
  accepted_payments?: string[];
  pricing_details?: { service: string; rate: string; rateType: string }[];
  staff_screening?: { background_checked: boolean; licensed: boolean; insured: boolean };
  reviews?: { name: string; rating: number; date: string; comment: string; relationship?: string }[];
  community_score?: number;
  value_score?: number;
  info_score?: number;
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


// ============================================================
// Page Component
// ============================================================

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // --- Data fetching ---
  let profile: Profile | null = null;

  // 1. Try iOS Supabase (olera-providers table) first
  try {
    const supabase = await createClient();
    const { data: iosProvider } = await supabase
      .from("olera-providers")
      .select("*")
      .eq("provider_id", slug)
      .not("deleted", "is", true)
      .single<IOSProvider>();

    if (iosProvider) {
      profile = iosProviderToProfile(iosProvider);
    }
  } catch {
    // iOS Supabase not configured or provider not found
  }

  // 2. Try web business_profiles table
  if (!profile) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("slug", slug)
        .in("type", ["organization", "caregiver"])
        .single<Profile>();
      profile = data;
    } catch {
      // Supabase not configured — fall through to mock lookup
    }
  }

  if (!profile) {
    return (
      <div className="bg-vanilla-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Provider not found</h1>
          <p className="mt-2 text-gray-600">
            The provider you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // --- Data extraction ---
  const meta = profile.metadata as ExtendedMetadata;
  const priceRange =
    meta?.price_range ||
    (meta?.hourly_rate_min && meta?.hourly_rate_max
      ? `$${meta.hourly_rate_min}-${meta.hourly_rate_max}/hr`
      : null);

  const rating = meta?.rating;
  const reviewCount = meta?.review_count;
  const images = meta?.images || (profile.image_url ? [profile.image_url] : []);
  const staff = meta?.staff;
  const acceptedPayments = meta?.accepted_payments || [];

  const categoryLabel = formatCategory(profile.category);
  const locationStr = [profile.city, profile.state].filter(Boolean).join(", ");

  const similarProviders = await getSimilarProviders(profile.category, profile.slug, 3);

  const pricingDetails = meta?.pricing_details || [];
  const staffScreening = meta?.staff_screening;
  const reviews = meta?.reviews || [];
  const defaultQA = getDefaultQA(profile.category, profile.display_name);

  // Olera Score: use community_score if available, otherwise rating
  const oleraScore = meta?.community_score || (rating ? Math.round(rating * 10) / 10 : null);

  // --- Display data (real or dummy fallbacks) ---
  const displayRating = rating ?? 4.2;
  const displayReviewCount = reviewCount ?? 8;
  const displayPriceRange = priceRange ?? "$25-$45 / hr";
  const displayStaff = staff ?? { name: "John Smith", position: "Owner & Manager", bio: "I believe that great care begins with heart-led leadership. I started this home to ensure that every senior no matter their background or health condition, we take our time to ensure they receive the best care possible. We listen to families and work with them to create personalized care plans.", image: "" };
  const displayReviews = reviews.length > 0 ? reviews : [
    { name: "Margaret T.", rating: 5, date: "2 weeks ago", comment: "The caregivers are wonderful and truly care about my mother's well-being. They go above and beyond every day and treat her like family." },
    { name: "Robert K.", rating: 4, date: "1 month ago", comment: "Great communication and reliable service. My father has been very happy with the care he receives. Would recommend to other families." },
  ];
  const displayOleraScore = oleraScore ?? 4.2;
  const displayCareTypes = (profile.care_types && profile.care_types.length > 0) ? profile.care_types : [
    "Dressing assistance", "Bathroom assistance", "Bathing and showering",
    "Exercise and wellness services", "Health and medical services",
    "Meals and dining services", "Transportation services", "Cleaning and housekeeping",
    "Recreational services", "Community activities",
    "Medication management", "Laundry services",
  ];

  // Build highlights from screening + care types
  const highlights: string[] = [];
  if (staffScreening?.background_checked || !staffScreening) highlights.push("Background-Checked");
  const topServices = (profile.care_types && profile.care_types.length > 0)
    ? profile.care_types.slice(0, 3)
    : ["Light Housekeeping", "Certified Caregivers", "Companionship"];
  highlights.push(...topServices);
  const displayHighlights = highlights.slice(0, 4);

  // Score breakdowns
  const scoreBreakdown = [
    { label: "Community sentiment", value: meta?.community_score ?? 3.8 },
    { label: "Value", value: meta?.value_score ?? 4.0 },
    { label: "Information Availability", value: meta?.info_score ?? 4.7 },
  ];

  // ============================================================
  // Section navigation items (1.0 order)
  // ============================================================
  const sectionItems: SectionItem[] = [];
  sectionItems.push({ id: "highlights", label: "Highlights" });
  sectionItems.push({ id: "services", label: "Services" });
  sectionItems.push({ id: "about", label: "About" });
  if (pricingDetails.length > 0 || !priceRange) sectionItems.push({ id: "pricing", label: "Pricing" });
  sectionItems.push({ id: "payment", label: "Payment" });
  sectionItems.push({ id: "qa", label: "Q&A" });
  sectionItems.push({ id: "reviews", label: "Reviews" });

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="bg-vanilla-100 min-h-screen">

      {/* Section Navigation (appears on scroll) */}
      <SectionNav
        sections={sectionItems}
        providerName={profile.display_name}
        oleraScore={displayOleraScore}
      />

      {/* ===== Main Layout ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">

        {/* Breadcrumbs */}
        <Breadcrumbs
          category={profile.category}
          city={profile.city}
          state={profile.state}
          providerName={profile.display_name}
        />

        {/* -- Two-Column Grid -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ========== Left Column ========== */}
          <div className="lg:col-span-2">

            {/* ── Hero ── */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Gallery */}
              <div className="flex-shrink-0 relative">
                <ProviderHeroGallery
                  images={images}
                  providerName={profile.display_name}
                  category={profile.category}
                />
                {images.length > 0 && (
                  <div className="absolute top-4 left-4 z-20">
                    <ClaimBadge
                      claimState={profile.claim_state}
                      providerName={profile.display_name}
                      claimUrl={`/for-providers/claim/${profile.slug}`}
                    />
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                {/* Name + Save */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight font-serif">
                    {profile.display_name}
                  </h1>
                  <SaveButton
                    provider={{
                      providerId: profile.id,
                      slug: profile.slug,
                      name: profile.display_name,
                      location: locationStr,
                      careTypes: profile.care_types || [],
                      image: images[0] || null,
                      rating: rating || undefined,
                    }}
                    variant="pill"
                  />
                </div>

                {/* Context line: category · location · rating · price */}
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-sm text-gray-500">
                  {categoryLabel && (
                    <>
                      <span className="text-gray-700 font-medium">{categoryLabel}</span>
                      <span className="text-gray-300">·</span>
                    </>
                  )}
                  {locationStr && (
                    <>
                      <span>{locationStr}</span>
                      <span className="text-gray-300">·</span>
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-primary-500" />
                    <span className="font-semibold text-gray-900">{displayRating.toFixed(1)}</span>
                    <span>({displayReviewCount})</span>
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="font-semibold text-gray-900">{displayPriceRange}</span>
                </div>

                {/* Address */}
                {profile.address && (
                  <p className="text-sm text-gray-400 mt-1">{profile.address}</p>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                Content Sections (1.0 order)
               ══════════════════════════════════════════ */}
            <div className="mt-10">

              {/* ── Highlights ── */}
              <div id="highlights" className="pb-8 scroll-mt-20">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">Highlights</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {displayHighlights.map((label) => (
                    <div key={label} className="bg-primary-25 rounded-xl py-5 px-3 flex flex-col items-center text-center">
                      <svg className="w-7 h-7 text-primary-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Managed by ── */}
              <div className="pb-8 flex items-center gap-3">
                {displayStaff.image ? (
                  <img src={displayStaff.image} alt={displayStaff.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">{getInitials(displayStaff.name)}</span>
                  </div>
                )}
                <p className="text-base text-gray-700">
                  Managed by: <span className="font-semibold text-gray-900">{displayStaff.name}</span>
                </p>
              </div>

              {/* ── Care Services ── */}
              <div id="services" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">Care Services</h2>
                <CareServicesList services={displayCareTypes} initialCount={9} />
              </div>

              {/* ── Staff Screening ── */}
              <div id="screening" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">Staff Screening</h2>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    { label: "Background Checked", verified: staffScreening?.background_checked ?? true },
                    { label: "Licensed", verified: staffScreening?.licensed ?? true },
                    { label: "Insured", verified: staffScreening?.insured ?? true },
                  ].filter(item => item.verified).map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span className="text-base text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── About ── */}
              <div id="about" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-4">About</h2>
                <ExpandableText
                  text={profile.description || `${profile.display_name} stands out among other ${categoryLabel || "senior care"} providers${locationStr ? ` in ${locationStr}` : ""} for its authentic approach and deeply personal touch. The business is rooted in the experiences of caring for family members with health needs. Request a consultation to learn about their services, availability, and pricing.`}
                  maxLength={300}
                />
              </div>

              {/* ── Detailed Pricing ── */}
              {pricingDetails.length > 0 && (
                <div id="pricing" className="py-8 scroll-mt-20 border-t border-gray-200">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 font-serif">Prices at {profile.display_name}</h2>
                      <p className="text-sm text-gray-400 mt-1">Last updated on 01/15/2025</p>
                    </div>
                    <button className="px-5 py-2.5 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0">
                      Get a custom quote
                    </button>
                  </div>
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
                </div>
              )}

              {/* ── Payment & Insurance ── */}
              <div id="payment" className="py-8 scroll-mt-20 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">Acceptable Payment / Insurance Options</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(acceptedPayments.length > 0 ? acceptedPayments : ["Private Pay", "LTC Insurance", "Home-Care Waivers", "Medicaid", "Medicare"]).map((payment) => (
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
                  <button className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    Book a consultation
                  </button>
                </p>
              </div>

              {/* ── Customer Questions & Answers ── */}
              <div id="qa" className="py-8 scroll-mt-20 border-t border-gray-200">
                <QASectionV2
                  providerName={profile.display_name}
                  providerImage={images[0]}
                  questions={defaultQA}
                />
              </div>

              {/* ── Our Rating ── */}
              <div id="reviews" className="py-8 scroll-mt-20 border-t border-gray-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">{displayOleraScore.toFixed(1)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">Our Rating</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Based on amenities, community compliance and profile completeness.{" "}
                      <button className="text-primary-600 hover:text-primary-700 font-medium">Learn more</button>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {scoreBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-48 flex-shrink-0">{item.label}:</span>
                      <span className="text-sm font-semibold text-primary-600 w-12 flex-shrink-0">{item.value.toFixed(1)} / 5</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${(item.value / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── What families are saying ── */}
              <div className="py-8 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">What families are saying</h2>
                  <span className="text-sm text-gray-400">Sort by: <button className="text-gray-700 font-medium">Most Helpful</button></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayReviews.map((review, index) => (
                    <div key={index} className="border border-gray-100 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600">{review.name.split(" ").map(n => n[0]).join("")}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                            <p className="text-xs text-gray-400">{review.date}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary-600">{review.rating.toFixed(1)} / 5 <StarIcon className="w-3.5 h-3.5 text-primary-500 inline" /></span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.comment.length > 180 ? review.comment.slice(0, 180).trimEnd() + "... " : review.comment + " "}
                        {review.comment.length > 180 && (
                          <button className="text-primary-600 font-medium">read more</button>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-5">
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Show more
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                    Add review
                  </button>
                </div>
              </div>

              {/* ── Facility Manager ── */}
              <div id="team" className="py-8 border-t border-gray-200 scroll-mt-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">Facility manager</h2>
                  <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                    Connect with us
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="border border-gray-200 rounded-xl p-5 text-center flex-shrink-0 w-40">
                    {displayStaff.image ? (
                      <img src={displayStaff.image} alt={displayStaff.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl font-bold text-gray-500">{getInitials(displayStaff.name)}</span>
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900">{displayStaff.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{displayStaff.position}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Care motivation</h3>
                    <ExpandableText text={displayStaff.bio} maxLength={200} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
                  <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75" />
                  </svg>
                  To help protect your family, the Olera team vet facility managers for information accuracy.
                </div>
              </div>

              {/* ── Disclaimer ── */}
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 font-serif mb-4">Disclaimer</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We strive to keep this page accurate and current, but some details may not be up to date. To confirm whether {profile.display_name} is the right fit for you or your loved one, please verify all information directly with the provider by submitting a connect request or contacting them.
                </p>
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                  <p className="text-base font-semibold text-gray-900">Are you the owner of this business?</p>
                  <Link
                    href={`/for-providers/claim/${profile.slug}`}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
                  >
                    Manage this page
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* ========== Right Column — Sticky Sidebar ========== */}
          <div className="lg:col-span-1 self-stretch">
            <div className="sticky top-24">
              <ConnectionCard
                providerId={profile.id}
                providerName={profile.display_name}
                providerSlug={profile.slug}
                priceRange={priceRange}
                oleraScore={oleraScore}
                reviewCount={meta?.review_count}
                phone={profile.phone}
                acceptedPayments={acceptedPayments}
                careTypes={profile.care_types}
                isActive={profile.is_active}
                responseTime={null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Compare Providers (full-width) ===== */}
      {similarProviders.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-6">
              Compare {profile.display_name}{locationStr ? ` of ${locationStr}` : ""} to the best local options
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarProviders.map((provider) => (
                <CompactProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
