"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ProviderCard from "@/components/providers/ProviderCard";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider as IOSProvider,
  type ProviderCardData,
  PROVIDERS_TABLE,
  toCardFormat,
} from "@/lib/types/provider";

const careCategories = [
  {
    id: "home-care",
    name: "Home Care",
    iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "home-health",
    name: "Home Health",
    iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    id: "assisted-living",
    name: "Assisted Living",
    iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    id: "memory-care",
    name: "Memory Care",
    iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    id: "independent-living",
    name: "Independent Living",
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    id: "nursing-home",
    name: "Nursing Home",
    iconPath: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
];

const categoryToProviderCategory: Record<string, string> = {
  "home-care": "Home Care (Non-medical)",
  "home-health": "Home Health Care",
  "assisted-living": "Assisted Living",
  "memory-care": "Memory Care",
  "independent-living": "Independent Living",
  "nursing-home": "Nursing Home",
};

const categoryToPowerPage: Record<string, string> = {
  "home-care": "/home-care",
  "home-health": "/home-health-care",
  "assisted-living": "/assisted-living",
  "memory-care": "/memory-care",
  "independent-living": "/independent-living",
  "nursing-home": "/nursing-home",
};

export default function BrowseByCareTypeSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("home-care");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [categoryProviders, setCategoryProviders] = useState<ProviderCardData[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateScrollState = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: "instant" });
      setTimeout(() => {
        updateScrollState();
      }, 50);
      container.addEventListener("scroll", updateScrollState);
      window.addEventListener("resize", updateScrollState);
      return () => {
        container.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }
  }, [updateScrollState, selectedCategory]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const newScrollLeft = Math.max(0, container.scrollLeft - 400);
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newScrollLeft = Math.min(maxScroll, container.scrollLeft + 400);
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) return;
    setSelectedCategory(categoryId);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "instant" });
    }
  };

  useEffect(() => {
    async function fetchCategoryProviders() {
      if (!selectedCategory) {
        setCategoryProviders([]);
        setIsLoadingCategory(false);
        return;
      }

      setIsLoadingCategory(true);
      const providerCategory = categoryToProviderCategory[selectedCategory];

      if (!providerCategory) {
        setCategoryProviders([]);
        setIsLoadingCategory(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .not("deleted", "is", true)
          .ilike("provider_category", `%${providerCategory}%`)
          .not("provider_images", "is", null)
          .order("google_rating", { ascending: false, nullsFirst: false })
          .limit(8);

        if (error || !data) {
          console.error("Error fetching category providers:", error?.message);
          setCategoryProviders([]);
        } else {
          setCategoryProviders((data as IOSProvider[]).map(toCardFormat));
        }
      } catch (err) {
        console.error("Error fetching category providers:", err);
        setCategoryProviders([]);
      } finally {
        setIsLoadingCategory(false);
      }
    }

    fetchCategoryProviders();
  }, [selectedCategory]);

  return (
    <section className="pt-8 md:pt-12 pb-6 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Browse by care type
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {careCategories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`rounded-xl border transition-all duration-200 px-3 py-3 flex items-center justify-center gap-2 ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                    isSelected ? "bg-primary-100" : "bg-primary-50"
                  }`}
                >
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.iconPath} />
                  </svg>
                </div>
                <span className={`font-medium text-sm transition-colors duration-200 ${
                  isSelected ? "text-primary-700" : "text-gray-700"
                }`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-8">
          <div className="relative overflow-visible">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 items-center justify-center transition-all ${
                canScrollLeft
                  ? "hover:bg-gray-50 hover:shadow-2xl hover:scale-105 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              aria-label="Scroll left"
            >
              <svg className={`w-6 h-6 ${canScrollLeft ? "text-gray-700" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-200 items-center justify-center transition-all ${
                canScrollRight
                  ? "hover:bg-gray-50 hover:shadow-2xl hover:scale-105 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              aria-label="Scroll right"
            >
              <svg className={`w-6 h-6 ${canScrollRight ? "text-gray-700" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="flex gap-5 overflow-x-scroll pb-4 scrollbar-hide"
            >
              {isLoadingCategory ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[370px] h-[512px] bg-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : (
                categoryProviders.slice(0, 6).map((provider) => (
                  <div key={provider.id} className="flex-shrink-0 w-[370px] h-[512px]">
                    <ProviderCard provider={provider} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href={categoryToPowerPage[selectedCategory || ""] || `/browse?type=${selectedCategory}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:shadow-md hover:shadow-primary-600/30 transition-all"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
