"use client";

import PhoneButton from "./PhoneButton";

interface InactiveStateProps {
  providerName: string;
  phone: string | null;
  saved: boolean;
  onToggleSave: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "#EF4444" : "none"}
      stroke={filled ? "#EF4444" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? "" : "text-gray-500"}
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function InactiveState({
  providerName,
  phone,
  saved,
  onToggleSave,
}: InactiveStateProps) {
  return (
    <>
      {/* Status banner */}
      <div className="px-4 py-4 bg-gray-50 rounded-[10px] mb-4 border border-gray-100">
        <p className="text-sm font-semibold text-gray-700">
          Not accepting requests
        </p>
        <p className="text-[13px] text-gray-500 mt-0.5">
          This provider is currently unavailable.
        </p>
      </div>

      {/* Phone — fully revealed */}
      <PhoneButton phone={phone} revealed onReveal={() => {}} />

      {/* Save for later */}
      <button
        onClick={onToggleSave}
        className="flex items-center justify-center gap-1.5 w-full mt-2 py-3 border border-gray-200 rounded-[10px] cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
      >
        <HeartIcon filled={saved} />
        {saved ? "Saved for later" : "Save for later"}
      </button>
    </>
  );
}
