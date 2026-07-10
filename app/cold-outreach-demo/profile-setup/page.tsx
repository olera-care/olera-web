"use client";

import { useState, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useNavbar } from "@/components/shared/NavbarContext";

// ============================================================
// Wizard Steps Configuration
// ============================================================

const WIZARD_STEPS = [
  {
    id: "photos",
    title: "Add photos of your community",
    description: "Photos help families picture themselves at your community. Add your best images.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zM15.75 9a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    id: "services",
    title: "What care services do you offer?",
    description: "Let families know what types of care and support you provide.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    id: "about",
    title: "Tell families about your community",
    description: "Share what makes your community special and why families choose you.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    id: "pricing",
    title: "Add your pricing information",
    description: "Families want to know costs upfront. Share your pricing range.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const MOCK_PROVIDER = {
  name: "Emerald Oaks Senior Living",
  category: "Assisted Living",
  city: "Austin",
  state: "TX",
  image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80",
};

const CARE_SERVICES = [
  "24/7 Staff",
  "Medication Management",
  "Personal Care Assistance",
  "Memory Care",
  "Physical Therapy",
  "Meal Preparation",
  "Housekeeping",
  "Transportation",
  "Social Activities",
  "Pet Friendly",
];

// ============================================================
// Step Components
// ============================================================

function PhotosStep({ onNext }: { onNext: () => void }) {
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80",
  ]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary-200">
            <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                Main
              </span>
            </div>
          </div>
        ))}
        <button
          onClick={() => {}}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm text-gray-500">Add photo</span>
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Tip: Communities with 5+ photos get 3x more inquiries from families.
      </p>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
      >
        Continue
      </button>
    </div>
  );
}

function ServicesStep({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string[]>(["24/7 Staff", "Medication Management"]);

  const toggle = (service: string) => {
    setSelected((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CARE_SERVICES.map((service) => {
          const isSelected = selected.includes(service);
          return (
            <button
              key={service}
              onClick={() => toggle(service)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {service}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
      >
        Continue
      </button>
    </div>
  );
}

function AboutStep({ onNext }: { onNext: () => void }) {
  const [about, setAbout] = useState(
    "Emerald Oaks Senior Living provides compassionate, personalized care in a warm, home-like environment. Our dedicated staff is available 24/7 to ensure residents feel safe, comfortable, and engaged."
  );

  return (
    <div>
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={5}
        className="w-full px-4 py-3 text-[15px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 transition-all mb-2"
        placeholder="Tell families what makes your community special..."
      />
      <p className="text-sm text-gray-500 mb-6">
        {about.length}/500 characters
      </p>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
      >
        Continue
      </button>
    </div>
  );
}

function PricingStep({ onComplete }: { onComplete: () => void }) {
  const [minPrice, setMinPrice] = useState("3500");
  const [maxPrice, setMaxPrice] = useState("6500");

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Starting from
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-3 text-[15px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="3,500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">per month</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Up to
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-3 text-[15px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="6,500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">per month</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        You can update pricing anytime. Families appreciate transparency.
      </p>

      <button
        onClick={onComplete}
        className="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
      >
        Finish setup
      </button>
    </div>
  );
}

function CompletionState() {
  return (
    <div className="text-center py-8" style={{ animation: "card-enter 0.3s ease-out both" }}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-6 border border-primary-100/60">
        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      </div>

      <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
        Your profile is ready!
      </h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        Families can now learn about Emerald Oaks Senior Living before reaching out. Your profile is doing the talking.
      </p>

      <Link
        href="/cold-outreach-demo/claimed"
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all"
      >
        View your profile
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function ProfileSetupPage() {
  const { setForceHidden } = useNavbar();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Hide main navbar
  useLayoutEffect(() => {
    setForceHidden(true);
    return () => setForceHidden(false);
  }, [setForceHidden]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const step = WIZARD_STEPS[currentStep];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F0]/80 backdrop-blur-sm border-b border-gray-200/40">
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <Image src="/images/olera-logo.png" alt="Olera" width={28} height={28} className="object-contain" />
              <span className="text-lg font-bold text-gray-900">Olera</span>
            </Link>

            <span className="hidden sm:block text-sm font-medium text-gray-500">
              Set up your profile
            </span>

            <Link
              href="/cold-outreach-demo/activation"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-14">
        <div className="max-w-xl mx-auto px-5 sm:px-8 py-10">
          {completed ? (
            <CompletionState />
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Step {currentStep + 1} of {WIZARD_STEPS.length}
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% complete
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Provider card */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl border border-gray-100">
                <Image
                  src={MOCK_PROVIDER.image}
                  alt={MOCK_PROVIDER.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{MOCK_PROVIDER.name}</h3>
                  <p className="text-sm text-gray-500">{MOCK_PROVIDER.category} · {MOCK_PROVIDER.city}, {MOCK_PROVIDER.state}</p>
                </div>
              </div>

              {/* Step card */}
              <div
                className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8"
                style={{ animation: "card-enter 0.25s ease-out both" }}
                key={currentStep}
              >
                {/* Step header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 text-primary-600 border border-primary-100/60">
                    {step.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-gray-900 mb-1">
                      {step.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Step content */}
                {step.id === "photos" && <PhotosStep onNext={handleNext} />}
                {step.id === "services" && <ServicesStep onNext={handleNext} />}
                {step.id === "about" && <AboutStep onNext={handleNext} />}
                {step.id === "pricing" && <PricingStep onComplete={handleComplete} />}
              </div>

              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {WIZARD_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep
                        ? "w-8 bg-primary-600"
                        : i < currentStep
                          ? "w-1.5 bg-primary-300"
                          : "w-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Demo notice */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">This is a demo</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  This wizard demonstrates the profile setup flow after a provider answers a family's question.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
