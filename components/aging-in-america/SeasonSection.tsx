import type { Season } from "@/lib/aging-in-america-data"
import EpisodeCard from "./EpisodeCard"

export default function SeasonSection({ season }: { season: Season }) {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Season header */}
        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white">
            {season.title}
          </h2>
          <span className="text-sm text-gray-600">
            {season.episodes.length} episode{season.episodes.length !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-10 max-w-2xl">
          {season.description}
        </p>

        {/* Episode grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {season.episodes.map((episode) => (
            <EpisodeCard key={episode.slug} episode={episode} />
          ))}
        </div>
      </div>
    </section>
  )
}
