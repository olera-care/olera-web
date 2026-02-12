"use client";

interface MatchActionsProps {
  onDismiss: () => void;
  onConnect: () => void;
  disabled?: boolean;
}

export default function MatchActions({
  onDismiss,
  onConnect,
  disabled,
}: MatchActionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-5">
      <div className="flex items-center gap-5">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          disabled={disabled}
          className="w-[52px] h-[52px] rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shadow-sm transition-all duration-150 hover:border-red-800 hover:text-red-800 hover:scale-[1.08] text-gray-400 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Skip this match"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Connect button */}
        <button
          onClick={onConnect}
          disabled={disabled}
          className="w-[52px] h-[52px] rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20 transition-all duration-150 hover:scale-[1.08] hover:shadow-primary-600/40 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Connect with this provider"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <p className="text-[11px] text-gray-400">
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
          ←
        </kbd>{" "}
        skip{" "}
        <span className="mx-1">·</span>{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
          →
        </kbd>{" "}
        connect{" "}
        <span className="mx-1">·</span>{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
          ↑
        </kbd>{" "}
        view profile
      </p>
    </div>
  );
}
