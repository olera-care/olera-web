import type { Author } from "@/lib/authors";

/**
 * Small rounded avatar used on the benefits-page "Reviewed by" chip.
 * Falls back to a gray-filled circle with initials when the author has no
 * avatar image set.
 */
export function ReviewerAvatar({ author }: { author: Author }) {
  if (author.avatar) {
    return (
      <img
        src={author.avatar}
        alt={author.name}
        className="w-7 h-7 rounded-full object-cover"
      />
    );
  }
  const initials = author.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-medium">{initials}</span>
    </div>
  );
}
