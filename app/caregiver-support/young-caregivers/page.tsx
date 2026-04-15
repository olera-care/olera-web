import type { Metadata } from "next";
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
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            {/* Left — text */}
            <div className="relative z-10">
              <h1
                className="font-sans text-[2.5rem] md:text-[3.5rem] font-bold italic leading-[1.1] tracking-tight mb-4"
                style={{ color: "#ffffff" }}
              >
                Finally. People who actually get it.
              </h1>
              <p className="text-lg md:text-xl leading-relaxed mb-6 whitespace-nowrap" style={{ color: "rgba(255,252,241,0.8)" }}>
                A free, private space where you don&apos;t have to explain yourself.
              </p>
              <div className="flex items-start">
                <Link
                  href="https://discord.com/invite/R8Mkj5VJsk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-[56px] px-10 rounded-full font-bold text-base active:translate-y-[1px] transition-all duration-200 hover:brightness-110"
                  style={{
                    backgroundColor: yc.accent,
                    color: yc.dark,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  Join the community
                </Link>
              </div>
              <div className="mt-5 flex items-center gap-3">
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
              <img
                src="/images/young-caregiver-hero.png"
                alt="Young caregiver with her grandmother on the couch"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- About ---- */}
      <section className="py-6 md:py-8" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
            {/* Left — About copy */}
            <div>
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: yc.primary }}>
                About
              </p>
              <h2 className="font-sans text-3xl md:text-4xl font-bold italic leading-tight mb-6" style={{ color: yc.dark }}>
                You didn&apos;t sign up for this, but you&apos;re showing up anyway.
              </h2>
              <div className="space-y-4">
                <p className="text-xl leading-relaxed" style={{ color: "#5a6a7a" }}>
                  Caregiving is hard. Doing it young can feel especially isolating
                  when most people around you aren&apos;t there yet, and it&apos;s
                  difficult to explain what it&apos;s actually like.
                </p>
                <p className="text-xl leading-relaxed" style={{ color: "#5a6a7a" }}>
                  A free, private space to connect with others who get it, ask
                  questions, vent, and find resources that actually help.
                </p>
                <span
                  className="inline-block px-5 py-2 rounded-full text-lg font-bold italic whitespace-nowrap"
                  style={{ backgroundColor: "rgba(91, 128, 174, 0.12)", color: yc.secondary }}
                >
                  No fees. No sales. Just people who understand.
                </span>
              </div>
            </div>

            {/* Right — Discord mockup (light theme) */}
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ boxShadow: "0px 8px 24px -4px rgba(16, 24, 40, 0.12), 0px 20px 48px -8px rgba(16, 24, 40, 0.08)" }}>
              <div className="flex">
                {/* Sidebar */}
                <div className="hidden sm:block w-36 flex-shrink-0" style={{ backgroundColor: "#F2F3F5" }}>
                  <div className="px-3 py-3 border-b" style={{ borderColor: "#E3E5E8" }}>
                    <p className="text-sm font-bold" style={{ color: "#060607" }}>Young Caregivers</p>
                  </div>
                  <div className="px-2 py-3 space-y-3 text-xs" style={{ color: "#5C5E66" }}>
                    <div>
                      <p className="px-1 mb-1 font-bold uppercase text-[10px] tracking-wide" style={{ color: "#5C5E66" }}>Text Channels</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: "#E3E5E8", color: "#060607" }}>
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span className="font-medium">general-support</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>👋 introductions</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>events</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>🗣️ vent</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="px-1 mb-1 font-bold uppercase text-[10px] tracking-wide" style={{ color: "#5C5E66" }}>Conditions</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>💜 alzheimers</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="px-1 mb-1 font-bold uppercase text-[10px] tracking-wide" style={{ color: "#5C5E66" }}>Resources</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>resources</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="px-1 mb-1 font-bold uppercase text-[10px] tracking-wide" style={{ color: "#5C5E66" }}>Community</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>social</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1">
                          <span style={{ color: "#6D6F78" }}>#</span>
                          <span>gratitude</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 bg-white">
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: "#E3E5E8" }}>
                    <span style={{ color: "#6D6F78" }}>#</span>
                    <span className="text-sm font-semibold" style={{ color: "#060607" }}>general-support</span>
                    <span className="hidden sm:inline text-xs ml-1" style={{ color: "#80848E" }}>A place to vent, ask, and just talk</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: yc.secondary }}>
                        <span className="text-white text-xs font-bold">JR</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#060607" }}>Jordan</span>
                          <span className="text-[10px]" style={{ color: "#80848E" }}>Today at 2:34 PM</span>
                        </div>
                        <p className="text-sm leading-relaxed mt-0.5" style={{ color: "#313338" }}>
                          My mom&apos;s not eating. Does anyone have any advice? I&apos;m really frustrated.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 animate-[fadeIn_0.5s_ease-out_2s_both]">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: yc.primary }}>
                        <span className="text-white text-xs font-bold">SK</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#060607" }}>Sam</span>
                          <span className="text-[10px]" style={{ color: "#80848E" }}>Today at 2:36 PM</span>
                        </div>
                        <p className="text-sm leading-relaxed mt-0.5" style={{ color: "#313338" }}>
                          Have you tried smaller meals throughout the day instead of big ones? That helped a lot with my dad.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 animate-[fadeIn_0.5s_ease-out_3.5s_both]">
                      <div className="w-7 h-7 rounded-full bg-[#EB459E] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">MP</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#060607" }}>Maya</span>
                          <span className="text-[10px]" style={{ color: "#80848E" }}>Today at 2:38 PM</span>
                        </div>
                        <p className="text-sm leading-relaxed mt-0.5" style={{ color: "#313338" }}>
                          Also, sensory stuff can help — my mom responds really well to textured foods now. You&apos;re not alone in this. 💛
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <div className="rounded-lg px-4 py-2.5 flex items-center" style={{ backgroundColor: "#EBEDEF" }}>
                      <span className="text-sm" style={{ color: "#6D6F78" }}>Message #general-support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  Discord is a free app where you can chat anonymously with other
                  members, ask questions, vent, share advice, and just talk to people
                  who get it. No one sees your real name unless you want them to. Think
                  of it like a group chat, but organized so you can find the
                  conversations that matter to you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Join CTA ---- */}
      <section className="py-4 md:py-6">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl py-8 md:py-10 px-6 text-center" style={{ backgroundColor: yc.secondary }}>
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
            className="inline-flex items-center justify-center min-h-[64px] px-14 rounded-full font-bold text-lg hover:scale-105 active:scale-100 transition-all duration-200"
            style={{
              backgroundColor: yc.accent,
              color: yc.dark,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            }}
          >
            Find your people &rarr;
          </Link>
          </div>
        </div>
      </section>

      {/* ---- What's Included ---- */}
      <section className="py-6 md:py-8" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="mb-8 md:mb-10">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: yc.primary }}>
              What&apos;s Included
            </p>
            <h2 className="font-sans text-2xl md:text-3xl font-bold italic leading-tight" style={{ color: yc.dark }}>
              Built around what caregivers actually need.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: "#fff", border: "2px solid rgba(91, 128, 174, 0.28)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(91, 128, 174, 0.28)" }}>
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="font-sans text-xl font-bold mb-2" style={{ color: yc.dark }}>
                A community that understands
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "#5a6a7a" }}>
                Young caregivers who know what you&apos;re going through and are
                facing the same struggles.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: "#fff", border: "2px solid rgba(91, 128, 174, 0.28)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(91, 128, 174, 0.28)" }}>
                <span className="text-4xl">🗓</span>
              </div>
              <h3 className="font-sans text-xl font-bold mb-2" style={{ color: yc.dark }}>
                Virtual meetups
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "#5a6a7a" }}>
                Low-pressure video hangouts. No agenda, just real conversation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: "#fff", border: "2px solid rgba(91, 128, 174, 0.28)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(91, 128, 174, 0.28)" }}>
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="font-sans text-xl font-bold mb-2" style={{ color: yc.dark }}>
                Free resources, shared by the community
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "#5a6a7a" }}>
                Guides, tools, and expert advice from Olera, all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Explore Care CTA ---- */}
      <section className="py-8 md:py-10" style={{ backgroundColor: "#ffffff" }}>
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
