import Link from "next/link"
import type { Episode } from "@/lib/aging-in-america-data"

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const isComingSoon = episode.status === "coming-soon"

  return (
    <Link
      href={`/aging-in-america/${episode.slug}`}
      className="group block"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 mb-4">
        <img
          src={episode.thumbnailUrl}
          alt={episode.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Play button overlay */}
        {!isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-900 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Coming soon badge */}
        {isComingSoon && (
          <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
            Coming{" "}
            {new Date(episode.releaseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}

        {/* Duration pill */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
          {episode.durationMinutes} min
        </div>
      </div>

      {/* Text content */}
      <h3 className="font-medium text-white group-hover:text-gray-200 transition-colors leading-snug mb-1">
        {episode.title}
      </h3>

      {episode.subject && (
        <p className="text-sm text-gray-500 mb-2">{episode.subject}</p>
      )}

      {/* One-line summary — keeps index scannable per NYT Op-Docs pattern */}
      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
        {episode.summary.split(".")[0]}.
      </p>
    </Link>
  )
}
