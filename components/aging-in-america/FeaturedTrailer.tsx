"use client"

import { useState, useCallback } from "react"

const TRAILER_ID = "kbKOG8vmJl0"

export default function FeaturedTrailer() {
  const [playing, setPlaying] = useState(false)
  const handlePlay = useCallback(() => setPlaying(true), [])

  return (
    <section className="py-20 md:py-28 border-t border-gray-800/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-xs tracking-widest text-gray-500 uppercase mb-6">
          Season 2 Trailer
        </p>

        {playing ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${TRAILER_ID}?autoplay=1&rel=0`}
              title="Aging in America — Season 2 Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <button
            onClick={handlePlay}
            className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 group cursor-pointer"
            aria-label="Play Season 2 trailer"
          >
            <img
              src={`https://img.youtube.com/vi/${TRAILER_ID}/maxresdefault.jpg`}
              alt="Aging in America Season 2 Trailer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
              1:00
            </div>
          </button>
        )}

        <p className="mt-4 text-sm text-gray-400">
          The Reality of Family Caregiving | Aging in America
        </p>
      </div>
    </section>
  )
}
