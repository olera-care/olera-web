import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allStates } from "@/data/waiver-library";
import { USMap } from "@/components/waiver-library/USMap";
import { StateSearchProvider } from "@/components/waiver-library/StateSearchContext";
import { HeroStateSearch } from "@/components/waiver-library/HeroStateSearch";

export const metadata: Metadata = {
  title: "Waiver Library | Olera",
  description:
    "Find HCBS and long-term care Medicaid waivers by state. Explore programs, eligibility requirements, and application steps for seniors and adults with disabilities.",
};

function parseSavingsAvg(s: string): number {
  const m = s.match(/\$([\d,]+)/g);
  if (!m) return 0;
  const nums = m.map((v) => Number(v.replace(/[$,]/g, "")));
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function WaiverLibraryPage() {
  const totalPrograms = allStates.reduce((s, st) => s + st.programs.length, 0);
  const totalSavingsM = Math.round(
    allStates.reduce(
      (s, st) => s + st.programs.reduce((ps, p) => ps + parseSavingsAvg(p.savingsRange), 0),
      0
    ) / 1_000_000
  );
  return (
    <StateSearchProvider>
    <div className="bg-vanilla-100 min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[360px] md:min-h-[420px] text-white overflow-hidden">
        {/* Full-bleed background image */}
        <Image
          src="/waiver-hero-v4.avif"
          alt="Caregiver with elderly woman"
          fill
          className="object-cover"
          style={{ objectPosition: "center 20%" }}
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content — pinned to left so it never overlaps the right-side faces */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex items-center min-h-[360px] md:min-h-[420px]">
          <div className="max-w-xl">
            <h1 className="font-bold leading-tight font-display">
              <span className="block text-4xl md:text-5xl lg:text-6xl">Save up to $10,000</span>
              <span className="block text-4xl md:text-5xl lg:text-6xl">a Year</span>
              <span className="block text-xl md:text-2xl lg:text-3xl text-primary-300 mt-1">in Senior Care Benefits</span>
            </h1>
            <p className="mt-3 text-lg md:text-xl text-gray-200">
              Check what you qualify for in 2 minutes. Free, no signup required.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <div>
                <Link
                  href="/benefits/finder"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-white font-semibold rounded-xl border border-primary-700/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-2px_3px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-2px_3px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-0 transition-all duration-150"
                  style={{ background: "linear-gradient(to bottom, #22a3c3, #0e7490)" }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Check My Benefits
                </Link>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-6 py-2">
                <p className="text-white/90 text-sm">
                  <span className="font-bold text-white">{totalPrograms} programs</span> across{" "}
                  <span className="font-bold text-white">{allStates.length} states</span>.{" "}
                  Over <span className="font-bold text-primary-300">${totalSavingsM}M</span> in potential savings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NIH badge — bottom of hero */}
        <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
          <div className="pr-4 sm:pr-6 lg:pr-8 pb-6">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 pointer-events-auto">
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


      {/* State grid */}
      <section id="states" className="py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-1 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Explore Benefits by State
            </h2>
            <p className="mt-1 text-gray-600">
              Click your state to see available programs and estimated savings.
            </p>
            <HeroStateSearch />
          </div>

          <USMap states={allStates} />
        </div>
      </section>


    </div>
    </StateSearchProvider>
  );
}
