import type { Metadata } from "next";
import HideFooter from "./HideFooter";

export const metadata: Metadata = {
  title: "Community | Olera",
  description:
    "Join the Olera community — share experiences, ask questions, and connect with other caregivers navigating senior care.",
  alternates: {
    canonical: "/community",
  },
  openGraph: {
    title: "Community | Olera",
    description:
      "Join the Olera community — share experiences, ask questions, and connect with other caregivers.",
    url: "/community",
    type: "website",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HideFooter />
      {children}
    </>
  );
}
