"use client";

export default function ShareButton() {
  function handleShare() {
    const subject = encodeURIComponent(document.title);
    const body = encodeURIComponent(window.location.href);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      aria-label="Share via email"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 4l-10 8L2 4" />
      </svg>
      Share
    </button>
  );
}
