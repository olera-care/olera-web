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
        ${small ? "px-3.5 py-2 text-sm rounded-full" : "px-4 py-3 text-[15px] rounded-xl"}
        whitespace-nowrap border-[1.5px] font-normal text-center cursor-pointer transition-all duration-150
        ${
          selected
            ? "border-primary-600 bg-primary-50 text-primary-700 font-semibold shadow-sm"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50/30"
        }
      `}
    >
      {selected && <span className="mr-1 text-sm">&#10003;</span>}
      {label}
    </button>
  );
}
