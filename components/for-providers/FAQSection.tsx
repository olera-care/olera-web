"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "How does Olera help me balance client demand and staffing?",
    answer:
      "Every care operator knows the balancing act: more families means more shifts to fill, and understaffing means turning away business. Olera is the only platform that addresses both sides \u2014 your profile brings in families through local search, and our staffing pipeline connects you with vetted caregivers from university health programs. Grow your census and fill your shifts from the same place.",
  },
  {
    question: "Why did we create Olera?",
    answer:
      "We built Olera after seeing how most senior care directories fail both families and providers. Existing senior care websites focus on selling family contact information to the highest bidder. They\u2019re limited to a few types of care, packed with confusing ads, and driven more by lead volume than genuine connection.",
  },
  {
    question: "What senior care businesses should join the Olera network?",
    answer:
      "Any organization that provides senior care services \u2014 including assisted living communities, home care agencies, memory care facilities, nursing homes, independent living communities, and adult day care centers. Whether you\u2019re a single-location provider or a multi-site operator, Olera helps families find you.",
  },
  {
    question: "Are there any costs to joining?",
    answer:
      "Getting started on Olera is free. You can claim or create your profile, add your services and photos, and start appearing in search results at no cost. For providers who want to respond to inquiries and access full lead details, we offer a Pro plan with a 14-day free trial.",
  },
  {
    question: "Where do your caregivers come from?",
    answer:
      "We recruit exclusively from university pre-health programs \u2014 pre-med, pre-nursing, pre-PA, physical therapy, and public health. Every caregiver is pursuing a career in healthcare, which means they\u2019re motivated, reliable, and invested in delivering quality care.",
  },
  {
    question: "How are caregivers vetted?",
    answer:
      "Every caregiver goes through a multi-step vetting process: university enrollment verification, a recorded intro video reviewed by our team, reliability and professionalism acknowledgments, and a confirmed schedule commitment. Only candidates who pass every step appear in your browse results.",
  },
  {
    question: "Are there fees for hiring through Olera staffing?",
    answer:
      "No placement fees, no markups, no middlemen. You browse caregiver profiles, watch their intro videos, and reach out directly. The connection is free.",
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
                <span className="text-base font-medium text-gray-900 pr-4">
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
                  <p className="pb-5 text-base text-gray-600 leading-relaxed">
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
