import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listBrands, BRANDS_BASE_PATH } from "@/lib/brands";

export const revalidate = 3600;

const SITE_URL = "https://olera.care";

export const metadata: Metadata = {
  title: "Senior Care Brands & Franchises: Compare Locations | Olera",
  description:
    "Compare the largest senior care brands and franchises: home care agencies, assisted living operators and nursing home groups. Every location, Google ratings and typical rates, by state.",
  alternates: { canonical: `${SITE_URL}${BRANDS_BASE_PATH}` },
  openGraph: {
    title: "Senior Care Brands & Franchises: Compare Locations | Olera",
    description:
      "Compare the largest senior care brands and franchises. Every location, Google ratings and typical rates, by state.",
    url: `${SITE_URL}${BRANDS_BASE_PATH}`,
    siteName: "Olera",
    type: "website",
  },
};

export default async function BrandsIndexPage() {
  const brands = await listBrands();
  const totalLocations = brands.reduce((s, b) => s + b.locationCount, 0);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Brands", item: `${SITE_URL}${BRANDS_BASE_PATH}` },
    ],
  };

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Senior care brands on Olera",
    numberOfItems: brands.length,
    itemListElement: brands.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      url: `${SITE_URL}${BRANDS_BASE_PATH}/${b.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />

      <div className="bg-vanilla-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Brands</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
            Senior Care Brands &amp; Franchises
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">
            The largest home care franchises, assisted living operators and nursing home groups, with every location Olera lists for each. Compare Google ratings and typical rates across a brand before you call a location.
          </p>
          {brands.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{brands.length}</span> brands ·{" "}
              <span className="font-semibold text-gray-900">{totalLocations.toLocaleString()}</span> locations
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {brands.length === 0 ? (
          <p className="text-center py-16 text-lg text-gray-500">No brands to show yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`${BRANDS_BASE_PATH}/${b.slug}`}
                  className="group flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={b.image}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide uppercase text-gray-500">{b.categoryLabel}</p>
                    <h2 className="mt-0.5 text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {b.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {b.locationCount.toLocaleString()} {b.locationCount === 1 ? "location" : "locations"} · {b.stateCount}{" "}
                      {b.stateCount === 1 ? "state" : "states"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {b.avgRating != null && (
                        <>
                          <span className="font-semibold text-gray-900">{b.avgRating.toFixed(1)}</span> on Google
                        </>
                      )}
                      {b.avgRating != null && b.typicalRate && " · "}
                      {b.typicalRate}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
