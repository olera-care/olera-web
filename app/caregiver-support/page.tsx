"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MOCK_RESOURCES } from "@/data/mock/resources";
import { Resource } from "@/types/resource";
import { ArticleTopic, TOPIC_CONFIG, ALL_TOPICS } from "@/lib/article-topics";
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
  care_types: string[];
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
    careTypes: (a.care_types || []) as Resource["careTypes"],
    category: a.category || "",
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
        <div className="relative aspect-[4/3] mb-5 rounded-lg overflow-hidden">
          <Image
            src={resource.coverImage}
            alt={resource.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        <div className="flex-1 flex flex-col">
          {resource.category && TOPIC_CONFIG[resource.category as ArticleTopic] && (
            <span className="text-sm font-medium text-gray-400 mb-2">
              {TOPIC_CONFIG[resource.category as ArticleTopic].label}
            </span>
          )}
          <h3 className="font-display text-display-xs md:text-display-sm font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-3">
            {resource.title}
          </h3>
          {resource.excerpt && (
            <p className="text-base text-gray-500 leading-relaxed line-clamp-2 mb-4">
              {resource.excerpt}
            </p>
          )}
          <span className="mt-auto text-sm text-gray-400">
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
        <div className="relative w-36 h-24 md:w-44 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
          <Image
            src={resource.coverImage}
            alt={resource.title}
            fill
            sizes="176px"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {resource.category && TOPIC_CONFIG[resource.category as ArticleTopic] && (
            <span className="text-xs font-medium text-gray-400 mb-1">
              {TOPIC_CONFIG[resource.category as ArticleTopic].label}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors duration-200 line-clamp-2">
            {resource.title}
          </h3>
          <span className="mt-1.5 text-xs text-gray-400">
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
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src={primary.coverImage}
              alt={primary.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
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
        {primary.category && TOPIC_CONFIG[primary.category as ArticleTopic] && (
          <span className="text-sm font-medium text-gray-400 mb-2 block">
            {TOPIC_CONFIG[primary.category as ArticleTopic].label}
          </span>
        )}
        <h3 className="font-display text-display-xs md:text-display-sm font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-3">
          {primary.title}
        </h3>
        {primary.excerpt && (
          <p className="text-base text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {primary.excerpt}
          </p>
        )}
        <span className="text-sm text-gray-400">
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
  const topicLabel = resource.category && TOPIC_CONFIG[resource.category as ArticleTopic]?.label;

  return (
    <Link href={`/caregiver-support/${resource.slug}`} className="group block">
      <article>
        <div className="relative aspect-[3/2] mb-4 rounded-xl overflow-hidden shadow-sm">
          <Image
            src={resource.coverImage}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        </div>
        {topicLabel && (
          <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
            {topicLabel}
          </span>
        )}
        <h3 className="mt-2 font-display text-lg font-semibold text-gray-900 leading-snug group-hover:text-gray-600 transition-colors duration-200 line-clamp-2">
          {resource.title}
        </h3>
        <span className="mt-2 block text-sm text-gray-400">
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
  const topicParam = searchParams.get("topic");
  const [activeTopic, setActiveTopic] = useState<ArticleTopic | "all">(
    (topicParam as ArticleTopic) || "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [apiResources, setApiResources] = useState<Resource[] | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);

  // Sync filter with URL (handles browser back/forward)
  useEffect(() => {
    const urlTopic = searchParams.get("topic");
    const next = (urlTopic as ArticleTopic) || "all";
    if (next !== activeTopic) {
      setActiveTopic(next);
      setCurrentPage(1);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all articles from API
  useEffect(() => {
    let cancelled = false;
    async function fetchFromApi() {
      try {
        const res = await fetch("/api/caregiver-support?section=caregiver-support&per_page=200");
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
  const showFeatured = activeTopic === "all" && currentPage === 1;

  // Filtered & sorted articles (excluding featured when shown in hero)
  const filteredResources = useMemo(() => {
    let resources = allResources;

    if (activeTopic !== "all") {
      resources = resources.filter((r) => r.category === activeTopic);
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
  }, [activeTopic, allResources, showFeatured, featuredArticles]);

  // Pagination
  const totalPages = Math.ceil(filteredResources.length / ARTICLES_PER_PAGE);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredResources.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredResources, currentPage]);

  const handleTopicChange = useCallback(
    (topic: ArticleTopic | "all") => {
      setActiveTopic(topic);
      setCurrentPage(1);
      // Persist filter in URL so deep-links & back-button work
      const params = new URLSearchParams(searchParams.toString());
      if (topic === "all") {
        params.delete("topic");
      } else {
        params.set("topic", topic);
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
      <header className="pt-10 pb-4 md:pt-16 md:pb-5">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <h1 className="font-display text-display-sm md:text-display-lg font-semibold text-gray-900 tracking-tight">
            Caregiver Support
          </h1>
          <p className="mt-2 text-base md:text-lg text-gray-500 max-w-xl leading-relaxed">
            Guides, insights, and practical advice for every stage of the care journey.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pb-24">
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
        <nav className="mb-8 md:mb-14 -mx-5 sm:mx-0">
          <div className="overflow-x-auto scrollbar-hide px-5 sm:px-0">
            <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap pb-2 sm:pb-0">
              <button
                onClick={() => handleTopicChange("all")}
                className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  activeTopic === "all"
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              {ALL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicChange(topic)}
                  className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    activeTopic === topic
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {TOPIC_CONFIG[topic].label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ---- Article Grid ---- */}
        {paginatedResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-10 sm:gap-y-12">
            {paginatedResources.map((resource) => (
              <ArticleCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-base text-gray-400 mb-4">No articles found</p>
            <button
              onClick={() => handleTopicChange("all")}
              className="min-h-[44px] px-4 text-sm text-gray-900 underline underline-offset-4 hover:text-gray-600 transition-colors"
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
