"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { seriesMeta } from "@/lib/aging-in-america-data"

export default function HeroSection({
  latestEpisodeSlug,
}: {
  latestEpisodeSlug?: string
}) {
  const imgRef = useRef<HTMLImageElement>(null)

  // Subtle parallax — image moves slower than scroll
  useEffect(() => {
    const img = imgRef.current
    if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return

    function onScroll() {
      const y = window.scrollY
      if (y < window.innerHeight && img) {
        img.style.transform = `translateY(${y * 0.3}px) scale(1.1)`
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section className="relative h-screen flex items-end overflow-hidden">
      {/* Background — S1 Ch1 thumbnail (the viral 193K-view episode) */}
      <div className="absolute inset-0">
        <img
          ref={imgRef}
          src="/images/aging-in-america/hero.jpg"
          alt="Viviane Koenig — Aging in America"
          className="w-full h-full object-cover scale-110 will-change-transform"
        />
        {/* Lighter gradient — let the photo breathe */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 pb-16 md:pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-end">
          {/* Left — Title */}
          <div>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight uppercase">
              Aging in
              <br />
              America
            </h1>
          </div>

          {/* Right — Copy + CTA, uppercase editorial style */}
          <div className="md:max-w-lg">
            <p className="text-xs sm:text-sm text-gray-100 leading-relaxed tracking-wide uppercase mb-3">
              {seriesMeta.tagline}
            </p>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed tracking-wide uppercase mb-3">
              This is a window into the lives of Americans navigating what comes
              next — with love, with grief, with no easy answers.
            </p>
            <p className="text-xs sm:text-sm text-white leading-relaxed tracking-wide uppercase mb-10">
              These are the stories of Aging in America.
            </p>

            {latestEpisodeSlug && (
              <Link
                href={`/aging-in-america/${latestEpisodeSlug}`}
                className="inline-flex items-center gap-3 text-xs sm:text-sm text-white tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch the Video
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
