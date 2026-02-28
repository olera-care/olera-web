"use client";

import Link from "next/link";
import Image from "next/image";

const bentoCards = [
  {
    id: 1,
    title: "Memory Care",
    image: "/images/memory-care.jpg",
    href: "/memory-care",
    className: "col-span-1 md:row-span-2",
  },
  {
    id: 2,
    title: "Home Care",
    image: "/images/home-care.jpg",
    href: "/home-care",
    className: "col-span-1 md:col-span-2 md:row-span-1",
  },
  {
    id: 3,
    title: "Assisted Living",
    image: "/images/assisted-living.jpg",
    href: "/assisted-living",
    className: "col-span-1 md:row-span-2",
  },
  {
    id: 4,
    title: "Skilled Nursing",
    image: "/images/nursing-home.jpg",
    href: "/nursing-home",
    className: "col-span-1",
  },
  {
    id: 5,
    title: "Home Health Care",
    image: "/images/home-health.jpg",
    href: "/home-health-care",
    className: "col-span-1",
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

        {/* Bento Grid - 2 rows, 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[180px] md:auto-rows-[200px]">
          {bentoCards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`relative overflow-hidden rounded-3xl group cursor-pointer ${card.className}`}
              style={{
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)',
              }}
            >
              {/* Image layer */}
              <div className="absolute inset-0">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
                />
              </div>

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 via-transparent to-warm-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>

              {/* Top badge */}
              <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="inline-flex items-center gap-2 bg-white text-gray-900 text-xs font-semibold px-3 py-2 rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  Browse {card.title}
                </span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg md:text-xl lg:text-2xl leading-tight tracking-tight">
                      {card.title}
                    </h3>
                    <div className="h-0.5 bg-primary-400 mt-2 w-0 group-hover:w-full transition-all duration-500 ease-out rounded-full" />
                  </div>

                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-primary-500 group-hover:border-primary-500 transition-all duration-300 group-hover:scale-110">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-white transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Ring on hover */}
              <div className="absolute inset-0 rounded-3xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
