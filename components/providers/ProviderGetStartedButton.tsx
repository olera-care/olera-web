"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface ProviderGetStartedButtonProps {
  /** Visual variant */
  variant?: "primary" | "hero";
  className?: string;
  children?: React.ReactNode;
}

/**
 * Client component that opens the auth modal for provider sign-up.
 * After authentication, the user is redirected to /onboarding?intent=organization.
 *
 * Used on the provider landing page where the parent is a server component.
 */
export default function ProviderGetStartedButton({
  variant = "primary",
  className,
  children,
}: ProviderGetStartedButtonProps) {
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (user) {
      // Already authenticated — go straight to onboarding
      router.push("/onboarding?intent=organization");
      return;
    }

    // Open auth overlay; after sign-up, deferred action redirects to onboarding
    openAuthModal(
      { action: "create_profile", returnUrl: "/onboarding?intent=organization" },
      "sign-up"
    );
  };

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={
          className ??
          "inline-flex items-center justify-center font-semibold rounded-lg px-10 py-4 text-lg bg-white text-primary-700 hover:bg-primary-50 transition-colors min-h-[44px] shadow-lg"
        }
      >
        {children ?? "Get Started Free"}
      </button>
    );
  }

  return (
    <Button size="lg" onClick={handleClick}>
      {children ?? "Get Started Free"}
    </Button>
  );
}
