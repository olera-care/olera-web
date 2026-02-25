"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Testimonial {
  quote: string;
  name: string;
  initials: string;
  role: string;
  location: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  intervalMs?: number;
}

export default function TestimonialCarousel({
  testimonials,
  intervalMs = 5000,
}: TestimonialCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPaused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!isPaused.current) {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [testimonials.length, intervalMs]);

  const goTo = useCallback((index: number) => setActiveIndex(index), []);

  const prev = useCallback(
    () => setActiveIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1)),
    [testimonials.length],
  );

  const next = useCallback(
    () => setActiveIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1)),
    [testimonials.length],
  );

  return (
    <section className="bg-vanilla-50 border-y border-warm-100/60 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
          What providers on Pro are saying
        </h2>

        <div
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; }}
        >
          {/* Stacked testimonials with fade crossfade */}
          <div className="relative">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`transition-opacity duration-500 ease-in-out ${
                  i === activeIndex
                    ? "opacity-100 relative"
                    : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
                aria-hidden={i !== activeIndex}
              >
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-8 py-8">
                  <div className="flex gap-5">
                    <div className="w-[3px] shrink-0 rounded-full bg-primary-400" />
                    <div>
                      <p className="text-lg sm:text-xl font-display text-gray-900 leading-relaxed italic">
                        {t.quote}
                      </p>
                      <div className="flex items-center gap-3 mt-6">
                        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary-700">
                            {t.initials}
                          </span>
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900">{t.name}</p>
                          <p className="text-sm text-gray-500">
                            {t.role} &middot; {t.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation: arrows + dots */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={prev}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-colors"
              aria-label="Previous testimonial"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-6 h-2 bg-primary-400"
                      : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white hover:border-gray-300 transition-colors"
              aria-label="Next testimonial"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
