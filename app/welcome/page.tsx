import type { Metadata } from "next";
import { Suspense } from "react";
import WelcomeClient from "@/components/welcome/WelcomeClient";
import WelcomeLoading from "./loading";

// Static page — no server-side data fetching.
// Provider data fetched client-side to avoid blocking page render.
// Guest users arriving from enrichment would otherwise wait 3-5s
// for server-side Supabase auth that always fails (no session cookie yet).

// Suspense boundary required: WelcomeClient uses useSearchParams() to read
// ?connection= and ?provider= params. Without Suspense, search params are
// empty on initial static render and the connection card never appears.

export const metadata: Metadata = {
  title: "Welcome | Olera",
  description: "Tell us about your care needs so we can help you find the right providers.",
};

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeLoading />}>
      <WelcomeClient destination="/portal/inbox" />
    </Suspense>
  );
}
