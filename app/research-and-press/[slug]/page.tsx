import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content";
import { renderContentToHTML } from "@/lib/render-content";
import { CareTypeId, CARE_TYPE_CONFIG } from "@/types/forum";
import { processArticleHtml } from "@/lib/article-html";
import { getAuthorByName } from "@/lib/authors";
import {
  DesktopTableOfContents,
  MobileTableOfContents,
} from "@/components/article/TableOfContents";

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

  if (!article) return { title: "Article Not Found | Olera" };

  const title = article.meta_title || article.title;
  const description =
    article.meta_description ||
    article.excerpt ||
    `${article.title} - Olera Research & Press`;
  const ogTitle = article.og_title || title;
  const ogDescription = article.og_description || description;
  const ogImage = article.og_image_url || article.cover_image_url;
  const canonical =
    article.canonical_url ||
    `https://olera.care/research-and-press/${slug}`;

  return {
    title: `${title} | Olera Research & Press`,
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
      ...(article.published_at && { publishedTime: article.published_at }),
      ...(article.updated_at && { modifiedTime: article.updated_at }),
    },
    twitter: {
      card:
        (article.twitter_card_type as
          | "summary_large_image"
          | "summary") || "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ============================================================
// Page Component (Server Component)
// ============================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ResearchAndPressArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const title = article.title;
  const subtitle = article.subtitle ?? "";
  const authorName = article.author_name;
  const authorRole = article.author_role;
  let authorAvatar = article.author_avatar;
  const readingTime = article.reading_time;
  const publishedAt = article.published_at ?? article.created_at;
  const coverImage = article.cover_image_url;
  const careTypes = (article.care_types ?? []) as CareTypeId[];
  const tags = article.tags ?? [];
  const showAuthorCard = authorName !== "Olera Team";
  const knownAuthor = getAuthorByName(authorName);
  const authorSlug = knownAuthor?.slug;
  if (!authorAvatar && knownAuthor?.avatar) {
    authorAvatar = knownAuthor.avatar;
  }

  // Render content
  let contentHtml = article.content_html || "";
  if (
    !contentHtml &&
    article.content_json &&
    Object.keys(article.content_json).length > 0
  ) {
    contentHtml = renderContentToHTML(article.content_json);
  }

  // Process HTML for heading IDs + TOC
  const { html: processedHtml, headings } = processArticleHtml(
    contentHtml || ""
  );
  const showToc = headings.length >= 2;

  // Related articles from same section
  const related = await getRelatedArticles(
    article.id,
    careTypes,
    3,
    "research-and-press"
  );

  // JSON-LD structured data
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": article.structured_data_type || "NewsArticle",
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
      "@id": `https://olera.care/research-and-press/${slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://olera.care",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Research & Press",
        item: "https://olera.care/research-and-press",
      },
      { "@type": "ListItem", position: 3, name: title },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Unified content container */}
      <div
        className={`max-w-[1100px] mx-auto px-5 ${showToc ? "lg:flex lg:gap-16" : ""}`}
      >
        {/* Left column: header + image + body */}
        <div
          className={`${showToc ? "flex-1 max-w-[680px]" : "max-w-[680px] mx-auto"}`}
        >
          {/* Header */}
          <header className="pt-8 md:pt-12">
            <Link
              href="/research-and-press"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Research &amp; Press
            </Link>

            <h1 className="font-display text-display-sm md:text-display-md text-gray-900 tracking-[-0.02em] mb-3">
              {title}
            </h1>

            {subtitle && (
              <p className="text-lg text-gray-500 mb-4">{subtitle}</p>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-10">
              {showAuthorCard && (
                <>
                  <div className="flex items-center gap-2">
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {authorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    )}
                    {authorSlug ? (
                      <Link href={`/author/${authorSlug}`} className="text-gray-600 font-medium hover:text-primary-600 transition-colors">
                        {authorName}
                      </Link>
                    ) : (
                      <span className="text-gray-600 font-medium">{authorName}</span>
                    )}
                  </div>
                  <span className="text-gray-300 mx-1.5">&middot;</span>
                </>
              )}
              <span>{formatDate(publishedAt)}</span>
              <span className="text-gray-300 mx-1.5">&middot;</span>
              <span>{readingTime}</span>
            </div>
          </header>

          {/* Hero Image */}
          {coverImage && (
            <figure className="mb-10">
              <img
                src={coverImage}
                alt={title}
                className="w-full aspect-[2/1] object-cover rounded-2xl"
              />
            </figure>
          )}

          {/* Article body */}
          <article>
            {showToc && <MobileTableOfContents headings={headings} />}

            <div
              className="prose-editorial"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

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
                        {authorName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
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
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="text-sm text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Related Articles */}
            {related.length > 0 && (
              <section className="mt-14 mb-16">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  More from Research &amp; Press
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/research-and-press/${r.slug}`}
                      className="group block"
                    >
                      {r.cover_image_url && (
                        <img
                          src={r.cover_image_url}
                          alt={r.title}
                          className="w-full aspect-[3/2] object-cover rounded-xl mb-3 group-hover:opacity-90 transition-opacity"
                        />
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                        {r.title}
                      </h3>
                      {r.reading_time && (
                        <p className="text-xs text-gray-400">
                          {r.reading_time}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
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

      {related.length === 0 && <div className="pb-16" />}
    </main>
  );
}
