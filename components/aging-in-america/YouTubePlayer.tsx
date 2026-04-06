"use client"

import { useState, useCallback } from "react"
import { getYouTubeThumbnail } from "@/lib/aging-in-america-data"

export default function YouTubePlayer({
  youtubeId,
  title,
}: {
  youtubeId: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)

  const handlePlay = useCallback(() => setPlaying(true), [])

  if (playing) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  return (
    <button
      onClick={handlePlay}
      className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-900 group cursor-pointer"
      aria-label={`Play ${title}`}
    >
      {/* Poster image */}
      <img
        src={getYouTubeThumbnail(youtubeId)}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

      {/* Play button */}
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
    </button>
  )
}
