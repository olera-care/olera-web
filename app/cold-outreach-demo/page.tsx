"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "provider-page" | "admin-trigger" | "first-contact";

// Mock image
const HERO_IMAGE = "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80";

const TABS: { id: Tab; label: string }[] = [
  { id: "provider-page", label: "Provider Page" },
  { id: "admin-trigger", label: "Admin Trigger" },
  { id: "first-contact", label: "First Contact" },
];

export default function ColdOutreachDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("provider-page");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Tab Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-2 py-1.5" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "provider-page" && <ProviderPageTab />}
        {activeTab === "admin-trigger" && <AdminTriggerTab />}
        {activeTab === "first-contact" && <FirstContactTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Mock Provider Data
// =============================================================================
const MOCK_PROVIDER = {
  name: "Effy's Home Care",
  slug: "effys-home-care",
  category: "Home Care",
  city: "Houston",
  state: "TX",
  address: "1234 Care Lane",
  rating: 4.8,
  reviewCount: 24,
  priceRange: "$25-35/hr",
  lastUpdated: "July 5, 2026",
  description: "Effy's Home Care provides compassionate, personalized in-home care services for seniors and individuals with disabilities. Our team of experienced caregivers is dedicated to helping clients maintain their independence while receiving the support they need in the comfort of their own homes.",
};

const MOCK_REVIEWS = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2 months ago",
    text: "The caregivers from Effy's Home Care have been absolutely wonderful with my mother. They're patient, kind, and truly care about her well-being. Highly recommend!",
  },
  {
    id: 2,
    author: "James T.",
    rating: 5,
    date: "3 months ago",
    text: "Professional service from start to finish. The team took time to understand my father's needs and matched him with the perfect caregiver.",
  },
  {
    id: 3,
    author: "Linda K.",
    rating: 4,
    date: "4 months ago",
    text: "Great communication and reliable service. The caregiver is always on time and my grandmother looks forward to her visits.",
  },
];

const MOCK_SERVICES = [
  "Personal Care Assistance",
  "Medication Reminders",
  "Meal Preparation",
  "Light Housekeeping",
  "Companionship",
  "Transportation",
  "Respite Care",
  "24-Hour Care",
];

const SECTION_NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "reviews", label: "Reviews" },
  { id: "services", label: "Services" },
  { id: "neighborhood", label: "Neighborhood" },
];

