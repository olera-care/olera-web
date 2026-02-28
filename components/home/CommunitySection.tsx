import Link from "next/link";

export default function CommunitySection() {
  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Beyond the Search
          </h2>
          <p className="mt-1.5 text-base text-gray-500">
            Resources, community, and stories from families like yours
          </p>
        </div>

        {/* Aging in America — hero card */}
        <div className="rounded-2xl bg-warm-50/80 border border-warm-100/60 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Text side */}
            <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/80 text-primary-700 text-xs font-semibold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Chapter 1
                </span>
                <span className="text-sm font-medium text-warm-600">Documentary Series</span>
              </div>

              <h3 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Aging in America
              </h3>
              <p className="mt-3 text-base text-gray-600 max-w-md leading-relaxed">
                Explore the realities of senior care in America and discover how families navigate finding the right care.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:shadow-md transition-all"
                >
                  Start Your Search
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <a
                  href="https://www.youtube.com/@OleraCare"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Watch more chapters
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Video side */}
            <div className="relative aspect-video lg:aspect-auto">
              <iframe
                src="https://www.youtube.com/embed/TiVrqkrYhEc"
                title="Aging in America — Chapter 1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full min-h-[280px] lg:min-h-full"
              />
            </div>
          </div>
        </div>

        {/* Community cards — Discord + Facebook */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Discord — Young Caregivers */}
          <a
            href="https://discord.gg/olera"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-2xl overflow-hidden bg-[#5865F2]/5 border border-[#5865F2]/15 hover:border-[#5865F2]/30 hover:shadow-lg hover:shadow-[#5865F2]/10 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5865F2] to-[#7289DA] rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#5865F2]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Young Caregivers Discord
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Connect with other young adults navigating caregiving.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#5865F2]/10 flex items-center justify-center group-hover:bg-[#5865F2] transition-colors duration-300">
                <svg className="w-4 h-4 text-[#5865F2] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          {/* Facebook — Caregiver Community */}
          <a
            href="https://www.facebook.com/groups/oleracaregivers"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-2xl overflow-hidden bg-[#1877F2]/5 border border-[#1877F2]/15 hover:border-[#1877F2]/30 hover:shadow-lg hover:shadow-[#1877F2]/10 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1877F2] to-[#4599FF] rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Caregiver Community
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">11,000+ caregivers sharing advice and support on Facebook.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#1877F2]/10 flex items-center justify-center group-hover:bg-[#1877F2] transition-colors duration-300">
                <svg className="w-4 h-4 text-[#1877F2] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* Resource + Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Link
            href="/resources"
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-primary-50/80 to-white border border-primary-100/60 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/40 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5.5 h-5.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Caregiving Guides & Articles
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Expert resources for every stage of the care journey.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                <svg className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link
            href="/benefits"
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-warm-50 via-warm-50/80 to-white border border-warm-100/60 hover:border-warm-200 hover:shadow-lg hover:shadow-warm-100/40 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warm-400 to-warm-600 rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5.5 h-5.5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Find Financial Aid Programs
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Medicare, Medicaid, and veteran benefits you may qualify for.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center group-hover:bg-warm-600 transition-colors duration-300">
                <svg className="w-4 h-4 text-warm-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
