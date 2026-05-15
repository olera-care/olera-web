"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Check, PartyPopper } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Lazy-init Supabase client to avoid build-time errors when env vars aren't available
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwMhSMivX1hSUhz9YzpeIOmFXPmZ1S-0ennboWyiw4KQFAyfBFYtFL1djdSYsot5EA/exec";

async function sendToGoogleSheet(email: string) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Silent fail — Supabase is the primary store
  }
}

/* ──────────────────────── Confetti ──────────────────────── */

function Confetti() {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; size: number; rotation: number }>>([]);

  useEffect(() => {
    const colors = ["#7bb8d0", "#a0cde0", "#b8d8e8", "#5a9bb5", "#3d8ba8", "#d4ecf4", "#93c5d6"];
    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[confettiFall_var(--dur)_ease-out_var(--delay)_forwards]"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            "--delay": `${p.delay}s`,
            "--dur": `${p.duration}s`,
            opacity: 0,
          } as React.CSSProperties}
        >
          <div
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: "2px",
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────── Nav ──────────────────────────── */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 lg:px-12 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/olera-logo.svg" alt="Olera" width={100} height={28} className="h-7 w-auto" />
        </Link>
      </div>
    </nav>
  );
}

/* ──────────────────────────── Hero ──────────────────────────── */

