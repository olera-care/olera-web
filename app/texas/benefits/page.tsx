import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getStateById } from "@/data/waiver-library";
import { ProgramList } from "@/components/waiver-library/ProgramList";
import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";
import { TX_OLD_TO_NEW } from "@/lib/texas-slug-map";

const TEXAS_FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I pay for senior care in Texas?",
    answer: "Texas seniors can pay for care through Medicaid waivers like STAR+PLUS, which covers home care, personal assistance, and assisted living for those who qualify. Other options include Medicare (limited coverage), out-of-pocket, and spend-down strategies for those over the income limit. Most families qualify for more than they realize — a [free benefits check](/benefits/finder) takes 2 minutes.",
  },
  {
    question: "What free services are available for senior citizens in Texas?",
    answer: "Texas offers free or low-cost services including in-home personal care through STAR+PLUS, meal delivery, transportation, adult day care, caregiver respite, legal aid for seniors 60+, and energy bill assistance through LIHEAP. Eligibility depends on income, age, and care needs.",
  },
  {
    question: "What is the income limit for Medicaid in Texas for seniors?",
    answer: "For 2026, the income limit for Texas Medicaid home care waivers is $2,982/month for a single applicant. If your income is higher, you may still qualify using a Miller Trust. The asset limit is $2,000, but your home does not count.",
  },
  {
    question: "Can family members get paid to be a caregiver in Texas?",
    answer: "Yes. Through the STAR+PLUS Consumer Directed Services (CDS) option, Texas Medicaid recipients can hire and manage their own caregivers — including adult children, grandchildren, siblings, and other relatives. Spouses and legal guardians are generally not eligible to be paid through CDS. The family caregiver is paid directly through a financial management agency, and pay typically ranges from $10–$17 per hour depending on the managed care organization and region.",
  },
  {
    question: "How long does it take to get approved for Texas senior benefits?",
    answer: "Approval times vary by program. Medicaid programs like MEPD and Medicare Savings Programs typically take 45 days, or up to 90 days if a disability determination is required. SNAP applications are usually decided within 30 days, with expedited service in 7 days for households facing emergencies. STAR+PLUS HCBS waiver services can take longer because they require both Medicaid eligibility and a functional needs assessment. Energy assistance through CEAP/LIHEAP is often processed within a few weeks but depends on funding availability.",
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
      {/* Editorial Hero */}
      <section className="relative bg-primary-50 overflow-hidden border-b border-primary-100">
        <div className="max-w-7xl mx-auto pl-4 sm:pl-6 lg:pl-8 pt-10 md:pt-14 pb-6 md:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 lg:items-stretch">
            {/* Left: Editorial copy */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-primary-700"></span>
                <span className="text-xs font-semibold tracking-[0.18em] uppercase text-primary-700">
                  Texas · 2026 Benefits Guide
                </span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.05] tracking-tight">
                Your Guide to{" "}
                <span className="italic text-primary-700 text-[1.1em] font-bold">Texas</span>{" "}
                Senior Benefits
              </h1>
              <p className="mt-5 text-lg text-gray-600 max-w-xl leading-relaxed">
                Medicaid, financial help, and assistance programs — updated for 2026.
              </p>

              {/* Savings stat — editorial pull-quote treatment */}
              {(() => {
                const maxSavings = Math.max(
                  ...state.programs.map((p) => {
                    const match = p.savingsRange.match(/\$[\d,]+/g);
                    if (!match) return 0;
                    const last = match[match.length - 1];
                    return parseInt(last.replace(/[$,]/g, ""), 10);
                  })
                );
                return (
                  <div className="mt-8 flex items-center gap-5">
                    <div className="h-16 w-1 rounded-full bg-gradient-to-b from-primary-600 to-primary-800"></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Saving families up to
                      </p>
                      <p className="font-serif text-4xl md:text-5xl font-bold text-primary-700 leading-none mt-1">
                        ${maxSavings.toLocaleString("en-US")}
                        <span className="text-xl md:text-2xl font-normal text-gray-500 ml-2">/ year</span>
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Right: Lifestyle image — flush to right edge, matches text column height on lg+ */}
            <div className="lg:col-span-5 order-1 lg:order-2 lg:h-full">
              <div className="relative h-full min-h-[320px] lg:min-h-0 w-full">
                <Image
                  src="/images/benefits-hero.png"
                  alt="Caregiver supporting a senior at home in Texas"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-10 md:py-14">
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
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-primary-700"></span>
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-primary-700">
              Keep Reading
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/texas/how-to-pay-for-senior-care-in-texas" className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                  src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/covers/how-to-pay-for-senior-care-in-texas-1774519457693.png"
                  alt="How to Pay for Senior Care in Texas in 2026"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Guide</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">10 min read</span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight tracking-tight">
                  How to Pay for Senior Care in Texas in 2026
                </h3>
                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  A complete guide to Medicaid waivers, Medicare, long-term care insurance, and out-of-pocket strategies for Texas families.
                </p>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary-700 group-hover:text-primary-800">
                  Read article
                  <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/texas/how-to-get-paid-as-a-caregiver-in-texas" className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                  src="https://ocaabzfiiikjcgqwhbwr.supabase.co/storage/v1/object/public/content-images/covers/how-to-get-paid-as-a-caregiver-in-texas-1774448475527.png"
                  alt="How to Get Paid as a Caregiver in Texas in 2026"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Guide</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">8 min read</span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight tracking-tight">
                  How to Get Paid as a Caregiver in Texas in 2026
                </h3>
                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  Step-by-step on becoming a paid family caregiver through STAR+PLUS Consumer Directed Services and other Texas programs.
                </p>
                <div className="mt-5 inline-flex items-center text-sm font-semibold text-primary-700 group-hover:text-primary-800">
                  Read article
                  <svg className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
