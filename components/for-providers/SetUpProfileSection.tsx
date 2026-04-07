"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useCitySearch } from "@/hooks/use-city-search";

const PREFILL_KEY = "olera_provider_search_prefill";

export default function SetUpProfileSection() {
  const { user, profiles } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const { results: cityResults, preload: preloadCities } = useCitySearch(cityInput);
  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  const handleSelectCity = (cityFull: string) => {
    setCityInput(cityFull);
    setSelectedCity(cityFull);
    setShowCityDropdown(false);
  };

  // Check if user already has a provider profile
  const hasProviderProfile = (profiles || []).some(
    (p) => p.type === "organization" || p.type === "caregiver"
  );

  const handleGetStarted = () => {
    const name = businessName.trim();
    const city = selectedCity || cityInput.trim();
    if (name || city) {
      try {
        sessionStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            searchQuery: name,
            locationQuery: city,
          }),
        );
      } catch {
        /* sessionStorage unavailable */
      }
    }

    // Navigate directly to onboarding (auth handled there)
    const targetUrl = (user && hasProviderProfile)
      ? "/provider/onboarding?adding=true"
      : "/provider/onboarding";

    router.push(targetUrl);
  };

  const showCitySuggestions = showCityDropdown && cityResults.length > 0;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900 text-center mb-12">
          Set up your profile
        </h2>

        <div className="max-w-5xl mx-auto rounded-2xl bg-gray-50 border border-gray-100 overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
            {/* Left — Form */}
            <div className="p-8 lg:p-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Add your business detail
              </h3>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="business-name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Business name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGetStarted();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div ref={cityDropdownRef} className="relative">
                  <label
                    htmlFor="city-input"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    City
                  </label>
                  <input
                    id="city-input"
                    type="text"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                      setSelectedCity(null);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => {
                      setShowCityDropdown(true);
                      preloadCities();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (showCitySuggestions && cityResults.length > 0) {
                          handleSelectCity(cityResults[0].full);
                        } else {
                          handleGetStarted();
                        }
                      }
                      if (e.key === "Escape") {
                        setShowCityDropdown(false);
                      }
                    }}
                    placeholder="e.g. Houston, TX"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />

                  {/* City dropdown — opens DOWN */}
                  {showCitySuggestions && (
                    <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50 max-h-[200px] overflow-y-auto">
                      {cityResults.slice(0, 5).map((city, index) => (
                        <button
                          key={city.full}
                          type="button"
                          onClick={() => handleSelectCity(city.full)}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${
                            index === 0
                              ? "bg-gray-50 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 text-gray-400 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{city.full}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetStarted}
                className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[44px]"
              >
                Get started
              </button>
            </div>

            {/* Right — Profile screenshot */}
            <div className="flex items-center justify-center p-4 lg:p-6">
              <Image
                src="/images/for-providers/profile-screenshot.png"
                alt="Provider profile page on Olera"
                width={789}
                height={700}
                className="w-full h-auto rounded-lg shadow-lg"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
