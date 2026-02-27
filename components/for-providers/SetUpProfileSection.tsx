"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function SetUpProfileSection() {
  const { openAuth } = useAuth();

  const handleGetStarted = () => {
    openAuth({ intent: "provider" });
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900 text-center mb-12">
          Set up your profile
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left — Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-text-lg font-semibold text-gray-900">
              Add your business detail
            </h3>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="business-name"
                  className="block text-text-sm font-medium text-gray-700 mb-1.5"
                >
                  Business name
                </label>
                <input
                  id="business-name"
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onFocus={handleGetStarted}
                  readOnly
                />
              </div>

              <div>
                <label
                  htmlFor="zip-code"
                  className="block text-text-sm font-medium text-gray-700 mb-1.5"
                >
                  Zip code
                </label>
                <input
                  id="zip-code"
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onFocus={handleGetStarted}
                  readOnly
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetStarted}
              className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[44px]"
            >
              Get started
            </button>
          </div>

          {/* Right — Screenshot placeholder */}
          <div className="aspect-[4/3] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-text-sm">
              Screenshot — provider profile page
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
