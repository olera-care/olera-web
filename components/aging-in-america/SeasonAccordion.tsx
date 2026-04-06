"use client"

import { useState } from "react"
import type { Season } from "@/lib/aging-in-america-data"
import EpisodeCard from "./EpisodeCard"

export default function SeasonAccordion({ seasons }: { seasons: Season[] }) {
  // Latest season (first in array) is open by default
  const [openSeasons, setOpenSeasons] = useState<Set<number>>(
    new Set([seasons[0]?.number])
  )

  function toggleSeason(num: number) {
    setOpenSeasons((prev) => {
      const next = new Set(prev)
      if (next.has(num)) {
        next.delete(num)
      } else {
        next.add(num)
      }
      return next
    })
  }

  return (
    <section id="episodes" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-2xl sm:text-3xl text-white mb-12">
          All Episodes
        </h2>

        <div className="divide-y divide-gray-800 border-t border-b border-gray-800">
          {seasons.map((season) => {
            const isOpen = openSeasons.has(season.number)
            return (
              <div key={season.number}>
                {/* Season header */}
                <button
                  onClick={() => toggleSeason(season.number)}
                  className="w-full flex items-center justify-between py-6 md:py-8 group cursor-pointer"
                >
                  <div className="flex items-baseline gap-4">
                    <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-white">
                      {season.title}
                    </h3>
                    <span className="text-sm text-gray-500 hidden sm:inline">
                      {season.episodes.length} episodes
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Episode grid — animated expand/collapse */}
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="pb-8 md:pb-12">
                      <p className="text-gray-500 text-sm mb-8 max-w-2xl">
                        {season.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                        {season.episodes.map((episode) => (
                          <EpisodeCard
                            key={episode.slug}
                            episode={episode}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
