"use client";

import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HeroSection() {
  const { openAuth } = useAuth();

  const handleGetStarted = () => {
    openAuth({ intent: "provider" });
  };

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Edge-to-edge background image */}
      <Image
        src="/images/for-providers/hero.jpg"
        alt="Caregiver with elderly woman"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-[1312px] mx-auto w-full relative">
          <div className="max-w-xl">
            <h1 className="font-serif text-display-md sm:text-display-lg lg:text-display-xl font-bold text-white leading-tight">
              Reach more families
            </h1>
            <p className="mt-3 text-text-lg text-white/85">
              Join a network of senior care providers families trust
            </p>

            {/* Search bar */}
            <div className="mt-6 flex items-center gap-3 max-w-md">
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
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

          {/* NIH badge — aligned to right edge of container */}
          <div className="absolute bottom-0 right-0 hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-white/90 flex items-center justify-center text-text-xs font-bold text-gray-700">
              NIH
            </div>
            <div className="text-text-xs text-white/90">
              <span className="block text-white/60 text-[10px]">
                Proudly supported by
              </span>
              <span className="font-medium">National Institute on Aging</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
