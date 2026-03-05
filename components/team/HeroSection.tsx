"use client";

import { useInView } from "@/hooks/use-in-view";

export default function HeroSection() {
  const { isInView, ref } = useInView(0.2);

  return (
    <section ref={ref} className="pt-24 md:pt-32 pb-12 md:pb-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className={`font-serif text-display-md md:text-display-lg font-bold text-gray-900 tracking-tight transition-all duration-700 ease-out ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          Built by people who understand care
        </h1>
        <p
          className={`mt-5 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto transition-all duration-700 ease-out delay-150 ${
            isInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          Olera was founded to make finding quality senior care less
          overwhelming and more human. We&apos;re a small team with a clear
          mission — connect families with the right care, faster.
        </p>
      </div>
    </section>
  );
}
