import type { ProfileCompleteness } from "@/lib/profile-completeness";
import CircularProgress from "@/components/ui/CircularProgress";

interface ProfileCompletenessSidebarProps {
  completeness: ProfileCompleteness;
  lastUpdated: string;
}

function getStatusText(percent: number): string {
  if (percent >= 100) return "ALL DONE!";
  if (percent >= 76) return "NEARLY COMPLETE!";
  if (percent >= 51) return "LOOKING GOOD!";
  if (percent >= 26) return "ALMOST THERE!";
  return "JUST GETTING STARTED";
}

export default function ProfileCompletenessSidebar({
  completeness,
  lastUpdated,
}: ProfileCompletenessSidebarProps) {
  const formattedDate = new Date(lastUpdated).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-gradient-to-b from-white to-vanilla-50 rounded-2xl border border-gray-200/80 shadow-sm p-6">
      {/* Header */}
      <h3 className="text-lg font-display font-bold text-gray-900 mb-5">
        Profile completeness
      </h3>

      {/* Circular progress */}
      <div className="flex justify-center mb-3">
        <CircularProgress percent={completeness.overall} size={140} />
      </div>

      {/* Status text */}
      <p className="text-center text-sm font-semibold tracking-wide uppercase text-gray-900 font-display mb-1">
        {getStatusText(completeness.overall)}
      </p>
      <p className="text-center text-sm text-gray-400 mb-6">
        Last updated: {formattedDate}
      </p>

      {/* CTA */}
      <p className="text-[15px] font-medium text-gray-600 mb-4">
        Complete your profile to attract more clients
      </p>

      {/* Section checklist */}
      <div className="space-y-0.5">
        {completeness.sections.map((section) => {
          const isComplete = section.percent >= 100;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center justify-between py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-vanilla-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                )}
                <span
                  className={`text-[15px] ${
                    isComplete
                      ? "text-primary-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {section.label}
                </span>
              </div>
              {!isComplete && (
                <span className="text-sm font-medium text-primary-600">
                  {section.percent}%
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
