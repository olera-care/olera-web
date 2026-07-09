"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "provider-page" | "admin-trigger" | "first-contact";

// Mock images for the photo grid
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1600&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
  "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=80",
  "https://images.unsplash.com/photo-1576765974257-b414b9e8f8ce?w=800&q=80",
];

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
  slug: "effys-home-care",
  category: "Home Care",
  city: "Houston",
  state: "TX",
  address: "1234 Care Lane",
  rating: 4.8,
  reviewCount: 24,
  priceRange: "$25-35/hr",
  lastUpdated: "July 5, 2026",
};

// =============================================================================
// Tab 1: Provider Page (Chantel's Design)
// =============================================================================
function ProviderPageTab() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Zone */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6">

        {/* Desktop: Provider name + Save/Share above photos */}
        <div className="hidden md:flex md:items-center md:gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight font-display">
            {MOCK_PROVIDER.name}
          </h1>
          {/* Manage this page CTA */}
          <button className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
            Manage this page
          </button>
          <div className="ml-auto flex items-center gap-4">
            {/* Save button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save
            </button>
            {/* Share button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Desktop: Zillow-style 1 large + 4 small grid */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-[2.5/1] relative">
          {/* Claim badge overlay */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Unclaimed</span>
            </div>
          </div>

          {/* Large hero photo */}
          <div className="col-span-2 row-span-2 relative bg-gray-100">
            <Image
              src={MOCK_IMAGES[0]}
              alt={`${MOCK_PROVIDER.name} — main photo`}
              fill
              sizes="50vw"
              priority
              className="object-cover"
            />
          </div>

          {/* 4 smaller photos */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative bg-gray-100">
              {MOCK_IMAGES[i] ? (
                <Image
                  src={MOCK_IMAGES[i]}
                  alt={`${MOCK_PROVIDER.name} — photo ${i + 1}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-50" />
              )}
              {/* "See all photos" on the last cell */}
              {i === 4 && (
                <div className="absolute inset-0 flex items-end justify-end p-3">
                  <button className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm text-sm font-medium text-gray-900 hover:bg-white transition-colors">
                    See all photos
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Single hero image with overlay actions */}
        <div className="md:hidden relative rounded-xl overflow-hidden aspect-[4/3]">
          <Image
            src={MOCK_IMAGES[0]}
            alt={MOCK_PROVIDER.name}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          {/* Mobile gallery actions */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-700">Unclaimed</span>
            </div>
            <button className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm text-sm font-medium text-gray-900">
              See all photos
            </button>
          </div>
        </div>

        {/* ── Details below photos ── */}
        <div className="flex flex-col md:mt-3">
          {/* ── Desktop: Info strip ── */}
          <div className="hidden md:block mt-1">
            {/* Location */}
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state} · {MOCK_PROVIDER.address}
            </p>

            {/* Price */}
            <p className="text-xl font-bold text-gray-900 mt-3">
              Est. {MOCK_PROVIDER.priceRange}
            </p>

            {/* Facts line */}
            <div className="flex items-center gap-6 mt-2">
              {/* Category */}
              <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                {MOCK_PROVIDER.category}
              </span>

              {/* Rating */}
              <span className="flex items-center gap-2 text-base text-gray-700 font-medium">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {MOCK_PROVIDER.rating} on Google
              </span>

              {/* Availability */}
              <span className="flex items-center gap-2 text-base text-gray-600 font-semibold bg-gray-100 rounded-full px-3 py-1">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Inquire about availability
              </span>
            </div>

            {/* Last updated */}
            <p className="text-xs text-gray-400 mt-3">
              Last updated {MOCK_PROVIDER.lastUpdated}
            </p>
          </div>

          {/* Mobile: Name and details */}
          <div className="md:hidden mt-4">
            {/* Category eyebrow */}
            <p className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-1">
              {MOCK_PROVIDER.category}
            </p>
            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {MOCK_PROVIDER.name}
            </h1>
            {/* Location */}
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}
            </p>
            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">{MOCK_PROVIDER.rating}</span>
              <span className="text-sm text-gray-500">({MOCK_PROVIDER.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Content sections placeholder */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-400">Additional sections (About, Reviews, etc.) will go here...</p>
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
