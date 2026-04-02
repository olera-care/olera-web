import type { Metadata } from "next";
import HeroSection from "@/components/for-providers/HeroSection";
import EasyToConnectSection from "@/components/for-providers/EasyToConnectSection";
import StatsSection from "@/components/for-providers/StatsSection";
import StaffingSection from "@/components/for-providers/StaffingSection";
import SetUpProfileSection from "@/components/for-providers/SetUpProfileSection";
import LeadershipSection from "@/components/for-providers/LeadershipSection";
import VideoSection from "@/components/for-providers/VideoSection";
import FAQSection from "@/components/for-providers/FAQSection";
import BottomCTASection from "@/components/for-providers/BottomCTASection";
import ProviderRedirect from "@/components/for-providers/ProviderRedirect";

export const metadata: Metadata = {
  title: "For Providers | Reach More Families & Staff Your Shifts on Olera",
  description:
    "Grow your senior care business on Olera. Get found by families, connect with leads, and hire vetted caregivers from university health programs. Free to get started.",
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

      {/* Bridge — transition from families to staffing */}
      <section className="pt-14 sm:pt-16 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-display-sm sm:text-display-md font-bold text-gray-900 tracking-tight">
              You have the clients.
              <br />
              <span className="text-primary-600">Now staff the shifts.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Growing your census is only half the challenge. The other half is
              finding reliable caregivers to deliver the care families expect.
            </p>
          </div>
        </div>
      </section>

      <StaffingSection />
      <SetUpProfileSection />
      <LeadershipSection />
      <VideoSection />
      <FAQSection />
      <BottomCTASection />
    </main>
  );
}
