"use client";

import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SetUpProfileSection() {
  const { openAuth } = useAuth();

  const handleGetStarted = () => {
    openAuth({ intent: "provider" });
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900 text-center mb-12">
          Set up your profile
        </h2>

        <div className="max-w-5xl mx-auto rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
            {/* Left — Form */}
            <div className="p-8 lg:p-10">
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

            {/* Right — Profile screenshot */}
            <div className="flex items-center justify-center p-4 lg:p-6">
              <Image
                src="/images/for-providers/profile-screenshot.png"
                alt="Provider profile page on Olera"
                width={789}
                height={700}
                className="w-full h-auto rounded-lg shadow-lg"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
