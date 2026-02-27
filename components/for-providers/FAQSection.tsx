"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "Why We Created Olera?",
    answer:
      "We built Olera after seeing how most senior care directories fail both families and providers. Existing senior care websites focus on selling family contact information to the highest bidder. They\u2019re limited to a few types of care, packed with confusing ads, and driven more by lead volume than genuine connection.",
  },
  {
    question: "What senior care businesses should join the Olera network?",
    answer:
      "Any organization that provides senior care services \u2014 including assisted living communities, home care agencies, memory care facilities, nursing homes, independent living communities, and adult day care centers. Whether you\u2019re a single-location provider or a multi-site operator, Olera helps families find you.",
  },
  {
    question: "What are the benefits for my organization?",
    answer:
      "Olera gives your organization a professional profile optimized for search engines, helping families discover you through local searches. You\u2019ll receive direct inquiries from families \u2014 no middleman, no referral fees per lead. Plus, you can manage reviews, track leads, and showcase what makes your care special.",
  },
  {
    question: "Are there any costs to joining?",
    answer:
      "Getting started on Olera is free. You can claim or create your profile, add your services and photos, and start appearing in search results at no cost. For providers who want to respond to inquiries and access full lead details, we offer a Pro plan with a 30-day free trial.",
  },
  {
    question: "How many new clients should I expect?",
    answer:
      "Results vary based on your location, care type, and profile completeness. Providers with complete profiles \u2014 including photos, detailed services, and active review management \u2014 tend to receive significantly more inquiries. We\u2019re transparent: there are no guarantees, but we\u2019re building tools to help you convert every lead.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900 text-center mb-12">
          FAQ
        </h2>

        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {faqItems.map((item, index) => (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-text-md font-medium text-gray-900 pr-4">
                  {item.question}
                </span>
                <span className="shrink-0 w-6 h-6 flex items-center justify-center text-primary-600">
                  {openIndex === index ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </span>
              </button>

              {/* Answer — animated expand */}
              <div
                className="grid transition-all duration-300 ease-in-out"
                style={{
                  gridTemplateRows: openIndex === index ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-text-md text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
