"use client";

import Link from "next/link";

const floatKeyframes = `
@keyframes comingSoonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes comingSoonPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
@keyframes comingSoonFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function StarIcon({ className = "", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      {filled ? (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      ) : (
        <path
          fillRule="evenodd"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          clipRule="evenodd"
          opacity={0.15}
        />
      )}
    </svg>
  );
}

export default function ProviderReviewsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      <div
        className="flex flex-col items-center justify-center text-center min-h-[70vh]"
        style={{ animation: "comingSoonFadeIn 0.6s ease-out" }}
      >
        {/* Floating stars cluster */}
        <div className="relative w-32 h-32 mb-8">
          {/* Center star */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: "comingSoonFloat 3s ease-in-out infinite" }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/80 border border-primary-200/50 flex items-center justify-center shadow-sm">
              <StarIcon filled className="w-10 h-10 text-primary-500" />
            </div>
          </div>

          {/* Orbiting small stars */}
          <div
            className="absolute -top-1 right-2"
            style={{ animation: "comingSoonFloat 3s ease-in-out infinite 0.4s" }}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center">
              <StarIcon filled className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div
            className="absolute -bottom-1 left-1"
            style={{ animation: "comingSoonFloat 3s ease-in-out infinite 0.8s" }}
          >
            <div className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-100 flex items-center justify-center">
              <StarIcon filled className="w-3.5 h-3.5 text-warm-300" />
            </div>
          </div>

          <div
            className="absolute top-3 -left-3"
            style={{ animation: "comingSoonFloat 3s ease-in-out infinite 1.2s" }}
          >
            <div className="w-5 h-5 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center">
              <StarIcon filled className="w-2.5 h-2.5 text-primary-300" />
            </div>
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 mb-5">
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 tracking-tight mb-3">
          Reviews
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-4">
          Collect and showcase feedback from the families you serve. Build trust with authentic reviews on your profile.
        </p>

        {/* Feature preview pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-lg">
          {["Collect reviews", "Share review links", "Showcase on profile", "Review analytics"].map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-vanilla-50 border border-warm-100 text-gray-700"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Decorative preview cards */}
        <div className="flex items-center gap-3 mb-10 opacity-40">
          {[5, 4, 5].map((rating, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 w-44 text-left"
              style={{
                animation: `comingSoonPulse 3s ease-in-out infinite ${i * 0.5}s`,
              }}
            >
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= rating} className={`w-3 h-3 ${star <= rating ? "text-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
              <div className="h-2 w-full bg-gray-100 rounded mb-1.5" />
              <div className="h-2 w-3/4 bg-gray-100 rounded mb-1.5" />
              <div className="h-2 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/provider"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
