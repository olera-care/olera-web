"use client";

import { useState } from "react";
import Image from "next/image";
import DiningCarousel from "@/components/providers/DiningCarousel";

/* ────────────────────────────────────────────
   MorningStar Assisted Living & Memory Care
   at West San Jose — AL template
   ──────────────────────────────────────────── */

/* ── Icons ── */
const ICON_PERSON = (
  <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const ICON_STETHOSCOPE = (
  <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const ICON_SHIELD = (
  <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const ICON_MED = (
  <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);
const ICON_CLIPBOARD = (
  <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
  </svg>
);
const ICON_PIN = (
  <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

/* ── Primitives ── */

const CHECK = (
  <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
    <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

function TwoCol({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2.5">
          {CHECK}
          <span className="text-[15px] text-gray-700">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ThreeCol({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-2.5">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2.5">
          {CHECK}
          <span className="text-[15px] text-gray-700">{item}</span>
        </div>
      ))}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return <span className="text-xs text-gray-400 italic">[{label}]</span>;
}

function Expander({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-4 pt-0">{children}</div>}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-[15px] font-semibold text-gray-900 pr-4">{q}</span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="text-[15px] text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}


/* ══════════════════════════════════════════════
   ABOUT — rendered separately so Reviews + Q&A
   can be injected between About and the rest
   ══════════════════════════════════════════════ */
export function MorningStarAbout() {
  return (
    <div className="py-8 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-2xl font-bold text-gray-900 font-display">About MorningStar at West San Jose</h2>
        <div className="flex items-center gap-2">
          <a href="https://www.facebook.com/morningstarseniorliving" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Facebook">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          </a>
          <a href="https://www.instagram.com/morningstar.seniorliving" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Instagram">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
          </a>
          <a href="https://www.morningstarseniorliving.com/communities/assisted-living-san-jose-west-san-jose/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors" aria-label="Website">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
          </a>
        </div>
      </div>
      <p className="text-[15px] text-gray-600 leading-relaxed max-w-2xl">
        MorningStar at West San Jose is a four-story assisted living and memory care community at 1380 South De Anza Blvd, serving families across Silicon Valley. The community offers 69 assisted living suites and 34 dedicated memory care suites in its Reflections Neighborhood. On-site clinical partnerships with physical therapy, occupational therapy, home health, hospice, and rounding physicians mean residents can age in place rather than face another disruptive move.
      </p>
    </div>
  );
}


/* ══════════════════════════════════════════════
   MAIN CONTENT — Pricing, Care, Safety, Memory
   Care, Neighborhood (matching Emerald nav order)
   ══════════════════════════════════════════════ */
export default function MorningStarContent() {
  return (
    <div>

      {/* ═══════════════════════════════════════
          1. PRICING  (nav-linked: id="pricing")
          Matches Emerald's Pricing pattern
          ═══════════════════════════════════════ */}
      <div id="pricing" className="scroll-mt-20 py-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Pricing</h2>
        <p className="text-sm text-gray-500 mb-5">Total monthly costs depend on apartment size and the level of care needed.</p>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Rate cards */}
          <div className="divide-y divide-gray-100">
            {[
              { type: "Studio", price: "$5,466" },
              { type: "1 Bedroom", price: "$6,800" },
              { type: "2 Bedroom", price: "$8,341" },
              { type: "Memory Care (Private)", price: "$8,500+" },
            ].map((row) => (
              <div key={row.type} className="flex items-center justify-between bg-blue-50/60 py-4 px-5">
                <span className="text-base font-semibold text-gray-900">{row.type}</span>
                <span className="text-base text-gray-700 text-right">Starting at <span className="font-bold text-gray-900">{row.price}</span><span className="font-normal text-gray-500">/mo</span></span>
              </div>
            ))}
          </div>

          {/* Additional info — prose */}
          <div className="bg-white px-5 py-5 space-y-4">
            <div>
              <Expander label="Care tier add-ons (click to expand)">
                <div className="space-y-3 pt-1">
                  {[
                    { tier: "Level 1: Minimal assistance", desc: "Medication reminders, light ADL help", est: "+$500-800/mo" },
                    { tier: "Level 2: Moderate assistance", desc: "Daily bathing/dressing, medication administration", est: "+$1,000-1,500/mo" },
                    { tier: "Level 3: Extensive assistance", desc: "Two-person transfers, incontinence care", est: "+$1,800-2,500/mo" },
                    { tier: "Level 4: Comprehensive care", desc: "Full ADL support, behavioral management", est: "+$3,000+/mo" },
                  ].map((t) => (
                    <div key={t.tier}>
                      <p className="text-sm font-semibold text-gray-900">{t.tier}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                      <p className="text-xs text-teal-700 font-medium mt-0.5">{t.est} <Placeholder label="confirm tier names and rates" /></p>
                    </div>
                  ))}
                </div>
              </Expander>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              A one-time community fee (typically one month&apos;s rent) is due at move-in. Couples sharing a suite pay a second-person fee. Medication management is included in the care tier. Respite and short-term stays are available and priced daily.
            </p>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                <svg className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Accepted payment methods
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                {[
                  "Private Pay (savings, retirement funds)",
                  "Long-Term Care Insurance",
                  "VA Aid & Attendance Benefits",
                  "CA Assisted Living Waiver (ALW)",
                  "Home Equity / Bridge Loans",
                  "Medicare (on-site skilled services only)",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    {CHECK}
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Medicare covers PT, OT, and home health but not room and board.</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">*Prices are estimates based on publicly available data. Contact MorningStar directly for a personalized quote.</p>
      </div>

      {/* ═══════════════════════════════════════
          2. CARE  (nav-linked: id="care")
          Matches Emerald's Dining pattern:
          heading + description + carousel + checklist
          ═══════════════════════════════════════ */}
      <div id="care" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Care Services</h2>
        <p className="text-base text-gray-600 mb-5">Care at MorningStar is built around a personalized care plan developed after a comprehensive assessment. On-site clinical partnerships mean residents receive physical therapy, occupational therapy, home health, hospice, and physician visits without leaving the building.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            "Personalized care plan after comprehensive assessment",
            "On-site physical therapy, occupational therapy, and home health",
            "Medication management by trained technicians",
            "Hospice and end-of-life care available in place",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 py-3 px-4">
              {CHECK}
              <span className="text-base text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-200">

          {/* Dining */}
          <div className="py-8 first:pt-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M16.5 8.25V6.75a3 3 0 00-3-3h-3a3 3 0 00-3 3v1.5" /></svg>
              Dining &amp; Nutrition
            </h3>
            <p className="text-base text-gray-600 mb-5 max-w-2xl">MorningStar&apos;s executive chef designs seasonal menus using locally sourced ingredients. Meals are served restaurant-style with flexible hours and a Resident Food Council for feedback.</p>
            <div className="mb-6">
              <DiningCarousel images={[
                { src: "/providers/morningstar-west-san-jose/dining/bistro.png", alt: "Bistro and Bar dining area" },
                { src: "/providers/morningstar-west-san-jose/bistro.png", alt: "Bistro seating" },
                { src: "/providers/morningstar-west-san-jose/theatre.png", alt: "Community theatre and gathering space" },
                { src: "/providers/morningstar-west-san-jose/art-studio.png", alt: "Art studio and activities" },
              ]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
              {[
                "Three chef-prepared meals daily",
                "All-day dining in the Bistro + Bar",
                "Seasonal menus, locally sourced",
                "Pureed and mechanical soft diets",
                "Thickened liquids prepared on-site",
                "Diabetic and low-sodium plans",
                "Eating assistance available",
                "Tray service for those unable to come to dining",
                "Snacks and beverages throughout the day",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  {CHECK}
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          2b. STAFFING  (nav-linked: id="staffing")
          ═══════════════════════════════════════ */}
      <div id="staffing" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Staffing</h2>
        <p className="text-base text-gray-600 mb-5">MorningStar maintains 24/7 awake staff across both assisted living and memory care, with dedicated caregivers trained for each level of need.</p>

        {/* 24/7 callout */}
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-5 py-4 mb-6 flex items-start gap-3">
          {ICON_SHIELD}
          <div>
            <p className="text-base font-semibold text-gray-900">24/7 Awake Night Staff</p>
            <p className="text-sm text-gray-600">Overnight caregivers respond to pull cords, assist with bathroom trips, manage sundowning behaviors, and administer overnight medications.</p>
          </div>
        </div>

        {/* Ratios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-center">
            <p className="text-2xl font-bold text-teal-700">1 : 6–8</p>
            <p className="text-sm text-gray-500 mt-1">Caregiver-to-resident ratio (AL daytime)</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 text-center">
            <p className="text-2xl font-bold text-teal-700">1 : 5–6</p>
            <p className="text-sm text-gray-500 mt-1">Caregiver-to-resident ratio (Memory Care)</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
          {[
            "Licensed nurse on-site during business hours",
            "Certified medication technicians",
            "Dementia-trained caregivers in memory care",
            "On-site PT, OT, and home health partnerships",
            "Rounding physicians visit regularly",
            "Background checks on all staff",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              {CHECK}
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 italic mt-3">[confirm exact ratios and nurse schedule]</p>
      </div>

      {/* ═══════════════════════════════════════
          3. SAFETY  (nav-linked: id="safety")
          Matches Emerald's Floor Plans pattern:
          heading + description + checklist
          ═══════════════════════════════════════ */}
      <div id="safety" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Safety &amp; Security</h2>
        <p className="text-base text-gray-600 mb-4">Safety infrastructure is non-negotiable. MorningStar&apos;s four-story building includes modern safety systems throughout, with additional secured features in the memory care wing.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5 mb-6">
          {[
            "Emergency pull cords in every room and bathroom",
            "Pendant/wearable alert system available",
            "Fall prevention program",
            "Sprinkler system throughout",
            "Emergency generator for power outages",
            "Secured memory care exits with coded entry",
            "Enclosed courtyard with secured fencing",
            "Infection control protocols",
            "24/7 awake staff for rapid response",
            "Elevator access to all floors",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              {CHECK}
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>

        {/* Apartments */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Apartments</h3>
          <p className="text-base text-gray-600 mb-4">Studio, one-bedroom, and two-bedroom suites available in both assisted living and memory care. 103 total suites (69 AL + 34 MC).</p>
          <div className="flex flex-col md:flex-row md:items-stretch gap-6 mb-5">
            <div className="md:w-2/5 flex-shrink-0">
              <div className="relative h-full min-h-[250px] rounded-xl overflow-hidden">
                <Image src="/providers/morningstar-west-san-jose/amenities/apartment.webp" alt="MorningStar apartment interior" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
              </div>
            </div>
            <div className="md:w-3/5 flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {[
                  "Private suites with full bathroom",
                  "Emergency pull cords in bathroom",
                  "Walk-in showers with safety features",
                  "Individual climate control",
                  "Cable TV & Wi-Fi included",
                  "Pet-friendly suites available",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    {CHECK}
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════
          4. MEMORY CARE  (nav-linked: id="memory-care")
          Matches Emerald's Amenities pattern:
          heading + divided sub-sections
          ═══════════════════════════════════════ */}
      <div id="memory-care" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-6">Memory Care: Reflections Neighborhood</h2>
        <div className="divide-y divide-gray-200">

          {/* Secured Environment */}
          <div className="py-8 first:pt-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              {ICON_SHIELD} Secured Environment
            </h3>
            <p className="text-base text-gray-600 mb-5 max-w-2xl">MorningStar&apos;s memory care program operates in a dedicated 34-suite secured neighborhood called Reflections, designed specifically for residents with Alzheimer&apos;s disease and other forms of dementia.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
              {[
                "34 private suites in a dedicated secured wing",
                "Coded exits to prevent elopement",
                "Enclosed outdoor courtyard for safe wandering",
                "Calming interior design with wayfinding cues",
                "Lower stimulation environment",
                "Separate dining room within the neighborhood",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  {CHECK}
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div className="py-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              Engagement at Every Cognitive Level
            </h3>
            <p className="text-base text-gray-600 mb-5 max-w-2xl">Programming adapted for residents at different stages, from early-stage group activities to late-stage sensory stimulation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
              {[
                "Music therapy and reminiscence programs",
                "Art and sensory stimulation",
                "Gentle movement and seated exercise",
                "In-room programming for bedbound residents",
                "Life skills stations (folding, sorting, gardening)",
                "Family education and support groups",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  {CHECK}
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Building Amenities */}
          <div className="py-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              Building Amenities
            </h3>
            <p className="text-base text-gray-600 mb-5 max-w-2xl">Common spaces designed as destinations that draw residents out of their apartments, creating natural opportunities for socialization.</p>
            <div className="flex flex-col md:flex-row md:items-stretch gap-6 mb-5">
              <div className="md:w-2/5 flex-shrink-0">
                <div className="relative h-full min-h-[250px] rounded-xl overflow-hidden">
                  <Image src="/providers/morningstar-west-san-jose/amenities/fitness.webp" alt="MorningStar Fitness Center" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
                </div>
              </div>
              <div className="md:w-3/5 flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                  {[
                    "Bistro + Bar",
                    "Art Studio",
                    "Theatre and Chapel",
                    "Fitness Center",
                    "Sky Terrace",
                    "Courtyard Gardens",
                    "Library and Lounge",
                    "Salon and Spa",
                    "Family Gathering Spaces",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      {CHECK}
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Family Communication */}
          <div className="py-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              Family Communication
            </h3>
            <p className="text-base text-gray-600 mb-5 max-w-2xl">Families placing a loved one in care need to know they&apos;ll stay informed and involved.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5">
              {[
                "Regular care conferences with family",
                "Incident notification process",
                "Open visiting policy",
                "Community Facebook page with updates",
                "Direct phone line to care team",
                "Move-in transition support for families",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  {CHECK}
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 italic mt-2">[confirm if they have a family portal/app]</p>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════
          5. NEIGHBORHOOD  (nav-linked: id="neighborhood")
          Matches Emerald's Neighborhood pattern
          ═══════════════════════════════════════ */}
      <div id="neighborhood" className="py-8 scroll-mt-20 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">Neighborhood</h2>
        <p className="text-base text-gray-700 mb-6">1380 South De Anza Blvd, San Jose, CA 95129</p>

        <div className="space-y-8">
          {/* Medical Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg> Medical Facilities
            </h3>
            <div className="space-y-5">
              {[
                { name: "O'Connor Hospital (ER)", detail: "Located 1.8 miles away (~5 min), providing comprehensive emergency services." },
                { name: "Good Samaritan Hospital", detail: "Located 3.2 miles away (~10 min)." },
                { name: "El Camino Health (Mountain View)", detail: "Located 5.5 miles away (~12 min)." },
                { name: "Kaiser Permanente Santa Clara", detail: "Located 4.1 miles away (~10 min)." },
              ].map((loc) => (
                <div key={loc.name} className="flex items-start gap-3">
                  {ICON_PIN}
                  <div>
                    <p className="text-base font-medium text-gray-900">{loc.name}</p>
                    <p className="text-sm text-gray-500">{loc.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shopping & Errands */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> Shopping &amp; Errands
            </h3>
            <div className="space-y-5">
              {[
                { name: "CVS Pharmacy (with delivery)", detail: "Located 0.4 miles away (~2 min)." },
                { name: "Walgreens Pharmacy", detail: "Located 0.6 miles away (~3 min)." },
                { name: "Cupertino Village Shopping Center", detail: "Adjacent to the community, within walking distance." },
              ].map((loc) => (
                <div key={loc.name} className="flex items-start gap-3">
                  {ICON_PIN}
                  <div>
                    <p className="text-base font-medium text-gray-900">{loc.name}</p>
                    <p className="text-sm text-gray-500">{loc.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parks & Recreation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m-7-9H4m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> Parks &amp; Recreation
            </h3>
            <div className="space-y-5">
              {[
                { name: "Cupertino Memorial Park", detail: "Located 1.5 miles away, featuring walking paths, picnic areas, and a community center." },
                { name: "Rancho San Antonio Open Space", detail: "Located 3 miles away, offering easy hiking trails popular with seniors and families." },
              ].map((loc) => (
                <div key={loc.name} className="flex items-start gap-3">
                  {ICON_PIN}
                  <div>
                    <p className="text-base font-medium text-gray-900">{loc.name}</p>
                    <p className="text-sm text-gray-500">{loc.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 italic mt-3">[confirm distances]</p>
      </div>

      {/* ═══════════════════════════════════════
          FAQ (scrolled to via internal content)
          ═══════════════════════════════════════ */}
      <div className="py-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Frequently Asked Questions</h2>
        <div>
          <FAQItem q="What is the difference between assisted living and memory care here?" a="Assisted living supports residents who need help with daily activities but are cognitively intact or have only mild impairment. Memory care (Reflections Neighborhood) is a secured unit for residents with Alzheimer's or other dementia, with specialized staff, programming, and safety features." />
          <FAQItem q="What happens if my parent's needs increase?" a="Residents can transition from assisted living to memory care within the same building. On-site partnerships with home health, hospice, physical therapy, and rounding physicians allow higher-level care without moving to a separate facility." />
          <FAQItem q="How is the monthly cost determined?" a="Base rent depends on apartment size. A care fee is added based on a personalized assessment (Level 1 through 4). As needs increase, the care fee adjusts while base rent stays the same." />
          <FAQItem q="Is there a way to try the community first?" a="Yes. Respite (short-term) stays let your loved one experience the community, meals, activities, and care before a permanent decision. Also useful when a primary caregiver needs temporary relief." />
          <FAQItem q="What are the visiting hours?" a="MorningStar has an open visiting policy. Family members are welcome at any time, can join meals, and participate in activities." />
          <FAQItem q="How does medication management work?" a="Trained medication technicians administer all scheduled medications at prescribed times, including oral medications, insulin, and other injectables. Staff coordinate directly with pharmacies and physicians." />
          <FAQItem q="What happens at night?" a="Awake staff are on-site 24/7. Overnight caregivers respond to pull cords, assist with bathroom trips, manage sundowning behaviors, and administer overnight medications." />
          <FAQItem q="Does Medicare pay for assisted living?" a="Medicare does not cover room and board. It does cover certain skilled services delivered on-site (PT, OT, home health). The VA Aid & Attendance benefit and California's ALW program may help eligible residents." />
          <FAQItem q="What is the Reflections Neighborhood?" a="MorningStar's dedicated memory care unit with 34 private suites. Secured with coded exits, an enclosed courtyard, and staff specifically trained in Alzheimer's and dementia care." />
          <FAQItem q="Can my parent keep their own doctor?" a="Yes. Residents can continue seeing existing physicians. MorningStar also has rounding physicians who visit regularly for residents who prefer a doctor who comes to them." />
        </div>
      </div>

    </div>
  );
}
