import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandHub, listBrands, BRANDS_BASE_PATH, MIN_BRAND_LOCATIONS, type BrandHub } from "@/lib/brands";
import BrandStateDirectory from "@/components/brands/BrandStateDirectory";
import BrowseCard from "@/components/browse/BrowseCard";

// ISR: revalidate every hour, like the category and state power pages.
export const revalidate = 3600;

const SITE_URL = "https://olera.care";

function pluralLocations(n: number): string {
  return n === 1 ? "location" : "locations";
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/** Three questions a family asks about a brand, answered from the same numbers the page shows. */
function buildFaqs(hub: BrandHub): { q: string; a: string }[] {
  const cat = hub.categoryLabel.toLowerCase();
  const states = hub.states.map((s) => s.name);
  const stateList =
    states.length <= 6
      ? states.join(", ")
      : `${states.slice(0, 5).join(", ")} and ${states.length - 5} more`;
  const faqs = [
    {
      q: `How many ${hub.name} locations are there?`,
      a: `Olera lists ${hub.locationCount} ${hub.name} ${cat} ${pluralLocations(hub.locationCount)} across ${hub.stateCount} ${hub.stateCount === 1 ? "state" : "states"}: ${stateList}. Each one is listed below with its city, Google rating and rate where published.`,
    },
  ];
  if (hub.typicalRate) {
    faqs.push({
      q: `How much does ${hub.name} cost?`,
      a: `Across the ${hub.pricedCount} ${hub.name} locations that publish pricing, typical rates run ${hub.typicalRate}. Rates are set by each location and vary with the level of care, hours and region, so confirm current pricing with the location directly.`,
    });
  }
  if (hub.avgRating) {
    faqs.push({
      q: `How is ${hub.name} rated?`,
      a: `${hub.name} locations average ${hub.avgRating.toFixed(1)} out of 5 on Google, across ${hub.ratedCount} rated locations and ${hub.totalReviews.toLocaleString()} reviews. Ratings differ a lot between locations, so look at the rating for the location nearest you rather than the brand average.`,
    });
  }
  return faqs;
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
    // Small brands keep a hub because their provider pages link here, but a
    // three-location page is too thin to put in the index.
    ...(hub.locationCount < MIN_BRAND_LOCATIONS && { robots: { index: false, follow: true } }),
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

  // Same care type first, then by size: a family comparing home care
  // franchises wants the other home care franchises, not a nursing home group.
  const otherBrands = (await listBrands())
    .filter((b) => b.slug !== hub.slug)
    .sort(
      (a, b) =>
        Number(b.primaryCategory === hub.primaryCategory) - Number(a.primaryCategory === hub.primaryCategory) ||
        b.locationCount - a.locationCount,
    );
  const url = `${SITE_URL}${BRANDS_BASE_PATH}/${hub.slug}`;
  const allLocations = hub.states.flatMap((s) => s.locations);
  const faqs = buildFaqs(hub);
  const defaultState = [...hub.states].sort((a, b) => b.locations.length - a.locations.length)[0]?.abbrev.toLowerCase() ?? "";

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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const lead = [
    `${hub.name} has ${hub.locationCount} ${hub.categoryLabel.toLowerCase()} ${pluralLocations(hub.locationCount)} listed on Olera across ${hub.stateCount} ${hub.stateCount === 1 ? "state" : "states"}.`,
    hub.avgRating
      ? `Families rate them ${hub.avgRating.toFixed(1)} out of 5 on Google on average, across ${hub.totalReviews.toLocaleString()} reviews of ${hub.ratedCount} locations.`
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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

          <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-500">
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
                <dd className="inline-flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-gray-900">{hub.avgRating.toFixed(1)}</span> on Google
                  <span className="text-gray-400">({hub.totalReviews.toLocaleString()} reviews)</span>
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
              <div className="w-full sm:w-auto">
                <dt className="sr-only">Official website</dt>
                <dd>
                  <a
                    href={hub.website}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center min-h-[36px] px-3.5 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 transition-colors"
                  >
                    Official website <span aria-hidden="true" className="ml-1">↗</span>
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
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
              Highest-rated {hub.name} locations
            </h2>
            <p className="text-sm text-gray-500 mb-5">Ranked by Google rating, weighted by how many families have reviewed each location.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hub.featured.map((provider) => (
                <BrowseCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        {/* What families say */}
        {hub.quotes.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              What families say about {hub.name}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
              {hub.quotes.map((q) => (
                <li key={`${q.locationSlug}-${q.author}`} className="flex flex-col">
                  <div className="flex items-center gap-0.5 text-amber-400 mb-2" aria-label={`${q.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className={`w-3.5 h-3.5 ${i < q.rating ? "" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 leading-relaxed">“{q.text}”</blockquote>
                  <p className="mt-3 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{q.author}</span>
                    {q.when && <span> · {q.when}</span>}
                    <br />
                    <Link href={`/provider/${q.locationSlug}`} className="text-primary-600 hover:text-primary-700">
                      {q.locationName}
                      {q.city && `, ${q.city}`}
                      {q.state && ` ${q.state}`}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-400">Google reviews of individual locations.</p>
          </section>
        )}

        {/* Rates by care type: only when the brand spans more than one */}
        {hub.ratesByCategory.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
              What {hub.name} costs by care type
            </h2>
            <p className="text-sm text-gray-500 mb-5">Median of the published ranges at {hub.name} locations, by type of care.</p>
            <dl className="divide-y divide-gray-100 border-y border-gray-100 max-w-2xl">
              {hub.ratesByCategory.map((r) => (
                <div key={r.category} className="py-3 flex items-baseline justify-between gap-4">
                  <dt className="text-gray-700">{r.label}</dt>
                  <dd className="text-right">
                    <span className="font-semibold text-gray-900">{r.range}</span>
                    <span className="ml-2 text-xs text-gray-400">{r.pricedCount} priced</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Directory: the state grid is the control, one state's tiles show at
            a time. Every state is server-rendered (hidden ones carry the hidden
            attribute) so all location links reach crawlers. */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">
            All {hub.name} locations
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Every {hub.name} location on Olera. Pick a state. Ratings are from Google reviews; rates are as reported by each location.
          </p>
          <BrandStateDirectory brandName={hub.name} states={hub.states} defaultState={defaultState} />
        </section>

        {/* FAQ */}
        <section className="mb-14 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
            Questions families ask about {hub.name}
          </h2>
          <dl className="divide-y divide-gray-100 border-y border-gray-100">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-base font-semibold text-gray-900">{f.q}</dt>
                <dd className="mt-2 text-gray-600 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* About the data */}
        <section className="mb-14 max-w-3xl">
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

        {/* Other brands, same care type first */}
        {otherBrands.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 font-serif mb-4">Compare with other brands</h2>
            <div className="flex flex-wrap gap-2">
              {otherBrands.map((b) => (
                <Link
                  key={b.slug}
                  href={`${BRANDS_BASE_PATH}/${b.slug}`}
                  className="inline-flex items-center min-h-[36px] px-3 py-1.5 text-sm bg-gray-50 rounded-full text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
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
