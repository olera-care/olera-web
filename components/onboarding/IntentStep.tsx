"use client";

import type { ProfileType } from "@/lib/types";

interface IntentStepProps {
  onSelect: (intent: ProfileType) => void;
}

const INTENTS: { type: ProfileType; title: string; description: string; icon: string }[] = [
  {
    type: "family",
    title: "I'm looking for care",
    description: "Find trusted providers for yourself or a loved one.",
    icon: "🏠",
  },
  {
    type: "organization",
    title: "I manage a care organization",
    description: "List your facility or agency and connect with families.",
    icon: "🏥",
  },
  {
    type: "caregiver",
    title: "I'm an independent caregiver",
    description: "Create your profile and find families or organizations.",
    icon: "🤝",
  },
];

export default function IntentStep({ onSelect }: IntentStepProps) {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        What brings you to Olera?
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        This helps us set up the right experience for you.
      </p>

      <div className="space-y-4">
        {INTENTS.map((intent) => (
          <button
            key={intent.type}
            type="button"
            onClick={() => onSelect(intent.type)}
            className="w-full text-left p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" role="img" aria-hidden="true">
                {intent.icon}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700">
                  {intent.title}
                </h2>
                <p className="text-base text-gray-600 mt-1">
                  {intent.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
