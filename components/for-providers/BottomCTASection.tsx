"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function BottomCTASection() {
  const { openAuth } = useAuth();

  const handleGetStarted = () => {
    openAuth({ intent: "provider" });
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-2xl px-6 sm:px-12 py-12 sm:py-16 text-center">
          <h2 className="font-serif text-display-sm md:text-display-md font-bold text-white">
            Ready to get started?
          </h2>

          {/* Search bar */}
          <div className="mt-8 flex items-center justify-center gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Business name or zip code"
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-text-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onFocus={handleGetStarted}
                readOnly
              />
            </div>
            <button
              type="button"
              onClick={handleGetStarted}
              className="shrink-0 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[44px]"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
