"use client";

import PhoneButton from "./PhoneButton";

interface DefaultActionsProps {
  phone: string | null;
  phoneRevealed: boolean;
  isAuthenticated: boolean;
  onConnect: () => void;
  onRevealPhone: () => void;
  onSignIn: () => void;
}

export default function DefaultActions({
  phone,
  phoneRevealed,
  isAuthenticated,
  onConnect,
  onRevealPhone,
  onSignIn,
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

      {/* Sign-in nudge — only for unauthenticated users */}
      {!isAuthenticated && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Already connected?{" "}
          <button
            onClick={onSignIn}
            className="text-primary-600 hover:text-primary-500 font-medium bg-transparent border-none cursor-pointer p-0 underline underline-offset-2 transition-colors"
          >
            Sign in
          </button>
        </p>
      )}
    </>
  );
}
