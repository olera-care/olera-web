"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAccountRestricted, isVerificationPending } from "@/lib/verification-gate";
import VerificationFormModal from "@/components/provider/VerificationFormModal";
import VerificationPendingModal from "@/components/provider/VerificationPendingModal";
import type { VerificationSubmission, ExistingVerificationData } from "@/components/provider/VerificationFormModal";

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

type ModalState = "none" | "pending" | "form";

export function VerificationGateProvider({ children }: VerificationGateProviderProps) {
  const [modalState, setModalState] = useState<ModalState>("none");
  const providerProfile = useProviderProfile();
  const { user, refreshAccountData } = useAuth();

  const verificationState = providerProfile?.verification_state;
  const isRestricted = isAccountRestricted(verificationState);
  const isPending = isVerificationPending(verificationState);
  const hasFullAccess = !isRestricted && !isPending;

  // Extract existing submission data from profile metadata
  const existingSubmission = useMemo(() => {
    const meta = providerProfile?.metadata as Record<string, unknown> | undefined;
    const submission = meta?.verification_submission as Record<string, unknown> | undefined;
    if (!submission) return null;

    return {
      name: (submission.name as string) || "",
      email: submission.email as string | null,
      role: (submission.role as string) || "",
      phone: submission.phone as string | null,
      notes: submission.notes as string | null,
      verification_type: submission.verification_type as "linkedin" | "website" | "contact_support" | null,
      linkedin_url: submission.linkedin_url as string | null,
      website_url: submission.website_url as string | null,
      submitted_at: submission.submitted_at as string | undefined,
    };
  }, [providerProfile?.metadata]);

  // Convert to form format (camelCase)
  const existingFormData: ExistingVerificationData | undefined = useMemo(() => {
    if (!existingSubmission) return undefined;
    return {
      name: existingSubmission.name,
      email: existingSubmission.email,
      role: existingSubmission.role,
      phone: existingSubmission.phone,
      notes: existingSubmission.notes,
      verificationType: existingSubmission.verification_type,
      linkedinUrl: existingSubmission.linkedin_url,
      websiteUrl: existingSubmission.website_url,
      submitted_at: existingSubmission.submitted_at,
    };
  }, [existingSubmission]);

  const openVerificationModal = useCallback(() => {
    // Show pending modal if they've already submitted, otherwise show form
    if (isPending && existingSubmission) {
      setModalState("pending");
    } else {
      setModalState("form");
    }
  }, [isPending, existingSubmission]);

  const closeVerificationModal = useCallback(() => {
    setModalState("none");
  }, []);

  const requireVerification = useCallback((): boolean => {
    if (isRestricted || isPending) {
      openVerificationModal();
      return false;
    }
    return true;
  }, [isRestricted, isPending, openVerificationModal]);

  // Switch from pending modal to form for updates
  const handleUpdateSubmission = useCallback(() => {
    setModalState("form");
  }, []);

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
      setModalState("none");
    },
    [providerProfile, refreshAccountData]
  );

  const isModalOpen = modalState !== "none";

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

      {/* Pending Review Modal - shown when they've already submitted */}
      {providerProfile && (
        <VerificationPendingModal
          isOpen={modalState === "pending"}
          onClose={closeVerificationModal}
          onUpdateSubmission={handleUpdateSubmission}
          businessName={providerProfile.display_name}
          submissionData={existingSubmission}
        />
      )}

      {/* Verification Form Modal - shown for initial submission or updates */}
      {providerProfile && (
        <VerificationFormModal
          isOpen={modalState === "form"}
          onClose={closeVerificationModal}
          onSubmit={handleVerificationSubmit}
          businessName={providerProfile.display_name}
          userEmail={user?.email || undefined}
          allowDismiss={true}
          onDismiss={closeVerificationModal}
          existingData={existingFormData}
          isUpdate={!!existingSubmission}
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
