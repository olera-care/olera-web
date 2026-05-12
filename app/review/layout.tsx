import type { Metadata } from "next";

// /review/[slug] is a review-collection form (star picker + textarea), not a
// content page — it's the link providers send to clients to gather Google/Olera
// reviews. It has no search value and shouldn't be indexed. As of 2026-05 these
// pages were ~55% of GSC's "Crawled — currently not indexed" bucket because the
// "use client" page ships no SSR content and every provider page linked to it.
// `follow: true` lets any accrued link equity flow back out to the provider page.
// Next.js replaces (does not deep-merge) the parent `robots` object, but spell
// out googleBot too so the noindex is unambiguous regardless of merge behavior —
// the root layout sets a googleBot block with index:true that we must not inherit.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
