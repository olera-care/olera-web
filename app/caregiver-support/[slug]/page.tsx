import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content";
import { getResourceBySlug } from "@/data/mock/resources";
import { renderContentToHTML } from "@/lib/render-content";
import { CareTypeId, CARE_TYPE_CONFIG } from "@/types/forum";
import { processArticleHtml } from "@/lib/article-html";
import { getAuthorByName } from "@/lib/authors";
import { getBylineRules } from "@/lib/article-byline";
import {
  DesktopTableOfContents,
  MobileTableOfContents,
} from "@/components/article/TableOfContents";
import SpendDownWidget from "@/components/article/SpendDownWidget";
import ArticleFAQ from "@/components/article/ArticleFAQ";
import SeniorCareFAQ from "@/components/article/SeniorCareFAQ";
import StarPlusFAQ from "@/components/article/StarPlusFAQ";
import MedicaidEligibilityFAQ from "@/components/article/MedicaidEligibilityFAQ";
import EligibilityChecker from "@/components/article/EligibilityChecker";

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
      title: `${mock.title} | Olera Caregiver Support`,
      description: mock.excerpt,
    };
  }

  const title = article.meta_title || article.title;
  // Prefer excerpt (natural opening paragraph) over CMS meta_description
  // to avoid overriding Google's body-pulled snippets for top articles.
  // CMS meta_description is only used when explicitly set AND excerpt is empty.
  const description = article.excerpt || article.meta_description || undefined;
  const ogTitle = article.og_title || title;
  const ogDescription = article.og_description || description;
  const ogImage = article.og_image_url || article.cover_image_url;
  const canonical = article.canonical_url || `https://olera.care/caregiver-support/${slug}`;

  return {
    title: `${title} | Olera Caregiver Support`,
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

/** Mock article HTML for fallback rendering */
const MOCK_ARTICLE_HTML = `
<p>When it comes to finding the right care for your loved one, there are many factors to consider. Understanding your options is the first step toward making an informed decision that balances quality of care with practical considerations like location and cost.</p>
<p>The journey of finding care can feel overwhelming, but breaking it down into manageable steps makes the process much more approachable. This guide will walk you through everything you need to know.</p>
<h2>Understanding Your Options</h2>
<p>The senior care landscape offers various levels of support, from minimal assistance to round-the-clock medical care. Each type of care serves different needs, and choosing the right one depends on your loved one's health condition, preferences, and financial situation.</p>
<blockquote>The most important thing is finding care that respects your loved one's dignity and independence while providing the support they need.</blockquote>
<p>Many families find that their needs change over time. What starts as occasional help with household tasks may eventually evolve into a need for more comprehensive care. Planning for this progression can help ease transitions.</p>
<h2>Key Considerations</h2>
<p>Before making any decisions, take time to assess the current and anticipated needs. Consider factors like mobility, cognitive function, medical requirements, and social preferences.</p>
<ul>
  <li>Assess current health status and anticipated future needs</li>
  <li>Consider your loved one's preferences and lifestyle</li>
  <li>Evaluate financial resources and insurance coverage</li>
  <li>Research quality ratings and reviews from other families</li>
  <li>Visit facilities and meet with staff when possible</li>
</ul>
<p>Taking the time to thoroughly evaluate these factors will help ensure you find the right fit for your family's unique situation.</p>
`;

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
  let authorAvatar = article?.author_avatar ?? mockResource?.author.avatar ?? null;
  const readingTime = article?.reading_time ?? mockResource!.readingTime;
  const publishedAt = article?.published_at ?? mockResource!.publishedAt;
  const coverImage = article?.cover_image_url ?? mockResource!.coverImage;
  const careTypes = (article?.care_types ?? mockResource!.careTypes) as CareTypeId[];
  const tags = article?.tags ?? mockResource!.tags ?? [];
  const primaryCareType = careTypes[0] as CareTypeId | undefined;
  const careTypeLabel = primaryCareType ? CARE_TYPE_CONFIG[primaryCareType]?.label : null;
  // Default medical reviewer when the DB doesn't specify one. Falls back to
  // Dr. Logan DuBose (Olera co-founder & MD) so every editorial article
  // surfaces a verified-by byline even before admin assigns a reviewer.
  const reviewerName = article?.reviewer_name || "Dr. Logan DuBose";
  const reviewerRole = article?.reviewer_role || "Co-founder & MD";
  const showAuthorCard = authorName !== "Olera Team";
  const knownAuthor = getAuthorByName(authorName);
  const knownReviewer = getAuthorByName(reviewerName);
  const reviewerSlug = knownReviewer?.slug;
  const reviewerAvatar = knownReviewer?.avatar ?? null;
  const authorSlug = knownAuthor?.slug;
  const byline = getBylineRules({ authorName, reviewerName });
  // Fall back to static author avatar when DB value is missing
  if (!authorAvatar && knownAuthor?.avatar) {
    authorAvatar = knownAuthor.avatar;
  }

  // Render content
  let contentHtml = article?.content_html || "";
  if (!contentHtml && article?.content_json && Object.keys(article.content_json).length > 0) {
    contentHtml = renderContentToHTML(article.content_json);
  }
  const hasRealContent = !!contentHtml;

  // Process HTML for heading IDs + TOC
  const rawHtml = hasRealContent ? contentHtml : MOCK_ARTICLE_HTML;
  const { html: processedHtml, headings } = processArticleHtml(rawHtml);
  const showToc = headings.length >= 2;

  // Related articles
  const related = article
    ? await getRelatedArticles(article.id, careTypes, 3, "caregiver-support")
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
    reviewedBy: {
      "@type": "Person",
      name: reviewerName,
      ...(reviewerRole && { jobTitle: reviewerRole }),
    },
    publisher: {
      "@type": "Organization",
      name: "Olera",
      url: "https://olera.care",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://olera.care/caregiver-support/${slug}`,
    },
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://olera.care" },
      { "@type": "ListItem", position: 2, name: "Caregiver Support", item: "https://olera.care/caregiver-support" },
      { "@type": "ListItem", position: 3, name: title },
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

      {/* ─── Unified content container ───────────────────── */}
      <div className={`max-w-[1100px] mx-auto px-5 ${showToc ? "lg:flex lg:gap-16" : ""}`}>
        {/* Left column: header + image + body */}
        <div className={`${showToc ? "flex-1 max-w-[680px]" : "max-w-[680px] mx-auto"}`}>

          {/* ─── Header ─────────────────────────────────────── */}
          <header className="pt-8 md:pt-12">
            {/* Back link */}
            <Link
              href="/caregiver-support"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Caregiver Support
            </Link>

            {/* Category */}
            {careTypeLabel && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 mb-3">
                {careTypeLabel}
              </p>
            )}

            {/* Title */}
            <h1 className="font-display text-display-sm md:text-display-md text-gray-900 tracking-[-0.02em] mb-3">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-lg text-gray-500 mb-4">
                {subtitle}
              </p>
            )}

            {/* Metadata + Verified by + Share */}
            <div className="flex items-start gap-6 mb-10">
            <div className="flex-1 border-l-[3px] border-primary-400 bg-gradient-to-r from-primary-50/60 to-transparent pl-5 pr-4 py-4 rounded-r-lg">
              {/* Top row: date + reading time */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
                <span className="text-gray-500">
                  Published <span className="font-medium text-gray-700">{formatDate(publishedAt)}</span>
                </span>
                {article?.updated_at && (
                  <span className="text-gray-500">
                    Updated <span className="font-medium text-gray-700">{formatDate(article.updated_at)}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  {readingTime}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200/60 mb-3" />

              {/* Author + Reviewer row */}
              <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
                {/* Written by */}
                <div className="flex items-center gap-2">
                  {showAuthorCard && authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Written by</p>
                    <p className="text-sm font-semibold text-gray-800">{showAuthorCard ? authorName : "Olera team"}</p>
                  </div>
                </div>

                {/* Verified by */}
                {!byline.isSamePerson && reviewerName && (
                  reviewerSlug ? (
                    <Link href="/team" className="flex items-center gap-2 group">
                      {reviewerAvatar ? (
                        <img src={reviewerAvatar} alt={reviewerName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {reviewerName.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Verified by</p>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">{reviewerName}</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {reviewerName.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Verified by</p>
                        <p className="text-sm font-semibold text-gray-800">{reviewerName}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Share buttons */}
            <div className="hidden sm:flex items-center gap-2 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Share</p>
              <a
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`https://olera.care/caregiver-support/${slug}`)}`}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                aria-label="Share via email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://olera.care/caregiver-support/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                aria-label="Share on LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://olera.care/caregiver-support/${slug}`)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                aria-label="Share on X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
            </div>
          </header>

          {/* ─── Hero Image ─────────────────────────────────── */}
          {coverImage && (
            <figure className="mb-10">
              <img
                src={coverImage}
                alt={title}
                className="w-full aspect-[2/1] object-cover rounded-2xl"
              />
            </figure>
          )}

          {/* ─── Article body ───────────────────────────────── */}
          <article>
          {/* Mobile TOC */}
          {showToc && <MobileTableOfContents headings={headings} />}

          {/* Content — split at widget placeholders to inject React components */}
          {(() => {
            const MARKERS: Record<string, React.ReactNode> = {
              "<!-- eligibility-checker -->": <EligibilityChecker />,
              "<!-- spend-down-calculator -->": <SpendDownWidget initialStateCode="TX" />,
              "<!-- faq-accordion -->": slug === "how-to-pay-for-senior-care-in-texas" ? <SeniorCareFAQ /> : slug === "star-plus-waiver-texas-complete-guide" ? <StarPlusFAQ /> : slug === "texas-medicaid-eligibility-seniors-2026" ? <MedicaidEligibilityFAQ /> : <ArticleFAQ />,
            };
            let segments: React.ReactNode[] = [processedHtml];
            for (const [marker, component] of Object.entries(MARKERS)) {
              const nextSegments: React.ReactNode[] = [];
              for (const seg of segments) {
                if (typeof seg === "string" && seg.includes(marker)) {
                  const parts = seg.split(marker);
                  parts.forEach((part, idx) => {
                    if (idx > 0) nextSegments.push(component);
                    nextSegments.push(part);
                  });
                } else {
                  nextSegments.push(seg);
                }
              }
              segments = nextSegments;
            }
            return (
              <>
                {segments.map((seg, i) =>
                  typeof seg === "string" ? (
                    seg.trim() ? <div key={i} className="prose-editorial" dangerouslySetInnerHTML={{ __html: seg }} /> : null
                  ) : (
                    <div key={i}>{seg}</div>
                  )
                )}
              </>
            );
          })()}

          {/* Contextual CTA */}
          {primaryCareType && (
            <Link
              href={`/browse?type=${primaryCareType}`}
              className="group block my-12 p-5 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
            >
              <p className="text-base font-semibold text-gray-900 mb-1">
                Looking for {CARE_TYPE_CONFIG[primaryCareType].label.toLowerCase()} providers?
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Browse verified options in your area
                <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </Link>
          )}

          {/* Author + Tags */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            {showAuthorCard && (
              <div className="flex items-center gap-3 mb-6">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {authorName.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                )}
                <div>
                  {authorSlug ? (
                    <Link href={`/author/${authorSlug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {authorName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                  )}
                  {authorRole && (
                    <p className="text-sm text-gray-500">{authorRole}</p>
                  )}
                </div>
              </div>
            )}


            {/* Tags */}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {careTypes.map((careType) => (
                <span
                  key={careType}
                  className="text-sm text-gray-500"
                >
                  {CARE_TYPE_CONFIG[careType]?.label ?? careType}
                </span>
              ))}
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-sm text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          </article>
        </div>

        {/* Desktop TOC sidebar */}
        {showToc && (
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-[96px] pt-4">
              <DesktopTableOfContents headings={headings} />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom spacing when no related articles */}
      {related.length === 0 && <div className="pb-16" />}
    </main>
  );
}
