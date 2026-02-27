"use client";

import { useState } from "react";
import Image from "next/image";

const tabs = [
  {
    id: "profile",
    label: "Profile",
    title: "Set up your profile",
    description:
      "Fill in key business information to show up in local searches.",
    image: "/images/for-providers/tab-profile.png",
  },
  {
    id: "reviews",
    label: "Reviews",
    title: "Manage your reviews",
    description: "Respond to reviews and build your reputation.",
    image: "/images/for-providers/tab-reviews.png",
  },
  {
    id: "inbox",
    label: "Inbox",
    title: "Your inbox",
    description: "Receive and respond to inquiries from families.",
    image: "/images/for-providers/tab-inbox.png",
  },
  {
    id: "leads",
    label: "Leads",
    title: "Track your leads",
    description: "See who\u2019s interested and follow up.",
    image: "/images/for-providers/tab-leads.png",
  },
];

export default function EasyToConnectSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTab = tabs[activeIndex];

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
              onClick={() => setActiveIndex(i)}
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
          <div className="mx-auto max-w-3xl relative aspect-[16/10]">
            {tabs.map((tab, i) => (
              <div
                key={tab.id}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  i === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <Image
                  src={tab.image}
                  alt={`${tab.label} — ${tab.title}`}
                  fill
                  className="object-contain object-center"
                  priority={i === 0}
                  sizes="(min-width: 768px) 768px, 100vw"
                />
              </div>
            ))}
          </div>

          {/* Caption */}
          <h3 className="mt-6 text-text-lg font-semibold text-gray-900">
            {activeTab.title}
          </h3>
          <p className="mt-1 text-text-md text-gray-500">
            {activeTab.description}
          </p>
        </div>
      </div>
    </section>
  );
}
