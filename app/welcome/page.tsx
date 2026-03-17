import type { Metadata } from "next";
import WelcomeClient from "@/components/welcome/WelcomeClient";

export const metadata: Metadata = {
  title: "Welcome | Olera",
  description: "Tell us about your care needs so we can help you find the right providers.",
};

interface WelcomePageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const destination = params.next || "/portal/inbox";

  return <WelcomeClient destination={destination} />;
}
