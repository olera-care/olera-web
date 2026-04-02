import type { StudentMetadata } from "@/lib/types";
import CaregiverSectionCard, { EmptyState } from "./CaregiverSectionCard";
import { SCENARIO_QUESTIONS } from "@/lib/medjobs-completeness";

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
      title="Screening Questions"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          {/* Question summaries */}
          <div className="space-y-2.5">
            {SCENARIO_QUESTIONS.map((q, i) => {
              const response = responses.find((r) => r.question === q.question);
              const isDone = (response?.answer?.length ?? 0) >= 50;
              return (
                <div key={q.key} className="flex items-start gap-2">
                  {isDone ? (
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs font-medium ${isDone ? "text-gray-600" : "text-gray-500"}`}>
                      Q{i + 1}: {q.question.length > 50 ? q.question.slice(0, 50) + "..." : q.question}
                    </span>
                    {isDone && response?.answer && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {response.answer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CaregiverSectionCard>
  );
}
