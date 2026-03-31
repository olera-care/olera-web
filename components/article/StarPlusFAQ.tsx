"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What does STAR+PLUS cover in Texas?",
    answer:
      "STAR+PLUS covers personal attendant services, home modifications (ramps, grab bars), adaptive aids, adult day care, respite care, skilled nursing, physical and occupational therapy, prescription drugs, and more. The <strong>HCBS waiver</strong> specifically covers services delivered at home or in the community instead of a nursing facility.",
  },
  {
    question: "How long is the STAR+PLUS waitlist in Texas?",
    answer:
      "The HCBS waiver interest list typically ranges from <strong>6 to 18 months</strong> depending on your region. Rural areas tend to have shorter waits (3 to 8 months), while major metros like Dallas and Austin can be 8 to 16 months. Getting on the list early is the most important step.",
  },
  {
    question: "Can a family member be a paid caregiver under STAR+PLUS?",
    answer:
      "<strong>Yes.</strong> Through Consumer Directed Services (CDS), family members including adult children, siblings, and close friends can be hired as paid caregivers. They must be 18 or older and pass a background check. Spouses and legal guardians are generally not eligible. Pay ranges from $10 to $17 per hour.",
  },
  {
    question: "What is the income limit for STAR+PLUS in Texas?",
    answer:
      "For 2026, the income limit is <strong>$2,982 per month</strong> and the asset limit is <strong>$2,000</strong> for an individual. Your home and one vehicle are exempt. If income exceeds the limit, a <strong>Qualified Income Trust</strong> (Miller Trust) can bring countable income below the threshold.",
  },
  {
    question: "How do I apply for STAR+PLUS in Texas?",
    answer:
      "Start by calling <strong>211</strong> or visiting <a href='https://www.yourtexasbenefits.com' target='_blank' rel='noopener noreferrer' class='text-primary-600 underline'>YourTexasBenefits.com</a> to get on the interest list. Then apply for Medicaid if not already enrolled, complete a medical assessment, choose a managed care organization, and work with a service coordinator to create your care plan. The full process typically takes 30 to 90 days.",
  },
];

export default function StarPlusFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]*>/g, ""),
      },
    })),
  };

  return (
    <div className="my-12 not-prose rounded-2xl bg-primary-25 border border-primary-100 p-6 sm:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 flex-shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-600"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <h2 className="text-xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl bg-white border border-primary-100 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
            >
              <span className="text-base font-semibold text-gray-900">
                {faq.question}
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-primary-500 flex-shrink-0 transition-transform duration-200 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-200 ease-in-out ${
                openIndex === i
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className="px-6 pb-5 text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
