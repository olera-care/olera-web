"use client";

import { useState } from "react";
import Image from "next/image";

const VALUE_PROPS = [
  {
    title: "Optimized for search engines and AI",
    description:
      "Your profile is built to rank on Google, Bing, and AI engines like ChatGPT and Claude. Families find you when they search for care in your area.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Qualified leads with care details",
    description:
      "Every lead includes care needs, location, and ability to pay. You know exactly who is reaching out and whether they are a fit before you respond.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    title: "Never shared with competitors",
    description:
      "Other directories send the same lead to 3-5 providers. On Olera, when a family reaches out to you, that connection is yours alone.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
            Find families
          </p>
          <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900">
            Stop paying per lead.
            <br className="hidden sm:block" />
            Start getting found.
          </h2>
          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            Families find you and reach out directly. Every lead is qualified,
            exclusive to you, and free. No commissions. No middlemen. No call
            centers.
          </p>
        </div>

        {/* Value prop cards */}
        <div className="mt-12 grid sm:grid-cols-3 gap-8">
          {VALUE_PROPS.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mt-0.5">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Product tabs */}
        <div className="mt-16 max-w-5xl mx-auto text-center">
          {/* Device mockup area */}
          <div className="mt-2 relative">
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
                    alt={`${tab.label}: ${tab.title}`}
                    fill
                    className="object-contain object-center"
                    priority={i === 0}
                    sizes="(min-width: 768px) 768px, 100vw"
                  />
                </div>
              ))}
            </div>

            {/* Caption */}
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {activeTab.title}
            </h3>
            <p className="mt-1 text-base text-gray-500">
              {activeTab.description}
            </p>

            {/* Tab pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
              {tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    i === activeIndex
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
