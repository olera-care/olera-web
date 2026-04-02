import type { Metadata } from "next";
import HeroSection from "@/components/for-providers/HeroSection";
import EasyToConnectSection from "@/components/for-providers/EasyToConnectSection";
import StatsSection from "@/components/for-providers/StatsSection";
import SetUpProfileSection from "@/components/for-providers/SetUpProfileSection";
import BenefitsSection from "@/components/for-providers/BenefitsSection";
import StaffingSection from "@/components/for-providers/StaffingSection";
import LeadershipSection from "@/components/for-providers/LeadershipSection";
import FAQSection from "@/components/for-providers/FAQSection";
import BottomCTASection from "@/components/for-providers/BottomCTASection";
import ProviderRedirect from "@/components/for-providers/ProviderRedirect";

export const metadata: Metadata = {
  title: "For Providers | Reach More Families & Staff Your Shifts on Olera",
  description:
    "Grow your senior care business on Olera. Get found by families, connect with leads, and hire vetted caregivers from university health programs — free to get started.",
  alternates: {
    canonical: "/for-providers",
  },
  openGraph: {
    title: "For Providers | Reach More Families & Staff Your Shifts on Olera",
    description:
      "Grow your senior care business on Olera. Get found by families and hire vetted caregivers from university health programs.",
    url: "/for-providers",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Providers | Reach More Families & Staff Your Shifts on Olera",
    description:
      "Grow your senior care business on Olera. Get found by families and hire vetted caregivers from university health programs.",
  },
};

export default function ForProvidersPage() {
  return (
    <main>
      {/* Redirect logged-in providers to their dashboard */}
      <ProviderRedirect />
      <HeroSection />
      <EasyToConnectSection />
      <StatsSection />
      <SetUpProfileSection />
      <BenefitsSection />
      <StaffingSection />
      <LeadershipSection />
      <FAQSection />
      <BottomCTASection />
    </main>
  );
}
