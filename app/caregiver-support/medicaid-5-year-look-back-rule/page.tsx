import Link from "next/link";
import type { Metadata } from "next";
import type { ArticleHeading } from "@/lib/article-html";
import { createClient } from "@/lib/supabase/server";
import {
  DesktopTableOfContents,
  MobileTableOfContents,
} from "@/components/article/TableOfContents";
import ShareButton from "@/components/article/ShareButton";
import StatePenaltyTable from "@/components/article/StatePenaltyTable";
import PenaltyCalculator from "@/components/article/PenaltyCalculator";

// ============================================================
// SEO Metadata
// ============================================================

const TITLE =
  "Medicaid 5-Year Look-Back Rule (2026): Penalties, State Rules & Exceptions";
const META_DESCRIPTION =
  "How the Medicaid 5-year look-back works in 2026: penalty calculations, state-by-state divisors, and the exceptions that protect your loved one\u2019s assets.";
const OG_DESCRIPTION =
  "A plain-English guide to the Medicaid 5-year look-back: penalties, state divisors, common mistakes, and legitimate exceptions.";
const SUBTITLE =
  "What the Medicaid 5-year look-back actually means for your family, how penalties get calculated, and the legitimate ways to protect your loved one\u2019s assets, explained without the legal jargon.";
const CANONICAL =
  "https://olera.care/caregiver-support/medicaid-5-year-look-back-rule";
const OG_IMAGE = "https://olera.care/images/medicaid-look-back-cover.png";

