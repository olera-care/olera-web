"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import BrowseCard from "@/components/browse/BrowseCard";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider as IOSProvider,
  type ProviderCardData,
  PROVIDERS_TABLE,
  toCardFormat,
} from "@/lib/types/provider";

export default function TopProvidersSection() {
  const [featuredProviders, setFeaturedProviders] = useState<ProviderCardData[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFeaturedProviders() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .not("deleted", "is", true)
          .not("google_rating", "is", null)
          .gte("google_rating", 4.0)
          .not("provider_images", "is", null)
          .order("google_rating", { ascending: false })
          .limit(8);

        if (error || !data) {
          console.error("Error fetching featured providers:", error?.message);
          setFeaturedProviders([]);
        } else {
          setFeaturedProviders((data as IOSProvider[]).map(toCardFormat));
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        setFeaturedProviders([]);
      } finally {
        setIsLoadingProviders(false);
      }
    }

    fetchFeaturedProviders();
  }, []);

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
      updateScrollState();
      container.addEventListener("scroll", updateScrollState);
      window.addEventListener("resize", updateScrollState);
      return () => {
        container.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }
  }, [updateScrollState]);

  const scrollLeftHandler = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const newScrollLeft = Math.max(0, container.scrollLeft - 400);
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  const scrollRightHandler = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newScrollLeft = Math.min(maxScroll, container.scrollLeft + 400);
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with title and View All button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Top providers near you
          </h2>
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:shadow-md hover:shadow-primary-600/30 transition-all"
          >
            View all providers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Provider Cards - Horizontal Scroll with Side Arrows */}
        <div className="relative overflow-visible">
          {/* Left Arrow */}
          <button
            onClick={scrollLeftHandler}
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

          {/* Right Arrow */}
          <button
            onClick={scrollRightHandler}
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

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-scroll pb-4 scrollbar-hide"
          >
            {isLoadingProviders ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[310px] bg-gray-100 rounded-xl animate-pulse aspect-[3/4]" />
              ))
            ) : (
              featuredProviders.map((provider) => (
                <div key={provider.id} className="flex-shrink-0 w-[310px]">
                  <BrowseCard provider={provider} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile View All button */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:shadow-md hover:shadow-primary-600/30 transition-all"
          >
            View all providers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
