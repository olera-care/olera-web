import HeroSection from "@/components/home/HeroSection";
import TopProvidersSection from "@/components/home/TopProvidersSection";
import ExploreCareSection from "@/components/home/ExploreCareSection";
import CommunitySection from "@/components/home/CommunitySection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      {/* Test banner - remove after verifying preview deployment */}
      <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium">
        Preview Branch Test — Deployment Verified (Rebased on Staging)
      </div>
      <HeroSection />
      <TopProvidersSection />
      <ExploreCareSection />
      <CommunitySection />
      <CTASection />
    </div>
  );
}
