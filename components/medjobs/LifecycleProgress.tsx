"use client";

const PHASES = [
  { key: "apply", label: "Apply" },
  { key: "verify", label: "Verify" },
  { key: "interview", label: "Interview" },
  { key: "hired", label: "Get Hired" },
] as const;

export type LifecyclePhase = (typeof PHASES)[number]["key"];

const PHASE_INDEX: Record<LifecyclePhase, number> = {
  apply: 0,
  verify: 1,
  interview: 2,
  hired: 3,
};

export function LifecycleProgress({ currentPhase }: { currentPhase: LifecyclePhase }) {
  const currentIdx = PHASE_INDEX[currentPhase];

  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full">
      {PHASES.map((phase, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={phase.key} className="flex-1 flex flex-col items-center gap-1.5">
            {/* Bar segment */}
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? "w-full bg-gray-900"
                    : isCurrent
                      ? "w-1/2 bg-gray-900"
                      : "w-0"
                }`}
              />
            </div>
            {/* Label */}
            <span
              className={`text-[11px] sm:text-xs font-medium transition-colors ${
                isCompleted || isCurrent ? "text-gray-900" : "text-gray-300"
              }`}
            >
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
