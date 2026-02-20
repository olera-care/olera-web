"use client";

import PhoneButton from "./PhoneButton";

interface DefaultActionsProps {
  phone: string | null;
  phoneRevealed: boolean;
  onConnect: () => void;
  onRevealPhone: () => void;
}

export default function DefaultActions({
  phone,
  phoneRevealed,
  onConnect,
  onRevealPhone,
}: DefaultActionsProps) {
  return (
    <>
      {/* Primary CTA */}
      <button
        onClick={onConnect}
        className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white border-none rounded-[10px] text-base font-semibold cursor-pointer tracking-tight transition-colors"
      >
        Connect
      </button>

      {/* Masked phone */}
      <div className="mt-2.5">
        <PhoneButton
          phone={phone}
          revealed={phoneRevealed}
          onReveal={onRevealPhone}
        />
      </div>

      {/* Helper text */}
      {!phoneRevealed && phone && (
        <p className="text-xs text-gray-400 text-center mt-1.5">
          Connect to see full number
        </p>
      )}
    </>
  );
}
