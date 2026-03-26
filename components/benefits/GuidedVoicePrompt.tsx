"use client";

import type { IntakeStep } from "@/lib/types/benefits";

// ─── Conversation Script ───────────────────────────────────────────────────

const GUIDED_PROMPTS: Record<IntakeStep, string> = {
  0: "Let\u2019s find programs that can help. What city or ZIP code are you in?",
  1: "How old is the person who needs care?",
  2: "Would they prefer to stay at home, or are you exploring facilities?",
  3: "What kind of help do they need most? You can mention a few things.",
  4: "To match the right programs, roughly what\u2019s the monthly budget for care? You can also say \u201Cprefer not to say.\u201D",
  5: "Do they currently have Medicaid?",
  6: "Last one \u2014 is the person who needs care a veteran?",
};

const GUIDED_CONFIRMATIONS: Record<IntakeStep, (detail?: string) => string> = {
  0: (detail) => `${detail} \u2014 got it.`,
  1: (detail) => `${detail} years old \u2014 that helps narrow things down.`,
  2: (detail) => `${detail} \u2014 understood.`,
  3: (detail) => `${detail} \u2014 anything else? Say \u201Cdone\u201D or tap Continue.`,
  4: () => "Got it.",
  5: () => "Got it.",
  6: () => "Thanks, that\u2019s everything. Let me find what\u2019s available.",
};

export { GUIDED_PROMPTS, GUIDED_CONFIRMATIONS };

interface GuidedVoicePromptProps {
  step: IntakeStep;
  confirmation: string | null;
  /** Whether TTS is currently narrating */
  isSpeaking?: boolean;
}

export default function GuidedVoicePrompt({ step, confirmation, isSpeaking }: GuidedVoicePromptProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-gray-400 tabular-nums">
          {step + 1} / 7
        </p>
        {isSpeaking && (
          <span className="flex items-center gap-1 text-xs text-primary-600 animate-fade-in">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            Speaking
          </span>
        )}
      </div>
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
