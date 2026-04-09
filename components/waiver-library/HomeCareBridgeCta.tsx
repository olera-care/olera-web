"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PROVIDERS_TABLE,
  toCardFormat,
  type Provider as SupabaseProvider,
  type ProviderCardData,
} from "@/lib/types/provider";

interface HomeCareBridgeCtaProps {
  /** Two-letter state code, e.g. "TX" */
  stateCode: string;
  /** Full state name for copy, e.g. "Texas" */
  stateName: string;
  /** Override heading text */
  heading?: string;
  /** Override subheading text */
  subheading?: string;
}

export function HomeCareBridgeCta({ stateCode, stateName, heading, subheading }: HomeCareBridgeCtaProps) {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProviders() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from(PROVIDERS_TABLE)
          .select("*")
          .eq("state", stateCode)
          .eq("provider_category", "Home Care (Non-medical)")
          .or("deleted.is.null,deleted.eq.false")
          .order("community_Score", { ascending: false, nullsFirst: false })
          .order("google_rating", { ascending: false, nullsFirst: false })
          .limit(3);

        if (cancelled) return;
        if (error || !data) {
          setProviders([]);
        } else {
          setProviders(data.map((p: SupabaseProvider) => toCardFormat(p)));
        }
      } catch {
        if (!cancelled) setProviders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();
    const location = trimmed || stateCode;
    router.push(`/browse?type=home-care&location=${encodeURIComponent(location)}`);
  }

  return (
    <section className="pb-16 md:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 mb-4">
                <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                {heading ?? "Want to Stay at Home?"}
              </h2>
              <p className="mt-2 text-gray-600 text-base md:text-lg">
                {subheading ?? `Find home care providers near you in ${stateName}.`}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-5 flex flex-col sm:flex-row items-stretch gap-2 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    placeholder="Enter ZIP code"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-md shadow-primary-600/25 transition-colors"
                >
                  Search
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Featured providers */}
            <div className="mt-8">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : providers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((p) => (
                    <Link
                      key={p.id}
                      href={`/provider/${p.slug}`}
                      className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all bg-white"
                    >
                      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        {p.verified && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white/95 rounded-full text-[10px] font-semibold text-primary-700 shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-700 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.address}</p>
                        {p.rating > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-warning-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 .587l3.668 7.568L24 9.75l-6 5.848L19.335 24 12 19.897 4.665 24 6 15.598 0 9.75l8.332-1.595z" />
                            </svg>
                            <span className="text-xs font-semibold text-gray-900">{p.rating.toFixed(1)}</span>
                            {p.reviewCount ? (
                              <span className="text-xs text-gray-500">({p.reviewCount})</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 text-center">
                <Link
                  href={`/browse?type=home-care&location=${encodeURIComponent(stateCode)}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-600 hover:underline transition-colors"
                >
                  Browse all {stateName} home care providers
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
