"use client";

import Link from "next/link";
import Image from "next/image";

const careCards = [
  {
    title: "Memory Care",
    image: "/images/memory-care.jpg",
    href: "/memory-care",
  },
  {
    title: "Home Care",
    image: "/images/home-care.jpg",
    href: "/home-care",
  },
  {
    title: "Assisted Living",
    image: "/images/assisted-living.jpg",
    href: "/assisted-living",
  },
  {
    title: "Skilled Nursing",
    image: "/images/nursing-home.jpg",
    href: "/nursing-home",
  },
  {
    title: "Home Health Care",
    image: "/images/home-health.jpg",
    href: "/home-health-care",
  },
];

export default function ExploreCareSection() {
  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Explore Care Options
          </h2>
        </div>

        {/* Uniform grid — 2 cols mobile, 3 cols md+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {careCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="relative overflow-hidden rounded-2xl group aspect-[4/3] shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Label + arrow */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex items-end justify-between">
                <h3 className="text-white font-bold text-base md:text-lg leading-tight">
                  {card.title}
                </h3>
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/25 transition-colors duration-300">
                  <svg
                    className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
