import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  type Provider,
  PROVIDERS_TABLE,
  parseProviderImages,
  formatPriceRange,
  getPrimaryImage,
  formatLocation,
  getCategoryDisplayName,
} from "@/lib/types/provider";
import { getProviderBySlug } from "@/lib/mock-providers";
import InquiryButton from "@/components/providers/InquiryButton";
import ImageCarousel from "@/components/providers/ImageCarousel";
import ExpandableText from "@/components/providers/ExpandableText";

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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// --- Similar Provider Card ---
function SimilarProviderCard({ provider }: { provider: Provider }) {
  const primaryImage = getPrimaryImage(provider);
  const locationStr = formatLocation(provider);
  const rating = provider.google_rating;

  return (
    <Link
      href={`/provider/${provider.provider_id}`}
      className="group flex gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={provider.provider_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-500/50">
              {provider.provider_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-primary-600 transition-colors">
          {provider.provider_name}
        </h3>
        {locationStr && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{locationStr}</p>
        )}
        {rating && (
          <div className="flex items-center gap-1 mt-1.5">
            <StarIcon className="w-3.5 h-3.5 text-yellow-400" filled />
            <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
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

  // --- Data fetching from iOS Supabase ---
  let provider: Provider | null = null;
  let similarProviders: Provider[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(PROVIDERS_TABLE)
      .select("*")
      .eq("provider_id", slug)
      .eq("deleted", false)
      .single<Provider>();

    if (!error && data) {
      provider = data;

      // Fetch similar providers (same category, different provider)
      const { data: similar } = await supabase
        .from(PROVIDERS_TABLE)
        .select("*")
        .eq("deleted", false)
        .ilike("provider_category", `%${data.provider_category.split(" | ")[0]}%`)
        .neq("provider_id", slug)
        .not("provider_images", "is", null)
        .order("google_rating", { ascending: false, nullsFirst: false })
        .limit(6);

      if (similar) {
        similarProviders = similar as Provider[];
      }
    }
  } catch {
    // Supabase not configured — fall through to mock lookup
  }

  // Fallback to mock data for development/demo
  if (!provider) {
    const mockProvider = getProviderBySlug(slug);
    if (mockProvider) {
      // Convert mock to Provider format
      provider = {
        provider_id: mockProvider.slug,
        provider_name: mockProvider.name,
        provider_category: mockProvider.primaryCategory,
        main_category: null,
        phone: null,
        email: null,
        website: null,
        google_rating: mockProvider.rating,
        address: mockProvider.address,
        city: mockProvider.address.split(", ")[1] || null,
        state: mockProvider.address.split(", ")[2]?.split(" ")[0] || null,
        zipcode: null,
        lat: null,
        lon: null,
        place_id: null,
        provider_images: mockProvider.images?.join(" | ") || null,
        provider_logo: mockProvider.image,
        provider_description: mockProvider.description || null,
        community_Score: null,
        value_score: null,
        information_availability_score: null,
        lower_price: null,
        upper_price: null,
        contact_for_price: null,
        deleted: false,
        deleted_at: null,
      };
    }
  }

  if (!provider) {
    return (
      <div className="bg-[#FFFEF8] min-h-screen flex items-center justify-center">
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

  // --- Data extraction (using iOS schema directly) ---
  const images = parseProviderImages(provider.provider_images);
  const primaryImage = getPrimaryImage(provider);
  const allImages = primaryImage && !images.includes(primaryImage)
    ? [primaryImage, ...images]
    : images.length > 0 ? images : (primaryImage ? [primaryImage] : []);

  const priceRange = formatPriceRange(provider);
  const rating = provider.google_rating;
  const categoryLabel = getCategoryDisplayName(provider.provider_category);
  const locationStr = formatLocation(provider);

  // Build full address string
  const fullAddress = [
    provider.address,
    provider.city,
    provider.state,
    provider.zipcode,
  ].filter(Boolean).join(", ");

  // Build scores display if available
  const scores: { label: string; value: number }[] = [];
  if (provider.community_Score) scores.push({ label: "Community", value: provider.community_Score });
  if (provider.value_score) scores.push({ label: "Value", value: provider.value_score });
  if (provider.information_availability_score) scores.push({ label: "Info Quality", value: provider.information_availability_score });

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="bg-[#FFFEF8] min-h-screen">

      {/* ===== Breadcrumbs + Share ===== */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <ol className="flex items-center gap-1.5 text-base text-gray-500">
            <li>
              <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            </li>
            <li><ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" /></li>
            <li>
              <Link href="/browse" className="hover:text-primary-600 transition-colors">Browse</Link>
            </li>
            {categoryLabel && (
              <>
                <li><ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" /></li>
                <li>
                  <Link
                    href={`/browse?category=${encodeURIComponent(provider.provider_category)}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {categoryLabel}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" /></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {provider.provider_name}
            </li>
          </ol>
          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Share
            </button>
            <button className="flex items-center gap-1.5 text-base text-gray-500 hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Save
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Main Two-Column Layout ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left Column — Image + Content */}
          <div className="lg:col-span-2">

            {/* ── Top Stack: Image + Identity ── */}
            <div>
              {/* Image Carousel */}
              {allImages.length > 0 && (
                <ImageCarousel images={allImages} alt={provider.provider_name} className="h-[420px]" />
              )}

              {/* Category + Provider Name + Location */}
              <div className={allImages.length > 0 ? "mt-6" : ""}>
                {categoryLabel && (
                  <p className="text-primary-600 text-sm font-semibold uppercase tracking-wider mb-1">
                    {categoryLabel}
                  </p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                  {provider.provider_name}
                  {rating && rating >= 4.0 && (
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  )}
                </h1>
                {fullAddress && (
                  <p className="text-[15px] text-gray-500 mt-1 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {fullAddress}
                  </p>
                )}
              </div>

              {/* Scores Bar (if available) */}
              {scores.length > 0 && (
                <div className="grid grid-cols-3 rounded-lg overflow-hidden mt-4 bg-white border border-gray-200 shadow-sm">
                  {scores.map((score, index) => (
                    <div
                      key={score.label}
                      className={`flex flex-col items-center text-center px-4 py-4 ${
                        index > 0 ? "border-l border-gray-200" : ""
                      }`}
                    >
                      <p className="text-2xl font-bold text-primary-600">{score.value.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">{score.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Content Sections ── */}
            <div className="mt-[44px] space-y-[44px]">

              {/* Unclaimed Banner */}
              <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-warm-800 text-[15px]">
                        This profile hasn&apos;t been claimed yet
                      </p>
                      <p className="text-sm text-warm-600">
                        Information may be outdated. Is this your organization?
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/for-providers/claim/${provider.provider_id}`}
                    className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Claim This Profile
                  </Link>
                </div>
              </div>

              {/* About */}
              {provider.provider_description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2.5">
                    About {provider.provider_name}
                  </h2>
                  <ExpandableText text={provider.provider_description} maxLength={400} />
                </div>
              )}

              {/* Category Info */}
              {provider.provider_category && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2.5">Care Type</h2>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium border border-primary-100">
                    {provider.provider_category}
                  </span>
                </div>
              )}

              {/* Similar Providers */}
              {similarProviders.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Similar {categoryLabel} Providers
                    </h2>
                    <Link
                      href={`/browse?type=${categoryLabel.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      View all
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similarProviders.slice(0, 4).map((similar) => (
                      <SimilarProviderCard key={similar.provider_id} provider={similar} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Sticky Sidebar */}
          <div className="lg:col-span-1 self-stretch">
            <div className="sticky top-24 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {/* Accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-600" />

              <div className="p-5 space-y-4">
                {/* Price */}
                {priceRange && (
                  <div className="text-center pb-4 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pricing</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{priceRange}</p>
                  </div>
                )}

                {/* Rating */}
                {rating && (
                  <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIcon
                          key={i}
                          className={`w-5 h-5 ${i <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
                          filled={i <= Math.round(rating)}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">Google</span>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-2.5">
                  <InquiryButton
                    providerProfileId={provider.provider_id}
                    providerName={provider.provider_name}
                    providerSlug={provider.provider_id}
                  />
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {provider.phone}
                    </a>
                  )}
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Visit Website
                    </a>
                  )}
                  {provider.email && (
                    <a
                      href={`mailto:${provider.email}`}
                      className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  )}
                </div>

                {/* Location */}
                {locationStr && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{locationStr}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
