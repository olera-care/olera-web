import Link from "next/link";

const communityStats = [
  { label: "Caregivers in our community", value: "11,000+" },
  { label: "Questions answered", value: "2,400+" },
  { label: "Backed by NIH research", value: "NIH" },
];

export default function CommunitySection() {
  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Community invitation */}
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 md:p-12 lg:p-16 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-warm-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              You&apos;re not alone in this
            </h2>
            <p className="mt-3 text-base md:text-lg text-primary-100/80 max-w-lg mx-auto">
              Join thousands of families navigating senior care together. Ask questions, share experiences, and find support from people who understand.
            </p>

            {/* Trust signals */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              {communityStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-primary-200/70 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-primary-700 shadow-lg shadow-black/10 hover:shadow-xl transition-all"
              >
                Join the community
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
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
