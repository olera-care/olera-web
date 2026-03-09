"use client";

import { useInView } from "@/hooks/use-in-view";
import { useAnimatedCounters } from "@/hooks/use-animated-counters";

const counterTargets = [
  { end: 48000, duration: 1500 },
  { end: 12000, duration: 1500 },
  { end: 500, duration: 1200 },
];

export default function SocialProofSection() {
  const { isInView, ref } = useInView(0.2);
  const [providersCount, familiesCount, citiesCount] = useAnimatedCounters(
    counterTargets,
    isInView
  );

  return (
    <section ref={ref} className="py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
          {/* Providers */}
          <div className="flex items-center gap-2 sm:px-6">
            <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {providersCount.toLocaleString()}+
            </span>
            <span className="text-sm text-gray-500 font-medium">providers</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Families */}
          <div className="flex items-center gap-2 sm:px-6">
            <svg className="w-5 h-5 text-warm-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {familiesCount.toLocaleString()}+
            </span>
            <span className="text-sm text-gray-500 font-medium">families connected</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Cities */}
          <div className="flex items-center gap-2 sm:px-6">
            <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {citiesCount.toLocaleString()}+
            </span>
            <span className="text-sm text-gray-500 font-medium">cities covered</span>
          </div>
        </div>
      </div>
    </section>
  );
}
