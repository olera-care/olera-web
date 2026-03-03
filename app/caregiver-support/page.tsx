"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MOCK_RESOURCES } from "@/data/mock/resources";
import { Resource } from "@/types/resource";
import { CareTypeId, CARE_TYPE_CONFIG, ALL_CARE_TYPES } from "@/types/forum";
import Pagination from "@/components/ui/Pagination";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface ArticleFromAPI {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  cover_image_url: string | null;
  care_types: CareTypeId[];
  category: string;
  author_name: string;
  author_role: string;
  author_avatar: string | null;
  featured: boolean;
  reading_time: string;
  tags: string[];
  published_at: string | null;
}

function apiToResource(a: ArticleFromAPI): Resource {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle || "",
    excerpt: a.excerpt || "",
    coverImage: a.cover_image_url || "/images/home-health.webp",
    careTypes: a.care_types || [],
    category: (a.category as Resource["category"]) || "guide",
    author: { name: a.author_name, role: a.author_role || "" },
    publishedAt: a.published_at || new Date().toISOString(),
    readingTime: (a.reading_time as Resource["readingTime"]) || "5 min",
    featured: a.featured,
    tags: a.tags || [],
  };
}

// ---------------------------------------------------------------------------
// Featured Section
// ---------------------------------------------------------------------------

function FeaturedArticlePrimary({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/caregiver-support/${resource.slug}`}
      className="group block"
    >
      <article className="h-full flex flex-col">
        <div className="aspect-[4/3] mb-5 rounded-lg overflow-hidden">
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        <div className="flex-1 flex flex-col">
          {resource.careTypes[0] && (
            <span className="text-text-sm font-medium text-gray-400 mb-2">
              {CARE_TYPE_CONFIG[resource.careTypes[0]].label}
            </span>
          )}
          <h3 className="font-display text-display-xs md:text-display-sm font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-3">
            {resource.title}
          </h3>
          {resource.excerpt && (
            <p className="text-text-md text-gray-500 leading-relaxed line-clamp-2 mb-4">
              {resource.excerpt}
            </p>
          )}
          <span className="mt-auto text-text-sm text-gray-400">
            {resource.readingTime} read
          </span>
        </div>
      </article>
    </Link>
  );
}

function FeaturedArticleSecondary({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/caregiver-support/${resource.slug}`}
      className="group block"
    >
      <article className="flex gap-5">
        <div className="w-36 h-24 md:w-44 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {resource.careTypes[0] && (
            <span className="text-text-xs font-medium text-gray-400 mb-1">
              {CARE_TYPE_CONFIG[resource.careTypes[0]].label}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors duration-200 line-clamp-2">
            {resource.title}
          </h3>
          <span className="mt-1.5 text-text-xs text-gray-400">
            {resource.readingTime} read
          </span>
        </div>
      </article>
    </Link>
  );
}

