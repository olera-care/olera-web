import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Young Caregiver Community | Olera",
  description:
    "A free, private community for young caregivers. Connect with people who actually get it.",
};

/* Young Caregivers brand palette */
const yc = {
  primary: "#06aeb1",    // teal
  secondary: "#5b80ae",  // periwinkle blue
  accent: "#fcf6b4",     // soft yellow
  neutral: "#fffcf1",    // cream
  dark: "#1a2a3a",       // dark text
};

export default function YoungCaregiversPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      {/* ---- Hero ---- */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: yc.secondary,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-6 pb-6 md:pt-24 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 items-center">
            {/* Left — text */}
            <div className="relative z-10 min-w-0">
              <h1
                className="font-sans font-bold mb-2"
                style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em", textWrap: "balance", color: "#ffffff" } as React.CSSProperties}
              >
                Caregiving before you were ready?
              </h1>
              <p className="text-lg md:text-xl leading-relaxed mb-4" style={{ color: "rgba(255,252,241,0.8)" }}>
                A free, private group chat for young people doing the same. Vent, ask questions, or just talk to people who get it.
              </p>
              <div className="flex items-start">
                <Link
                  href="https://discord.com/invite/R8Mkj5VJsk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center py-3 px-8 rounded-full font-bold text-base active:scale-[0.98] transition-all duration-200 hover:brightness-110"
                  style={{
                    backgroundColor: yc.accent,
                    color: yc.dark,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  Join the community
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: yc.primary, borderColor: yc.secondary }}>
                    <span className="text-white text-xs font-bold">AK</span>
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: yc.accent, borderColor: yc.secondary }}>
                    <span style={{ color: yc.dark }} className="text-xs font-bold">MR</span>
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: "#fff", borderColor: yc.secondary }}>
                    <span style={{ color: yc.secondary }} className="text-xs font-bold">JS</span>
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: yc.primary, borderColor: yc.secondary }}>
                    <span className="text-white text-xs font-bold">TL</span>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,252,241,0.7)" }}>
                  Join <span className="font-bold" style={{ color: yc.accent }}>130+</span> caregivers already in the community
                </p>
              </div>
            </div>
            {/* Right — image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/young-caregiver-hero.webp"
                alt="Young caregiver with her grandmother on the couch"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- About ---- */}
      <section className="py-10 md:py-16" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: yc.primary }}>
            About
          </p>
          <h2 className="font-sans text-2xl md:text-4xl font-bold italic leading-tight mb-6" style={{ color: yc.dark }}>
            You didn&apos;t sign up for this, but you&apos;re showing up anyway.
          </h2>
          <p className="text-xl leading-relaxed max-w-prose" style={{ color: "#5a6a7a" }}>
            Caregiving is hard, and doing it young can feel isolating. Most people your age just aren&apos;t there yet. Here, you don&apos;t have to explain yourself.
          </p>

          {/* What is Discord — accent yellow card */}
          <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: "rgba(91, 128, 174, 0.28)" }}>
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="56" height="56" rx="12" fill="#5865F2" />
                  <path d="M40.12 19.28C38.08 18.28 35.86 17.58 33.52 17.14C33.24 17.68 32.92 18.38 32.7 18.92C30.24 18.52 27.78 18.52 25.38 18.92C25.16 18.38 24.84 17.68 24.56 17.14C22.22 17.58 20 18.28 17.96 19.28C13.72 25.52 12.52 31.62 13.12 37.62C15.84 39.7 18.48 40.92 21.12 41.74C21.74 40.88 22.3 39.98 22.82 39.02C21.92 38.68 21.06 38.26 20.26 37.78C20.5 37.6 20.74 37.42 20.98 37.22C26.2 39.64 31.88 39.64 37.04 37.22C37.28 37.42 37.52 37.6 37.76 37.78C36.96 38.26 36.1 38.68 35.2 39.02C35.72 39.98 36.28 40.88 36.9 41.74C39.54 40.92 42.18 39.7 44.9 37.62C45.56 30.62 43.78 24.58 40.12 19.28ZM23.14 34.36C21.58 34.36 20.3 32.94 20.3 31.18C20.3 29.42 21.54 28 23.14 28C24.74 28 26.02 29.42 25.98 31.18C25.98 32.94 24.74 34.36 23.14 34.36ZM34.88 34.36C33.32 34.36 32.04 32.94 32.04 31.18C32.04 29.42 33.28 28 34.88 28C36.48 28 37.76 29.42 37.72 31.18C37.72 32.94 36.48 34.36 34.88 34.36Z" fill="white" />
                </svg>
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold mb-1" style={{ color: yc.dark }}>
                  What is Discord?
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a5568" }}>
                  A free chat app where the community lives. No one sees your real name unless you want them to. Think of it like a group chat, but organized so you can find the conversations that matter to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Join CTA ---- */}
      <section className="py-12 md:py-16 px-5 sm:px-6 lg:px-8 text-center" style={{ backgroundColor: yc.secondary }}>
          <div className="max-w-2xl mx-auto">
            <p className="text-base font-bold uppercase tracking-widest mb-2" style={{ color: yc.accent }}>
              Ready to join?
            </p>
            <h2 className="font-sans text-3xl md:text-[2.25rem] font-bold italic leading-tight tracking-tight mb-2" style={{ color: "#fff" }}>
              You don&apos;t have to do this alone.
            </h2>
            <p className="text-lg mb-6" style={{ color: "rgba(255,252,241,0.75)" }}>
              Connect with caregivers who understand. No fees, no judgment, just support.
            </p>
            <Link
              href="https://discord.com/invite/R8Mkj5VJsk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-4 px-14 rounded-full font-bold text-lg hover:scale-105 active:scale-[0.98] transition-all duration-200"
              style={{
                backgroundColor: yc.accent,
                color: yc.dark,
                boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              }}
            >
              Find your people &rarr;
            </Link>
          </div>
      </section>


      {/* ---- Explore Care CTA ---- */}
      <section className="py-12 md:py-16" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl py-10 px-6 text-center" style={{ backgroundColor: "rgba(91, 128, 174, 0.08)" }}>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(91, 128, 174, 0.15)" }}>
                <svg className="w-7 h-7" style={{ color: yc.secondary }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: yc.secondary }}>
              Find Care
            </p>
            <h2 className="font-sans text-2xl md:text-3xl font-bold italic leading-tight mb-2" style={{ color: yc.dark }}>
              Need help with care? Explore options near you.
            </h2>
            <p className="text-base mb-6" style={{ color: "#5a6a7a" }}>
              Search thousands of vetted providers in your area.
            </p>
            <form
              action="/browse"
              method="get"
              className="flex items-center justify-center gap-3 max-w-md mx-auto"
            >
              <input
                name="location"
                type="text"
                placeholder="Enter your zip code"
                className="flex-1 h-12 px-5 rounded-full border text-base outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                style={{ borderColor: "rgba(91, 128, 174, 0.28)" }}
              />
              <button
                type="submit"
                className="h-12 px-8 rounded-full text-white font-bold text-base hover:brightness-110 transition-all shadow-sm"
                style={{ backgroundColor: yc.secondary }}
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
