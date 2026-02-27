import type { Metadata } from "next";
import HeroSection from "@/components/for-providers/HeroSection";
import EasyToConnectSection from "@/components/for-providers/EasyToConnectSection";
import StatsSection from "@/components/for-providers/StatsSection";
import SetUpProfileSection from "@/components/for-providers/SetUpProfileSection";
import BenefitsSection from "@/components/for-providers/BenefitsSection";
import LeadershipSection from "@/components/for-providers/LeadershipSection";
import FAQSection from "@/components/for-providers/FAQSection";
import BottomCTASection from "@/components/for-providers/BottomCTASection";

export const metadata: Metadata = {
  title: "For Providers | Reach More Families on Olera",
  description:
    "Join a network of senior care providers families trust. Set up your profile, get found in local searches, and connect with families — free to get started.",
  openGraph: {
    title: "For Providers | Reach More Families on Olera",
    description:
      "Join a network of senior care providers families trust. Set up your profile, get found in local searches, and connect with families.",
    url: "/for-providers",
    type: "website",
  },
};

export default function ForProvidersPage() {
  return (
    <main>
      <HeroSection />
      <EasyToConnectSection />
      <StatsSection />
      <SetUpProfileSection />
      <BenefitsSection />
      <LeadershipSection />
      <FAQSection />
      <BottomCTASection />
    </main>
  );
}
