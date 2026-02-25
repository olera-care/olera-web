"use client";

import Link from "next/link";

const floatKeyframes = `
@keyframes statsFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes statsPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.65; }
}
@keyframes statsFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes statsBarGrow {
  from { width: 0; }
}
`;

export default function ProviderStatisticsPage() {
  const barHeights = [35, 55, 45, 70, 60, 85];
  const barLabels = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      <div
        className="flex flex-col items-center justify-center text-center min-h-[70vh]"
        style={{ animation: "statsFadeIn 0.6s ease-out" }}
      >
        {/* Floating chart illustration */}
        <div
          className="relative mb-8"
          style={{ animation: "statsFloat 3s ease-in-out infinite" }}
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/80 border border-primary-200/50 flex items-center justify-center shadow-sm">
            <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>

          {/* Floating accent elements */}
          <div
            className="absolute -top-2 -right-4"
            style={{ animation: "statsFloat 3s ease-in-out infinite 0.5s" }}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div
            className="absolute -bottom-2 -left-3"
            style={{ animation: "statsFloat 3s ease-in-out infinite 1s" }}
          >
            <div className="w-6 h-6 rounded-md bg-success-50 border border-success-200/50 flex items-center justify-center">
              <svg className="w-3 h-3 text-success-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 mb-5">
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 tracking-tight mb-3">
          Statistics
        </h1>

        <p className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed mb-4">
          Understand how families find and engage with your listing. Track inquiries, views, and response metrics.
        </p>

        {/* Feature preview pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-lg">
          {["Profile views", "Inquiry tracking", "Response rate", "Monthly trends"].map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-vanilla-50 border border-warm-100 text-gray-700"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Decorative chart preview */}
        <div
          className="flex items-end justify-center gap-2.5 mb-10 h-28 opacity-40"
          style={{ animation: "statsPulse 4s ease-in-out infinite" }}
        >
          {barHeights.map((height, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 sm:w-11 rounded-t-lg bg-gradient-to-t from-primary-400 to-primary-200"
                style={{
                  height: `${height}%`,
                  animation: `statsBarGrow 1s ease-out ${i * 0.1}s both`,
                }}
              />
              <span className="text-[10px] text-gray-400 font-medium">{barLabels[i]}</span>
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
