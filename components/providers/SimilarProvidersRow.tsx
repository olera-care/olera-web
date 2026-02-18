"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProviderCard from "@/components/providers/ProviderCard";
import { createClient } from "@/lib/supabase/client";
import {
  type Provider as IOSProvider,
  type ProviderCardData,
  PROVIDERS_TABLE,
  toCardFormat,
} from "@/lib/types/provider";

interface SimilarProvidersRowProps {
  category?: string;
  city?: string;
  state?: string;
  excludeSlug?: string;
}

export default function SimilarProvidersRow({
  category,
  city,
  state,
  excludeSlug,
}: SimilarProvidersRowProps) {
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollState);
      window.addEventListener("resize", updateScrollState);
      return () => {
        container.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }
  }, [updateScrollState, providers]);

  useEffect(() => {
    async function fetchSimilar() {
      // Need at least location or category to query
      if (!category && !city && !state) {
        setProviders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .not("deleted", "is", true)
          .not("provider_images", "is", null)
          .gte("google_rating", 3.5)
          .order("google_rating", { ascending: false, nullsFirst: false })
          .limit(12);

        if (category) query = query.ilike("provider_category", `%${category}%`);
        if (city) query = query.ilike("provider_city", city);
        if (state) query = query.ilike("provider_state", state);

        const { data, error } = await query;

        if (error || !data) {
          setProviders([]);
        } else {
          const formatted = (data as IOSProvider[])
            .map(toCardFormat)
            .filter((p) => p.slug !== excludeSlug)
            .slice(0, 8);

          // If location+category returned too few, broaden to just state
          if (formatted.length < 4 && (city || category)) {
            let broader_query = supabase
              .from(PROVIDERS_TABLE)
              .select("*")
              .not("deleted", "is", true)
              .not("provider_images", "is", null)
              .gte("google_rating", 3.5)
              .order("google_rating", { ascending: false, nullsFirst: false })
              .limit(12);

            if (state) broader_query = broader_query.ilike("provider_state", state);

            const { data: broader } = await broader_query;

            if (broader) {
              const broaderFormatted = (broader as IOSProvider[])
                .map(toCardFormat)
                .filter((p) => p.slug !== excludeSlug)
                .slice(0, 8);
              setProviders(broaderFormatted);
              return;
            }
          }

          setProviders(formatted);
        }
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
        setTimeout(() => updateScrollState(), 50);
      }
    }

    fetchSimilar();
  }, [category, city, state, excludeSlug, updateScrollState]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollRef.current.scrollLeft - 400),
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const max = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: Math.min(max, scrollRef.current.scrollLeft + 400),
        behavior: "smooth",
      });
    }
  };

  if (!loading && providers.length === 0) return null;

  return (
    <section className="pt-8 md:pt-12 pb-6 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            You might also like
          </h2>
        </div>

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
            ref={scrollRef}
            className="flex gap-5 overflow-x-scroll pb-4 scrollbar-hide"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[370px] h-[512px] bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : (
              providers.map((provider) => (
                <div key={provider.id} className="flex-shrink-0 w-[370px] h-[512px]">
                  <ProviderCard provider={provider} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
