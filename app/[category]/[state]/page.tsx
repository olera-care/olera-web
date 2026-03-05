import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getCategoryBySlug,
  getResolvedCategorySlug,
  stateSlugToAbbrev,
  stateAbbrevToName,
  fetchPowerPageData,
  fetchTopCities,
  cityToSlug,
} from "@/lib/power-pages";
import BrowseCard from "@/components/browse/BrowseCard";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; state: string }>;
}): Promise<Metadata> {
  const { category: catSlug, state: stateSlug } = await params;
  const config = getCategoryBySlug(catSlug);
  const abbrev = stateSlugToAbbrev(stateSlug);
  if (!config || !abbrev) return { title: "Not Found | Olera" };

  const stateName = stateAbbrevToName(abbrev);
  const title = `${config.displayName} in ${stateName} | Compare Providers | Olera`;
  const description = `Compare ${config.displayName.toLowerCase()} providers in ${stateName}. Find pricing, reviews, and ratings for top-rated ${config.displayName.toLowerCase()} options near you.`;

  return {
    title,
    description,
    alternates: { canonical: `https://olera.care/${catSlug}/${stateSlug}` },
    openGraph: {
      title,
      description,
      url: `https://olera.care/${catSlug}/${stateSlug}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ category: string; state: string }>;
}) {
  const { category: catSlug, state: stateSlug } = await params;

  // Handle category aliases
  const resolved = getResolvedCategorySlug(catSlug);
  if (resolved && resolved !== catSlug) {
    permanentRedirect(`/${resolved}/${stateSlug}`);
  }

  const config = getCategoryBySlug(catSlug);
  const abbrev = stateSlugToAbbrev(stateSlug);
  if (!config || !abbrev) notFound();

  const stateName = stateAbbrevToName(abbrev);

  const [data, cities] = await Promise.all([
    fetchPowerPageData({ category: config.dbValue, stateAbbrev: abbrev, limit: 24 }),
    fetchTopCities(config.dbValue, abbrev),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      { "@type": "ListItem", position: 2, name: config.displayName, item: `https://olera.care/${catSlug}` },
      { "@type": "ListItem", position: 3, name: stateName },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <div className="bg-vanilla-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${catSlug}`} className="hover:text-primary-600 transition-colors">{config.displayName}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{stateName}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
            {config.displayName} in {stateName}
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">
            Find and compare {config.displayName.toLowerCase()} providers in {stateName}. Read reviews, check pricing, and connect with top-rated options near you.
          </p>

          {data && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">{data.totalCount.toLocaleString()}</span> providers in {stateName}
              </span>
              {data.avgLowerPrice && data.avgUpperPrice && (
                <span className="inline-flex items-center gap-1.5">
                  Average cost: <span className="font-semibold text-gray-900">${data.avgLowerPrice.toLocaleString()} - ${data.avgUpperPrice.toLocaleString()}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Browse by City */}
        {cities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              {config.displayName} by City in {stateName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {cities.map(({ city, count }) => (
                <Link
                  key={city}
                  href={`/${catSlug}/${stateSlug}/${cityToSlug(city)}`}
                  className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span className="text-gray-700">{city}</span>
                  <span className="text-gray-400 text-xs">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Provider Listings */}
        {data && data.providers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              Top-Rated {config.displayName} in {stateName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.providers.map((provider) => (
                <BrowseCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        {(!data || data.providers.length === 0) && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">
              No {config.displayName.toLowerCase()} providers found in {stateName} yet.
            </p>
            <Link href={`/${catSlug}`} className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
              Browse all {config.displayName.toLowerCase()} states
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