function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");

    const { error: dbError } = await getSupabase()
      .from("care_shifts_waitlist")
      .insert({ email: email.trim().toLowerCase() });

    if (dbError) {
      if (dbError.code === "23505") {
        // Duplicate — still show success, they're already in
        setSubmitted(true);
        return;
      }
      setError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
    window.fbq?.("track", "Lead");
    sendToGoogleSheet(email.trim().toLowerCase());
  };

  return (
    <section className="relative min-h-[55vh] md:min-h-[60vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/care-shifts-hero.jpg" alt="" fill className="object-cover object-[center_35%]" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
      </div>

      <div className="relative w-full mx-auto max-w-7xl px-6 lg:px-12 pb-16 md:pb-24">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-primary-300 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20 mb-6">Launching Soon in Texas</span>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05]">
            Worried about leaving Mom home alone?
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl">
            Affordable in-home care from nursing and medical students.
          </p>

          {submitted ? (
            <>
            <Confetti />
            <div className="mt-8 bg-white rounded-2xl p-6 max-w-md text-center animate-[fadeIn_0.4s_ease-out]">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-primary-500" strokeWidth={2.5} />
              </div>
              <p className="font-display text-2xl text-gray-900">You&apos;re in!</p>
              <p className="text-sm text-gray-500 mt-2">
                Welcome to the founding group. We&apos;ll email you first when we launch in Texas.
              </p>
            </div>
            </>
          ) : (
            <div className="mt-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-5 py-3.5 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-base"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-base font-bold px-8 py-3.5 transition-colors cursor-pointer shadow-lg shadow-primary-500/30"
                >
                  Join the Waitlist →
                </button>
              </form>
              <p className="mt-3 text-sm text-white/60">
                Launching in Texas this summer · Founding members get priority matching &amp; pricing
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── Trust Stats ──────────────────────── */

function TrustStats() {
  return (
    <section className="py-10 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="font-display text-2xl text-gray-900">$15/hr</p>
            <p className="text-sm text-gray-500">Half the cost of traditional agencies</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.54 23.54 0 0 0-2.688 6.352c5.357 1.39 10.96 1.39 16.318 0a23.54 23.54 0 0 0-2.688-6.352m-10.942 0L12 3l4.971 7.147M12 3v7.147" />
              </svg>
            </div>
            <p className="font-display text-2xl text-gray-900">10+ Schools</p>
            <p className="text-sm text-gray-500">Texas nursing &amp; medical programs</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <p className="font-display text-2xl text-gray-900">100% Vetted</p>
            <p className="text-sm text-gray-500">Background-checked &amp; CPR-trained</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── The Approach ──────────────────────── */

function TheApproach() {
  return (
    <section id="approach" className="py-10 md:py-14 bg-[#f8f7f4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary-600 mb-6">The Approach</p>
        <h2 className="font-display text-3xl md:text-4xl text-gray-900 tracking-tight leading-tight max-w-2xl flex items-center gap-3">
          Quality care shouldn&apos;t cost a fortune
          <svg className="w-8 h-8 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </h2>
        <p className="mt-4 text-base text-gray-500 max-w-xl">
          Agencies charge $30–50/hr. Our caregivers are nursing and medical students who charge half that.
        </p>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl p-8">
            <p className="font-display text-5xl text-primary-300 leading-none mb-5">01</p>
            <h3 className="font-display text-2xl text-gray-900 mb-3">Rates you can afford</h3>
            <p className="text-base text-gray-500 leading-relaxed">
              Starting at $15/hr. Half what an agency charges. No contracts, no minimums, no hidden fees.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl p-8">
            <p className="font-display text-5xl text-primary-300 leading-none mb-5">02</p>
            <h3 className="font-display text-2xl text-gray-900 mb-3">Trained, not just willing</h3>
            <p className="text-base text-gray-500 leading-relaxed">
              Your caregiver is studying to be a nurse or doctor. They notice the things a sitter would miss.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl p-8">
            <p className="font-display text-5xl text-primary-300 leading-none mb-5">03</p>
            <h3 className="font-display text-2xl text-gray-900 mb-3">Peace of mind, built in</h3>
            <p className="text-base text-gray-500 leading-relaxed">
              Background-checked. ID-verified. Photo updates during every visit so you always know she&apos;s okay.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Meet the Students ──────────────────── */

const STUDENTS = [
  {
    name: "Joshua S.",
    school: "Texas A&M",
    program: "Pre-Med",
    hours: 180,
    photo: "/images/medjobs/student-joshua.jpg",
  },
  {
    name: "Natasha J.",
    school: "University of Michigan",
    program: "Pre-PA",
    hours: 312,
    photo: "/images/medjobs/student-natasha.jpg",
  },
  {
    name: "Emma N.",
    school: "Texas A&M",
    program: "Pre-Nursing",
    hours: 456,
    photo: "/images/medjobs/student-emma.jpg",
  },
];

function MeetTheStudents() {
  return (
    <section className="pt-8 pb-10 md:pt-10 md:pb-12 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary-600 mb-4">Meet the Students</p>
          <h2 className="font-display text-3xl md:text-4xl text-gray-900 tracking-tight leading-tight">
            Future doctors. Future nurses.<br />Current caregivers.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STUDENTS.map((s) => (
            <div key={s.name}>
              <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={s.photo}
                  alt={s.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="mt-5">
                <h3 className="font-display text-xl text-gray-900">{s.name}</h3>
                <p className="text-base text-gray-500 mt-1">{s.school} &middot; {s.program}</p>
                <p className="text-sm font-semibold text-primary-600 mt-1">{s.hours} hrs verified</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── The Care Gap (Pull Quote) ──────────────────── */

function TheCareGap() {
  return (
    <section className="py-10 md:py-14 bg-[#f8f7f4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Quote side — white card */}
          <div className="relative bg-white rounded-2xl p-8 md:p-10">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary-600 mb-6">The Problem</p>

            <blockquote className="relative font-display text-2xl sm:text-3xl text-gray-900 tracking-tight leading-[1.2] italic pl-10">
              {/* Big decorative quote mark */}
              <span className="absolute -top-2 left-0 font-display text-[80px] leading-none text-primary-200/50 select-none pointer-events-none" aria-hidden="true">
                &ldquo;
              </span>
              1 in 4 Texas families spend over $3,000 a month on home care. Most don&apos;t qualify for Medicaid. Most can&apos;t afford an agency.
            </blockquote>

            <p className="mt-5 text-xs font-semibold tracking-[0.15em] uppercase text-gray-400">
              Genworth Cost of Care Survey, 2025
            </p>

            <p className="mt-6 text-base text-gray-500 leading-relaxed">
              In conversations with Texas families, the same theme comes up: agencies are too expensive, but they don&apos;t know who else to trust. That&apos;s why we&apos;re building Olera.
            </p>
          </div>

          {/* Photo side */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-200">
            <Image
              src="/images/memory-care.jpg"
              alt="Elderly person at home"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────── Cost Comparison ──────────────────── */

function CostComparison() {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary-600 mb-4">The Comparison</p>
          <h2 className="font-display text-3xl md:text-4xl text-gray-900 tracking-tight leading-tight">
            Why families are switching to <span className="text-primary-600">Olera</span>
          </h2>
          <p className="mt-2 text-base text-gray-500">Same quality care. Half the price. Zero contracts.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Traditional */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-gray-300 cursor-default">
            <h3 className="text-sm font-semibold tracking-[0.15em] uppercase text-gray-400 mb-6">Traditional Agency</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-1">Hourly rate</p>
                <p className="font-display text-2xl text-gray-900">$35–50/hr</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly (20hrs/week)</p>
                <p className="font-display text-2xl text-gray-900">$3,000–$4,300</p>
              </div>
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <p className="text-sm text-gray-400 flex items-start gap-2.5">
                  <span className="text-gray-300 mt-0.5">&times;</span>
                  Minimum visit hours (often 4+)
                </p>
                <p className="text-sm text-gray-400 flex items-start gap-2.5">
                  <span className="text-gray-300 mt-0.5">&times;</span>
                  Assigned caregiver (no choice)
                </p>
                <p className="text-sm text-gray-400 flex items-start gap-2.5">
                  <span className="text-gray-300 mt-0.5">&times;</span>
                  Limited visibility during visits
                </p>
              </div>
            </div>
          </div>

          {/* Olera — prominent */}
          <div className="rounded-2xl border-2 border-primary-500 bg-white p-8 shadow-lg relative transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl cursor-default">
            <span className="absolute -top-3 left-8 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Save up to 50%</span>
            <h3 className="text-sm font-semibold tracking-[0.15em] uppercase text-primary-600 mb-6">Olera</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-1">Hourly rate</p>
                <p className="font-display text-2xl text-primary-700">$15–30/hr</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly (20hrs/week)</p>
                <p className="font-display text-2xl text-primary-700">$1,300–$2,600</p>
              </div>
              <div className="border-t border-primary-100 pt-5 space-y-3">
                <p className="text-sm text-gray-700 flex items-start gap-2.5">
                  <span className="text-primary-600 mt-0.5">&#10003;</span>
                  No contracts, book as needed
                </p>
                <p className="text-sm text-gray-700 flex items-start gap-2.5">
                  <span className="text-primary-600 mt-0.5">&#10003;</span>
                  Choose your caregiver from verified profiles
                </p>
                <p className="text-sm text-gray-700 flex items-start gap-2.5">
                  <span className="text-primary-600 mt-0.5">&#10003;</span>
                  Photo updates during every visit
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-gray-400 max-w-2xl">
          Agency rates based on US home care industry averages. Olera rates vary by caregiver experience and service type. Comparisons assume 20 hours of care per week.
        </p>
      </div>
    </section>
  );
}



/* ──────────────────── Bottom Waitlist CTA ──────────────────── */

function BottomCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const { error: dbError } = await getSupabase()
      .from("care_shifts_waitlist")
      .insert({ email: email.trim().toLowerCase() });

    if (dbError && dbError.code !== "23505") return;
    setSubmitted(true);
    window.fbq?.("track", "Lead");
    sendToGoogleSheet(email.trim().toLowerCase());
  };

  return (
    <section className="py-8 md:py-12 bg-[#f8f7f4]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 px-8 py-10 md:px-12 md:py-12 text-center shadow-sm">
            <h2 className="font-display text-3xl md:text-4xl text-gray-900 tracking-tight leading-tight">
              Start saving on care.
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Be one of the first 100 Texas families. Founding members get priority matching and locked-in pricing.
            </p>

            {submitted ? (
              <div className="mt-8 inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-700" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-semibold text-gray-900">You&apos;re on the list.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-5 py-3.5 rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base shadow-sm"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-base cursor-pointer shadow-md shadow-primary-600/20"
                >
                  Join Waitlist →
                </button>
              </form>
            )}

            <p className="mt-3 text-xs text-gray-400">No spam. Just a heads up when we launch.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Footer ──────────────────────────── */

function Footer() {
  return (
    <footer className="bg-white text-gray-400 py-12 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-900 font-display text-xl">Olera</span>
            <span className="text-sm text-gray-400">Affordable care in Texas.</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} Olera. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function CareShiftsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Meta Pixel */}
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1517421710074612');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1517421710074612&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      <main className="flex-grow">
        <Hero />
        <TrustStats />
        <MeetTheStudents />
        <BottomCta />
        <TheApproach />
        <CostComparison />
        <TheCareGap />
      </main>
      <Footer />
    </div>
  );
}
