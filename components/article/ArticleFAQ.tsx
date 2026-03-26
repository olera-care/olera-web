"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Can a spouse get paid to be a caregiver in Texas?",
    answer:
      "In most cases, spouses are <strong>not eligible</strong> to be paid caregivers under STAR+PLUS Consumer Directed Services. However, other family members,including adult children, siblings, and close friends,can qualify.",
  },
  {
    question: "Can an adult child get paid to care for a parent in Texas?",
    answer:
      "<strong>Yes.</strong> Adult children are one of the most common paid caregivers under the CDS program. You must be 18 or older, pass a background check, and your parent must be enrolled in STAR+PLUS.",
  },
  {
    question: "How much does STAR+PLUS pay caregivers per hour?",
    answer:
      "Pay rates range from <strong>$10 to $17 per hour</strong> depending on your managed care organization and region. See the comparison table above for estimated monthly earnings.",
  },
  {
    question: "What is Consumer Directed Services in Texas?",
    answer:
      "CDS is a Medicaid program option that lets the person receiving care (or their representative) <strong>hire, manage, and direct their own caregivers</strong>,including family members. It gives families more control over who provides care and when.",
  },
  {
    question:
      "How long does it take to get approved as a paid caregiver in Texas?",
    answer:
      "The full process typically takes <strong>30 to 90 days</strong> from start to first paycheck. The biggest variable is the service coordinator assessment and FMSA enrollment, which can take 2 to 4 weeks each.",
  },
];

export default function ArticleFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="my-8 not-prose">
      <div className="flex items-center gap-2 mb-4">
        <svg
          width="20"
          height="20"
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
        <h2 className="text-lg font-semibold text-gray-900">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl bg-primary-25 border border-primary-100 overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
            >
              <span className="text-sm font-semibold text-gray-900">
                {faq.question}
              </span>
              <svg
                width="18"
                height="18"
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
                  className="px-5 pb-4 text-sm text-gray-600 leading-relaxed"
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
