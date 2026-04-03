"use client";

interface PillProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  small?: boolean;
}

export default function Pill({ label, selected, onClick, small }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        ${small ? "px-3.5 py-2 min-h-[44px] text-[13px] rounded-full" : "px-4 py-3 min-h-[44px] text-[15px] rounded-xl"}
        whitespace-nowrap border text-center cursor-pointer transition-all duration-150
        ${
          selected
            ? "border-gray-900 bg-gray-900 text-white font-medium"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
        }
      `}
    >
      {label}
    </button>
  );
}
