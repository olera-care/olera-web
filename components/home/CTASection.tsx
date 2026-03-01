import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 pt-12 md:pt-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            You don&apos;t have to figure this out alone.
          </h2>
          <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
            Thousands of families use Olera to find trusted care for the people they love.
          </p>
          <div className="mt-6">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Browse care options
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
