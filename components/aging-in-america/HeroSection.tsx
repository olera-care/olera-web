import Link from "next/link"
import { seriesMeta } from "@/lib/aging-in-america-data"

export default function HeroSection({
  latestEpisodeSlug,
}: {
  latestEpisodeSlug?: string
}) {
  return (
    <section className="relative min-h-[85vh] flex items-end">
      {/* Background — S1 Ch1 thumbnail (the viral 193K-view episode) */}
      <div className="absolute inset-0">
        <img
          src="https://img.youtube.com/vi/TiVrqkrYhEc/maxresdefault.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16 md:pb-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end">
          {/* Left — Title */}
          <div>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight">
              Aging in
              <br />
              America
            </h1>
          </div>

          {/* Right — Copy + CTA */}
          <div className="md:max-w-md">
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-2">
              {seriesMeta.tagline}
            </p>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-2">
              This is a window into the lives of Americans navigating what comes
              next — with love, with grief, with no easy answers.
            </p>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed mb-8">
              These are the stories of Aging in America.
            </p>

            <div className="flex items-center gap-4">
              {latestEpisodeSlug && (
                <Link
                  href={`/aging-in-america/${latestEpisodeSlug}`}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Now
                </Link>
              )}
              <Link
                href="#episodes"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                All Episodes
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
                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
