import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allStates } from "@/data/waiver-library";
import { USMap } from "@/components/waiver-library/USMap";
import { StateSearchProvider } from "@/components/waiver-library/StateSearchContext";
import { HeroStateSearch } from "@/components/waiver-library/HeroStateSearch";

export const metadata: Metadata = {
  title: "Benefits Hub | Olera",
  description:
    "Find HCBS and long-term care Medicaid waivers by state. Explore programs, eligibility requirements, and application steps for seniors and adults with disabilities.",
  alternates: { canonical: "/waiver-library" },
  openGraph: {
    title: "Benefits Hub | Olera",
    description:
      "Find HCBS and long-term care Medicaid waivers by state. Explore programs, eligibility, and application steps.",
    url: "/waiver-library",
    siteName: "Olera",
    type: "website",
  },
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30" />

        {/* Content — pinned to left so it never overlaps the right-side faces */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex items-center min-h-[360px] md:min-h-[420px]">
          <div className="max-w-2xl">
            <h1 className="font-bold leading-tight font-serif text-3xl sm:text-4xl lg:text-5xl">
              Save Up to $10,000<br />on Care
            </h1>
            <p className="mt-1 sm:mt-3 text-base sm:text-lg text-white/80 max-w-md leading-relaxed">
              Check what benefits you qualify for in 2 minutes.<br />Free, no signup required.
            </p>
            <div className="mt-2 flex flex-col gap-4">
              <div>
                <Link
                  href="/benefits/finder"
                  className="inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find My Savings
                </Link>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-6 py-2">
                <p className="text-white/90 text-sm">
                  <span className="font-bold text-white">{totalPrograms} Programs</span>
                  <span className="mx-2 text-white/50">|</span>
                  <span className="font-bold text-white">{allStates.length} States</span>
                  <span className="mx-2 text-white/50">|</span>
                  <span className="font-bold text-primary-300">${totalSavingsM}M</span> Saved
                </p>
              </div>
            </div>
          </div>

          {/* NIH badge — bottom-right of hero */}
          <div className="absolute -bottom-4 right-0 hidden sm:flex items-center gap-2">
            <img
              src="/images/nia-logo.png"
              alt="NIH"
              className="h-8 w-auto brightness-0 invert opacity-90"
            />
            <div className="text-white/90 leading-[1.2]">
              <span className="block text-white/50 text-[10px]">Proudly supported by</span>
              <span className="text-[11px] font-medium">National Institute on Aging</span>
            </div>
          </div>
        </div>
      </section>


      {/* State grid */}
      <section id="states" className="py-4 md:py-6">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-1 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Explore Benefits by State
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              Your state offers free senior care benefits. Find yours below.
            </p>
            <HeroStateSearch />
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
          <USMap states={allStates} />
        </div>

        {/* CTA Banner */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="rounded-2xl bg-white px-6 py-8 md:py-10 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif mb-2">
              See How Much You Could Save on Care
            </h3>
            <p className="text-gray-500 text-base md:text-lg mb-5">
              Free, no signup required. Just a few quick questions.
            </p>
            <Link
              href="/benefits/finder"
              className="group inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
            >
              Find My Savings
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>


    </div>
    </StateSearchProvider>
  );
}
