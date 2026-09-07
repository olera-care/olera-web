import type { Metadata } from "next";
import ManagedAdsHero from "@/components/managed-ads/ManagedAdsHero";
import ResultsTicker from "@/components/managed-ads/ResultsTicker";
import TwoEngines from "@/components/managed-ads/TwoEngines";
import WhatWeKnow from "@/components/managed-ads/WhatWeKnow";
import TheLoop from "@/components/managed-ads/TheLoop";
import TheHandoff from "@/components/managed-ads/TheHandoff";
import Pricing from "@/components/managed-ads/Pricing";
import HonestLimits from "@/components/managed-ads/HonestLimits";
import { getManagedAdsStats } from "@/lib/managed-ads/stats.server";

/**
 * /managed-ads — the public explainer for Olera Managed Ads.
 *
 * WHY THIS EXISTS
 * The product surface at /provider/boost is behind the sign-in wall, so the
 * only thing a provider could be sent before claiming their page was a pitch
 * of three sentences. Meanwhile what we run is two ad products, a qualification
 * form, a consent record, a sequential provider relay, a follow-up loop, and a
 * standing optimization routine — and none of that was written down anywhere a
 * provider could read it. This page is that. It doubles as the internal
 * description of the system, which is why it names mechanisms rather than
 * benefits.
 *
 * THE RULE FOR EDITING IT
 * Every claim on this page is traceable to code or to a measured campaign. The
 * section files carry the guardrails for their own content; the ones that bite
 * hardest are that the automatic provider relay is built but dormant (both live
 * metros are concierge-routed), that no Meta campaign has ever run, and that
 * spend and click figures are hand-reconciled and therefore a floor. If a claim
 * cannot be traced, it does not go on a page whose whole argument is that our
 * numbers can be checked.
 *
 * Sits next to /managed-ads-terms, which is noindex legal copy. This one is
 * indexed and is in app/sitemap.ts.
 */

export const revalidate = 900;

const TITLE = "Managed Ads for Senior Care Providers | Olera";
const DESCRIPTION =
  "Olera builds and runs the ads that bring local families to senior care providers, on Google and Nextdoor. Your first campaign is free. See exactly what our campaigns have cost and delivered.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/managed-ads" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/managed-ads",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function ManagedAdsPage() {
  const stats = await getManagedAdsStats();

  // Render the strip only when a real signal came back. An unreadable database
  // would otherwise print a confident row of zeroes next to a page arguing that
  // our numbers are checkable, which is the worst available outcome.
  const hasSignal =
    !!stats && (stats.spendCents > 0 || stats.clicks > 0 || stats.familiesDelivered > 0);

  return (
    <main>
      <ManagedAdsHero />
      {hasSignal && stats ? <ResultsTicker stats={stats} /> : null}
      <TwoEngines />
      <WhatWeKnow />
      <TheLoop />
      <TheHandoff />
      <Pricing />
      <HonestLimits />
    </main>
  );
}
