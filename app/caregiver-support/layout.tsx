import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caregiver Support | Guides & Articles | Olera",
  description:
    "Guides, comparisons, and practical advice to help you navigate senior care options. From home health to assisted living, find the information you need.",
  alternates: {
    canonical: "https://olera.care/caregiver-support",
  },
  openGraph: {
    title: "Caregiver Support | Olera",
    description:
      "Guides, comparisons, and practical advice to help you navigate senior care options.",
    url: "https://olera.care/caregiver-support",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caregiver Support | Olera",
    description:
      "Guides, comparisons, and practical advice to help you navigate senior care options.",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
