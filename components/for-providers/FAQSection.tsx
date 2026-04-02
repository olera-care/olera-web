"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: "How does Olera help me balance client demand and staffing?",
    answer:
      "Every care operator knows the balancing act: more families means more shifts to fill, and understaffing means turning away business. Olera is the only platform that addresses both sides. Your profile brings in families through local search, and our staffing pipeline connects you with vetted caregivers from university health programs. Grow your census and fill your shifts from the same place.",
  },
  {
    question: "What does it cost?",
    answer: (
      <>
        Setting up your profile is free, and it goes live immediately, visible
        to the thousands of families visiting Olera every month. Leads that come
        to you through your profile are always free, with no commissions. For{" "}
        <Link href="/provider/pro" className="text-primary-600 font-medium hover:underline">
          $50/month with Olera Pro
        </Link>
        , you unlock proactive matching with high-intent families through our
        outreach system, plus unlimited access to browse and hire from our vetted
        caregiver pool. One subscription covers both sides: unlimited family
        matching and unlimited hiring.
      </>
    ),
  },
  {
    question: "What about hiring fees?",
    answer: (
      <>
        Your first three hires are completely free, no subscription needed.
        After that, the same{" "}
        <Link href="/provider/pro" className="text-primary-600 font-medium hover:underline">
          $50/month Pro plan
        </Link>{" "}
        that unlocks family matching also gives you unlimited access to browse
        and hire from our caregiver pool. No placement fees, no per-hire
        charges, no markups.
      </>
    ),
  },
  {
    question: "How quickly can I get started?",
    answer:
      "You can set up your profile in under five minutes. Once it is live, families searching for care in your area can find you immediately. Browsing caregiver profiles is available right away too. Most providers go from sign-up to their first family inquiry or caregiver interview within the first week.",
  },
  {
    question: "Where do your caregivers come from?",
    answer:
      "We recruit from university pre-health programs: pre-med, pre-nursing, pre-PA, physical therapy, and public health. They need hundreds of verified patient care hours for their professional school applications, so they stay longer and show up more reliably than typical part-time hires.",
  },
  {
    question: "How are caregivers vetted?",
    answer:
      "University enrollment verification, a recorded video intro with scenario-based questions, formal commitments to punctuality and professional conduct, a locked-in schedule, and realistic job expectation setting. Not every applicant makes it through. That is by design.",
  },
  {
    question: "What senior care businesses should join?",
    answer:
      "Any organization that provides senior care services, including home care agencies, assisted living communities, memory care facilities, nursing homes, independent living communities, and adult day care centers. Whether you are a single-location provider or a multi-site operator, Olera helps families find you and connects you with vetted staff.",
  },
  {
    question: "Why did you build Olera?",
    answer: (
      <>
        Our founders met in graduate school and spent two years in the{" "}
        <a
          href="https://new.nsf.gov/funding/initiatives/i-corps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 font-medium hover:underline"
        >
          NIH/NSF I-Corps program
        </a>{" "}
        researching the eldercare ecosystem, interviewing hundreds of families,
        providers, and caregivers. They found that existing platforms fail both
        sides: families get sold to the highest bidder, providers pay steep lead
        fees, and staffing is handled by expensive agencies with high turnover.
        Olera was built to fix that. One platform where providers can grow their
        census and staff their shifts without middlemen.
      </>
    ),
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

              {/* Animated expand */}
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
