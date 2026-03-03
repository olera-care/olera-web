import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research & Press | Olera",
  description:
    "The latest in senior care research, industry news, and Olera announcements. Stay informed about what matters in eldercare.",
  alternates: {
    canonical: "https://olera.care/research-and-press",
  },
  openGraph: {
    title: "Research & Press | Olera",
    description:
      "The latest in senior care research, industry news, and Olera announcements.",
    url: "https://olera.care/research-and-press",
    siteName: "Olera",
    type: "website",
  },
};

export default function ResearchAndPressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
