import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getCategoryBySlug,
  getResolvedCategorySlug,
  fetchPowerPageData,
  fetchStatesForCategory,
  stateAbbrevToSlug,
  stateAbbrevToName,
} from "@/lib/power-pages";
import BrowseCard from "@/components/browse/BrowseCard";

// ISR: revalidate every hour
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const config = getCategoryBySlug(slug);
  if (!config) return { title: "Not Found | Olera" };

  const title = `${config.displayName} Near You | Compare Providers | Olera`;
  const description = config.description.slice(0, 155) + "...";

  return {
    title,
    description,
    alternates: { canonical: `https://olera.care/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://olera.care/${slug}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;

  // Handle aliases (e.g. "home-care-non-medical" → "home-care")
  const resolved = getResolvedCategorySlug(slug);
  if (resolved && resolved !== slug) {
    permanentRedirect(`/${resolved}`);
  }

  const config = getCategoryBySlug(slug);
  if (!config) notFound();

  const [data, states] = await Promise.all([
    fetchPowerPageData({ category: config.dbValue, limit: 24 }),
    fetchStatesForCategory(config.dbValue),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      { "@type": "ListItem", position: 2, name: config.displayName },
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
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{config.displayName}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
            {config.displayName} Providers
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">
            {config.description}
          </p>

          {data && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">{data.totalCount.toLocaleString()}</span> providers nationwide
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
        {/* Browse by State */}
        {states.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              Browse {config.displayName} by State
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {states.map((abbr) => (
                <Link
                  key={abbr}
                  href={`/${slug}/${stateAbbrevToSlug(abbr)}`}
                  className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  {stateAbbrevToName(abbr)}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top Providers */}
        {data && data.providers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 font-serif mb-5">
              Top-Rated {config.displayName} Providers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.providers.map((provider) => (
                <BrowseCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
