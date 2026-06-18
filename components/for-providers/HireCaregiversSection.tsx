"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";

/**
 * HireCaregiversSection — the provider-side mirror of the "Reach more families"
 * hero. Same OrganizationSearch + "Get started" UI/behavior, but anchored
 * bottom-RIGHT (the hero sits bottom-left) so the two photo bands bookend the
 * page. "Get started" routes into the hire-caregivers funnel: /medjobs/candidates
 * opens the "Tell us your hiring needs" screener → the Hire Caregivers board.
 */
export default function HireCaregiversSection() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<SelectedOrg | null>(null);

  const handleOrgSelect = useCallback((org: SelectedOrg | null) => {
    setSelectedOrg(org);
  }, []);

  const handleGetStarted = () => {
    // Into the hire-caregivers funnel: ?welcome=1 auto-opens the "Tell us your
    // hiring needs" screener on the candidates board for a not-yet-eligible
    // provider. The screener collects the org itself, so nothing to thread here.
    router.push("/medjobs/candidates?welcome=1");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !selectedOrg && searchInput.trim()) {
      e.preventDefault();
      handleGetStarted();
    }
  };

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px]">
      {/* Edge-to-edge background image */}
      <Image
        src="/images/medjobs/hero-caregiving.jpg"
        alt="College student caregiver with a senior"
        fill
        className="object-cover"
        sizes="100vw"
      />

      {/* Brand-green gradient — heavier on the RIGHT for text, transparent on the
          left to show the photo (mirror of the hero's left-weighted overlay) */}
      <div className="absolute inset-0 bg-gradient-to-l from-primary-900/85 via-primary-800/55 to-transparent" />

      {/* Content overlay — anchored bottom-right */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto w-full relative px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl ml-auto text-right">
            <h2 className="font-serif text-display-md sm:text-display-lg lg:text-display-xl font-bold text-white leading-tight">
              Hire more caregivers
            </h2>
            <p className="mt-3 text-lg text-white/85">
              Staff your open shifts with college students
            </p>

            {/* Search bar — Organization autocomplete (same UI as the hero) */}
            <div className="mt-6 flex items-center gap-3 max-w-md ml-auto">
              <div className="relative flex-1 text-left" onKeyDown={handleKeyDown}>
                <OrganizationSearch
                  value={searchInput}
                  onChange={setSearchInput}
                  onSelect={handleOrgSelect}
                  placeholder="Search for your organization"
                  variant="dark"
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
        </div>
      </div>
    </section>
  );
}
