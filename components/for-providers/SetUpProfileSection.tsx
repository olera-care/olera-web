"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";

const PREFILL_KEY = "olera_provider_search_prefill";

export default function SetUpProfileSection() {
  const { user, profiles } = useAuth();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<SelectedOrg | null>(null);

  // Check if user already has a provider profile
  const hasProviderProfile = (profiles || []).some(
    (p) => p.type === "organization" || p.type === "caregiver"
  );

  const handleOrgSelect = useCallback((org: SelectedOrg | null) => {
    setSelectedOrg(org);
  }, []);

  const handleGetStarted = () => {
    // Store search data for onboarding page to read
    try {
      if (selectedOrg) {
        // User selected an existing org from autocomplete
        sessionStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            selectedOrg: selectedOrg,
            searchQuery: "",
          }),
        );
      } else if (searchInput.trim()) {
        // User typed but didn't select - treat as org name search
        sessionStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            searchQuery: searchInput.trim(),
            selectedOrg: null,
          }),
        );
      }
    } catch {
      /* sessionStorage unavailable */
    }

    // Navigate directly to onboarding (auth handled there)
    const targetUrl = (user && hasProviderProfile)
      ? "/provider/onboarding?adding=true"
      : "/provider/onboarding";

    router.push(targetUrl);
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !selectedOrg && searchInput.trim()) {
      e.preventDefault();
      handleGetStarted();
    }
  };

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
                Find your organization
              </h3>

              <div className="mt-6 space-y-4">
                {/* Organization search with autocomplete */}
                <div onKeyDown={handleKeyDown}>
                  <label
                    htmlFor="org-search"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Organization name
                  </label>
                  <OrganizationSearch
                    value={searchInput}
                    onChange={(value) => {
                      setSearchInput(value);
                      // Clear selected org when user types something different
                      if (selectedOrg && value !== selectedOrg.name) {
                        setSelectedOrg(null);
                      }
                    }}
                    onSelect={handleOrgSelect}
                    placeholder="Search for your organization"
                  />
                </div>

                {/* City (auto-filled when org is selected) */}
                {selectedOrg && (selectedOrg.city || selectedOrg.state) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-base">
                        {[selectedOrg.city, selectedOrg.state].filter(Boolean).join(", ")}
                      </span>
                      <svg className="w-4 h-4 text-primary-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Selected org confirmation */}
                {selectedOrg && (
                  <p className="text-sm text-primary-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected: {selectedOrg.name}
                    {selectedOrg.claimState === "claimed" && (
                      <span className="text-amber-600 font-medium">(Claimed)</span>
                    )}
                  </p>
                )}
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
