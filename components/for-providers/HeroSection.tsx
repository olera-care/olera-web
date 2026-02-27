"use client";

import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HeroSection() {
  const { openAuth } = useAuth();

  const handleGetStarted = () => {
    openAuth({ intent: "provider" });
  };

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[560px] lg:min-h-[640px] py-12 lg:py-0">
          {/* Left — Copy + Search */}
          <div className="max-w-xl">
            <h1 className="font-serif text-display-lg md:text-display-xl lg:text-display-2xl font-bold text-gray-900 leading-tight">
              Reach more families
            </h1>
            <p className="mt-4 text-text-lg text-gray-600">
              Join a network of senior care providers families trust
            </p>

            {/* Search bar */}
            <div className="mt-8 flex items-center gap-3">
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
                  className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-gray-300 text-text-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onFocus={handleGetStarted}
                  readOnly
                />
              </div>
              <button
                type="button"
                onClick={handleGetStarted}
                className="shrink-0 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[44px]"
              >
                Get started
              </button>
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="relative hidden lg:block">
            {/* Teal gradient overlay — top-right corner */}
            <div className="absolute -top-12 -right-8 w-[480px] h-[480px] bg-gradient-to-bl from-primary-600/30 via-primary-500/10 to-transparent rounded-3xl -z-0" />

            <div className="relative z-10 w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/for-providers/hero.jpg"
                alt="Caregiver with elderly woman"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>

            {/* NIH badge */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-text-xs font-bold text-gray-500">
                NIH
              </div>
              <div className="text-text-xs text-gray-600">
                <span className="block text-gray-400 text-[10px]">
                  Proudly supported by
                </span>
                <span className="font-medium">National Institute on Aging</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero image */}
      <div className="lg:hidden px-4 pb-8">
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden">
          <Image
            src="/images/for-providers/hero.jpg"
            alt="Caregiver with elderly woman"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        {/* NIH badge — mobile */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
            NIH
          </div>
          <span className="text-text-xs text-gray-500">
            Proudly supported by National Institute on Aging
          </span>
        </div>
      </div>
    </section>
  );
}
