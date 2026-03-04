"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleFromAPI {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  reading_time: string;
  published_at: string | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Article Card — larger, date-prominent, editorial feel
// ---------------------------------------------------------------------------

function ArticleCard({ article }: { article: ArticleFromAPI }) {
  return (
    <Link
      href={`/research-and-press/${article.slug}`}
      className="group block"
    >
      <article className="flex flex-col h-full">
        {article.cover_image_url && (
          <div className="aspect-[16/9] mb-5 rounded-xl overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {article.published_at && (
            <time className="text-sm text-gray-400 mb-2">
              {formatDate(article.published_at)}
            </time>
          )}
          <h3 className="font-display text-xl md:text-2xl font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-3">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-base text-gray-500 leading-relaxed line-clamp-3 mb-4">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 text-sm text-gray-400">
            <span>{article.author_name}</span>
            <span className="text-gray-300">&middot;</span>
            <span>{article.reading_time} read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Lead Article — full-width hero for the latest article
// ---------------------------------------------------------------------------

function LeadArticle({ article }: { article: ArticleFromAPI }) {
  return (
    <Link
      href={`/research-and-press/${article.slug}`}
      className="group block mb-16"
    >
      <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {article.cover_image_url && (
          <div className="aspect-[16/9] rounded-xl overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />
          </div>
        )}
        <div>
          {article.published_at && (
            <time className="text-sm text-gray-400 mb-3 block">
              {formatDate(article.published_at)}
            </time>
          )}
          <h2 className="font-display text-display-xs md:text-display-sm font-bold text-gray-900 leading-tight group-hover:text-gray-600 transition-colors duration-200 mb-4">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-lg text-gray-500 leading-relaxed line-clamp-3 mb-4">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{article.author_name}</span>
            <span className="text-gray-300">&middot;</span>
            <span>{article.reading_time} read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Content
// ---------------------------------------------------------------------------

const ARTICLES_PER_PAGE = 10;

function ResearchAndPressContent() {
  const [articles, setArticles] = useState<ArticleFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function fetchArticles() {
      try {
        const res = await fetch(
          "/api/caregiver-support?section=research-and-press&per_page=200"
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.articles) {
            setArticles(data.articles);
          }
        }
      } catch {
        // Silently handle errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArticles();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lead article is the most recent
  const leadArticle = articles[0] ?? null;
  const remainingArticles = articles.slice(1);

  // Pagination (on remaining articles, excluding lead)
  const totalPages = Math.ceil(remainingArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return remainingArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [remainingArticles, currentPage]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <header className="pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-display-md md:text-display-lg text-gray-900 tracking-tight">
              Research & Press
            </h1>
            <p className="mt-2 text-lg text-gray-400 max-w-2xl">
              The latest in senior care research, industry news, and Olera
              announcements.
            </p>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="py-24 text-center">
            <p className="text-gray-400">No articles published yet.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ---- Hero Header ---- */}
      <header className="pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-display-md md:text-display-lg text-gray-900 tracking-tight">
            Research & Press
          </h1>
          <p className="mt-2 text-lg text-gray-400 max-w-2xl">
            The latest in senior care research, industry news, and Olera
            announcements.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ---- Lead Article ---- */}
        {leadArticle && currentPage === 1 && (
          <>
            <LeadArticle article={leadArticle} />
            {remainingArticles.length > 0 && (
              <div className="border-t border-gray-100 mb-12" />
            )}
          </>
        )}

        {/* ---- Article Grid — 2 columns ---- */}
        {paginatedArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
            {paginatedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={remainingArticles.length}
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
      <div className="pt-12 pb-8 md:pt-16 md:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-5 w-96 bg-gray-100 rounded mt-3 animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Lead skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div className="aspect-[16/9] bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex flex-col justify-center gap-3">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse mt-2" />
            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="border-t border-gray-100 mb-12" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="aspect-[16/9] bg-gray-100 rounded-xl mb-5 animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-6 w-full bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
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

export default function ResearchAndPressPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ResearchAndPressContent />
    </Suspense>
  );
}
