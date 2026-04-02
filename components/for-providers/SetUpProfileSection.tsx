"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";

const PREFILL_KEY = "olera_provider_search_prefill";

const PROFILE_BENEFITS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    text: "Your profile goes live immediately, visible to thousands of families searching for care in your area",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    text: "Caregivers near your facility can find you too. One profile connects you to both families and staff",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    text: "Free to set up. No subscription required to get found. Leads from your profile are always free, no commissions",
  },
];

export default function SetUpProfileSection() {
  const { user, openAuth } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [zipCode, setZipCode] = useState("");

  const handleGetStarted = () => {
    const name = businessName.trim();
    const zip = zipCode.trim();
    if (name || zip) {
      try {
        sessionStorage.setItem(
          PREFILL_KEY,
          JSON.stringify({
            searchQuery: name,
            locationQuery: zip,
          }),
        );
      } catch {
        /* sessionStorage unavailable */
      }
    }

    if (user) {
      router.push("/provider/onboarding");
    } else {
      openAuth({ intent: "provider" });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="font-serif text-display-sm md:text-display-md font-bold text-gray-900">
            Set up your profile in minutes
          </h2>
          <p className="mt-4 text-lg text-gray-500 leading-relaxed">
            Your Olera profile is how families find you and how caregivers know
            you&apos;re hiring. It takes a few minutes to set up and starts
            working for you immediately. Most features are free. Pro features
            are designed to be high-value, not extractive.
          </p>
        </div>

        {/* Benefits list */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {PROFILE_BENEFITS.map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mt-0.5">
                {item.icon}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
            {/* Left — Form */}
            <div className="p-8 lg:p-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Add your business details
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                We&apos;ll check if your business is already on Olera. If it is,
                you can claim it. If not, we&apos;ll create a new profile for you.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="business-name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Business name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGetStarted();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="zip-code"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Zip code
                  </label>
                  <input
                    id="zip-code"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGetStarted();
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetStarted}
                className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors min-h-[44px]"
              >
                Get started, it&apos;s free
              </button>
            </div>

            {/* Right — Profile screenshot */}
            <div className="flex items-center justify-center p-4 lg:p-6">
              <Image
                src="/images/for-providers/profile-screenshot.png"
                alt="Provider profile page on Olera"
                width={789}
                height={700}
                className="w-full h-auto rounded-lg shadow-lg"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
