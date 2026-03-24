import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getCategoryBySlug,
  getResolvedCategorySlug,
  stateSlugToAbbrev,
  stateAbbrevToName,
  citySlugToDisplay,
  fetchPowerPageData,
} from "@/lib/power-pages";
import CityBrowseClient from "@/components/browse/CityBrowseClient";
import { getNearestCoveredCity } from "@/lib/nearest-city";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; state: string; city: string }>;
}): Promise<Metadata> {
  const { category: catSlug, state: stateSlug, city: citySlug } = await params;
  const config = getCategoryBySlug(catSlug);
  const abbrev = stateSlugToAbbrev(stateSlug);
  if (!config || !abbrev) return { title: "Not Found | Olera" };

  const stateName = stateAbbrevToName(abbrev);
  const cityName = citySlugToDisplay(citySlug);
  const title = `${config.displayName} in ${cityName}, ${abbrev} | Compare Providers | Olera`;
  const description = `Compare ${config.displayName.toLowerCase()} providers in ${cityName}, ${stateName}. Find pricing, reviews, and ratings to choose the best ${config.displayName.toLowerCase()} option for your family.`;

  return {
    title,
    description,
    alternates: { canonical: `https://olera.care/${catSlug}/${stateSlug}/${citySlug}` },
    openGraph: {
      title,
      description,
      url: `https://olera.care/${catSlug}/${stateSlug}/${citySlug}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ category: string; state: string; city: string }>;
}) {
  const { category: catSlug, state: stateSlug, city: citySlug } = await params;

  // Handle category aliases
  const resolved = getResolvedCategorySlug(catSlug);
  if (resolved && resolved !== catSlug) {
    permanentRedirect(`/${resolved}/${stateSlug}/${citySlug}`);
  }

  const config = getCategoryBySlug(catSlug);
  const abbrev = stateSlugToAbbrev(stateSlug);
  if (!config || !abbrev) notFound();

  const stateName = stateAbbrevToName(abbrev);
  const cityName = citySlugToDisplay(citySlug);

  const data = await fetchPowerPageData({
    category: config.dbValue,
    stateAbbrev: abbrev,
    city: cityName,
    limit: 100,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      { "@type": "ListItem", position: 2, name: config.displayName, item: `https://olera.care/${catSlug}` },
      { "@type": "ListItem", position: 3, name: stateName, item: `https://olera.care/${catSlug}/${stateSlug}` },
      { "@type": "ListItem", position: 4, name: `${cityName}, ${abbrev}` },
    ],
  };

  const itemListJsonLd = data && data.providers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${config.displayName} in ${cityName}, ${abbrev}`,
    numberOfItems: data.totalCount,
    itemListElement: data.providers.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `https://olera.care/provider/${p.slug}`,
    })),
  } : null;

  // Build cross-links for sibling categories in this state
  const crossLinks = ["assisted-living", "memory-care", "nursing-home", "home-care", "home-health-care", "independent-living"]
    .filter((s) => s !== catSlug)
    .map((s) => {
      const c = getCategoryBySlug(s);
      if (!c) return null;
      return { href: `/${s}/${stateSlug}`, label: `${c.displayName} in ${stateName}` };
    })
    .filter((link): link is { href: string; label: string } => link !== null);

  // SEO content rendered at the bottom of the left panel (not as a hero)
  const seoContent = {
    h1: `${config.displayName} in ${cityName}, ${abbrev}`,
    description: `Compare ${data?.totalCount.toLocaleString() || ""} ${config.displayName.toLowerCase()} providers in ${cityName}, ${stateName}. Read reviews, check pricing, and connect with top-rated ${config.displayName.toLowerCase()} options for your family.`,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: config.displayName, href: `/${catSlug}` },
      { label: stateName, href: `/${catSlug}/${stateSlug}` },
      { label: cityName },
    ],
    avgCost: data?.avgLowerPrice && data?.avgUpperPrice
      ? `$${data.avgLowerPrice.toLocaleString()} – $${data.avgUpperPrice.toLocaleString()}/mo`
      : null,
    totalCount: data?.totalCount ?? 0,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {/* No hero — matches browse page layout: filter bar → heading → cards */}
      {data && data.providers.length > 0 ? (
        <CityBrowseClient
          initialProviders={data.providers}
          totalCount={data.totalCount}
          categorySlug={catSlug}
          categoryLabel={config.displayName}
          cityName={cityName}
          stateAbbrev={abbrev}
          stateName={stateName}
          stateSlug={stateSlug}
          crossLinks={crossLinks}
          seoContent={seoContent}
        />
      ) : (
        <NoCoverageFallback
          cityName={cityName}
          stateAbbrev={abbrev}
          stateName={stateName}
          stateSlug={stateSlug}
          categorySlug={catSlug}
          categoryLabel={config.displayName}
          crossLinks={crossLinks}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// No-coverage fallback — warm, helpful empty state with nearest city suggestion
// ---------------------------------------------------------------------------

async function NoCoverageFallback({
  cityName,
  stateAbbrev,
  stateName,
  stateSlug,
  categorySlug,
  categoryLabel,
  crossLinks,
}: {
  cityName: string;
  stateAbbrev: string;
  stateName: string;
  stateSlug: string;
  categorySlug: string;
  categoryLabel: string;
  crossLinks: { href: string; label: string }[];
}) {
  const nearest = await getNearestCoveredCity(cityName, stateAbbrev);
  const categoryLower = categoryLabel.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Warm heading */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 mb-6">
          <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-serif mb-3">
          We&apos;re expanding to {cityName} soon
        </h1>
        <p className="text-lg text-gray-500 max-w-lg mx-auto">
          We don&apos;t have {categoryLower} providers in {cityName} yet, but we&apos;re
          adding new communities every week.
        </p>
      </div>

      {/* Nearest city suggestion */}
      {nearest && (
        <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 mb-10">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            In the meantime
          </p>
          <p className="text-lg text-gray-900 mb-4">
            Explore {categoryLower} providers in{" "}
            <span className="font-semibold">{nearest.city}, {nearest.state}</span>
            {nearest.distance > 0 && (
              <span className="text-gray-500"> — {nearest.distance} miles away</span>
            )}
          </p>
          <Link
            href={`/${categorySlug}/${nearest.stateSlug}/${nearest.citySlug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Browse {categoryLabel} in {nearest.city}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* Browse state */}
      <div className="text-center mb-10">
        <Link
          href={`/${categorySlug}/${stateSlug}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Browse all {categoryLower} in {stateName} →
        </Link>
      </div>

      {/* Cross-category links */}
      {crossLinks.length > 0 && (
        <section className="pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 font-serif mb-4">
            More Senior Care Options in {stateName}
          </h2>
          <div className="flex flex-wrap gap-2">
            {crossLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
