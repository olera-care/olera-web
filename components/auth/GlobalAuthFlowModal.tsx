"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import AuthFlowModal from "@/components/auth/AuthFlowModal";

/**
 * Global wrapper that renders AuthFlowModal based on context state.
 * Include this once in your root layout to enable the global auth flow modal.
 */
export default function GlobalAuthFlowModal() {
  const { isAuthModalOpen, closeAuthModal, authFlowOptions } = useAuth();

  return (
    <AuthFlowModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      intent={authFlowOptions.intent}
      providerType={authFlowOptions.providerType}
      claimProfile={authFlowOptions.claimProfile}
      defaultToSignIn={authFlowOptions.defaultToSignIn}
    />
  );
}
