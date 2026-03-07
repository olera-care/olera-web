import { headers } from "next/headers";
import HeroSection from "@/components/home/HeroSection";
import TopProvidersSection from "@/components/home/TopProvidersSection";
import ExploreCareSection from "@/components/home/ExploreCareSection";
import CommunitySection from "@/components/home/CommunitySection";
import CTASection from "@/components/home/CTASection";
import { US_STATES } from "@/lib/power-pages";

export default async function HomePage() {
  const hdrs = await headers();
  const region = hdrs.get("x-vercel-ip-country-region"); // 2-letter state code e.g. "TX"
  const geoState = region && US_STATES[region] ? region : null;

  return (
    <div className="bg-gray-50">
      <HeroSection />
      <TopProvidersSection geoState={geoState} />
      <ExploreCareSection />
      <CommunitySection />
      <CTASection />
    </div>
  );
}
