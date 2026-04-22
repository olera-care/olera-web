"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAccountRestricted, isVerificationPending } from "@/lib/verification-gate";
import VerificationFormModal from "@/components/provider/VerificationFormModal";
import type { VerificationSubmission } from "@/components/provider/VerificationFormModal";

interface VerificationGateContextValue {
  /** Whether the account is in restricted mode (pending_verification) */
  isRestricted: boolean;
  /** Whether verification has been submitted and is awaiting review */
  isPending: boolean;
  /** Whether the account has full access */
  hasFullAccess: boolean;
  /**
   * Call this before performing a restricted action.
   * If restricted, shows the verification modal and returns false.
   * If not restricted, returns true immediately.
   */
  requireVerification: () => boolean;
  /** Manually open the verification modal */
  openVerificationModal: () => void;
  /** Close the verification modal */
  closeVerificationModal: () => void;
  /** Whether the modal is currently open */
  isModalOpen: boolean;
}

const VerificationGateContext = createContext<VerificationGateContextValue | null>(null);

interface VerificationGateProviderProps {
  children: ReactNode;
}

export function VerificationGateProvider({ children }: VerificationGateProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const providerProfile = useProviderProfile();
  const { user, refreshAccountData } = useAuth();

  const verificationState = providerProfile?.verification_state;
  const isRestricted = isAccountRestricted(verificationState);
  const isPending = isVerificationPending(verificationState);
  const hasFullAccess = !isRestricted && !isPending;

  const openVerificationModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeVerificationModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const requireVerification = useCallback((): boolean => {
    if (isRestricted || isPending) {
      openVerificationModal();
      return false;
    }
    return true;
  }, [isRestricted, isPending, openVerificationModal]);

  // Handle verification form submission
  const handleVerificationSubmit = useCallback(
    async (data: VerificationSubmission) => {
      if (!providerProfile) return;

      const res = await fetch("/api/provider/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: providerProfile.id,
          submission: data,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit verification");
      }

      // Refresh to get updated verification_state
      await refreshAccountData();
      setIsModalOpen(false);
    },
    [providerProfile, refreshAccountData]
  );

  const value: VerificationGateContextValue = {
    isRestricted,
    isPending,
    hasFullAccess,
    requireVerification,
    openVerificationModal,
    closeVerificationModal,
    isModalOpen,
  };

  return (
    <VerificationGateContext.Provider value={value}>
      {children}

      {/* Global Verification Modal */}
      {providerProfile && (
        <VerificationFormModal
          isOpen={isModalOpen}
          onClose={closeVerificationModal}
          onSubmit={handleVerificationSubmit}
          businessName={providerProfile.display_name}
          userEmail={user?.email || undefined}
          allowDismiss={true}
          onDismiss={closeVerificationModal}
        />
      )}
    </VerificationGateContext.Provider>
  );
}

/**
 * Hook to access verification gate functionality.
 * Must be used within a VerificationGateProvider.
 */
export function useVerificationGate(): VerificationGateContextValue {
  const context = useContext(VerificationGateContext);
  if (!context) {
    throw new Error("useVerificationGate must be used within a VerificationGateProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if outside provider (for components that may render outside provider)
 */
export function useVerificationGateOptional(): VerificationGateContextValue | null {
  return useContext(VerificationGateContext);
}
