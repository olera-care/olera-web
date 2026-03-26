import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById } from "@/data/waiver-library";
import { ProgramList } from "@/components/waiver-library/ProgramList";
import { StateOutline } from "@/components/waiver-library/StateOutline";
import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";
import { TX_OLD_TO_NEW } from "@/lib/texas-slug-map";

const TEXAS_FAQS: { question: string; answer: string }[] = [
  {
    question: "Can I get paid to care for a family member in Texas?",
    answer: "Yes. Through STAR+PLUS Consumer Directed Services, Medicaid recipients can hire and manage their own caregivers, including friends and certain family members. The family member is paid directly through a financial management agency.",
  },
  {
    question: "What is the income limit for Medicaid in Texas in 2026?",
    answer: "For 2026, the income limit for Texas Medicaid home care waivers is $2,982/month for a single applicant. If your income is higher, you may still qualify using a Miller Trust. The asset limit is $2,000, but your home does not count.",
  },
  {
    question: "What if my income is too high to qualify in Texas?",
    answer: "You may still qualify through a spend-down strategy. Texas allows you to reduce your countable income or assets through allowable expenses like medical bills, home care costs, and health insurance premiums. A Qualified Income Trust (Miller Trust) is another option if your monthly income exceeds the $2,982 limit.",
  },
];

export const metadata: Metadata = {
  title: "Texas Benefits | Benefits Hub | Olera",
  description: "Texas offers Medicaid waiver programs through the Health and Human Services Commission (HHSC) to help seniors and adults with disabilities receive long-term care services at home or in the community.",
  alternates: { canonical: "/texas/benefits" },
  openGraph: {
    title: "Texas Benefits | Benefits Hub | Olera",
    description: "Texas offers Medicaid waiver programs through the Health and Human Services Commission (HHSC) to help seniors and adults with disabilities receive long-term care services at home or in the community.",
    url: "/texas/benefits",
    siteName: "Olera",
    type: "website",
  },
};

export default function TexasBenefitsPage() {
  const state = getStateById("texas");

  if (!state || state.programs.length === 0) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="relative bg-primary-800 text-white overflow-hidden">
        <StateOutline stateId="texas" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Texas Benefits
          </h1>
          <p className="mt-1.5 text-base md:text-lg text-white/80">
            A complete guide to Medicaid, senior assistance programs, and financial help available to Texas families in 2026.
          </p>
          <p className="mt-1.5 text-xl md:text-2xl font-semibold text-white">
            Saving families up to {(() => {
              const maxSavings = Math.max(
                ...state.programs.map((p) => {
                  const match = p.savingsRange.match(/\$[\d,]+/g);
                  if (!match) return 0;
                  const last = match[match.length - 1];
                  return parseInt(last.replace(/[$,]/g, ""), 10);
                })
              );
              return `$${maxSavings.toLocaleString("en-US")}`;
            })()} a year
          </p>
          <div className="mt-4">
            <Link
              href="/benefits/finder"
              className="inline-flex items-center justify-center px-5 py-2 bg-white text-primary-600 font-semibold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-white/90 transition-all"
            >
              <svg
                className="mr-1.5 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Find My Savings
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProgramList
            programs={state.programs}
            stateId="texas"
            slugMap={TX_OLD_TO_NEW}
            basePath="/texas/benefits"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: TEXAS_FAQS.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
              },
            })),
          }),
        }}
      />
      <section className="pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">
            Frequently Asked Questions
          </h2>
          <FaqAccordion faqs={TEXAS_FAQS} columns={1} />
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="pb-8 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white px-6 py-8 md:py-10 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
              See How Much You Could Save on Care
            </h2>
            <p className="mt-2 text-gray-500 text-base md:text-lg">
              Free, no signup required. Just a few quick questions.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
              >
                Find My Savings
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ maxWidth: "680px" }}>
            <Link href="/texas/how-to-pay-for-senior-care-in-texas" className="group block">
              <div className="rounded-lg overflow-hidden mb-2">
                <img
                  src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/covers/how-to-pay-for-senior-care-in-texas-1774519457693.png"
                  alt="How to Pay for Senior Care in Texas in 2026"
                  className="w-full aspect-[3/2] object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-0.5">
                How to Pay for Senior Care in Texas in 2026
              </h3>
              <p className="text-xs text-gray-400">10 min read</p>
            </Link>
            <Link href="/texas/how-to-get-paid-as-a-caregiver-in-texas" className="group block">
              <div className="rounded-lg overflow-hidden mb-2">
                <img
                  src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/covers/how-to-get-paid-as-a-caregiver-in-texas-1774448475527.png"
                  alt="How to Get Paid as a Caregiver in Texas in 2026"
                  className="w-full aspect-[3/2] object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-0.5">
                How to Get Paid as a Caregiver in Texas in 2026
              </h3>
              <p className="text-xs text-gray-400">8 min read</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
