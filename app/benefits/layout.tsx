import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senior Care Benefits Finder | Check Eligibility in 2 Minutes | Olera",
  description:
    "Find Medicaid waivers, HCBS programs, and senior care benefits you qualify for. Free eligibility check — no signup required.",
  alternates: { canonical: "/benefits/finder" },
  openGraph: {
    title: "Senior Care Benefits Finder | Olera",
    description:
      "Find Medicaid waivers, HCBS programs, and senior care benefits you qualify for. Free eligibility check.",
    url: "/benefits/finder",
    siteName: "Olera",
    type: "website",
  },
};

export default function BenefitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
