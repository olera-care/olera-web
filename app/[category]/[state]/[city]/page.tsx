import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getCategoryBySlug,
  getResolvedCategorySlug,
  stateSlugToAbbrev,
  stateAbbrevToName,
  citySlugToDisplay,
  fetchPowerPageData,
} from "@/lib/power-pages";
import CityBrowseClient from "@/components/browse/CityBrowseClient";

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
    redirect(`/${resolved}/${stateSlug}/${citySlug}`);
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

      {/* Hero — server-rendered for SEO */}
      <div className="bg-vanilla-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${catSlug}`} className="hover:text-primary-600 transition-colors">{config.displayName}</Link>
            <span>/</span>
            <Link href={`/${catSlug}/${stateSlug}`} className="hover:text-primary-600 transition-colors">{stateName}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{cityName}</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
            {config.displayName} in {cityName}, {abbrev}
          </h1>

          {/* SEO description — present for crawlers, visually quiet */}
          <p className="mt-1.5 text-[15px] text-gray-500 max-w-2xl">
            Compare {data?.totalCount.toLocaleString() || ""} {config.displayName.toLowerCase()} providers in {cityName}.{data?.avgLowerPrice && data?.avgUpperPrice ? ` Average cost: $${data.avgLowerPrice.toLocaleString()} – $${data.avgUpperPrice.toLocaleString()}/mo.` : ""}
          </p>
        </div>
      </div>

      {/* Interactive browse section */}
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
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">
              No {config.displayName.toLowerCase()} providers found in {cityName}, {abbrev} yet.
            </p>
            <Link href={`/${catSlug}/${stateSlug}`} className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
              Browse all {config.displayName.toLowerCase()} in {stateName}
            </Link>
          </div>

          {/* Cross-links for empty state */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 font-serif mb-4">
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
        </div>
      )}
    </div>
  );
}
