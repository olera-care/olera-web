"use client";

import { useState } from "react";

const tabs = [
  {
    id: "profile",
    label: "Profile",
    title: "Set up your profile",
    description:
      "Fill in key business information to show up in local searches.",
  },
  {
    id: "reviews",
    label: "Reviews",
    title: "Manage your reviews",
    description: "Respond to reviews and build your reputation.",
  },
  {
    id: "inbox",
    label: "Inbox",
    title: "Your inbox",
    description: "Receive and respond to inquiries from families.",
  },
  {
    id: "leads",
    label: "Leads",
    title: "Track your leads",
    description: "See who\u2019s interested and follow up.",
  },
];

export default function EasyToConnectSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(tabs.length - 1, index)));
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900">
          It&apos;s easy to connect with
          <br className="hidden sm:block" />
          families on Olera
        </h2>

        {/* Tab pills */}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => goTo(i)}
              className={`px-5 py-2 rounded-full text-text-sm font-medium transition-colors ${
                i === activeIndex
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Device mockup area */}
        <div className="mt-10 relative">
          {/* Laptop + phone placeholder */}
          <div className="mx-auto max-w-3xl aspect-[16/10] rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center relative overflow-hidden">
            {/* Laptop frame */}
            <div className="w-[70%] aspect-[16/10] rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-text-sm">
                Laptop — {activeTab.label} view
              </span>
            </div>

            {/* Phone frame — overlapping bottom-right */}
            <div className="absolute bottom-4 right-[10%] w-[18%] aspect-[9/19] rounded-xl bg-gray-100 border-2 border-gray-300 shadow-lg flex items-center justify-center">
              <span className="text-gray-400 text-[10px] text-center px-1">
                Phone
              </span>
            </div>
          </div>

          {/* Caption */}
          <h3 className="mt-6 text-text-lg font-semibold text-gray-900">
            {activeTab.title}
          </h3>
          <p className="mt-1 text-text-md text-gray-500">
            {activeTab.description}
          </p>

          {/* Carousel controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-text-sm text-gray-500 tabular-nums">
              {activeIndex + 1}/{tabs.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === tabs.length - 1}
              className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
