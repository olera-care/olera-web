import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAuthorBySlug, getAllAuthorSlugs } from "@/lib/authors";
import { createClient } from "@/lib/supabase/server";

// ISR: revalidate every 60 seconds
export const revalidate = 60;

// Static generation for all known authors
export async function generateStaticParams() {
  return getAllAuthorSlugs().map((slug) => ({ slug }));
}

// SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Author Not Found | Olera" };

  return {
    title: `${author.name} — Author | Olera`,
    description: author.bio,
    alternates: { canonical: `https://olera.care/author/${slug}` },
    openGraph: {
      title: `${author.name} — Author | Olera`,
      description: author.bio,
      url: `https://olera.care/author/${slug}`,
      siteName: "Olera",
      type: "profile",
      ...(author.avatar && { images: [author.avatar] }),
    },
  };
}

// Fetch articles by author name from Supabase
async function getArticlesByAuthor(authorName: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_articles")
    .select(
      "id,slug,title,excerpt,cover_image_url,care_types,reading_time,published_at,section"
    )
    .eq("status", "published")
    .eq("author_name", authorName)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  return data ?? [];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const articles = await getArticlesByAuthor(author.name);

  // Separate caregiver-support from research-and-press
  const caregiverArticles = articles.filter(
    (a) => a.section === "caregiver-support" || !a.section
  );
  const pressArticles = articles.filter(
    (a) => a.section === "research-and-press"
  );

  // Person JSON-LD
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    ...(author.role && { jobTitle: author.role }),
    ...(author.bio && { description: author.bio }),
    ...(author.avatar && {
      image: `https://olera.care${author.avatar}`,
    }),
    ...(author.linkedin && { sameAs: [author.linkedin] }),
    url: `https://olera.care/author/${slug}`,
    worksFor: {
      "@type": "Organization",
      name: "Olera",
      url: "https://olera.care",
    },
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-5 pt-8 md:pt-12 pb-16">
        {/* Back link */}
        <Link
          href="/caregiver-support"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
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
          Caregiver Support
        </Link>

        {/* Author header */}
        <div className="flex items-start gap-6 md:gap-8 mb-10">
          {author.avatar ? (
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
              <Image
                src={author.avatar}
                alt={author.name}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl md:text-3xl font-medium">
                {author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          )}
          <div className="pt-2">
            <h1 className="font-display text-display-sm md:text-display-md text-gray-900 tracking-[-0.02em]">
              {author.name}
            </h1>
            {author.role && (
              <p className="text-base text-gray-500 mt-1">{author.role}</p>
            )}
            {author.linkedin && (
              <a
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-base text-gray-600 leading-relaxed max-w-2xl mb-12">
          {author.bio}
        </p>

        {/* Articles */}
        {caregiverArticles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Articles ({caregiverArticles.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {caregiverArticles.map((a) => (
                <Link
                  key={a.id}
                  href={`/caregiver-support/${a.slug}`}
                  className="group block"
                >
                  {a.cover_image_url && (
                    <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-3">
                      <Image
                        src={a.cover_image_url}
                        alt={a.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                    {a.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {a.published_at && <span>{formatDate(a.published_at)}</span>}
                    {a.reading_time && (
                      <>
                        <span>&middot;</span>
                        <span>{a.reading_time}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {pressArticles.length > 0 && (
          <section className={caregiverArticles.length > 0 ? "mt-14" : ""}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Research & Press ({pressArticles.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pressArticles.map((a) => (
                <Link
                  key={a.id}
                  href={`/research-and-press/${a.slug}`}
                  className="group block"
                >
                  {a.cover_image_url && (
                    <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-3">
                      <Image
                        src={a.cover_image_url}
                        alt={a.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                    {a.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {a.published_at && <span>{formatDate(a.published_at)}</span>}
                    {a.reading_time && (
                      <>
                        <span>&middot;</span>
                        <span>{a.reading_time}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <p className="text-gray-400 text-center py-12">
            No published articles yet.
          </p>
        )}
      </div>
    </main>
  );
}
