"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How do I pay for a nursing home in Texas if I have no money?",
    answer:
      "If your loved one has limited income and assets, they may qualify for Texas Medicaid which covers nursing home care for eligible seniors. Apply through <a href='https://www.yourtexasbenefits.com' target='_blank' rel='noopener noreferrer' class='text-primary-600 underline'>YourTexasBenefits.com</a> or call <strong>211</strong> for help. If their income is too high, a spend-down strategy or Miller Trust may help them qualify.",
  },
  {
    question: "Does Medicare pay for home care in Texas?",
    answer:
      "Medicare covers home health care only when it is medically necessary and ordered by a doctor, for example after a hospital stay. It does <strong>not</strong> cover ongoing personal care like help with bathing, dressing, or meals. For long-term home care, Texas Medicaid through <strong>STAR+PLUS</strong> is the primary option.",
  },
  {
    question:
      "What is the income limit for Medicaid in Texas for seniors?",
    answer:
      "For STAR+PLUS and Medicaid waivers, the income limit for a single applicant in 2026 is <strong>$2,982 per month</strong>. The asset limit is <strong>$2,000</strong>. Your home does not count as a countable asset as long as you intend to return to it.",
  },
  {
    question:
      "How long will $100,000 last in a nursing home in Texas?",
    answer:
      "At the average Texas nursing home cost of $8,500 per month, $100,000 will last approximately <strong>11 to 12 months</strong>. This is why exploring Medicaid eligibility early is so important. The STAR+PLUS waitlist alone can be 6 to 12 months.",
  },
  {
    question: "Can I get free home care in Texas?",
    answer:
      "Yes. Through the <strong>STAR+PLUS Medicaid waiver</strong>, eligible seniors can receive personal care assistants, nursing services, adult day care, and other home-based supports at no cost. You must meet the income, asset, and care level requirements to qualify. Call <strong>211</strong> to get on the interest list.",
  },
];

export default function SeniorCareFAQ() {
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
