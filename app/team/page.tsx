import type { Metadata } from "next";
import HeroSection from "@/components/team/HeroSection";
import TeamSection from "@/components/team/TeamSection";

export const metadata: Metadata = {
  title: "Our Team | Olera",
  description:
    "Meet the team behind Olera — building a better way for families to find quality senior care.",
  alternates: {
    canonical: "/team",
  },
  openGraph: {
    title: "Our Team | Olera",
    description:
      "Meet the team behind Olera — building a better way for families to find quality senior care.",
    url: "/team",
    type: "website",
  },
};

export default function TeamPage() {
  return (
    <main>
      <HeroSection />
      <TeamSection />
    </main>
  );
}
