"use client";

import { useInView } from "@/hooks/use-in-view";
import { useAnimatedCounters } from "@/hooks/use-animated-counters";

const counterTargets = [
  { end: 48000, duration: 2000 },
  { end: 12000, duration: 2000 },
  { end: 500, duration: 1500 },
];

export default function SocialProofSection() {
  const { isInView, ref } = useInView(0.3);
  const [providersCount, familiesCount, citiesCount] = useAnimatedCounters(
    counterTargets,
    isInView
  );

  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12 relative overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-6 relative">
        <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2">Trusted nationwide</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Helping families find care
        </h2>
      </div>

      {/* Connected Journey — Premium Stats Section */}
      <div ref={ref} className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flowing connection line */}
        <svg className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 hidden md:block" preserveAspectRatio="none" viewBox="0 0 800 100">
          <defs>
            <linearGradient id="lineGradientEnhanced" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(25, 144, 135)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="rgb(194, 120, 86)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(25, 144, 135)" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="dotGradient">
              <stop offset="0%" stopColor="rgb(25, 144, 135)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgb(25, 144, 135)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shadow/glow line */}
          <path
            d="M 60 50 Q 200 15, 400 50 T 740 50"
            stroke="url(#lineGradientEnhanced)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            opacity="0.3"
            filter="url(#glow)"
          />

          {/* Main flowing line */}
          <path
            d="M 60 50 Q 200 15, 400 50 T 740 50"
            stroke="url(#lineGradientEnhanced)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 4"
            className="animate-pulse"
          />

          {/* Animated dots */}
          <circle r="6" fill="rgb(25, 144, 135)" filter="url(#glow)">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 60 50 Q 200 15, 400 50 T 740 50" />
          </circle>
          <circle r="4" fill="rgb(194, 120, 86)" filter="url(#glow)">
            <animateMotion dur="3s" repeatCount="indefinite" begin="1s" path="M 60 50 Q 200 15, 400 50 T 740 50" />
          </circle>
          <circle r="5" fill="rgb(25, 144, 135)" filter="url(#glow)">
            <animateMotion dur="3s" repeatCount="indefinite" begin="2s" path="M 60 50 Q 200 15, 400 50 T 740 50" />
          </circle>
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
          {/* Stat 1 — Providers */}
          <div className="group text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 w-36 h-36 -m-4 rounded-full bg-gradient-to-br from-primary-400/20 to-transparent animate-ping opacity-20" style={{ animationDuration: '3s' }} />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-100 to-white flex items-center justify-center shadow-xl shadow-primary-500/20 group-hover:shadow-2xl group-hover:shadow-primary-500/30 transition-all duration-700 group-hover:scale-110">
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary-200/50 animate-spin" style={{ animationDuration: '20s' }} />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-primary-500/40 border-4 border-white">
                1
              </div>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight tabular-nums mb-2 group-hover:text-primary-700 transition-colors duration-300">
              {providersCount.toLocaleString()}+
            </p>
            <p className="text-gray-700 font-semibold text-lg">Providers Listed</p>
          </div>

          {/* Stat 2 — Families (Center, emphasized) */}
          <div className="group text-center md:mt-6">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 w-44 h-44 -m-5 rounded-full bg-gradient-to-br from-warm-400/25 to-transparent animate-ping opacity-25" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-0 w-40 h-40 -m-3 rounded-full border-2 border-warm-300/30 animate-pulse" />
              <div className="relative w-34 h-34 rounded-full bg-gradient-to-br from-warm-100 via-white to-warm-50 flex items-center justify-center shadow-2xl shadow-warm-500/25 group-hover:shadow-3xl group-hover:shadow-warm-500/40 transition-all duration-700 group-hover:scale-110" style={{ width: '136px', height: '136px' }}>
                <div className="absolute inset-3 rounded-full border-2 border-dashed border-warm-200/50 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                <div className="absolute -top-1 -left-1 w-4 h-4 text-warm-400 animate-bounce" style={{ animationDuration: '2s' }}>
                  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="absolute -top-2 right-2 w-3 h-3 text-warm-300 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-warm-400 via-warm-500 to-warm-600 flex items-center justify-center shadow-xl transform group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-warm-500 to-warm-700 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-warm-500/40 border-4 border-white">
                2
              </div>
            </div>
            <p className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight tabular-nums mb-2 group-hover:text-warm-600 transition-colors duration-300">
              {familiesCount.toLocaleString()}+
            </p>
            <p className="text-gray-700 font-semibold text-xl">Families Connected</p>
          </div>

          {/* Stat 3 — Cities */}
          <div className="group text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 w-36 h-36 -m-4 rounded-full bg-gradient-to-br from-primary-500/20 to-transparent animate-ping opacity-20" style={{ animationDuration: '3.5s' }} />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-100 to-white flex items-center justify-center shadow-xl shadow-primary-600/20 group-hover:shadow-2xl group-hover:shadow-primary-600/30 transition-all duration-700 group-hover:scale-110">
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary-200/50 animate-spin" style={{ animationDuration: '25s' }} />
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary-400 rounded-full -translate-x-1/2 -translate-y-1" />
                <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-primary-300 rounded-full" />
                <div className="absolute top-4 left-1 w-1.5 h-1.5 bg-primary-300 rounded-full" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg transform group-hover:-rotate-12 transition-transform duration-500">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-primary-600/40 border-4 border-white">
                3
              </div>
            </div>
            <p className="text-4xl md:text-5xl font-bold text-primary-600 tracking-tight tabular-nums mb-2 group-hover:text-primary-700 transition-colors duration-300">
              {citiesCount.toLocaleString()}+
            </p>
            <p className="text-gray-700 font-semibold text-lg">Cities Covered</p>
          </div>
        </div>
      </div>
    </section>
  );
}
