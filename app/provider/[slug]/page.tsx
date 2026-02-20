import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, OrganizationMetadata, CaregiverMetadata } from "@/lib/types";
import { iosProviderToProfile } from "@/lib/mock-providers";
import type { Provider as IOSProvider } from "@/lib/types/provider";
import ConnectionCard from "@/components/providers/connection-card";
import ProviderHeroGallery from "@/components/providers/ProviderHeroGallery";
import Breadcrumbs from "@/components/providers/Breadcrumbs";
import QuickFacts from "@/components/providers/QuickFacts";
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
  buildQuickFacts,
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

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
      <div className="bg-white min-h-screen flex items-center justify-center">
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

  const quickFacts = buildQuickFacts({
    category: profile.category,
    city: profile.city,
    state: profile.state,
    yearFounded: meta?.year_founded,
    bedCount: meta?.bed_count,
    yearsExperience: meta?.years_experience,
    acceptsMedicaid: meta?.accepts_medicaid,
    acceptsMedicare: meta?.accepts_medicare,
    priceRange,
  });

  const similarProviders = await getSimilarProviders(profile.category, profile.slug, 4);

  const pricingDetails = meta?.pricing_details || [];
  const staffScreening = meta?.staff_screening;
  const reviews = meta?.reviews || [];
  const defaultQA = getDefaultQA(profile.category, profile.display_name);

  // Olera Score: use community_score if available, otherwise rating
  const oleraScore = meta?.community_score || (rating ? Math.round(rating * 10) / 10 : null);

  // ============================================================
  // Section navigation items (built dynamically based on available data)
  // ============================================================
  const sectionItems: SectionItem[] = [];
  sectionItems.push({ id: "about", label: "Overview" });
  if (profile.care_types && profile.care_types.length > 0) sectionItems.push({ id: "services", label: "Services" });
  if (pricingDetails.length > 0) sectionItems.push({ id: "pricing", label: "Pricing" });
  if (acceptedPayments.length > 0 || meta?.accepts_medicaid || meta?.accepts_medicare) sectionItems.push({ id: "payment", label: "Payment" });
  if (staffScreening) sectionItems.push({ id: "safety", label: "Safety" });
  if (staff) sectionItems.push({ id: "team", label: "Team" });
  if (defaultQA.length > 0) sectionItems.push({ id: "qa", label: "Q&A" });
  if (oleraScore || reviews.length > 0) sectionItems.push({ id: "reviews", label: "Reviews" });

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="bg-white min-h-screen">

      {/* Section Navigation (appears on scroll) */}
      <SectionNav
        sections={sectionItems}
        providerName={profile.display_name}
        oleraScore={oleraScore}
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

        {/* -- Identity: Category + Provider Name + Location + Share/Save -- */}
        <div className="mb-4">
          {categoryLabel && (
            <p className="text-primary-600 text-sm font-semibold uppercase tracking-wider mb-1">
              {categoryLabel}
            </p>
          )}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex items-center gap-2">
              {profile.display_name}
              {profile.claim_state === "claimed" && (
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              )}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg w-24 py-2 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
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
              />
            </div>
          </div>
          {/* Pricing / Rating / Location summary row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm">
            {rating && (
              <span className="flex items-center gap-1 text-gray-700">
                <StarIcon className="w-4 h-4 text-yellow-400" filled />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                {reviewCount && <span className="text-gray-400">({reviewCount})</span>}
              </span>
            )}
            {locationStr && (
              <span className="flex items-center gap-1 text-gray-500">
                <MapPinIcon className="w-4 h-4" />
                {locationStr}
              </span>
            )}
            {priceRange && (
              <span className="font-medium text-gray-700">{priceRange}</span>
            )}
          </div>

          {profile.address && (
            <p className="text-sm text-gray-500 mt-1">
              {profile.address}
            </p>
          )}
        </div>

        {/* -- Two-Column Grid (Image+Content | Sidebar) -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column — Image + Content */}
          <div className="lg:col-span-2">

            {/* -- Top Stack: Hero Gallery + Quick Facts -- */}
            <div>
              {/* Hero Gallery */}
              <div className="relative">
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

              {/* Quick Facts Bar */}
              <div className="mt-4">
                <QuickFacts facts={quickFacts} />
              </div>
            </div>

            {/* -- Content Sections -- */}
            <div className="mt-[44px]">

            {/* 1. Unclaimed Banner */}
            {profile.claim_state === "unclaimed" && (
              <div className="pb-12">
                <div className="bg-warm-50 border border-warm-100 rounded-xl p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-warm-800 text-base">
                          This profile hasn&apos;t been claimed yet
                        </p>
                        <p className="text-sm text-warm-600">
                          Information may be outdated. Is this your organization?
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/for-providers/claim/${profile.slug}`}
                      className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                    >
                      Claim This Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* 2. About */}
            <div id="about" className="pb-12 first:pt-0 scroll-mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About {profile.display_name}
              </h2>
              <ExpandableText
                text={profile.description || `${profile.display_name} is a ${categoryLabel || "senior care"} provider${locationStr ? ` located in ${locationStr}` : ""}. Contact them directly for more information about their services, availability, and pricing.`}
                maxLength={150}
              />
            </div>

            {/* 3. Care Services */}
            {profile.care_types && profile.care_types.length > 0 && (
              <div id="services" className="py-12 scroll-mt-20 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Care Services</h2>
                <CareServicesList services={profile.care_types} initialCount={9} />
              </div>
            )}

            {/* 4. Detailed Pricing */}
            {pricingDetails.length > 0 && (
              <div id="pricing" className="py-12 scroll-mt-20 border-t border-gray-100">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Prices at {profile.display_name}</h2>
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

            {/* 5. Payment & Insurance */}
            {(acceptedPayments.length > 0 || meta?.accepts_medicaid || meta?.accepts_medicare) && (
              <div id="payment" className="py-12 scroll-mt-20 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Acceptable Payment Options</h2>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {acceptedPayments.map((payment) => (
                    <div key={payment} className="flex items-center gap-2.5">
                      <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span className="text-base text-gray-700">{payment}</span>
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
            )}

            {/* 7. Staff Screening & Safety */}
            {staffScreening && (
              <div id="safety" className="py-12 scroll-mt-20 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Staff Screening &amp; Safety</h2>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {[
                    { label: "Background Checked", verified: staffScreening.background_checked },
                    { label: "Licensed", verified: staffScreening.licensed },
                    { label: "Insured", verified: staffScreening.insured },
                  ].filter(item => item.verified).map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span className="text-base text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. Meet Our Team */}
            {staff && (
              <div id="team" className="py-12 scroll-mt-20 border-t border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Meet Our Team</h2>
                <div className="flex items-start gap-4">
                  {staff.image ? (
                    <img
                      src={staff.image}
                      alt={staff.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary-600">
                        {getInitials(staff.name)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">{staff.name}</h3>
                    <p className="text-primary-600 text-sm font-medium mt-0.5">{staff.position}</p>
                    <p className="text-gray-600 text-base mt-2 leading-relaxed">{staff.bio}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Q&A */}
            {defaultQA.length > 0 && (
              <div id="qa" className="py-12 scroll-mt-20 border-t border-gray-100">
                <QASectionV2
                  providerName={profile.display_name}
                  providerImage={images[0]}
                  questions={defaultQA}
                />
              </div>
            )}

            {/* 11. Disclaimer */}
            <div className="py-12 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We strive to keep this page accurate and current, but some details may not be up to date. To confirm whether {profile.display_name} is the right fit for you or your loved one, please verify all information directly with the provider by submitting a connect request or contacting them.
              </p>
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                <p className="text-base font-semibold text-gray-900">Are you the owner of this business?</p>
                <Link
                  href={`/for-providers/claim/${profile.slug}`}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  Manage this page
                </Link>
              </div>
            </div>

            </div>
          </div>

          {/* Right Column — Sticky Sidebar */}
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

      {/* ===== Olera Score & Reviews — Full-Width Section ===== */}
      {(oleraScore || reviews.length > 0) && (
        <div id="reviews" className="bg-gradient-to-b from-gray-50 to-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

            {/* Olera Score */}
            {oleraScore && (
              <div className="text-center mb-16">
                <p className="text-sm uppercase tracking-[0.2em] text-primary-600 font-semibold mb-6">Olera Score</p>
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="w-32 h-32 rounded-full bg-white border-2 border-primary-100 shadow-lg flex items-center justify-center">
                    <span className="text-5xl font-bold text-primary-700 tracking-tight">{oleraScore.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} className={`w-6 h-6 ${star <= Math.round(oleraScore) ? "text-yellow-400" : "text-gray-200"}`} filled={star <= Math.round(oleraScore)} />
                  ))}
                </div>
                {/* Breakdown cards — only show when real sub-scores exist */}
                {(() => {
                  const scoreBreakdown = [
                    { label: "Community", value: meta?.community_score },
                    { label: "Value", value: meta?.value_score },
                    { label: "Information Availability", value: meta?.info_score },
                  ].filter((f): f is { label: string; value: number } => !!f.value && f.value > 0);

                  if (scoreBreakdown.length === 0) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                      {scoreBreakdown.map((f) => (
                        <div key={f.label} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                          <span className="text-3xl font-bold text-gray-900 tracking-tight">{f.value.toFixed(1)}</span>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3 mb-2">
                            <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${(f.value / 5) * 100}%` }} />
                          </div>
                          <span className="text-xs uppercase tracking-[0.15em] text-gray-500 font-medium">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    What families are saying
                  </h2>
                  {reviews.length > 0 && (
                    <p className="text-base text-gray-500 mt-1">{reviews.length} {reviews.length === 1 ? "family" : "families"} shared their experience</p>
                  )}
                </div>
                <button className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  Write a review
                </button>
              </div>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {reviews.map((review, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100">
                      {/* Quote mark decoration */}
                      <svg className="w-8 h-8 text-primary-100 mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609L9.978 5.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z" />
                      </svg>
                      {/* Review text first (Airbnb pattern) */}
                      <p className="text-base text-gray-600 leading-relaxed mb-5">
                        {review.comment.length > 200 ? review.comment.slice(0, 200).trimEnd() + "..." : review.comment}
                      </p>
                      {/* Reviewer identity at bottom */}
                      <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">{review.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon key={star} className={`w-3 h-3 ${star <= review.rating ? "text-yellow-400" : "text-gray-200"}`} filled={star <= review.rating} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
                  <p className="text-base text-gray-500">No reviews yet. Be the first to share your experience.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Similar Providers ===== */}
      {similarProviders.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Compare to best local options
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
