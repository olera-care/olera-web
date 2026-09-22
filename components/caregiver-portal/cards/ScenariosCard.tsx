import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { SCENARIO_QUESTIONS } from "@/lib/medjobs-completeness";

// Labels for each screening question
const QUESTION_LABELS: Record<string, string> = {
  scenario_reliability: "Reliability",
  scenario_judgement: "Judgement",
  scenario_commitment: "Commitment",
};

interface ScenariosCardProps {
  meta: StudentMetadata;
  onEdit?: () => void;
}

export default function ScenariosCard({ meta, onEdit }: ScenariosCardProps) {
  const responses = meta.scenario_responses || [];
  const answeredCount = responses.filter((r) => (r.answer?.length ?? 0) >= 50).length;
  const totalQuestions = SCENARIO_QUESTIONS.length;
  const isComplete = answeredCount >= totalQuestions;

  return (
    <CaregiverSectionCard
      title="Screening"
      isComplete={isComplete}
      id="scenarios"
      onEdit={onEdit}
    >
      {responses.length === 0 ? (
        <EmptyState
          message="No answers yet"
          subMessage="Answer screening questions to show providers your judgement."
          icon={
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {SCENARIO_QUESTIONS.map((q) => {
            const response = responses.find((r) => r.question === q.question);
            const isDone = (response?.answer?.length ?? 0) >= 50;
            const label = QUESTION_LABELS[q.key] || q.key;

            return (
              <div key={q.key}>
                <div className="flex items-center gap-2 mb-1">
                  {isDone ? (
                    <svg className="w-3.5 h-3.5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${isDone ? "text-gray-900" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {isDone && response?.answer && (
                  <p className="text-sm text-gray-500 line-clamp-2 ml-[22px]">
                    {response.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CaregiverSectionCard>
  );
}
