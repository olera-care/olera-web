import HeroSection from "@/components/home/HeroSection";
import TopProvidersSection from "@/components/home/TopProvidersSection";
import ExploreCareSection from "@/components/home/ExploreCareSection";
import CommunitySection from "@/components/home/CommunitySection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      <HeroSection />
      <TopProvidersSection />
      <ExploreCareSection />
      <CommunitySection />
      <CTASection />
    </div>
  );
}
