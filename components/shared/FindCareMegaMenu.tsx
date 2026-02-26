"use client";

import { useState } from "react";
import Link from "next/link";
import { CARE_CATEGORIES } from "./NavMenuData";
import type { NavResource } from "./NavMenuData";

const categoryToPowerPage: Record<string, string> = {
  "home-health": "/home-health-care",
  "home-care": "/home-care",
  "assisted-living": "/assisted-living",
  "memory-care": "/memory-care",
  "nursing-homes": "/nursing-home",
  "independent-living": "/independent-living",
};

function ResourceIcon({ icon }: { icon: NavResource["icon"] }) {
  switch (icon) {
    case "chat":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "heart":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "dollar":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "compare":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "book":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "info":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "shield":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

interface FindCareMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function FindCareMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: FindCareMegaMenuProps) {
  const [hoveredCategory, setHoveredCategory] = useState("home-health");

  if (!isOpen) return null;

  const activeCategory =
    CARE_CATEGORIES.find((c) => c.id === hoveredCategory) || CARE_CATEGORIES[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Mega-menu panel */}
      <div
        className="fixed top-[64px] left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xl animate-slide-down"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex gap-12">
            {/* Left — Care Types */}
            <div className="min-w-[220px]">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Care Types
              </h4>
              <ul className="space-y-0.5 -ml-3">
                {CARE_CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={categoryToPowerPage[category.id] || `/browse?type=${category.id}`}
                      onClick={onClose}
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      className={`text-[15px] font-medium transition-all text-left w-full py-2.5 pl-3 pr-4 rounded-lg block ${
                        hoveredCategory === category.id
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-900 hover:text-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      {category.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Center — Featured Card */}
            <div className="flex gap-8">
              <Link
                href={categoryToPowerPage[activeCategory.id] || `/browse?type=${activeCategory.id}`}
                onClick={onClose}
                className="w-[340px] shrink-0 block"
              >
                <div
                  className="relative rounded-2xl overflow-hidden h-[350px] group cursor-pointer hover:-translate-y-1"
                  style={{
                    transition:
                      "transform 450ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 450ms cubic-bezier(0.23, 1, 0.32, 1)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                >
                  <img
                    src={activeCategory.image}
                    alt={activeCategory.label}
                    className="w-full h-full object-cover group-hover:scale-[1.03]"
                    style={{
                      transition:
                        "transform 600ms cubic-bezier(0.23, 1, 0.32, 1)",
                    }}
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-block bg-white/90 backdrop-blur-sm text-primary-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                      {activeCategory.label}
                    </span>
                  </div>
                  {/* Glass overlay card */}
                  <div className="absolute bottom-4 left-4 right-4 backdrop-blur-xl bg-white/70 rounded-xl p-5 border border-white/20 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {activeCategory.headline}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {activeCategory.description}
                    </p>
                    <span className="flex items-center justify-center w-full bg-primary-600 group-hover:bg-primary-700 text-white font-semibold py-3 px-5 rounded-full transition-colors text-sm">
                      Get Started
                    </span>
                  </div>
                </div>
              </Link>

              {/* Right — Resources */}
              <div className="w-[574px] shrink-0">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Resources
                </h4>
                <div className="grid grid-cols-2 gap-3.5">
                  {activeCategory.resources.map((resource) => (
                    <Link
                      key={resource.href}
                      href={resource.href}
                      onClick={onClose}
                      className="flex flex-col items-center text-center p-6 rounded-2xl backdrop-blur-sm bg-white/60 border border-white/40 shadow-sm hover:bg-primary-50 hover:shadow-md hover:border-primary-200 transition-all group h-[150px]"
                    >
                      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-gray-500 group-hover:text-primary-600 group-hover:bg-primary-50 mb-4 transition-colors shrink-0">
                        <ResourceIcon icon={resource.icon} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
                        {resource.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
