import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allStates } from "@/data/waiver-library";
import { USMap } from "@/components/waiver-library/USMap";
import { StatePickerCard } from "@/components/waiver-library/StatePickerCard";

export const metadata: Metadata = {
  title: "Waiver Library | Olera",
  description:
    "Find HCBS and long-term care Medicaid waivers by state. Explore programs, eligibility requirements, and application steps for seniors and adults with disabilities.",
};

export default function WaiverLibraryPage() {
  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[480px] md:min-h-[540px] text-white overflow-hidden">
        {/* Full-bleed background image */}
        <Image
          src="/waiver-hero-v3.png"
          alt="Caregiver with elderly woman"
          fill
          className="object-cover"
          style={{ objectPosition: "70% 60%" }}
          priority
        />
        {/* Dark overlay — strong on left for text, light on right to keep faces clear */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 via-35% to-transparent" />

        {/* Content — pinned to left so it never overlaps the right-side faces */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex items-center min-h-[480px] md:min-h-[540px]">
          <div className="max-w-xl">
            <h1 className="font-bold leading-tight">
              <span className="block text-3xl md:text-4xl lg:text-5xl">Save $10,000 a Year</span>
              <span className="block text-xl md:text-2xl lg:text-3xl text-primary-300 mt-2">in Senior Care Benefits</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-200">
              Check what you qualify for in 2 minutes. Free, no signup required.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
              >
                Check My Benefits
              </Link>
              <a
                href="#states"
                className="inline-flex items-center gap-2 text-white font-semibold hover:text-primary-200 transition-colors"
              >
                Browse by State
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* NIH badge — bottom of hero */}
        <div className="absolute bottom-0 inset-x-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex justify-end">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3">
              {/* NIH logo */}
              <div className="flex items-center justify-center w-12 h-12 border-2 border-white rounded-md">
                <span className="text-white font-bold text-sm tracking-wide">NIH</span>
                <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 17l6-5-6-5v10z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs">Proudly supported by</p>
                <p className="text-white font-semibold text-sm">National Institute on Aging</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Check Your Eligibility",
                description:
                  "Click here to instantly see which care benefits you qualify for and start your application today.",
                cta: "Check my benefits",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                href: "/benefits/finder",
              },
              {
                title: "Browse Care Benefits by State",
                description:
                  "Quickly see which programs and waivers are available where you live.",
                cta: "View your state\u2019s programs",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
                href: "#states",
              },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group p-6 rounded-2xl bg-white border border-gray-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                <span className="mt-auto text-sm font-semibold text-primary-600 group-hover:text-primary-700 inline-flex items-center gap-1">
                  {item.cta} <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            ))}
            <StatePickerCard />
          </div>
        </div>
      </section>

      {/* State grid */}
      <section id="states" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Browse by State
            </h2>
            <p className="mt-2 text-gray-600">
              Click your state to see available programs and estimated savings.
            </p>
          </div>

          <USMap states={allStates} />
        </div>
      </section>


    </div>
  );
}
