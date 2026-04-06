import Link from "next/link"
import type { Episode } from "@/lib/aging-in-america-data"

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const isComingSoon = episode.status === "coming-soon"
  const hasThumbnail = !episode.youtubeId.startsWith("TODO")

  const card = (
    <div className={`group ${isComingSoon ? "" : "cursor-pointer"}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 mb-3">
        {hasThumbnail ? (
          <img
            src={episode.thumbnailUrl}
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Branded placeholder for episodes without a YouTube ID */
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-500 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            {episode.subject && (
              <span className="text-sm text-gray-500 font-medium">
                {episode.subject}
              </span>
            )}
          </div>
        )}

        {/* Play button overlay — only for published episodes with real thumbnails */}
        {!isComingSoon && hasThumbnail && (
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

      {/* Text — title + subject only, no summary (detail page handles that) */}
      <h3 className="font-medium text-white group-hover:text-gray-200 transition-colors leading-snug text-[15px]">
        {episode.title}
      </h3>

      {episode.subject && hasThumbnail && (
        <p className="text-sm text-gray-500 mt-1">{episode.subject}</p>
      )}
    </div>
  )

  if (isComingSoon && !hasThumbnail) {
    return card
  }

  return (
    <Link href={`/aging-in-america/${episode.slug}`} className="block">
      {card}
    </Link>
  )
}