export const metadata: Metadata = {
  title: `${TITLE} | Olera`,
  description: META_DESCRIPTION,
  alternates: { canonical: CANONICAL },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: OG_DESCRIPTION,
    url: CANONICAL,
    siteName: "Olera",
    type: "article",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// ============================================================
// Reusable micro-components
// ============================================================

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3 mb-6">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-lg text-gray-700 leading-relaxed"
        >
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 my-6 flex items-start gap-3">
      <svg
        className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <div className="text-base text-amber-900 leading-relaxed">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-blue-50/50 border border-blue-100 px-6 py-5 my-6">
      <div className="text-base text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

/** Inline glossary term with hover/tap tooltip */
function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  return (
    <span className="relative group/glossary inline">
      <span
        className="font-semibold text-gray-900 border-b border-dashed border-gray-400 cursor-help"
        tabIndex={0}
        role="button"
        aria-label={`${term}: ${definition}`}
      >
        {term}
      </span>
      <span
        className="pointer-events-none group-hover/glossary:pointer-events-auto group-focus-within/glossary:pointer-events-auto
          invisible group-hover/glossary:visible group-focus-within/glossary:visible
          opacity-0 group-hover/glossary:opacity-100 group-focus-within/glossary:opacity-100
          transition-opacity duration-150
          absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
          w-64 px-3.5 py-2.5 rounded-lg
          bg-blue-100 text-gray-900 text-sm leading-snug shadow-lg"
      >
        <span className="font-semibold">{term}:</span>{" "}
        {definition}
        {/* arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-100" />
      </span>
    </span>
  );
}

// Glossary definitions
const GLOSSARY = {
  "penalty period": "A stretch of time during which Medicaid will not pay for long-term care because the applicant transferred assets for less than fair market value.",
  "penalty divisor": "The average monthly cost of nursing home care in a given state, used to calculate how many months of ineligibility a disqualifying transfer creates.",
  "disqualifying transfer": "Any gift or sale of assets for less than fair market value during the look-back window that triggers a Medicaid penalty.",
  "look-back period": "The 60-month (5-year) window before a Medicaid application during which the state reviews all financial transactions for improper transfers.",
  "Community Spouse Resource Allowance": "The portion of a couple\u2019s combined assets that the non-applicant spouse is allowed to keep when the other spouse applies for Medicaid. Federal max in 2026: $162,660.",
  "Personal Care Agreement": "A written contract that documents a family caregiver\u2019s duties, hours, and pay rate so Medicaid treats the payments as employment, not gifts.",
  "irrevocable trust": "A trust that cannot be changed or revoked once created. Assets placed inside are no longer owned by the person who funded it.",
  "estate recovery": "A process where states seek reimbursement from a deceased Medicaid recipient\u2019s estate for the cost of care that Medicaid paid.",
  "Medicaid waiver": "A state program (also called HCBS waiver) that provides long-term care services at home or in the community instead of in a nursing home.",
  "life estate": "A legal arrangement where someone transfers ownership of their home to another person but keeps the right to live there for life.",
  "spend down": "The process of reducing countable assets to meet Medicaid\u2019s eligibility limits through legitimate purchases or payments.",
  "Undue Hardship Waiver": "An emergency exception that waives the look-back penalty when enforcing it would leave the applicant without food, clothing, or shelter.",
  "fair market value": "The price a willing buyer would pay a willing seller in an open market \u2014 the benchmark Medicaid uses to judge whether a transfer was legitimate.",
  "Medicaid-compliant annuity": "An annuity structured to meet Medicaid rules: irrevocable, non-transferable, actuarially sound, and naming the state as remainder beneficiary.",
} as const;

// ============================================================
// Headings for TOC
// ============================================================

const HEADINGS: ArticleHeading[] = [
  { id: "quick-answer", text: "Quick Answer: What Is the Medicaid 5-Year Look-Back?", level: 2 },
  { id: "how-it-works", text: "How the Look-Back Period Actually Works", level: 2 },
  { id: "penalty-calculation", text: "How the Penalty Period Is Calculated", level: 2 },
  { id: "state-by-state", text: "State-by-State Look-Back Rules and Penalty Divisors", level: 2 },
  { id: "common-mistakes", text: "Common Mistakes That Trigger Penalties", level: 2 },
  { id: "medicare-vs-medicaid", text: "Medicare vs. Medicaid: There Is No Medicare Look-Back", level: 2 },
  { id: "exceptions", text: "Exceptions: Transferring Assets Without a Penalty", level: 2 },
  { id: "spend-down", text: "Legitimate Spend-Down Strategies", level: 2 },
  { id: "already-transferred", text: "What If You\u2019ve Already Made a Disqualifying Transfer?", level: 2 },
  { id: "planning-strategies", text: "Planning Strategies That Avoid the Look-Back Entirely", level: 2 },
  { id: "faq", text: "Frequently Asked Questions", level: 2 },
];

const READING_TIME = "22 min read";

// ============================================================
// State penalty divisor data
// ============================================================

const STATE_DATA: { state: string; period: string; divisor: string; notes: string }[] = [
  { state: "Alabama", period: "60 months", divisor: "~$7,200", notes: "Standard rules" },
  { state: "Alaska", period: "60 months", divisor: "~$22,400", notes: "Highest divisor in the country" },
  { state: "Arizona", period: "60 months", divisor: "~$8,500", notes: "Standard rules" },
  { state: "Arkansas", period: "60 months", divisor: "~$6,500", notes: "Standard rules" },
  { state: "California", period: "60 months (reimplementing 2026)", divisor: "Daily APPR-based (~$14,440/mo)", notes: "Daily gifting up to APPR allowed; only applies to Nursing Home Medicaid" },
  { state: "Colorado", period: "60 months", divisor: "~$9,500", notes: "Standard rules" },
  { state: "Connecticut", period: "60 months", divisor: "~$14,700", notes: "Standard rules" },
  { state: "Delaware", period: "60 months", divisor: "~$11,000", notes: "Standard rules" },
  { state: "Florida", period: "60 months", divisor: "~$10,500", notes: "Standard rules" },
  { state: "Georgia", period: "60 months", divisor: "~$8,400", notes: "Standard rules" },
  { state: "Hawaii", period: "60 months", divisor: "~$13,500", notes: "Standard rules" },
  { state: "Idaho", period: "60 months", divisor: "~$9,200", notes: "Standard rules" },
  { state: "Illinois", period: "60 months", divisor: "~$8,900", notes: "Standard rules" },
  { state: "Indiana", period: "60 months", divisor: "~$7,800", notes: "Standard rules" },
  { state: "Iowa", period: "60 months", divisor: "~$7,500", notes: "Standard rules" },
  { state: "Kansas", period: "60 months", divisor: "~$6,700", notes: "Standard rules" },
  { state: "Kentucky", period: "60 months", divisor: "~$9,200", notes: "Standard rules" },
  { state: "Louisiana", period: "60 months", divisor: "~$5,500", notes: "Among the lowest divisors" },
  { state: "Maine", period: "60 months", divisor: "~$11,800", notes: "Standard rules" },
  { state: "Maryland", period: "60 months", divisor: "~$11,200", notes: "Standard rules" },
  { state: "Massachusetts", period: "60 months", divisor: "~$13,800", notes: "Standard rules" },
  { state: "Michigan", period: "60 months", divisor: "~$9,400", notes: "Standard rules" },
  { state: "Minnesota", period: "60 months", divisor: "~$9,800", notes: "Standard rules" },
  { state: "Mississippi", period: "60 months", divisor: "~$6,600", notes: "Standard rules" },
  { state: "Missouri", period: "60 months", divisor: "~$5,800", notes: "Standard rules" },
  { state: "Montana", period: "60 months", divisor: "~$8,900", notes: "Standard rules" },
  { state: "Nebraska", period: "60 months", divisor: "~$7,200", notes: "Standard rules" },
  { state: "Nevada", period: "60 months", divisor: "~$10,200", notes: "Standard rules" },
  { state: "New Hampshire", period: "60 months", divisor: "~$11,400", notes: "Standard rules" },
  { state: "New Jersey", period: "60 months", divisor: "~$13,200", notes: "Standard rules" },
  { state: "New Mexico", period: "60 months", divisor: "~$8,400", notes: "Standard rules" },
  { state: "New York", period: "60 months (Nursing Home only)", divisor: "~$14,800", notes: "No look-back yet for Community Medicaid (HCBS). 30-month look-back planned but not yet implemented" },
  { state: "North Carolina", period: "60 months", divisor: "~$9,300", notes: "Standard rules" },
  { state: "North Dakota", period: "60 months", divisor: "~$10,800", notes: "Standard rules" },
  { state: "Ohio", period: "60 months", divisor: "~$7,800", notes: "Standard rules" },
  { state: "Oklahoma", period: "60 months", divisor: "~$6,800", notes: "Standard rules" },
  { state: "Oregon", period: "60 months", divisor: "~$10,400", notes: "Standard rules" },
  { state: "Pennsylvania", period: "60 months", divisor: "~$11,000", notes: "Allows gifting up to $500/month without penalty" },
  { state: "Rhode Island", period: "60 months", divisor: "~$11,600", notes: "Standard rules" },
  { state: "South Carolina", period: "60 months", divisor: "~$8,000", notes: "Standard rules" },
  { state: "South Dakota", period: "60 months", divisor: "~$8,400", notes: "Standard rules" },
  { state: "Tennessee", period: "60 months", divisor: "~$7,600", notes: "Standard rules" },
  { state: "Texas", period: "60 months", divisor: "~$7,900", notes: "Standard rules" },
  { state: "Utah", period: "60 months", divisor: "~$8,200", notes: "Standard rules" },
  { state: "Vermont", period: "60 months", divisor: "~$11,400", notes: "Standard rules" },
  { state: "Virginia", period: "60 months", divisor: "~$9,700", notes: "Standard rules" },
  { state: "Washington", period: "60 months", divisor: "~$11,800", notes: "Standard rules" },
  { state: "West Virginia", period: "60 months", divisor: "~$9,400", notes: "Standard rules" },
  { state: "Wisconsin", period: "60 months", divisor: "~$10,200", notes: "Standard rules" },
  { state: "Wyoming", period: "60 months", divisor: "~$10,600", notes: "Standard rules" },
  { state: "DC", period: "60 months", divisor: "~$13,500", notes: "Standard rules" },
];

// ============================================================
// JSON-LD
// ============================================================

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  headline: TITLE,
  description: META_DESCRIPTION,
  image: OG_IMAGE,
  datePublished: "2026-05-26",
  dateModified: "2026-05-26",
  author: { "@type": "Organization", name: "Olera", url: "https://olera.care" },
  reviewedBy: {
    "@type": "Person",
    name: "Dr. Logan DuBose",
    jobTitle: "Physician",
  },
  publisher: {
    "@type": "Organization",
    name: "Olera",
    url: "https://olera.care",
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": CANONICAL },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://olera.care",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Caregiver Support",
      item: "https://olera.care/caregiver-support",
    },
    { "@type": "ListItem", position: 3, name: TITLE, item: CANONICAL },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does the Medicaid look-back apply to my spouse's transfers, too?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The look-back review covers all transfers made by either spouse during the 60-month window, whether they\u2019re applying for Medicaid or not.",
      },
    },
    {
      "@type": "Question",
      name: "How far back does Medicaid actually look?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In 49 states, the look-back period is exactly 60 months (5 years) from the date of the long-term care Medicaid application. California is reimplementing the standard look-back in 2026 after temporarily having a 30-month rule.",
      },
    },
    {
      "@type": "Question",
      name: "Does the look-back apply to all Medicaid programs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The look-back only applies to long-term care Medicaid: nursing home Medicaid and Home and Community-Based Services (HCBS) waivers. Regular Medicaid does not have a look-back.",
      },
    },
    {
      "@type": "Question",
      name: "Can I gift the IRS annual exclusion amount ($19,000) without violating Medicaid rules?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The IRS gift tax exclusion and Medicaid look-back rules are completely separate. A gift can be tax-free and still trigger a Medicaid penalty.",
      },
    },
  ],
};

// ============================================================
// Page Component
// ============================================================

export default async function MedicaidLookBackRulePage() {
  const supabase = await createClient();
  const { data: related } = await supabase
    .from("content_articles")
    .select("id, slug, title, cover_image_url, care_types, reading_time")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-[1100px] mx-auto px-5 lg:flex lg:gap-16">
        {/* Left column: header + body */}
        <div className="flex-1 max-w-[680px]">
          {/* Header */}
          <header className="pt-8 md:pt-12">
            <Link
              href="/caregiver-support"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Caregiver Support
            </Link>

            <h1 className="font-display text-display-sm md:text-display-md text-gray-900 tracking-[-0.02em] mb-3">
              {TITLE}
            </h1>

            <p className="text-lg text-gray-500 mb-4">{SUBTITLE}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-10">
              <span>
                <span className="text-gray-400">Published by </span>
                <span className="font-medium text-gray-700">Olera team</span>
              </span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <img
                  src="/images/for-providers/team/logan.jpg"
                  alt="Dr. Logan DuBose"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span>
                  <span className="text-gray-400">Verified by </span>
                  <Link
                    href="/author/dr-logan-dubose"
                    className="font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Dr. Logan DuBose
                  </Link>
                </span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">{READING_TIME}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">Last updated May 26, 2026</span>
              <span className="text-gray-300">|</span>
              <ShareButton />
            </div>
          </header>

          {/* Hero Image */}
          <figure className="mb-10">
            <img
              src="/images/medicaid-look-back-cover.png"
              alt="Father and son reviewing financial documents together at a kitchen table"
              className="w-full aspect-[16/9] object-cover object-top rounded-2xl"
            />
          </figure>

          {/* Article body */}
          <article>
            <MobileTableOfContents headings={HEADINGS} />

            {/* Quick Summary */}
            <div className="rounded-2xl bg-primary-50 border border-primary-100 px-6 py-6 mb-10">
              <h2 className="font-display text-2xl text-gray-900 tracking-[-0.01em] mb-4">
                Quick Summary
              </h2>
              <CheckList
                items={[
                  <>The look-back period is <strong>60 months (5 years)</strong> in 49 states</>,
                  <>Medicaid reviews all financial transfers for <strong>fair market value</strong></>,
                  <>Penalty = total transferred &divide; state divisor (avg. <strong>$6,000&ndash;$22,000/mo</strong> depending on state)</>,
                  <>Legitimate exceptions exist: spouse transfers, caregiver child, disabled child, and more</>,
                ]}
              />
            </div>

            {/* Intro */}
            <div className="prose-editorial">
              <p>
                If you&rsquo;re reading this, you&rsquo;re probably trying to figure out how to pay for a parent&rsquo;s nursing home care without losing everything they&rsquo;ve worked for, or you just found out a hospital is discharging your mom in three days and someone mentioned &ldquo;Medicaid look-back&rdquo; and now you&rsquo;re panicking.
              </p>
              <p>
                Take a breath. We&rsquo;re going to walk through this together, in plain English, without the legal jargon.
              </p>
              <p>
                The Medicaid 5-year look-back is one of the most misunderstood rules in elder care. It&rsquo;s also one of the most important. Get it wrong and your family member could be denied Medicaid coverage for months or even years, leaving you to pay out of pocket. Get it right and you can protect significant assets while still qualifying for the care your loved one needs.
              </p>
              <p>Here&rsquo;s everything you need to know.</p>
            </div>

            {/* ── Quick Answer ──────────────────────────────── */}
            <h2
              id="quick-answer"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Quick Answer: What Is the Medicaid 5-Year Look-Back?
            </h2>

            <div className="prose-editorial">
              <p>
                When someone applies for long-term care Medicaid (nursing home care or home-based care through a <GlossaryTerm term="Medicaid waiver" definition={GLOSSARY["Medicaid waiver"]} />), the state reviews the previous 60 months (5 years) of financial records. If the applicant gave away money or property, or sold it for less than it was worth, during that window, Medicaid imposes a <GlossaryTerm term="penalty period" definition={GLOSSARY["penalty period"]} /> during which they&rsquo;re ineligible for benefits.
              </p>
              <p>
                The look-back exists to stop people from giving away their assets just to qualify for Medicaid. It&rsquo;s not a rule that punishes you for being generous, but it can feel that way if you didn&rsquo;t know about it.
              </p>
            </div>

            <div className="rounded-xl bg-primary-50 border border-primary-100 px-6 py-6 my-6">
              <h3 className="font-display text-lg text-gray-900 tracking-[-0.01em] mb-4">
                Three things to know right now
              </h3>
              <CheckList
                items={[
                  "The look-back is 60 months in 49 states. California historically had a 30-month rule but is reimplementing the standard look-back in 2026.",
                  "The look-back does not apply to Medicare. These are completely different programs (more on this below).",
                  "There are legitimate exceptions and strategies that let you transfer assets without triggering a penalty, but they have to be done correctly.",
                ]}
              />
            </div>

            {/* ── How the Look-Back Works ──────────────────── */}
            <h2
              id="how-it-works"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              How the Look-Back Period Actually Works
            </h2>

            <div className="prose-editorial">
              <p>
                The look-back period starts on the date you apply for long-term care Medicaid and goes back 60 months from that date.
              </p>
              <p>
                <strong>Example:</strong> If your father applies for Medicaid on June 1, 2026, the state will review every financial transaction from June 1, 2021 through June 1, 2026.
              </p>
              <p><strong>What gets reviewed:</strong></p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 px-6 py-5 my-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  "Bank statements",
                  "Property records and deed transfers",
                  "Brokerage and investment accounts",
                  "Vehicle title transfers (cars, boats, motorcycles, RVs)",
                  "Trust documents",
                  "Tax returns",
                  "Cash withdrawals (yes, large ones raise red flags)",
                  "Gifts to family members",
                  "Charitable donations",
                  "Payments to caregivers (especially without a formal agreement)",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-base text-gray-700 leading-relaxed">
                    <CheckIcon />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="prose-editorial">
              <p>
                If a Medicaid caseworker finds a transfer where the applicant didn&rsquo;t receive equal value in return, that&rsquo;s a &ldquo;<GlossaryTerm term="disqualifying transfer" definition={GLOSSARY["disqualifying transfer"]} />,&rdquo; and a penalty kicks in.
              </p>
            </div>

            <Callout>
              The look-back doesn&rsquo;t end after the initial review. If a Medicaid recipient inherits money or wins the lottery while on Medicaid and gives some of it away, that&rsquo;s also a violation. The rule applies for as long as someone needs Medicaid coverage.
            </Callout>

            {/* ── Penalty Calculation ─────────────────────────── */}
            <h2
              id="penalty-calculation"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              How the Penalty Period Is Calculated (With a Real Example)
            </h2>

            <div className="prose-editorial">
              <p>
                This is the section every other article on this topic skims past. Let&rsquo;s actually walk through the math.
              </p>
              <p>
                The penalty period is calculated by dividing the total amount transferred by your state&rsquo;s <GlossaryTerm term="penalty divisor" definition={GLOSSARY["penalty divisor"]} />, which is the average monthly cost of nursing home care in that state.
              </p>
            </div>

            <InfoBox>
              <p className="font-semibold mb-2">Formula</p>
              <p className="font-mono text-sm bg-white/60 rounded-lg px-4 py-3">
                Total amount of disqualifying transfers &divide; State penalty divisor = Months of Medicaid ineligibility
              </p>
            </InfoBox>

            <div className="prose-editorial">
              <h3>Worked Example: Linda&rsquo;s Story</h3>
              <p>
                Linda&rsquo;s mom, Margaret, is moving into a nursing home in Texas. Linda is helping her apply for Medicaid in March 2026. Going back through her mom&rsquo;s records, Linda finds:
              </p>
              <ul>
                <li><strong>March 2022:</strong> Margaret gave $25,000 to Linda&rsquo;s brother to help with a down payment on a house</li>
                <li><strong>August 2023:</strong> Margaret gifted $10,000 to her granddaughter for college</li>
                <li><strong>December 2024:</strong> Margaret transferred her old car (worth $8,000) to her grandson for $1</li>
              </ul>
              <p>
                Total disqualifying transfers within the 5-year window: $25,000 (house down payment) + $10,000 (college gift) + $7,000 (under-market car transfer) = <strong>$42,000</strong>
              </p>
              <p>
                Texas&rsquo;s penalty divisor in 2026 is approximately <strong>$7,900/month</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-5 my-6 text-center">
              <p className="text-base text-gray-900">
                <strong>Penalty calculation:</strong> $42,000 &divide; $7,900 = <span className="text-lg font-bold">5.3 months of Medicaid ineligibility</span>
              </p>
            </div>

            <div className="prose-editorial">
              <p>
                This means Margaret would have to pay out of pocket for the first 5+ months of nursing home care. At roughly $7,900/month, that&rsquo;s nearly $42,000 the family has to find before Medicaid kicks in.
              </p>
            </div>

            <Callout>
              <strong>Important:</strong> The penalty period doesn&rsquo;t start on the date of the gift. It starts on the date the person would otherwise be eligible for Medicaid (i.e., they&rsquo;re already in the nursing home and have spent down their other assets). This is often the most painful part: the penalty hits exactly when the family can least afford it.
            </Callout>

            <PenaltyCalculator />

            {/* ── State-by-State Table ────────────────────────── */}
            <h2
              id="state-by-state"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              State-by-State Look-Back Rules and Penalty Divisors
            </h2>

            <div className="prose-editorial">
              <p>
                The look-back rule itself is federal, but the penalty divisor varies dramatically by state because it&rsquo;s tied to local nursing home costs. A few states also have unique exceptions.
              </p>
              <p>
                The table below shows 2026 estimates. Verify your specific state&rsquo;s current divisor with your state Medicaid agency before making any decisions. These numbers update annually.
              </p>
            </div>

            <StatePenaltyTable data={STATE_DATA} />

            <Callout>
              The penalty period has <strong>no cap</strong>. If someone gave away $500,000 within the look-back window in a state with an $8,000 divisor, the penalty period would be 62.5 months, over 5 years, and Medicaid would not pay for any care during that entire time.
            </Callout>

            {/* ── Common Mistakes ─────────────────────────────── */}
            <h2
              id="common-mistakes"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Common Mistakes That Trigger Penalties (Without Anyone Realizing It)
            </h2>

            <div className="prose-editorial">
              <p>
                These are the situations that catch families off guard. None of them feel like &ldquo;trying to game Medicaid,&rdquo; but all of them can trigger a penalty.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">1</span><span className="text-gray-900">Holiday and Birthday Gifts to Grandkids</span></h3>
              <p>
                <strong>The mistake:</strong> Grandma writes a $5,000 check to each grandchild every Christmas because she always has.
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> Even though it feels like a tradition, Medicaid sees these as disqualifying transfers. The IRS allows gifts up to $19,000 per recipient in 2026 without tax consequences, but the IRS gift tax rule is completely separate from Medicaid rules. Just because a gift is tax-free doesn&rsquo;t mean it&rsquo;s Medicaid-safe.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">2</span><span className="text-gray-900">Selling a Car or Property to Family Below Market Value</span></h3>
              <p>
                <strong>The mistake:</strong> Dad sells his old truck to his nephew for $1 because the nephew needs a vehicle.
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> Medicaid will value the truck at <GlossaryTerm term="fair market value" definition={GLOSSARY["fair market value"]} /> (let&rsquo;s say $8,000) and treat the difference ($7,999) as a disqualifying transfer.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">3</span><span className="text-gray-900">Paying a Family Caregiver Without a Formal Agreement</span></h3>
              <p>
                <strong>The mistake:</strong> Mom pays her daughter $2,000/month to provide care, but they never wrote anything down.
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> Without a formal <GlossaryTerm term="Personal Care Agreement" definition={GLOSSARY["Personal Care Agreement"]} /> (also called a Caregiver Agreement or Life Care Contract), Medicaid will assume those payments were gifts, even if the daughter was legitimately providing care. This is one of the most common, and most heartbreaking, mistakes families make.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">4</span><span className="text-gray-900">Setting Up an Irrevocable Trust Within the 5-Year Window</span></h3>
              <p>
                <strong>The mistake:</strong> Someone sets up a Medicaid Asset Protection Trust two years before applying for Medicaid, thinking the assets are now &ldquo;protected.&rdquo;
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> If the trust was created within the look-back window, the assets transferred into it count as disqualifying transfers. Asset protection trusts only work if they&rsquo;re set up at least 5 years before applying.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">5</span><span className="text-gray-900">Paying Off a Child&rsquo;s Debt or Tuition</span></h3>
              <p>
                <strong>The mistake:</strong> Mom uses $40,000 of her savings to help pay off her son&rsquo;s student loans.
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> Medicaid sees this as a gift to the son, not a payment for value received.
              </p>

              <h3 className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">6</span><span className="text-gray-900">Lack of Documentation for Legitimate Sales</span></h3>
              <p>
                <strong>The mistake:</strong> Dad sold his old boat for fair market value years ago but doesn&rsquo;t have the paperwork.
              </p>
              <p>
                <strong>Why it&rsquo;s a problem:</strong> Without documentation proving the sale was at fair market value, Medicaid can treat the entire value as a disqualifying transfer. Keep records of every significant financial transaction.
              </p>
            </div>

            {/* ── Medicare vs. Medicaid ───────────────────────── */}
            <h2
              id="medicare-vs-medicaid"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Medicare vs. Medicaid: There Is No Medicare Look-Back
            </h2>

            <div className="prose-editorial">
              <p>
                This is one of the most common misconceptions, and it causes a lot of unnecessary panic.
              </p>
              <p>
                <strong>Medicare does not have a 5-year look-back period.</strong> Medicare is a federal health insurance program for people 65+ (or with certain disabilities), and eligibility is based on age and work history, not assets. You can be a millionaire and still qualify for Medicare.
              </p>
              <p>
                <strong>Medicaid</strong> is a needs-based program for low-income individuals and families. Because it&rsquo;s needs-based, the look-back exists to prevent people from artificially making themselves &ldquo;low-income&rdquo; right before applying.
              </p>
            </div>

            <div className="my-8 rounded-xl border border-gray-200 overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-3">
                <div className="bg-gray-100 px-5 py-4"></div>
                <div className="bg-blue-50 px-5 py-4 text-center border-l border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-0.5">Medicare</p>
                  <p className="text-[11px] text-gray-400">Federal insurance</p>
                </div>
                <div className="bg-primary-50 px-5 py-4 text-center border-l border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 mb-0.5">Medicaid (LTC)</p>
                  <p className="text-[11px] text-gray-400">Needs-based</p>
                </div>
              </div>
              {/* Rows */}
              {[
                { label: "Eligibility based on", medicare: "Age (65+) and work history", medicaid: "Income and assets" },
                { label: "Look-back period?", medicare: "No", medicaid: "Yes, 60 months", medicaidHighlight: true },
                { label: "Covers nursing home?", medicare: "Limited (up to 100 days)", medicaid: "Yes, long-term", medicaidHighlight: true },
                { label: "Asset limit?", medicare: "None", medicaid: "Yes (typically $2,000)", medicaidHighlight: true },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-3 border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                  <div className="px-5 py-3.5 text-sm font-medium text-gray-900 bg-gray-50">{row.label}</div>
                  <div className="px-5 py-3.5 text-sm text-gray-600 border-l border-gray-100 text-center">{row.medicare}</div>
                  <div className={`px-5 py-3.5 text-sm border-l border-gray-100 text-center font-medium ${row.medicaidHighlight ? "text-primary-700" : "text-gray-600"}`}>{row.medicaid}</div>
                </div>
              ))}
            </div>

            <div className="prose-editorial">
              <p>
                If someone tells you Medicare has a look-back period, they&rsquo;re confusing it with Medicaid. The two programs work very differently.
              </p>
            </div>

            {/* ── Exceptions ─────────────────────────────────── */}
            <h2
              id="exceptions"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Exceptions: When You Can Transfer Assets Without a Penalty
            </h2>

            <div className="prose-editorial">
              <p>
                Federal Medicaid law includes several legitimate exceptions to the look-back rule. These exist to protect families from being financially devastated when one spouse needs nursing home care, or to honor caregiving relationships.
              </p>

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>The Spouse Exception</span></h3>
              <p>
                You can transfer any amount of assets to a spouse without triggering a look-back penalty. This is the most important exception in Medicaid law.
              </p>
              <p>
                The non-applicant spouse (called the &ldquo;community spouse&rdquo;) is also entitled to keep a portion of the couple&rsquo;s combined assets through the <GlossaryTerm term="Community Spouse Resource Allowance" definition={GLOSSARY["Community Spouse Resource Allowance"]} /> (CSRA). In 2026, the federal maximum CSRA is <strong>$162,660</strong>, though some states use lower limits.
              </p>

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>The Disabled Child Exception</span></h3>
              <p>
                You can transfer assets, including a home, to a child who is permanently disabled or legally blind, regardless of their age. This includes setting up a special needs trust for them.
              </p>

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>The Caregiver Child Exception</span></h3>
              <p>
                This is one of the most powerful and underused exceptions. If an adult child:
              </p>
            </div>
            <CheckList
              items={[
                "Lived in the parent\u2019s home for at least 2 years immediately before the parent\u2019s nursing home admission, AND",
                "Provided care during that time that delayed the parent\u2019s need for nursing home placement",
              ]}
            />
            <div className="prose-editorial">
              <p>
                &hellip;then the parent can transfer the home to that child without any look-back penalty.
              </p>
              <p>
                This requires documentation: medical records, caregiver logs, statements from the parent&rsquo;s doctor confirming that the child&rsquo;s care prevented institutionalization. But for families where one child has been the primary caregiver, this can protect the home entirely.
              </p>

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>The Sibling Exception</span></h3>
              <p>A home can be transferred to a sibling who:</p>
            </div>
            <CheckList
              items={[
                "Has an equity interest in the home (i.e., is a part owner), AND",
                "Lived in the home for at least 1 year immediately before the Medicaid applicant entered a nursing home",
              ]}
            />
            <div className="prose-editorial">

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>Transfers to a Child Under 21</span></h3>
              <p>You can transfer your home to a child under 21 without a penalty.</p>

              <h3 className="flex items-center gap-2.5"><span className="inline-flex items-center gap-2 rounded-xl bg-green-100 text-green-800 text-xl font-semibold px-4 py-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>Transfers to a Special Needs Trust for Anyone Under 65</span></h3>
              <p>
                Assets can be placed in a special needs trust for any disabled person under 65 without triggering a look-back penalty.
              </p>
            </div>

            {/* ── Spend-Down Strategies ───────────────────────── */}
            <h2
              id="spend-down"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Legitimate Spend-Down Strategies (No Penalty)
            </h2>

            <div className="prose-editorial">
              <p>
                If your loved one has too many assets to qualify for Medicaid but can&rsquo;t afford to wait 5 years, there are legitimate ways to <GlossaryTerm term="spend down" definition={GLOSSARY["spend down"]} /> assets without violating the look-back rule.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                </span>
                Pay Off Debt
              </h3>
              <p>
                Paying off a mortgage, car loan, or credit card debt doesn&rsquo;t violate the look-back. It also reduces the applicant&rsquo;s countable assets and can lower monthly expenses for the community spouse.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                </span>
                Make Home Modifications
              </h3>
              <p>
                Money spent making a home safer or more accessible (wheelchair ramps, stairlifts, walk-in showers, widened doorways, first-floor bedroom additions) doesn&rsquo;t count as a transfer. It improves the home&rsquo;s value and the applicant&rsquo;s quality of life.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                </span>
                Buy Necessary Items
              </h3>
              <p>
                Replacing an old car, buying necessary medical equipment, or purchasing prepaid funeral arrangements (through an irrevocable funeral trust) all count as legitimate spend-downs.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </span>
                Personal Care Agreements (Done Correctly)
              </h3>
              <p>
                You can legally pay a family member to provide care, but only with a properly drafted Personal Care Agreement that includes:
              </p>
            </div>
            <CheckList
              items={[
                "Start date of care services",
                "Specific duties (bathing, transportation, meal prep, medication reminders, etc.)",
                "Hours per week and rate of pay",
                "Pay rate that\u2019s reasonable for your area (Medicaid will reject inflated rates)",
                "Detailed logs of services provided",
                "Written invoices and payment records",
              ]}
            />
            <div className="prose-editorial">
              <p>
                This is one of the most powerful tools available for families, and one of the most commonly botched. If you&rsquo;re considering paying a family caregiver, get the agreement reviewed by a professional first. For Texas families, our <Link href="/caregiver-support/free-services-for-senior-citizens-texas-complete-2026-guide" className="text-primary-600 hover:text-primary-700 underline underline-offset-2">free senior services guide</Link> covers additional programs that can help offset costs.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                Medicaid-Compliant Annuities
              </h3>
              <p>
                Converting a lump sum of cash into a monthly income stream through a <GlossaryTerm term="Medicaid-compliant annuity" definition={GLOSSARY["Medicaid-compliant annuity"]} /> can lower countable assets while providing income. Not all annuities are Medicaid-compliant. Deferred annuities, in particular, will trigger penalties. State rules vary significantly, and this strategy almost always requires professional guidance.
              </p>

              <h3 className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                </span>
                Irrevocable Funeral Trusts
              </h3>
              <p>
                Prepaying for funeral and burial expenses through an irrevocable trust removes that money from countable assets. About half the states cap the amount that can be funded this way, so check your state&rsquo;s limit.
              </p>
            </div>

            {/* ── Already Transferred ────────────────────────── */}
            <h2
              id="already-transferred"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              What If You&rsquo;ve Already Made a Disqualifying Transfer?
            </h2>

            <div className="prose-editorial">
              <p>
                If you&rsquo;re reading this and realizing you already made a transfer that&rsquo;s going to trigger a penalty, don&rsquo;t panic. There are still options.
              </p>

              <h3>1. Asset Recuperation</h3>
              <p>
                If the recipient of the gift can return some or all of the transferred assets, the penalty can be reduced or eliminated. Some states require full recuperation; others allow partial recuperation with a proportional reduction in the penalty.
              </p>
              <p>
                If your sister still has the $30,000 you gave her two years ago, ask for it back.
              </p>

              <h3>2. Undue Hardship Waiver</h3>
              <p>
                If the assets can&rsquo;t be returned and the penalty would leave the applicant unable to obtain food, clothing, or shelter, you can apply for an <GlossaryTerm term="Undue Hardship Waiver" definition={GLOSSARY["Undue Hardship Waiver"]} />. These are difficult to obtain (Medicaid sets a high bar) but they exist for true emergencies.
              </p>

              <h3>3. Cure the Violation Through Legal Strategies</h3>
              <p>
                An experienced elder law attorney or Medicaid planner can sometimes cure a violation through specific legal mechanisms: promissory notes, half-loaf strategies, or restructuring the situation to fit within an exception. This is not DIY territory.
              </p>
            </div>

            <Callout>
              If you&rsquo;ve already made a transfer you&rsquo;re worried about, <strong>get help immediately</strong>. The longer you wait, the fewer options you have.
            </Callout>

            {/* ── Planning Strategies ────────────────────────── */}
            <h2
              id="planning-strategies"
              className="font-display text-2xl md:text-3xl text-gray-900 tracking-[-0.01em] mt-14 mb-4"
            >
              Medicaid Planning Strategies That Avoid the Look-Back Entirely
            </h2>

            <div className="prose-editorial">
              <p>
                If your loved one is currently healthy and you&rsquo;re thinking ahead, you have more options than someone in crisis.
              </p>

              <h3>The 5-Year Trust Strategy</h3>
              <p>
                You can transfer assets into a properly structured <GlossaryTerm term="irrevocable trust" definition={GLOSSARY["irrevocable trust"]} /> today. As long as you don&rsquo;t apply for Medicaid for 5 years, those assets won&rsquo;t count.
              </p>
              <p>The risks:</p>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                "You lose control of the assets permanently. The trustee (often an adult child) decides what happens to them.",
                "The beneficiaries can technically use the money for anything, even though the intent is to fund care.",
                "If something happens within 5 years (a stroke, an accident, sudden dementia), the strategy fails.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-lg text-gray-700 leading-relaxed">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="prose-editorial">
              <p>
                This is why most elder law attorneys recommend the 5-year trust as part of a broader plan, not as a standalone strategy.
              </p>

              <h3>Long-Term Care Insurance</h3>
              <p>
                A long-term care insurance policy purchased before someone needs care can cover years of nursing home or in-home care, eliminating the need for Medicaid entirely. Premiums are expensive and increase with age, but for families with assets to protect, it&rsquo;s often cheaper than the alternative.
              </p>

              <h3>Life Estates</h3>
              <p>
                A <GlossaryTerm term="life estate" definition={GLOSSARY["life estate"]} /> allows someone to transfer ownership of their home to a child while retaining the right to live there for the rest of their life. Done at least 5 years before applying for Medicaid, this can protect the home from <GlossaryTerm term="estate recovery" definition={GLOSSARY["estate recovery"]} />.
              </p>
            </div>

            {/* ── FAQ ────────────────────────────────────────── */}
            <div
              id="faq"
              className="mt-14 mb-12 rounded-2xl bg-gray-50 border border-gray-200 px-6 py-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </span>
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "Does the Medicaid look-back apply to my spouse\u2019s transfers, too?",
                    a: "Yes. The look-back review covers all transfers made by either spouse during the 60-month window, whether they\u2019re applying for Medicaid or not.",
                  },
                  {
                    q: "How far back does Medicaid actually look?",
                    a: "In 49 states, the look-back period is exactly 60 months (5 years) from the date of the long-term care Medicaid application. California is reimplementing the standard look-back in 2026 after temporarily having a 30-month rule.",
                  },
                  {
                    q: "Does the look-back apply to all Medicaid programs?",
                    a: "No. The look-back only applies to long-term care Medicaid: nursing home Medicaid and Home and Community-Based Services (HCBS) waivers. Regular Medicaid (sometimes called Aged, Blind, and Disabled Medicaid) does not have a look-back.",
                  },
                ].map(({ q, a }, i) => (
                  <details key={i} className="group rounded-xl bg-white border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                      {q}
                      <svg
                        className="w-5 h-5 text-primary-500 flex-shrink-0 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-base text-gray-600 leading-relaxed">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* ── Final Thoughts ──────────────────────────────── */}
            <div className="prose-editorial">
              <h2>Final Thoughts</h2>
              <p>
                The 5-year look-back rule is complicated, and the stakes are high. But it&rsquo;s not designed to trap families. It&rsquo;s designed to prevent abuse of a program that protects vulnerable people.
              </p>
              <p>
                If you&rsquo;re planning ahead, you have powerful tools to protect your assets while still qualifying for care when you need it. If you&rsquo;re in crisis, you still have options, but you need expert help quickly.
              </p>
              <p>
                The most important thing? Don&rsquo;t try to handle this alone. A single mistake can cost a family tens of thousands of dollars and months of denied coverage. The cost of professional advice is almost always far less than the cost of getting it wrong.
              </p>
            </div>

            {/* ── Disclaimer + Sources ────────────────────────── */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-400 space-y-4 mb-16">
              <p className="italic">
                This article is for informational purposes and does not constitute legal or financial advice. Medicaid rules change frequently and vary by state. Always consult with a Certified Medicaid Planner or licensed elder law attorney about your specific situation.
              </p>
              <div>
                <p className="font-semibold text-gray-500 mb-2">Sources</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Centers for Medicare &amp; Medicaid Services (CMS), Medicaid.gov</li>
                  <li>Deficit Reduction Act of 2005</li>
                  <li>2026 federal CSRA limits (verify with your state Medicaid agency)</li>
                  <li>2026 IRS Gift Tax Exclusion: $19,000 per recipient</li>
                  <li>State-specific Medicaid penalty divisors (verify with your state Medicaid agency)</li>
                </ul>
              </div>
            </div>

            {/* Related Articles */}
            {related && related.length > 0 && (
              <section className="mt-14 mb-16">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Recommended</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {related.map((r) => (
                    <Link key={r.id} href={`/caregiver-support/${r.slug}`} className="group block">
                      {r.cover_image_url && (
                        <img
                          src={r.cover_image_url}
                          alt={r.title}
                          className="w-full aspect-[3/2] object-cover rounded-xl mb-3 group-hover:opacity-90 transition-opacity"
                        />
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
                        {r.title}
                      </h3>
                      {r.reading_time && (
                        <p className="text-xs text-gray-400">{r.reading_time}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>

        {/* Desktop TOC sidebar */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0">
          <div className="sticky top-[96px] pt-4">
            <DesktopTableOfContents headings={HEADINGS} />
          </div>
        </aside>
      </div>
    </main>
  );
}
