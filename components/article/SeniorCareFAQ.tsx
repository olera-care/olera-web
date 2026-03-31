"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What happens to my house if I go on Medicaid in Texas?",
    answer:
      "Your home is generally <strong>exempt</strong> from Medicaid's asset count as long as you (or your spouse) intend to return to it or continue living there. However, after you pass away, Texas may seek repayment from your estate through <strong>Medicaid Estate Recovery</strong>. Proper planning, such as placing the home in a trust, can help protect it.",
  },
  {
    question: "Can I pay for nursing home care with just Social Security in Texas?",
    answer:
      "In most cases, <strong>no</strong>. The average nursing home in Texas costs around $8,500 per month, while the average Social Security benefit is roughly $1,900. Most families use a combination of Medicaid, personal savings, and sometimes Veterans benefits to cover the gap.",
  },
  {
    question: "How much does Medicaid pay for assisted living in Texas?",
    answer:
      "Texas Medicaid does not directly pay for room and board in assisted living facilities. However, the <strong>STAR+PLUS HCBS waiver</strong> can cover personal care services, nursing, and other supports delivered in an assisted living setting. The resident is responsible for room and board costs.",
  },
  {
    question: "Is there a senior assistance program that covers $3,000 a month in Texas?",
    answer:
      "Yes. The <strong>STAR+PLUS waiver</strong> can provide services valued at several thousand dollars per month, including personal attendant care, home modifications, and adult day care. The exact value depends on the care plan set by your service coordinator.",
  },
  {
    question: "Can a family member get paid to care for me in Texas?",
    answer:
      "Yes. Through <strong>Consumer Directed Services (CDS)</strong> under STAR+PLUS, you can hire a family member (except a spouse in most cases) as your paid caregiver. They must pass a background check and be managed through an FMSA.",
  },
  {
    question: "How long is the waitlist for STAR+PLUS in Texas?",
    answer:
      "The STAR+PLUS interest list wait time varies by region but typically ranges from <strong>6 to 18 months</strong>. You can get on the list by calling <strong>211</strong> or applying through <a href='https://www.yourtexasbenefits.com' target='_blank' rel='noopener noreferrer' class='text-primary-600 underline'>YourTexasBenefits.com</a>. Getting on the list early is critical.",
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
