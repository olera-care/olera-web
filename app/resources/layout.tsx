import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Care Seeker Resources | Guides & Articles | Olera",
  description:
    "Guides, comparisons, and practical advice to help you navigate senior care options. From home health to assisted living, find the information you need.",
  alternates: {
    canonical: "https://olera.care/resources",
  },
  openGraph: {
    title: "Care Seeker Resources | Olera",
    description:
      "Guides, comparisons, and practical advice to help you navigate senior care options.",
    url: "https://olera.care/resources",
    siteName: "Olera",
    type: "website",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
