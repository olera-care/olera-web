"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const careCategories = [
  { label: "Assisted Living", slug: "assisted-living" },
  { label: "Home Care", slug: "home-care" },
  { label: "Memory Care", slug: "memory-care" },
  { label: "Home Health Care", slug: "home-health-care" },
  { label: "Nursing Homes", slug: "nursing-home" },
  { label: "Independent Living", slug: "independent-living" },
];

interface CityEntry {
  label: string;
  city: string;
  state: string;
}

const popularCities: CityEntry[] = [
  { label: "Houston, TX", city: "houston", state: "texas" },
  { label: "Dallas, TX", city: "dallas", state: "texas" },
  { label: "Los Angeles, CA", city: "los-angeles", state: "california" },
  { label: "Phoenix, AZ", city: "phoenix", state: "arizona" },
  { label: "Chicago, IL", city: "chicago", state: "illinois" },
  { label: "New York, NY", city: "new-york", state: "new-york" },
  { label: "San Antonio, TX", city: "san-antonio", state: "texas" },
  { label: "Miami, FL", city: "miami", state: "florida" },
  { label: "Atlanta, GA", city: "atlanta", state: "georgia" },
  { label: "Philadelphia, PA", city: "philadelphia", state: "pennsylvania" },
  { label: "Denver, CO", city: "denver", state: "colorado" },
  { label: "Seattle, WA", city: "seattle", state: "washington" },
];

const popularStates = [
  { label: "Texas", href: "/assisted-living/texas" },
  { label: "California", href: "/assisted-living/california" },
  { label: "Florida", href: "/assisted-living/florida" },
  { label: "New York", href: "/assisted-living/new-york" },
  { label: "Pennsylvania", href: "/assisted-living/pennsylvania" },
  { label: "Illinois", href: "/assisted-living/illinois" },
  { label: "Ohio", href: "/assisted-living/ohio" },
  { label: "Georgia", href: "/assisted-living/georgia" },
  { label: "North Carolina", href: "/assisted-living/north-carolina" },
  { label: "Arizona", href: "/assisted-living/arizona" },
  { label: "Michigan", href: "/assisted-living/michigan" },
  { label: "Virginia", href: "/assisted-living/virginia" },
];

// ---------------------------------------------------------------------------
// Expandable City Row
// ---------------------------------------------------------------------------

function CityRow({ city }: { city: CityEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full py-3 border-b border-vanilla-200/80 text-left group"
      >
        <span className="text-[15px] text-gray-800 font-medium group-hover:text-primary-700 transition-colors">
          {city.label}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="py-2 pl-1 space-y-1.5 animate-fade-in">
          {careCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}/${city.state}/${city.city}`}
              className="block text-sm text-gray-600 hover:text-primary-700 transition-colors py-0.5"
            >
              {city.label.split(",")[0]} {cat.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export default function Footer() {
  return (
    <footer>
      {/* ── Discovery Zone — warm vanilla background ── */}
      <div className="bg-vanilla-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Section header */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Find senior care by city
          </h3>
          <p className="text-sm text-gray-500 mb-8">
            Explore top-rated providers in your area
          </p>

          {/* Expandable city grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-0">
            {popularCities.map((city) => (
              <CityRow key={`${city.state}-${city.city}`} city={city} />
            ))}
          </div>

          {/* States + Care Types — compact row below */}
          <div className="mt-12 pt-8 border-t border-vanilla-200/80 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Browse by State */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Browse by State
              </h4>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {popularStates.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-primary-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* By Care Type */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                By Care Type
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {careCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/${item.slug}`}
                    className="text-sm text-gray-600 hover:text-primary-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-gray-50 border-t border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center space-x-2.5 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">O</span>
                </div>
                <span className="text-lg font-bold text-gray-900">Olera</span>
              </Link>
              <p className="text-gray-400 max-w-xs leading-relaxed text-sm">
                Helping families find the right senior care. Compare trusted
                providers and connect with confidence.
              </p>
            </div>

            {/* For Families */}
            <div>
              <h3 className="text-gray-900 font-semibold text-xs uppercase tracking-wider mb-4">
                For Families
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/browse" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Browse Care Options
                  </Link>
                </li>
                <li>
                  <Link href="/assisted-living" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Assisted Living
                  </Link>
                </li>
                <li>
                  <Link href="/home-care" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Home Care
                  </Link>
                </li>
                <li>
                  <Link href="/memory-care" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Memory Care
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h3 className="text-gray-900 font-semibold text-xs uppercase tracking-wider mb-4">
                For Providers
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/for-providers" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Why Olera?
                  </Link>
                </li>
                <li>
                  <Link href="/for-providers/create" className="text-gray-500 hover:text-primary-600 transition-colors text-sm">
                    Claim Your Listing
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Olera. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                Terms
              </Link>
              <Link href="/support" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