function FeaturedSection({ articles }: { articles: Resource[] }) {
  if (articles.length === 0) return null;

  // Single featured article — full width
  if (articles.length === 1) {
    return (
      <section className="mb-16 md:mb-24">
        <div className="max-w-2xl">
          <FeaturedArticlePrimary resource={articles[0]} />
        </div>
      </section>
    );
  }

  // 2 featured — side by side
  if (articles.length === 2) {
    return (
      <section className="mb-16 md:mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <FeaturedArticlePrimary resource={articles[0]} />
          <FeaturedArticlePrimary resource={articles[1]} />
        </div>
      </section>
    );
  }

  // 3+ featured — dominant left + stacked right
  const primary = articles[0];
  const secondary = articles.slice(1, 4);

  return (
    <section className="mb-8 md:mb-10">
      {/* Grid: primary IMAGE aligned with secondary articles */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
        {/* Primary image — 3/5 width */}
        <Link
          href={`/caregiver-support/${primary.slug}`}
          className="group lg:col-span-3 block"
        >
          <div className="aspect-[16/9] rounded-lg overflow-hidden">
            <img
              src={primary.coverImage}
              alt={primary.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />
          </div>
        </Link>

        {/* Secondary articles — 2/5 width, distributed across image height */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-6">
          {secondary.map((resource) => (
            <FeaturedArticleSecondary key={resource.id} resource={resource} />
          ))}
        </div>
      </div>

      {/* Primary text — below grid, scoped to 3/5 width */}
      <Link
        href={`/caregiver-support/${primary.slug}`}
        className="group block mt-5 lg:max-w-[58%]"
      >
        {primary.careTypes[0] && (
          <span className="text-text-sm font-medium text-gray-400 mb-2 block">
            {CARE_TYPE_CONFIG[primary.careTypes[0]].label}
          </span>
        )}
        <h3 className="font-display text-display-xs md:text-display-sm font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-3">
          {primary.title}
        </h3>
        {primary.excerpt && (
          <p className="text-text-md text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {primary.excerpt}
          </p>
        )}
        <span className="text-text-sm text-gray-400">
          {primary.readingTime} read
        </span>
      </Link>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <>
      <section className="mb-8 md:mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
          <div className="lg:col-span-3">
            <div className="aspect-[16/9] bg-gray-100 rounded-lg animate-pulse mb-5" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="h-7 w-4/5 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-7 w-3/5 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-8 justify-between">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-5">
                <div className="w-44 h-28 flex-shrink-0 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="border-t border-gray-100 mb-8 md:mb-10" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Article Grid Card
// ---------------------------------------------------------------------------

function ArticleCard({ resource }: { resource: Resource }) {
  const careType = resource.careTypes[0];

  return (
    <Link href={`/caregiver-support/${resource.slug}`} className="group block">
      <article>
        <div className="aspect-[3/2] mb-4 rounded-lg overflow-hidden">
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        {careType && (
          <span className="text-text-xs font-medium text-gray-400 tracking-wide uppercase">
            {CARE_TYPE_CONFIG[careType].label}
          </span>
        )}
        <h3 className="mt-1.5 text-lg font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors duration-200">
          {resource.title}
        </h3>
        <span className="mt-1.5 block text-text-sm text-gray-400">
          {resource.readingTime} read
        </span>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Page Content
// ---------------------------------------------------------------------------

const ARTICLES_PER_PAGE = 12;

function CaregiverSupportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const typeParam = searchParams.get("type");
  const [activeCareType, setActiveCareType] = useState<CareTypeId | "all">(
    (typeParam as CareTypeId) || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [apiResources, setApiResources] = useState<Resource[] | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);

  // Sync filter with URL (handles browser back/forward)
  useEffect(() => {
    const urlType = searchParams.get("type");
    const next = (urlType as CareTypeId) || "all";
    if (next !== activeCareType) {
      setActiveCareType(next);
      setCurrentPage(1);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all articles from API
  useEffect(() => {
    let cancelled = false;
    async function fetchFromApi() {
      try {
        const res = await fetch("/api/caregiver-support?per_page=200");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.articles && data.articles.length > 0) {
            setApiResources(data.articles.map(apiToResource));
          }
        }
      } catch {
        // Silently fall back to mock data
      } finally {
        if (!cancelled) setLoadingApi(false);
      }
    }
    fetchFromApi();
    return () => { cancelled = true; };
  }, []);

  const allResources = apiResources ?? MOCK_RESOURCES;

  // Featured articles (only show on "All" view, page 1)
  const featuredArticles = useMemo(
    () => allResources.filter((r) => r.featured),
    [allResources]
  );
  const showFeatured = activeCareType === "all" && currentPage === 1;

  // Filtered & sorted articles (excluding featured when shown in hero)
  const filteredResources = useMemo(() => {
    let resources = allResources;

    if (activeCareType !== "all") {
      resources = resources.filter((r) => r.careTypes.includes(activeCareType));
    }

    // When showing featured section, exclude those articles from the grid
    if (showFeatured && featuredArticles.length > 0) {
      const featuredIds = new Set(featuredArticles.slice(0, 4).map((r) => r.id));
      resources = resources.filter((r) => !featuredIds.has(r.id));
    }

    return [...resources].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [activeCareType, allResources, showFeatured, featuredArticles]);

  // Pagination
  const totalPages = Math.ceil(filteredResources.length / ARTICLES_PER_PAGE);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredResources.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredResources, currentPage]);

  const handleCategoryChange = useCallback(
    (category: CareTypeId | "all") => {
      setActiveCareType(category);
      setCurrentPage(1);
      // Persist filter in URL so deep-links & back-button work
      const params = new URLSearchParams(searchParams.toString());
      if (category === "all") {
        params.delete("type");
      } else {
        params.set("type", category);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, router, pathname],
  );

  return (
    <main className="min-h-screen bg-white">
      {/* ---- Hero Header ---- */}
      <header className="pt-12 pb-4 md:pt-16 md:pb-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-display-md md:text-display-lg text-gray-900 tracking-tight">
            Caregiver Support
          </h1>
          <p className="mt-2 text-text-lg text-gray-400 max-w-xl">
            Guides, insights, and practical advice for every stage of the care journey.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ---- Featured Section (with loading placeholder to prevent layout shift) ---- */}
        {showFeatured && (
          loadingApi ? (
            <FeaturedSkeleton />
          ) : featuredArticles.length > 0 ? (
            <>
              <FeaturedSection articles={featuredArticles.slice(0, 4)} />
              <div className="border-t border-gray-100 mb-8 md:mb-10" />
            </>
          ) : null
        )}

        {/* ---- Category Filters ---- */}
        <nav className="mb-10 md:mb-14">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-4 py-2 rounded-full text-text-sm font-medium transition-colors duration-150 ${
                activeCareType === "all"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {ALL_CARE_TYPES.map((careType) => (
              <button
                key={careType}
                onClick={() => handleCategoryChange(careType)}
                className={`px-4 py-2 rounded-full text-text-sm font-medium transition-colors duration-150 ${
                  activeCareType === careType
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {CARE_TYPE_CONFIG[careType].label}
              </button>
            ))}
          </div>
        </nav>

        {/* ---- Article Grid ---- */}
        {paginatedResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {paginatedResources.map((resource) => (
              <ArticleCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-gray-400 mb-4">No articles found</p>
            <button
              onClick={() => handleCategoryChange("all")}
              className="text-text-sm text-gray-900 underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              View all articles
            </button>
          </div>
        )}

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredResources.length}
              itemsPerPage={ARTICLES_PER_PAGE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              itemLabel="articles"
              showItemCount={false}
            />
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <div className="pt-12 pb-4 md:pt-16 md:pb-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-72 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Featured skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 mb-8 md:mb-10">
          <div className="lg:col-span-3">
            <div className="aspect-[16/9] bg-gray-100 rounded-lg animate-pulse mb-5" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="h-7 w-4/5 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-7 w-3/5 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-8 justify-between">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-5">
                <div className="w-44 h-28 flex-shrink-0 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider skeleton */}
        <div className="border-t border-gray-100 mb-8 md:mb-10" />

        {/* Filter skeleton */}
        <div className="flex gap-2 mb-10 md:mb-14">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="aspect-[3/2] bg-gray-100 rounded-lg mb-4 animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-5 w-full bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page Export
// ---------------------------------------------------------------------------

export default function CaregiverSupportPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CaregiverSupportContent />
    </Suspense>
  );
}
