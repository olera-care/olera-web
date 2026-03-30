"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is the difference between STAR+PLUS and regular Medicaid?",
    answer:
      "Regular Texas Medicaid covers basic health care like doctor visits and prescriptions. <strong>STAR+PLUS</strong> adds long-term services and supports (LTSS) on top of that, including personal attendant care, home modifications, adult day care, and the option to hire family members as caregivers through Consumer Directed Services.",
  },
  {
    question: "How long is the STAR+PLUS waitlist in Texas?",
    answer:
      "The HCBS waiver interest list typically ranges from <strong>6 to 18 months</strong> depending on your region. Rural areas tend to have shorter waits (3 to 8 months), while major metros like Dallas and Austin can be 8 to 16 months. Getting on the list early is the most important step.",
  },
  {
    question: "Can I keep my house if I go on STAR+PLUS?",
    answer:
      "Yes. Your primary home is <strong>exempt</strong> from the Medicaid asset count as long as you (or your spouse) live in it or intend to return to it. One vehicle is also exempt. However, Texas may seek estate recovery after you pass away.",
  },
  {
    question: "What if my income is over the $2,982 limit?",
    answer:
      "You can use a <strong>Qualified Income Trust</strong> (also called a Miller Trust) to bring your countable income below the limit. Excess income goes into the trust each month and is used for approved expenses. Your managed care organization or a Medicaid planner can help set one up.",
  },
  {
    question: "Can my daughter get paid to take care of me through STAR+PLUS?",
    answer:
      "<strong>Yes.</strong> Through Consumer Directed Services (CDS), adult children can be hired as paid caregivers. They must be 18 or older and pass a background check. Pay rates range from $10 to $17 per hour depending on the MCO and region.",
  },
  {
    question: "What services does the STAR+PLUS waiver cover?",
    answer:
      "The HCBS waiver covers personal attendant services, home modifications (ramps, grab bars), adaptive aids, adult day care, respite care, skilled nursing, therapy, and more. Services are determined by your individualized care plan created with your service coordinator.",
  },
];

export default function StarPlusFAQ() {
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
