"use client";

import type { IntakeStep } from "@/lib/types/benefits";

// ─── Conversation Script ───────────────────────────────────────────────────

const GUIDED_PROMPTS: Record<IntakeStep, string> = {
  0: "Let\u2019s find programs that can help. What city or ZIP code are you in?",
  1: "How old is the person who needs care?",
  2: "Would they prefer to stay at home, or are you exploring facilities?",
  3: "What kind of help do they need most? You can mention a few things.",
  4: "To match the right programs, roughly what\u2019s their monthly income? You can also say \u201Cprefer not to say.\u201D",
  5: "Last one \u2014 do they currently have Medicaid?",
};

const GUIDED_CONFIRMATIONS: Record<IntakeStep, (detail?: string) => string> = {
  0: (detail) => `${detail} \u2014 got it.`,
  1: (detail) => `${detail} years old \u2014 that helps narrow things down.`,
  2: (detail) => `${detail} \u2014 understood.`,
  3: (detail) => `${detail} \u2014 anything else? Say \u201Cdone\u201D or tap Continue.`,
  4: () => "Got it.",
  5: () => "Thanks, that\u2019s everything. Let me find what\u2019s available.",
};

export { GUIDED_PROMPTS, GUIDED_CONFIRMATIONS };

interface GuidedVoicePromptProps {
  step: IntakeStep;
  confirmation: string | null;
}

export default function GuidedVoicePrompt({ step, confirmation }: GuidedVoicePromptProps) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-400 mb-3 tabular-nums">
        {step + 1} / 6
      </p>
      <h2 className="font-display text-display-sm font-medium text-gray-900 mb-3 leading-snug tracking-tight animate-step-in" key={`prompt-${step}`}>
        {GUIDED_PROMPTS[step]}
      </h2>
      {confirmation && (
        <p className="text-sm text-primary-700 font-medium animate-fade-in" key={`confirm-${step}-${confirmation}`}>
          {confirmation}
        </p>
      )}
    </div>
  );
}
