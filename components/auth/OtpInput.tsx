"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

/**
 * Accessible OTP input component with large touch targets.
 * Optimized for seniors with:
 * - Large, clearly separated input boxes
 * - Auto-focus and auto-advance
 * - Paste support (full code or partial)
 * - Keyboard navigation (backspace to go back)
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Split value into individual characters
  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  // Focus first empty input on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmptyIndex = digits.findIndex((d) => d === "");
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [autoFocus, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusInput = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clampedIndex]?.focus();
    setFocusedIndex(clampedIndex);
  }, [length]);

  const handleChange = (index: number, newValue: string) => {
    // Handle paste of full code
    if (newValue.length > 1) {
      const pastedCode = newValue.replace(/\D/g, "").slice(0, length);
      onChange(pastedCode);
      // Focus last filled input or first empty
      const nextIndex = Math.min(pastedCode.length, length - 1);
      setTimeout(() => focusInput(nextIndex), 0);
      return;
    }

    // Single character input
    const digit = newValue.replace(/\D/g, "");
    if (digit.length === 0 && newValue.length > 0) {
      // Non-digit entered, ignore
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(""));

    // Auto-advance to next input
    if (digit && index < length - 1) {
      setTimeout(() => focusInput(index + 1), 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index] === "" && index > 0) {
        // Current is empty, go back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        focusInput(index - 1);
        e.preventDefault();
      } else if (digits[index] !== "") {
        // Clear current
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedText) {
      onChange(pastedText);
      const nextIndex = Math.min(pastedText.length, length - 1);
      setTimeout(() => focusInput(nextIndex), 0);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // Select the input content for easy replacement
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length} // Allow paste of full code
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className={`
            w-12 h-14 sm:w-14 sm:h-16
            text-center text-2xl font-semibold
            border-2 rounded-lg
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500"
              : focusedIndex === index
              ? "border-primary-500 bg-white focus:ring-primary-500"
              : digit
              ? "border-gray-300 bg-gray-50"
              : "border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-500"
            }
          `}
        />
      ))}
    </div>
  );
}
