import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import {
  allEpisodes,
  getEpisodeBySlug,
  getRelatedEpisodes,
} from "@/lib/aging-in-america-data"
import YouTubePlayer from "@/components/aging-in-america/YouTubePlayer"
import EpisodeCard from "@/components/aging-in-america/EpisodeCard"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return allEpisodes.map((ep) => ({ slug: ep.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const episode = getEpisodeBySlug(slug)
  if (!episode) return {}

  const title = episode.subject
    ? `${episode.subject}: ${episode.title} | Aging in America`
    : `${episode.title} | Aging in America`

  return {
    title,
    description: episode.summary,
    alternates: { canonical: `/aging-in-america/${slug}` },
    openGraph: {
      title,
      description: episode.summary,
      url: `https://olera.care/aging-in-america/${slug}`,
      siteName: "Olera",
      type: "video.episode",
      images: [{ url: episode.thumbnailUrl, width: 1280, height: 720 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: episode.summary,
      images: [episode.thumbnailUrl],
    },
  }
}

export default async function EpisodeDetailPage({ params }: Props) {
  const { slug } = await params
  const episode = getEpisodeBySlug(slug)
  if (!episode) notFound()

  const related = getRelatedEpisodes(slug, 3)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: episode.title,
    description: episode.summary,
    thumbnailUrl: episode.thumbnailUrl,
    uploadDate: episode.releaseDate,
    duration: `PT${episode.durationMinutes}M`,
    url: `https://olera.care/aging-in-america/${episode.slug}`,
    embedUrl: `https://www.youtube.com/embed/${episode.youtubeId}`,
    publisher: {
      "@type": "Organization",
      name: "Olera",
      url: "https://olera.care",
    },
    partOfSeries: {
      "@type": "CreativeWorkSeries",
      name: "Aging in America",
      url: "https://olera.care/aging-in-america",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href="/aging-in-america"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to all episodes
        </Link>
      </div>

      {/* Episode header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-medium px-3 py-1 rounded-full border border-gray-700 text-gray-300">
            {episode.durationMinutes} min
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full border border-gray-700 text-gray-300">
            {episode.year}
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full border border-gray-700 text-gray-300">
            Season {episode.season}
          </span>
          {episode.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="text-xs font-medium px-3 py-1 rounded-full border border-gray-700 text-gray-300"
            >
              {topic}
            </span>
          ))}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
          {episode.title}
        </h1>

        {episode.subject && (
          <p className="mt-3 text-lg text-gray-400">
            The story of {episode.subject}
          </p>
        )}
      </header>

      {/* Video player */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {episode.status === "published" ? (
          <YouTubePlayer
            youtubeId={episode.youtubeId}
            title={episode.title}
          />
        ) : (
          <div className="relative aspect-video rounded-xl bg-gray-900 flex items-center justify-center border border-gray-800">
            <div className="text-center">
              <p className="text-gray-400 text-lg font-medium">Coming soon</p>
              <p className="text-gray-500 text-sm mt-1">
                Premieres{" "}
                {new Date(episode.releaseDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Story text */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-lg text-gray-300 leading-relaxed">
          {episode.summary}
        </p>

        {episode.pullQuote && (
          <blockquote className="mt-10 pl-6 border-l-2 border-gray-700">
            <p className="text-xl text-gray-200 italic leading-relaxed">
              &ldquo;{episode.pullQuote}&rdquo;
            </p>
            {episode.subject && (
              <cite className="block mt-3 text-sm text-gray-500 not-italic">
                — {episode.subject}
              </cite>
            )}
          </blockquote>
        )}
      </section>

      {/* Related episodes */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <h2 className="font-display text-2xl text-white mb-8">
            More episodes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((ep) => (
              <EpisodeCard key={ep.slug} episode={ep} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
