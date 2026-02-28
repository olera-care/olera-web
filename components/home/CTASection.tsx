"use client";

import Link from "next/link";

export default function CTASection() {
  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-8 py-16 md:px-16 md:py-20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-warm-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Ready to find the right care?
            </h2>
            <p className="mt-4 text-lg text-primary-100/90 max-w-xl mx-auto">
              Join thousands of families who have found trusted care through Olera.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-primary-700 shadow-lg shadow-black/10 hover:shadow-xl transition-all"
              >
                Browse Care Options
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-semibold text-white transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
