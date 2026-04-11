import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById } from "@/data/waiver-library";
import { ProgramList } from "@/components/waiver-library/ProgramList";
import { StateOutline } from "@/components/waiver-library/StateOutline";
import { FaqAccordion } from "@/components/waiver-library/FaqAccordion";
import { pipelineDrafts } from "@/data/pipeline-drafts";
import { StatePageV3 } from "@/components/waiver-library/StatePageV3";
import { createClient } from "@/lib/supabase/server";
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
    question: "How do I apply for a Medicaid waiver in Texas?",
    answer: "Call 211 to get on the STAR+PLUS interest list, then apply for Medicaid at YourTexasBenefits.com if not already enrolled. A needs assessment follows and processing takes 1–2 months. Getting on the waitlist early is critical as spots are limited.",
  },
  {
    question: "Can I get paid to be a caregiver for a family member in Texas?",
    answer: "Yes. Through STAR+PLUS Consumer Directed Services, Medicaid recipients can hire and manage their own caregivers — including friends and certain family members. The family member is paid directly through a financial management agency.",
  },
  {
    question: "How much does Medicaid pay caregivers in Texas?",
    answer: "Texas Medicaid pays caregivers through the STAR+PLUS program at rates set by the managed care organization. Rates typically range from $10–$17/hour for personal assistance services depending on the region and MCO.",
  },
  {
    question: "What are Texas grants for senior citizens?",
    answer: "Texas does not offer direct cash grants to seniors but has programs that function similarly — LIHEAP pays heating and cooling bills directly to utility companies, the Weatherization Assistance Program covers home improvements up to $2,000, and Medicare Savings Programs pay Medicare premiums worth up to $8,000/year.",
  },
  {
    question: "Does Medicaid pay for nursing home care in Texas?",
    answer: "Yes, Medicaid does pay for nursing home care in Texas for people who meet financial and medical eligibility requirements. You must have income below $2,901 per month and require a nursing facility level of care, meaning you need significant help with daily activities or full-time medical supervision. Texas also offers the STAR+PLUS program as an alternative, which covers similar services at home so you can avoid a nursing facility altogether.",
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

export default async function TexasBenefitsPage() {
  const state = getStateById("texas");

  if (!state || state.programs.length === 0) {
    notFound();
  }

  // V3 state page if pipeline has generated a state overview
  const stateDrafts = pipelineDrafts[state.abbreviation];
  if (stateDrafts?.stateOverview) {
    const pipelinePrograms = (stateDrafts.programs || []).map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
    }));

    // Fetch recent answered questions (social proof)
    let familyQuestions: { question: string; answer: string; providerName: string; answeredAt: string; providerSlug?: string }[] = [];
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("provider_questions")
        .select("question, answer, answered_at, answered_by, provider_id")
        .eq("status", "answered")
        .eq("is_public", true)
        .not("answer", "is", null)
        .order("answered_at", { ascending: false })
        .limit(6);

      if (data) {
        const providerIds = data.map((q) => q.provider_id).filter(Boolean);
        let slugMap: Record<string, string> = {};
        if (providerIds.length > 0) {
          const { data: providers } = await supabase
            .from("olera-providers")
            .select("provider_id, slug")
            .in("provider_id", providerIds);
          if (providers) {
            for (const p of providers) {
              if (p.slug) slugMap[p.provider_id] = p.slug;
            }
          }
        }

        familyQuestions = data
          .filter((q) => q.question && q.answer)
          .slice(0, 3)
          .map((q) => ({
            question: q.question!,
            answer: q.answer!,
            providerName: q.answered_by || "Care provider",
            answeredAt: q.answered_at || "",
            providerSlug: q.provider_id ? slugMap[q.provider_id] : undefined,
          }));
      }
    } catch {
      // Silent — social proof is nice-to-have
    }

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Benefits Hub", item: "https://olera.care/senior-benefits" },
        { "@type": "ListItem", position: 2, name: state.name, item: "https://olera.care/texas/benefits" },
      ],
    };

    const faqJsonLd = stateDrafts.stateOverview.quickFacts?.length ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: stateDrafts.stateOverview.quickFacts.map((fact) => ({
        "@type": "Question",
        name: fact.split("—")[0]?.trim() || fact.slice(0, 80),
        acceptedAnswer: { "@type": "Answer", text: fact },
      })),
    } : null;

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
        <StatePageV3 state={state} overview={stateDrafts.stateOverview} pipelinePrograms={pipelinePrograms} familyQuestions={familyQuestions} />
      </>
    );
  }

  // Fallback: V1 layout (only if no pipeline data)
  return (
    <div className="bg-vanilla-100 min-h-screen">
      <section className="relative bg-primary-800 text-white overflow-hidden">
        <StateOutline stateId="texas" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Texas Benefits</h1>
          <p className="mt-1.5 text-base md:text-lg text-white/80 max-w-xl">
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
            <Link href="/benefits/finder" className="inline-flex items-center justify-center px-5 py-2 bg-white text-primary-600 font-semibold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-white/90 transition-all">
              Find My Savings
            </Link>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProgramList programs={state.programs} stateId="texas" slugMap={TX_OLD_TO_NEW} basePath="/texas/benefits" />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: TEXAS_FAQS.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />
      <section className="pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
          <FaqAccordion faqs={TEXAS_FAQS} columns={1} />
        </div>
      </section>
    </div>
  );
}
