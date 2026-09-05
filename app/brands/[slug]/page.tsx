import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandHub, listBrands, BRANDS_BASE_PATH } from "@/lib/brands";
import BrowseCard from "@/components/browse/BrowseCard";

// ISR: revalidate every hour, like the category and state power pages.
export const revalidate = 3600;

const SITE_URL = "https://olera.care";

function pluralLocations(n: number): string {
  return n === 1 ? "location" : "locations";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getBrandHub(slug);
  if (!hub) return { title: "Not Found | Olera" };

  const url = `${SITE_URL}${BRANDS_BASE_PATH}/${hub.slug}`;
  const title = `${hub.name} Locations & Reviews (${hub.locationCount} in ${hub.stateCount} states) | Olera`;
  const ratingClause = hub.avgRating
    ? ` Google ratings average ${hub.avgRating.toFixed(1)} across ${hub.ratedCount} rated locations.`
    : "";
  const description = `Compare ${hub.locationCount} ${hub.name} ${hub.categoryLabel.toLowerCase()} ${pluralLocations(hub.locationCount)} across ${hub.stateCount} states.${ratingClause} Ratings, typical rates and details for every ${hub.name} location listed on Olera.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Olera",
      type: "website",
      images: [{ url: hub.image.startsWith("http") ? hub.image : `${SITE_URL}${hub.image}` }],
    },
  };
}

export default async function BrandHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = await getBrandHub(slug);
  if (!hub) notFound();

  const otherBrands = (await listBrands()).filter((b) => b.slug !== hub.slug);
  const url = `${SITE_URL}${BRANDS_BASE_PATH}/${hub.slug}`;
  const allLocations = hub.states.flatMap((s) => s.locations);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Brands", item: `${SITE_URL}${BRANDS_BASE_PATH}` },
      { "@type": "ListItem", position: 3, name: hub.name, item: url },
    ],
  };

  // The page is a collection about the brand, not the brand itself: `about`
  // names the organization (with its own site as the identity URL) and the
  // list of locations is the main entity. No AggregateRating here on purpose.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${hub.name} locations on Olera`,
    url,
    about: {
      "@type": "Organization",
      name: hub.name,
      ...(hub.website && { url: hub.website, sameAs: [hub.website] }),
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: allLocations.length,
      itemListElement: allLocations.slice(0, 100).map((loc, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: loc.name,
        url: `${SITE_URL}/provider/${loc.slug}`,
      })),
    },
  };

  const lead = [
    `${hub.name} has ${hub.locationCount} ${hub.categoryLabel.toLowerCase()} ${pluralLocations(hub.locationCount)} listed on Olera across ${hub.stateCount} ${hub.stateCount === 1 ? "state" : "states"}.`,
    hub.avgRating
      ? `Families rate them ${hub.avgRating.toFixed(1)} out of 5 on Google on average, across the ${hub.ratedCount} locations with reviews.`
      : null,
    hub.typicalRate
      ? `Typical rates run ${hub.typicalRate} at the ${hub.pricedCount} locations that publish pricing.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Hero */}
      <div className="bg-vanilla-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href={BRANDS_BASE_PATH} className="hover:text-primary-600 transition-colors">Brands</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{hub.name}</span>
          </nav>

          <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2">
            {hub.categoryLabel}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
            {hub.name} Locations
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">{lead}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-500">
            <div>
              <dt className="sr-only">Locations</dt>
              <dd>
                <span className="font-semibold text-gray-900">{hub.locationCount.toLocaleString()}</span> {pluralLocations(hub.locationCount)}
              </dd>
            </div>
            <div>
              <dt className="sr-only">States</dt>
              <dd>
                <span className="font-semibold text-gray-900">{hub.stateCount}</span> {hub.stateCount === 1 ? "state" : "states"}
              </dd>
            </div>
            {hub.avgRating && (
              <div>
                <dt className="sr-only">Average Google rating</dt>
                <dd>
                  <span className="font-semibold text-gray-900">{hub.avgRating.toFixed(1)}</span> average on Google
                  <span className="text-gray-400"> ({hub.ratedCount} rated)</span>
                </dd>
              </div>
            )}
            {hub.typicalRate && (
              <div>
                <dt className="sr-only">Typical rate</dt>
                <dd>
                  Typical rate <span className="font-semibold text-gray-900">{hub.typicalRate}</span>
                </dd>
              </div>
            )}
            {hub.website && (
              <div>
                <dt className="sr-only">Official website</dt>
                <dd>
                  <a
                    href={hub.website}
                    target="_blank"
                    rel="noopener"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Official website
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Highest rated */}
        {hub.featured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
              Highest-rated {hub.name} locations
            </h2>
            <p className="text-sm text-gray-500 mb-5">By Google rating across every {hub.name} location on Olera.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hub.featured.map((provider) => (
                <BrowseCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        {/* Browse by state */}
        {hub.states.length > 1 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              {hub.name} by state
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {hub.states.map((s) => (
                <a
                  key={s.abbrev}
                  href={`#state-${s.abbrev.toLowerCase()}`}
                  className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span className="text-gray-700">{s.name}</span>
                  <span className="text-gray-400 text-xs">{s.locations.length}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Full directory */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
            All {hub.name} locations
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Every {hub.name} location listed on Olera, by state and city. Ratings are from Google reviews; rates are as reported by each location.
          </p>
          <div className="space-y-10">
            {hub.states.map((s) => (
              <div key={s.abbrev} id={`state-${s.abbrev.toLowerCase()}`} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {s.name}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {s.locations.length} {pluralLocations(s.locations.length)}
                  </span>
                </h3>
                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                  {s.locations.map((loc) => (
                    <li key={loc.id} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <Link
                        href={`/provider/${loc.slug}`}
                        className="font-medium text-gray-900 hover:text-primary-700 transition-colors"
                      >
                        {loc.name}
                      </Link>
                      {loc.city && <span className="text-sm text-gray-500">{loc.city}</span>}
                      <span className="ml-auto flex items-center gap-4 text-sm text-gray-500">
                        {loc.rating != null && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-semibold text-gray-900">{loc.rating.toFixed(1)}</span>
                          </span>
                        )}
                        {loc.priceRange && <span>{loc.priceRange}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* About the data */}
        <section className="mb-12 max-w-3xl">
          <h2 className="text-xl font-bold text-gray-900 font-serif mb-3">About this page</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            This page lists every {hub.name} location in Olera&apos;s directory that has been matched to the brand. Ratings are Google review ratings for each individual location, not a rating of {hub.name} as a company. Rates are reported by locations or estimated from regional data and are shown for comparison; confirm current pricing and availability directly with the location.
            {hub.website && (
              <>
                {" "}For corporate information, visit{" "}
                <a href={hub.website} target="_blank" rel="noopener" className="text-primary-600 hover:text-primary-700">
                  {hub.name}&apos;s official website
                </a>
                .
              </>
            )}
          </p>
        </section>

        {/* Other brands */}
        {otherBrands.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 font-serif mb-4">Other senior care brands</h2>
            <div className="flex flex-wrap gap-2">
              {otherBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`${BRANDS_BASE_PATH}/${b.slug}`}
                  className="px-3 py-1.5 text-sm bg-gray-50 rounded-full text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  {b.name}
                  <span className="text-gray-400 ml-1.5">{b.locationCount}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
