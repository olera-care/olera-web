"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";

const PREFILL_KEY = "olera_provider_search_prefill";

export default function BottomCTASection() {
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
    if (e.key === "Enter" && !selectedOrg && searchInput.trim()) {
      e.preventDefault();
      handleGetStarted();
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-2xl px-6 sm:px-12 py-12 sm:py-16 text-center overflow-visible">
          <h2 className="font-serif text-display-sm md:text-display-md font-bold text-white">
            Ready to get started?
          </h2>

          {/* Search bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
            <div className="relative flex-1 w-full" onKeyDown={handleKeyDown}>
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
                variant="dark"
              />
            </div>
            <button
              type="button"
              onClick={handleGetStarted}
              className="shrink-0 w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[48px]"
            >
              Get started
            </button>
          </div>

          {/* Selected org indicator */}
          {selectedOrg && (
            <p className="mt-4 text-sm text-white/80 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{selectedOrg.name}</span>
              {selectedOrg.city && selectedOrg.state && (
                <span className="text-white/60">• {selectedOrg.city}, {selectedOrg.state}</span>
              )}
              {selectedOrg.claimState === "claimed" && (
                <span className="text-amber-300 text-xs">(Claimed)</span>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
