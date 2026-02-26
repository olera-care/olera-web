import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content";
import { getResourceBySlug } from "@/data/mock/resources";
import { renderContentToHTML } from "@/lib/render-content";
import { CareTypeId, CARE_TYPE_CONFIG } from "@/types/forum";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

// ============================================================
// SEO Metadata
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    // Fall back to mock data for metadata
    const mock = getResourceBySlug(slug);
    if (!mock) return { title: "Article Not Found | Olera" };
    return {
      title: `${mock.title} | Olera Resources`,
      description: mock.excerpt,
    };
  }

  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt || `${article.title} - Olera Resources`;
  const ogTitle = article.og_title || title;
  const ogDescription = article.og_description || description;
  const ogImage = article.og_image_url || article.cover_image_url;
  const canonical = article.canonical_url || `https://olera.care/resources/${slug}`;

  return {
    title: `${title} | Olera Resources`,
    description,
    alternates: { canonical },
    ...(article.noindex && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: "Olera",
      type: "article",
      ...(ogImage && { images: [ogImage] }),
      ...(article.published_at && {
        publishedTime: article.published_at,
      }),
      ...(article.updated_at && {
        modifiedTime: article.updated_at,
      }),
    },
    twitter: {
      card: (article.twitter_card_type as "summary_large_image" | "summary") || "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ============================================================
// Page Component (Server Component)
// ============================================================

// Care type emojis for the CTA banner
const CARE_TYPE_EMOJI: Record<CareTypeId, string> = {
  "home-health": "\u{1F3E5}",
  "home-care": "\u{1F3E0}",
  "assisted-living": "\u{1F91D}",
  "memory-care": "\u{1F9E0}",
  "nursing-homes": "\u{1F3E2}",
  "independent-living": "\u2600\uFE0F",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try Supabase first, then fall back to mock data
  const article = await getArticleBySlug(slug);
  const mockResource = !article ? getResourceBySlug(slug) : null;

  if (!article && !mockResource) {
    notFound();
  }

  // Normalize data
  const title = article?.title ?? mockResource!.title;
  const subtitle = article?.subtitle ?? mockResource?.subtitle ?? "";
  const authorName = article?.author_name ?? mockResource!.author.name;
  const authorRole = article?.author_role ?? mockResource!.author.role;
  const authorAvatar = article?.author_avatar ?? mockResource?.author.avatar ?? null;
  const readingTime = article?.reading_time ?? mockResource!.readingTime;
  const publishedAt = article?.published_at ?? mockResource!.publishedAt;
  const coverImage = article?.cover_image_url ?? mockResource!.coverImage;
  const careTypes = (article?.care_types ?? mockResource!.careTypes) as CareTypeId[];
  const tags = article?.tags ?? mockResource!.tags ?? [];
  const primaryCareType = careTypes[0] as CareTypeId | undefined;
  const careTypeLabel = primaryCareType ? CARE_TYPE_CONFIG[primaryCareType]?.label : null;

  // Render content
  let contentHtml = article?.content_html || "";
  if (!contentHtml && article?.content_json && Object.keys(article.content_json).length > 0) {
    contentHtml = renderContentToHTML(article.content_json);
  }
  const hasRealContent = !!contentHtml;

  // Related articles
  const related = article
    ? await getRelatedArticles(article.id, careTypes, 3)
    : [];

  // JSON-LD structured data
  const articleJsonLd = article ? {
    "@context": "https://schema.org",
    "@type": article.structured_data_type || "Article",
    headline: title,
    description: article.excerpt || subtitle,
    image: coverImage || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorRole && { jobTitle: authorRole }),
    },
    publisher: {
      "@type": "Organization",
      name: "Olera",
      url: "https://olera.care",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://olera.care/resources/${slug}`,
    },
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      { "@type": "ListItem", position: 2, name: "Resources", item: "https://olera.care/resources" },
      ...(primaryCareType && careTypeLabel
        ? [{
            "@type": "ListItem",
            position: 3,
            name: careTypeLabel,
            item: `https://olera.care/resources?type=${primaryCareType}`,
          }]
        : []),
      { "@type": "ListItem", position: primaryCareType ? 4 : 3, name: title },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD */}
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Article Header */}
      <header className="max-w-[1000px] mx-auto px-5 pt-6 md:pt-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
          <Link href="/resources" className="text-gray-500 hover:text-gray-700 transition-colors">
            Resources
          </Link>
          {primaryCareType && careTypeLabel && (
            <>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
              <Link
                href={`/resources?type=${primaryCareType}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {careTypeLabel}
              </Link>
            </>
          )}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-[300px]">
            {title}
          </span>
        </nav>

        {/* Title */}
        <h1 className="text-[28px] md:text-[36px] font-bold text-gray-900 leading-[1.2] tracking-[-0.02em] mb-4">
          {title}
        </h1>

        {/* Author row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {authorName.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-900 block">{authorName}</span>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <span>{readingTime}</span>
                <span>&middot;</span>
                <span>{formatDate(publishedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {coverImage && (
        <figure className="max-w-[1000px] mx-auto px-5 mb-8">
          <img
            src={coverImage}
            alt={title}
            className="w-full max-h-[400px] object-cover rounded-lg"
          />
        </figure>
      )}

      {/* Article Content */}
      <article className="max-w-[680px] mx-auto px-5">
        {hasRealContent ? (
          <div
            className="prose-medium"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          /* Fallback: hardcoded body for mock articles */
          <div className="prose-medium">
            <p>
              When it comes to finding the right care for your loved one, there are many factors to consider. Understanding your options is the first step toward making an informed decision that balances quality of care with practical considerations like location and cost.
            </p>
            <p>
              The journey of finding care can feel overwhelming, but breaking it down into manageable steps makes the process much more approachable. This guide will walk you through everything you need to know.
            </p>
            <h2>Understanding Your Options</h2>
            <p>
              The senior care landscape offers various levels of support, from minimal assistance to round-the-clock medical care. Each type of care serves different needs, and choosing the right one depends on your loved one&apos;s health condition, preferences, and financial situation.
            </p>
            <blockquote>
              The most important thing is finding care that respects your loved one&apos;s dignity and independence while providing the support they need.
            </blockquote>
            <p>
              Many families find that their needs change over time. What starts as occasional help with household tasks may eventually evolve into a need for more comprehensive care. Planning for this progression can help ease transitions.
            </p>
            <h2>Key Considerations</h2>
            <p>
              Before making any decisions, take time to assess the current and anticipated needs. Consider factors like mobility, cognitive function, medical requirements, and social preferences.
            </p>
            <ul>
              <li>Assess current health status and anticipated future needs</li>
              <li>Consider your loved one&apos;s preferences and lifestyle</li>
              <li>Evaluate financial resources and insurance coverage</li>
              <li>Research quality ratings and reviews from other families</li>
              <li>Visit facilities and meet with staff when possible</li>
            </ul>
            <p>
              Taking the time to thoroughly evaluate these factors will help ensure you find the right fit for your family&apos;s unique situation.
            </p>
          </div>
        )}

        {/* Contextual CTA Banner */}
        {primaryCareType && (
          <Link
            href={`/browse?type=${primaryCareType}`}
            className="group relative block my-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-primary-50/80 to-white border border-primary-100/60 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/40 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <span className="text-xl">{CARE_TYPE_EMOJI[primaryCareType]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-900 leading-snug">
                  Looking for {CARE_TYPE_CONFIG[primaryCareType].label.toLowerCase()} providers?
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Browse verified providers in your area and compare options.
                </p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                <svg className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )}

        {/* Author Card */}
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
          <div className="flex items-start gap-4">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
                <span className="text-white text-lg font-semibold">
                  {authorName.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Written by</p>
              <h3 className="text-lg font-bold text-gray-900">{authorName}</h3>
              {authorRole && (
                <p className="text-gray-600 text-sm">{authorRole}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-200">
            {careTypes.map((careType) => (
              <Link
                key={careType}
                href={`/resources?type=${careType}`}
                className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {CARE_TYPE_CONFIG[careType]?.label ?? careType}
              </Link>
            ))}
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-white text-gray-500 text-sm rounded-full border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/resources/${r.slug}`} className="group block">
                  {r.cover_image_url && (
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      className="w-full aspect-[2/1] object-cover rounded-lg mb-2 group-hover:opacity-90 transition-opacity"
                    />
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Bottom CTA */}
      <section className="max-w-[1000px] mx-auto px-5 mt-16 pb-16">
        <Link
          href={primaryCareType ? `/browse?type=${primaryCareType}` : "/browse"}
          className="group block relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-700"
        >
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute right-0 top-0 w-80 h-80 -mr-16 -mt-16" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="40"/>
            </svg>
            <svg className="absolute left-0 bottom-0 w-64 h-64 -ml-16 -mb-16" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="30"/>
            </svg>
          </div>
          <div className="relative px-8 py-10 md:px-12 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {primaryCareType
                  ? `Ready to find ${CARE_TYPE_CONFIG[primaryCareType].label.toLowerCase()}?`
                  : "Ready to find the right care?"
                }
              </h2>
              <p className="text-primary-100 text-lg">
                {primaryCareType
                  ? `Browse verified ${CARE_TYPE_CONFIG[primaryCareType].label.toLowerCase()} providers in your area.`
                  : "Join thousands of families who have found trusted care through Olera."
                }
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-primary-700 font-semibold rounded-full group-hover:bg-primary-50 transition-colors shadow-lg shadow-primary-900/20">
                Browse Care Options
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}
