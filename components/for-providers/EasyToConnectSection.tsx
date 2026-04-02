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
    title: "No lead fees. No commissions.",
    description:
      "Other directories charge $50 per lead or first month's rent. On Olera, families reach out to you directly. Every lead is exclusive and free.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    title: "Reviews that build trust",
    description:
      "Manage your reputation in one place. Families read reviews before reaching out.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
            Families find you and reach out directly. Leads are exclusive. Leads
            are free. No commissions. No middlemen.
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

        {/* How families become clients */}
        <div className="mt-14">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-6">
            How families become clients
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Families search for care", desc: "By type, location, or need" },
              { step: "2", title: "They find your profile", desc: "Optimized for search and AI" },
              { step: "3", title: "They reach out to you", desc: "Direct connection request" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold mb-2">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product tabs */}
        <div className="mt-14 max-w-5xl mx-auto text-center">
          {/* Tab pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
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
          </div>
        </div>
      </div>
    </section>
  );
}
