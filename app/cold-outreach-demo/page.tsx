"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "provider-page" | "admin-trigger" | "first-contact";

const TABS: { id: Tab; label: string }[] = [
  { id: "provider-page", label: "Provider Page" },
  { id: "admin-trigger", label: "Admin Trigger" },
  { id: "first-contact", label: "First Contact" },
];

// =============================================================================
// Mock Data for Effy's Home Care
// =============================================================================
const MOCK_PROVIDER = {
  name: "Effy's Home Care",
  slug: "effys-home-care",
  category: "Home Care",
  city: "Houston",
  state: "TX",
  rating: 4.8,
  reviewCount: 24,
  priceRange: "$25-35/hr",
  description: "Effy's Home Care provides compassionate, personalized in-home care services for seniors and individuals with disabilities in the Houston area. Our team of trained caregivers is dedicated to helping your loved ones maintain their independence while ensuring their safety and well-being.",
  images: [
    "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
    "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80",
  ],
  highlights: [
    { label: "State Licensed", icon: "shield" },
    { label: "Est. 2019", icon: "clock" },
    { label: "Background-Checked", icon: "check" },
  ],
  services: [
    "Personal Care Assistance",
    "Companionship",
    "Meal Preparation",
    "Medication Reminders",
    "Light Housekeeping",
    "Transportation",
    "Respite Care",
    "24-Hour Care",
  ],
  staff: {
    name: "Effy Amekye",
    position: "Owner & Care Coordinator",
    image: null,
    bio: "With over 10 years of experience in senior care, I founded Effy's Home Care to provide the same quality of care I would want for my own family members.",
  },
  reviews: [
    {
      name: "Sarah M.",
      rating: 5,
      date: "2026-06-15",
      comment: "Wonderful care for my mother. The caregivers are punctual, professional, and genuinely caring.",
    },
    {
      name: "James T.",
      rating: 5,
      date: "2026-05-20",
      comment: "Effy and her team have been a blessing. They treat my father with dignity and respect.",
    },
    {
      name: "Linda K.",
      rating: 4,
      date: "2026-04-10",
      comment: "Great service overall. Communication could be slightly better but the care quality is excellent.",
    },
  ],
  acceptedPayments: ["Private Pay", "Long-Term Care Insurance", "Veterans Benefits"],
};

export default function ColdOutreachDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("provider-page");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
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
// Tab 1: Provider Page (Replica of current provider page)
// =============================================================================
function ProviderPageTab() {
  const provider = MOCK_PROVIDER;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* ===== Hero Zone ===== */}
      <div className="bg-white md:bg-vanilla-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-4 md:pb-8">
          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-4">
            <a href="#" className="hover:text-gray-700">Home</a>
            <span>/</span>
            <a href="#" className="hover:text-gray-700">{provider.category}</a>
            <span>/</span>
            <a href="#" className="hover:text-gray-700">{provider.city}, {provider.state}</a>
            <span>/</span>
            <span className="text-gray-900">{provider.name}</span>
          </nav>

          {/* Hero Grid */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Gallery */}
            <div className="flex-shrink-0 relative w-full md:w-[448px]">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={provider.images[currentImageIndex]}
                  alt={provider.name}
                  fill
                  className="object-cover"
                />
                {/* Gallery dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {provider.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                {/* Claim badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-gray-700 shadow-sm">
                    <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Category eyebrow */}
              <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1">
                {provider.category}
              </p>

              {/* Name + Save */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                  {provider.name}
                </h1>
                <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Save
                </button>
              </div>

              {/* Location */}
              <p className="text-sm text-gray-500 mt-1">
                {provider.city}, {provider.state}
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mt-3">
                {provider.highlights.map((h) => (
                  <span
                    key={h.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                  >
                    <HighlightIcon icon={h.icon} className="w-3.5 h-3.5 text-primary-600" />
                    {h.label}
                  </span>
                ))}
              </div>

              {/* Rating box */}
              <div className="flex items-center justify-center mt-6 py-5 border border-gray-100 rounded-xl md:justify-start md:border-0 md:py-0 md:mt-4">
                <div className="flex items-center gap-6 md:gap-4">
                  <div className="flex flex-col items-center md:flex-row md:gap-2">
                    <span className="text-2xl md:text-xl font-bold text-gray-900">{provider.rating}</span>
                    <div className="flex items-center gap-0.5 mt-1 md:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(provider.rating) ? "text-amber-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-200 md:hidden" />
                  <div className="flex flex-col items-center md:flex-row md:gap-1">
                    <span className="text-2xl md:text-base font-bold md:font-medium text-gray-900">{provider.reviewCount}</span>
                    <span className="text-xs md:text-sm text-gray-500">Google reviews</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{provider.priceRange}</span>
                <span className="text-sm text-gray-500">estimated</span>
              </div>

              {/* Verified manager (desktop) */}
              <div className="hidden md:flex items-center gap-2.5 mt-4">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-500">
                      {provider.staff.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <svg className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="10" fill="white" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Managed by: <span className="font-medium text-gray-700">{provider.staff.name}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Content Zone ===== */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-0">
              {/* Reviews Section */}
              <div className="py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">What families are saying</h2>
                <div className="space-y-4">
                  {provider.reviews.map((review, idx) => (
                    <div key={idx} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-500">{review.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.name}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3 h-3 ${star <= review.rating ? "text-amber-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Section */}
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Care Services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {provider.services.map((service) => (
                    <div key={service} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-base text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Section */}
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-base text-gray-600 leading-relaxed">{provider.description}</p>
              </div>

              {/* Payment Options */}
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Payment Options</h2>
                <div className="flex flex-wrap gap-3">
                  {provider.acceptedPayments.map((payment) => (
                    <span
                      key={payment}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-sm text-gray-700"
                    >
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {payment}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sticky CTA */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect with {provider.name}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get pricing, availability, and answers to your questions.
                </p>
                <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                  Request Information
                </button>
                <button className="w-full mt-3 py-3 px-4 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors">
                  Schedule a Tour
                </button>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Free, no obligation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden">
        <button className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
          Request Information
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Helper: Highlight Icon
// =============================================================================
function HighlightIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "shield":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      );
  }
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
