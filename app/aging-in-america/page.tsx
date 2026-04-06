import { seasons, allEpisodes, seriesMeta } from "@/lib/aging-in-america-data"
import HeroSection from "@/components/aging-in-america/HeroSection"
import FeaturedTrailer from "@/components/aging-in-america/FeaturedTrailer"
import AboutSection from "@/components/aging-in-america/AboutSection"
import SeasonSection from "@/components/aging-in-america/SeasonSection"
import CtaSection from "@/components/aging-in-america/CtaSection"

export default function AgingInAmericaPage() {
  // Latest published episode for hero CTA
  const latestEpisode = allEpisodes.find((ep) => ep.status === "published")

  // Separate seasons for the new layout: S2 → Trailer → S1
  const season2 = seasons.find((s) => s.number === 2)!
  const season1 = seasons.find((s) => s.number === 1)!

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: seriesMeta.name,
    description: seriesMeta.description,
    url: seriesMeta.url,
    creator: {
      "@type": "Organization",
      name: "Olera",
      url: "https://olera.care",
    },
    hasPart: allEpisodes
      .filter((ep) => ep.status === "published")
      .map((ep) => ({
        "@type": "VideoObject",
        name: ep.title,
        description: ep.summary,
        thumbnailUrl: ep.thumbnailUrl,
        uploadDate: ep.releaseDate,
        duration: `PT${ep.durationMinutes}M`,
        url: `https://olera.care/aging-in-america/${ep.slug}`,
        embedUrl: `https://www.youtube.com/embed/${ep.youtubeId}`,
        publisher: {
          "@type": "Organization",
          name: "Olera",
          url: "https://olera.care",
        },
      })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection latestEpisodeSlug={latestEpisode?.slug} />
      <SeasonSection season={season2} />
      <FeaturedTrailer />
      <SeasonSection season={season1} />
      <AboutSection />
      <CtaSection />
    </>
  )
}
