"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "provider-page" | "admin-trigger" | "first-contact";

// Fallback image - stock photo representing home care
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80";

const TABS: { id: Tab; label: string }[] = [
  { id: "provider-page", label: "Provider Page" },
  { id: "admin-trigger", label: "Admin Trigger" },
  { id: "first-contact", label: "First Contact" },
];

export default function ColdOutreachDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("provider-page");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Tab Navigation - positioned over the hero */}
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
  category: "Home Care",
  city: "Houston",
  state: "TX",
  rating: 4.8,
  reviewCount: 24,
  priceRange: "$25-35/hr",
};

// =============================================================================
// Tab 1: Provider Page
// =============================================================================
function ProviderPageTab() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - OpenTable style: one big image */}
      <section className="relative w-full">
        {/* Full-width hero image */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[480px]">
          <Image
            src={FALLBACK_IMAGE}
            alt="Home care services"
            fill
            className="object-cover"
            priority
          />

          {/* Overlay container - aligned with navbar (max-w-7xl) */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-4">
            {/* Save this provider - top right, aligned with navbar menu icon */}
            <button className="absolute top-4 right-0 flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save this provider
            </button>

            {/* See all photos - bottom center of image */}
            <button className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 hover:bg-black/80 backdrop-blur-sm rounded-full text-sm font-medium text-white transition-colors">
              See all photos
            </button>
          </div>
        </div>
      </section>

      {/* Content Section - Two Column Layout */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left Column - Provider Info */}
            <div className="lg:col-span-2">
              {/* Provider Name - Big like OpenTable */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                {MOCK_PROVIDER.name}
              </h1>

              {/* Rating · Price · Category - Inline like OpenTable */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 text-base text-gray-600">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{MOCK_PROVIDER.rating}</span>
                  <span className="text-gray-400">({MOCK_PROVIDER.reviewCount})</span>
                </div>

                <span className="text-gray-300">·</span>

                {/* Price */}
                <span>{MOCK_PROVIDER.priceRange}</span>

                <span className="text-gray-300">·</span>

                {/* Category */}
                <span>{MOCK_PROVIDER.category}</span>
              </div>

              {/* Location */}
              <p className="mt-2 text-sm text-gray-500">
                {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
              </p>

              {/* Placeholder for additional content sections */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-gray-400">Additional sections will go here...</p>
              </div>
            </div>

            {/* Right Column - Sticky CTA Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                {/* CTA Card - matches current Olera style */}
                <div className="bg-gradient-to-b from-white to-primary-25/40 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                  <div className="px-6 py-6">
                    {/* Header */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Check availability
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      Get pricing and schedule a consultation
                    </p>

                    {/* Email input */}
                    <div className="mb-4">
                      <input
                        type="email"
                        placeholder="Your email address"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Submit button */}
                    <button className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
                      Request details
                    </button>

                    {/* Trust signals */}
                    <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>No spam. No sales calls.</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-40">
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
