"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import AuthFlowModal from "@/components/auth/AuthFlowModal";

interface ProviderGetStartedButtonProps {
  /** Visual variant */
  variant?: "primary" | "hero";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Client component that opens the unified auth + onboarding flow for providers.
 *
 * Uses AuthFlowModal with intent="provider" to skip the "family vs provider"
 * question since the user's intent is clear from the entry point.
 *
 * Used on the provider landing page where the parent is a server component.
 */
export default function ProviderGetStartedButton({
  variant = "primary",
  className,
  children,
}: ProviderGetStartedButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "hero") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "inline-flex items-center justify-center font-semibold rounded-lg px-10 py-4 text-lg bg-white text-primary-700 hover:bg-primary-50 transition-colors min-h-[44px] shadow-lg"
          }
        >
          {children ?? "Get Started Free"}
        </button>
        <AuthFlowModal
          isOpen={open}
          onClose={() => setOpen(false)}
          intent="provider"
        />
      </>
    );
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        {children ?? "Get Started Free"}
      </Button>
      <AuthFlowModal
        isOpen={open}
        onClose={() => setOpen(false)}
        intent="provider"
      />
    </>
  );
}
