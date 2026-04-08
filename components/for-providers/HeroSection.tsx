"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";

const PREFILL_KEY = "olera_provider_search_prefill";

export default function HeroSection() {
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

    // Navigate directly to onboarding (auth moved to end of flow)
    const targetUrl = (user && hasProviderProfile)
      ? "/provider/onboarding?adding=true"
      : "/provider/onboarding";

    router.push(targetUrl);
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle Enter if dropdown is not managing it
    // OrganizationSearch handles its own Enter for selection
    if (e.key === "Enter" && !selectedOrg && searchInput.trim()) {
      e.preventDefault();
      handleGetStarted();
    }
  };

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Edge-to-edge background image */}
      <Image
        src="/images/for-providers/hero.jpg"
        alt="Caregiver with elderly woman"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto w-full relative px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h1 className="font-serif text-display-md sm:text-display-lg lg:text-display-xl font-bold text-white leading-tight">
              Reach more families
            </h1>
            <p className="mt-3 text-lg text-white/85">
              Join a network of senior care providers families trust
            </p>

            {/* Search bar - Organization autocomplete */}
            <div className="mt-6 flex items-center gap-3 max-w-md">
              <div className="relative flex-1" onKeyDown={handleKeyDown}>
                <OrganizationSearch
                  value={searchInput}
                  onChange={setSearchInput}
                  onSelect={handleOrgSelect}
                  placeholder="Search for your organization"
                />
                {selectedOrg && (
                  <div className="absolute -bottom-6 left-0 text-sm text-white/80 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="truncate max-w-[200px]">{selectedOrg.name}</span>
                    {selectedOrg.claimState === "claimed" && (
                      <span className="text-amber-300 text-xs">(Claimed)</span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleGetStarted}
                className="shrink-0 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[48px]"
              >
                Get started
              </button>
            </div>
          </div>

          {/* NIH badge — aligned to right edge of container */}
          <div className="absolute bottom-0 right-0 hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-white/90 flex items-center justify-center text-xs font-bold text-gray-700">
              NIH
            </div>
            <div className="text-xs text-white/90">
              <span className="block text-white/60 text-[10px]">
                Proudly supported by
              </span>
              <span className="font-medium">National Institute on Aging</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
