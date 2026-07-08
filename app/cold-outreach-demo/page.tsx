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
                    ? "border-blue-600 text-blue-600"
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
// Tab 1: Provider Page
// =============================================================================
function ProviderPageTab() {
  return (
    <div>
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
            {/* See all photos - bottom center of image */}
            <button className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 hover:bg-black/80 backdrop-blur-sm rounded-full text-sm font-medium text-white transition-colors">
              See all photos
            </button>
          </div>
        </div>
      </section>

      {/* Floating action bar - below hero, aligned with navbar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save this provider
          </button>
        </div>
      </div>

      {/* Content below hero - placeholder */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">Content sections will go here...</p>
        </div>
      </section>
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