// =============================================================================
// Tab 1: Provider Page (Full Chantel Design)
// =============================================================================
function ProviderPageTab() {
  const [activeSection, setActiveSection] = useState("about");

  return (
    <div className="min-h-screen bg-white md:bg-vanilla-100">

      {/* ===== Hero Zone — Cream Background ===== */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">

        {/* Desktop: Provider name + Save/Share above photo */}
        <div className="hidden md:flex md:items-center md:gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight font-display">
            {MOCK_PROVIDER.name}
          </h1>
          <button className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
            Manage this page
          </button>
          <div className="ml-auto flex items-center gap-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* One big hero image (first principle: provider has one image) */}
        <div className="relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-[2.5/1]">
          <Image
            src={HERO_IMAGE}
            alt={MOCK_PROVIDER.name}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          {/* Claim badge overlay */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-700">Unclaimed</span>
            </div>
          </div>
        </div>

        {/* Details below photo */}
        <div className="flex flex-col md:mt-3">
          {/* Desktop: Info strip */}
          <div className="hidden md:block mt-1">
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state} · {MOCK_PROVIDER.address}
            </p>

            <p className="text-xl font-bold text-gray-900 mt-3">
              Est. {MOCK_PROVIDER.priceRange}
            </p>

            <div className="flex items-center gap-6 mt-2">
              <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                {MOCK_PROVIDER.category}
              </span>

              <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {MOCK_PROVIDER.rating} on Google
              </span>

              <span className="flex items-center gap-2 text-base text-gray-600 font-semibold bg-gray-100 rounded-full px-3 py-1">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Inquire about availability
              </span>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Last updated {MOCK_PROVIDER.lastUpdated}
            </p>
          </div>

          {/* Mobile: Name and details */}
          <div className="md:hidden mt-4">
            <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1">
              {MOCK_PROVIDER.category}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {MOCK_PROVIDER.name}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">{MOCK_PROVIDER.rating}</span>
              <span className="text-sm text-gray-500">({MOCK_PROVIDER.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Content Zone — White Background ===== */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:py-10">

          {/* About + CTA side-by-side (desktop) */}
          <div className="hidden md:flex md:gap-10 md:items-start mb-10">
            {/* Left: About + standout */}
            <div className="flex-1 min-w-0">
              <div id="about" className="scroll-mt-20">
                <h2 className="text-3xl font-bold text-gray-900 font-display mb-3">About {MOCK_PROVIDER.name}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {MOCK_PROVIDER.description}
                </p>

                {/* What makes this place special */}
                <div className="mt-6 bg-teal-50/50 border border-teal-100 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900">What makes us special</h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Personalized care plans tailored to each client",
                      "Experienced, background-checked caregivers",
                      "24/7 on-call support for families",
                      "Flexible scheduling to fit your needs",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-sm text-gray-900 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: CTA card */}
            <div className="w-[380px] flex-shrink-0">
              <div className="bg-gradient-to-b from-white to-primary-25/40 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-6 py-6">
                  <p className="text-sm text-gray-500 italic">
                    {MOCK_PROVIDER.category} in {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {MOCK_PROVIDER.priceRange}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Area estimate — not this provider&apos;s actual price
                  </p>

                  <div className="border-t border-gray-200 my-5" />

                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Get actual pricing &amp; availability
                  </h3>

                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                    Request details
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-gray-500">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>No spam. No sales calls.</span>
                  </div>

                  <p className="text-center text-sm text-gray-400 mt-2">
                    71 families checked this month
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Navigation — sticky tabs */}
          <div className="sticky top-0 z-30 bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
            <nav className="flex items-center gap-6">
              {SECTION_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeSection === item.id
                      ? "text-gray-900 border-gray-900"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Sections */}
          <div className="mt-8">

            {/* Reviews Section */}
            <div id="reviews" className="scroll-mt-20 py-8 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
                  <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Reviews
                </h2>
                <span className="text-sm text-gray-500">({MOCK_PROVIDER.reviewCount} reviews)</span>
              </div>

              <div className="space-y-6">
                {MOCK_REVIEWS.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-500">{review.author.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.author}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div id="services" className="scroll-mt-20 py-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-6 flex items-center gap-2.5">
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                Services
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {MOCK_SERVICES.map((service) => (
                  <div key={service} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-800">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhood Section */}
            <div id="neighborhood" className="scroll-mt-20 py-8 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2.5">
                  <svg className="w-7 h-7 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  What&apos;s nearby
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Close to medical care and shopping
                </span>
              </div>
              <p className="text-sm text-gray-900 mb-4">{MOCK_PROVIDER.address}, {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}</p>

              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
                <p className="text-gray-400">Map will be displayed here</p>
              </div>

              {/* Nearby places */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: "Hospital", name: "Houston Methodist", distance: "2.3 mi" },
                  { label: "Grocery", name: "H-E-B", distance: "0.8 mi" },
                  { label: "Pharmacy", name: "CVS Pharmacy", distance: "0.5 mi" },
                  { label: "Park", name: "Memorial Park", distance: "1.2 mi" },
                ].map((place) => (
                  <div key={place.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{place.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.distance}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-4">Disclaimer</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We strive to keep this page accurate and current, but some details may not be up to date. To confirm whether {MOCK_PROVIDER.name} is the right fit for you or your loved one, please verify all information directly with the provider by submitting a connect request or contacting them.
              </p>
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-200">
                <p className="text-sm text-gray-500">Are you the owner of this business?</p>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Manage this page <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40">
        <button className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
          Request details
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Tab 2: Admin Trigger
// =============================================================================
function AdminTriggerTab() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Admin Trigger
        </h2>
        <p className="text-gray-500">
          Admin dashboard to initiate cold outreach — coming next
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Tab 3: First Contact Experience
// =============================================================================
function FirstContactTab() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Provider First Contact
        </h2>
        <p className="text-gray-500">
          What the provider sees when they receive outreach — coming later
        </p>
      </div>
    </div>
  );
}
