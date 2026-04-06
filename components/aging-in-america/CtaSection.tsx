import Link from "next/link"

export default function CtaSection() {
  return (
    <section className="py-20 md:py-28 border-t border-gray-800/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
          Every story matters
        </h2>
        <p className="text-gray-400 leading-relaxed mb-10 max-w-xl mx-auto">
          If you&apos;re caring for someone you love, know that you&apos;re not
          alone. Whether you want to share your story or find support for your
          family, we&apos;re here.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:support@olera.care?subject=I want to share my caregiving story"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Share Your Story
          </a>
          <Link
            href="/benefits"
            className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 px-6 py-3 rounded-full text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
          >
            Find Care for Your Family
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
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        {/* YouTube subscribe nudge */}
        <div className="mt-14 pt-8 border-t border-gray-800/50">
          <p className="text-sm text-gray-500 mb-3">
            Follow the series on YouTube
          </p>
          <a
            href="https://www.youtube.com/@OleraCare"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path fill="#0a0a0a" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            @OleraCare
          </a>
        </div>
      </div>
    </section>
  )
}
