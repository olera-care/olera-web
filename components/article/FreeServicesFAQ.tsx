"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What free services are available for senior citizens in Texas?",
    answer:
      "Texas offers six core free services for seniors: <strong>2-1-1 Texas</strong> (a 24/7 helpline connecting you to local resources), the <strong>Long-Term Care Ombudsman</strong> (a free advocate for nursing home and assisted living residents), <strong>Texas Legal Services for Seniors</strong> (free legal help for people 60+), <strong>SHIP Medicare Counseling</strong> (unbiased help comparing Medicare plans), the <strong>Senior Companion Program</strong> (trained volunteer visitors for isolated seniors), and <strong>Meals on Wheels</strong> (free or low-cost home-delivered meals). Most have no income requirements.",
  },
  {
    question: "Is there really a $3,000 senior assistance program in Texas?",
    answer:
      "There is no single $3,000 program in Texas, despite what online searches suggest. The phrase usually refers to combined annual benefits from multiple programs  - like SNAP food benefits, energy assistance, and Medicare savings programs. Total benefits across multiple programs can exceed $3,000 per year for qualifying seniors.",
  },
  {
    question: "What can senior citizens over 60 get for free in Texas?",
    answer:
      "Texans 60 and older can access free legal help through <strong>Texas Legal Services for Seniors</strong>, free Medicare counseling through <strong>SHIP</strong>, free home-delivered meals through <strong>Meals on Wheels</strong>, free companionship visits through the <strong>Senior Companion Program</strong>, and free advocacy through the <strong>Long-Term Care Ombudsman</strong>. None of these require Medicaid enrollment, and most have no income requirement at all.",
  },
  {
    question: "How do I apply for free services for seniors in Texas?",
    answer:
      "The fastest way is to call <strong>2-1-1</strong> from any phone in Texas. The helpline is free, available 24/7, and can connect you to every senior service in your area. You can also visit <a href='https://www.211texas.org' target='_blank' rel='noopener noreferrer' class='text-primary-600 underline'>211texas.org</a> online. For specific programs, you can call them directly  - each section of this guide includes the program\u2019s phone number.",
  },
  {
    question:
      "Are there free services for seniors who do not qualify for Medicaid?",
    answer:
      "Yes. Most of the services in this guide have <strong>no income or Medicaid requirement</strong>. The Long-Term Care Ombudsman, SHIP Medicare Counseling, Senior Companion Program, and Texas Legal Services for Seniors are all available regardless of income. Meals on Wheels eligibility varies by local chapter but generally serves anyone 60+ who has difficulty preparing meals.",
  },
  {
    question: "What does 2-1-1 Texas do?",
    answer:
      "2-1-1 Texas is a free, confidential helpline that connects callers to local health and human services. It covers everything from senior care and food assistance to housing, transportation, and mental health services. It is available <strong>24 hours a day, 7 days a week</strong>, in English, Spanish, and 150+ other languages through interpreter services. Think of it as a single front door to every state and local assistance program.",
  },
];

export default function FreeServicesFAQ() {
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
