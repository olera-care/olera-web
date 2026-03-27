import type { Metadata } from "next";
import WelcomeClient from "@/components/welcome/WelcomeClient";

// Static page — no server-side data fetching.
// Provider data fetched client-side to avoid blocking page render.
// Guest users arriving from enrichment would otherwise wait 3-5s
// for server-side Supabase auth that always fails (no session cookie yet).

export const metadata: Metadata = {
  title: "Welcome | Olera",
  description: "Tell us about your care needs so we can help you find the right providers.",
};

export default function WelcomePage() {
  return <WelcomeClient destination="/portal/inbox" />;
}
