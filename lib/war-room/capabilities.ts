import type { WarRoomProposalEvidence } from "@/lib/war-room/types";

/**
 * A deliberately conservative inventory of company capabilities that are easy
 * for an operating model to falsely rediscover from aggregate metrics. This is
 * repository-owned evidence: when one of these systems materially changes, the
 * same PR should update its entry. It proves presence, never absence.
 */
const CAPABILITIES: Array<{
  id: string;
  label: string;
  detail: string;
  paths: string[];
}> = [
  {
    id: "provider-question-loop",
    label: "Provider question notification and answer loop",
    detail: "Question creation records question-level activity, resolves directory and claimed-provider identities, sends a tracked one-click provider email, flags missing or suppressed contact information, routes to the exact question, and records the answer.",
    paths: ["app/api/questions/route.ts", "app/api/provider/questions/route.ts", "app/provider/[slug]/onboard/page.tsx"],
  },
  {
    id: "provider-email-funnel",
    label: "Provider communication funnel",
    detail: "Admin analytics already report provider email sent, delivered, opened, clicked, one-click access, answering, dashboard arrival, and downstream activation with explicit attribution caveats.",
    paths: ["app/api/admin/analytics/summary/route.ts", "app/admin/analytics/page.tsx"],
  },
  {
    id: "provider-contact-operations",
    label: "Provider contact acquisition operations",
    detail: "Admin workflows already identify missing or dead provider emails, search and verify replacements, track no-contact and not-interested states, and support provider outreach across email, phone, fax, mailer, and Smartlead workflows.",
    paths: ["app/admin/questions/page.tsx", "app/admin/provider-outreach/page.tsx", "app/api/admin/provider-outreach"],
  },
  {
    id: "organic-page-intelligence",
    label: "Organic acquisition and page-family intelligence",
    detail: "Weekly GA4 and Search Console collection includes channel mix, organic landing pages, search queries and pages. Admin page intelligence compares provider, benefits, and editorial performance and directionally connects those pages to family leads.",
    paths: ["lib/growth/collector.server.ts", "app/api/admin/organic-growth/pages/route.ts", "app/admin/organic-growth/page.tsx"],
  },
  {
    id: "provider-directory",
    label: "Provider directory and identity system",
    detail: "Olera has provider search, directory hydration, identity resolution, ownership, claims, verification, reviews, and provider-page rendering across directory and claimed-provider records.",
    paths: ["lib/providers", "lib/provider-identity.ts", "app/provider/[slug]/page.tsx", "app/admin/directory"],
  },
  {
    id: "benefits-guidance",
    label: "Benefits guidance and family follow-through",
    detail: "Olera has benefits eligibility, local-program matching, care-need inference, profile enrichment, navigator review, provider tie-ins, and family communications for benefits users.",
    paths: ["lib/benefits", "lib/family-comms", "app/admin/benefits/page.tsx"],
  },
  {
    id: "editorial-content",
    label: "Editorial content system",
    detail: "Olera has article topic, rendering, byline, admin editing, and organic page-category measurement for editorial acquisition.",
    paths: ["lib/article-topics.ts", "lib/article-html.ts", "app/admin/content", "lib/analytics/content-pages.ts"],
  },
  {
    id: "ad-boost-revenue",
    label: "Ad Boost acquisition, delivery, and billing",
    detail: "Ad Boost has an admin pipeline, eligibility, campaign delivery, outcome reporting, lifecycle communications, Stripe-backed billing, receipts, and conversion analytics.",
    paths: ["lib/ad-boost", "app/admin/ad-boost", "app/api/admin/ad-boost/route.ts"],
  },
  {
    id: "support-email",
    label: "Support inbox and customer-voice system",
    detail: "The admin support inbox syncs Gmail, classifies threads, preserves attachments, tracks priority and state, and supports bulk handling while exposing current customer evidence to War Room.",
    paths: ["lib/support-email", "app/admin/support-email/page.tsx", "app/api/admin/support-email"],
  },
  {
    id: "product-experimentation",
    label: "Product experimentation and funnel analytics",
    detail: "Olera already assigns and measures multiple product variants across provider-page calls to action, benefits enrichment, mobile navigation, and managed-ads conversion.",
    paths: ["lib/analytics", "app/api/admin/analytics", "app/admin/analytics/page.tsx"],
  },
  {
    id: "family-connections",
    label: "Family-to-provider connection operations",
    detail: "Olera records inbound care inquiries, provider delivery and engagement, contact repair, connection status, hot leads, pulse reporting, and administrative follow-through.",
    paths: ["app/admin/connections/page.tsx", "app/api/admin/connections", "lib/connection-engagement.ts"],
  },
  {
    id: "medjobs-revenue",
    label: "MedJobs provider and subscription operations",
    detail: "MedJobs has provider prospecting, client state, interview workflows, Stripe subscription metadata, outreach, and administrative reporting. It is not yet consolidated into War Room revenue.",
    paths: ["app/admin/medjobs", "app/api/admin/medjobs", "lib/medjobs"],
  },
];

export function warRoomCapabilityEvidence(): WarRoomProposalEvidence[] {
  return CAPABILITIES.map((capability) => ({
    id: `capability:${capability.id}`,
    label: capability.label,
    detail: `${capability.detail} Repository paths: ${capability.paths.join(", ")}.`,
    source: "repository:capability-index",
    freshness: "current",
  }));
}
