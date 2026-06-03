"use client";

import { useState, useCallback } from "react";
import type { VerificationResult } from "@/components/provider/VerificationMethodModal";

interface UseVerificationModalOptions {
  profileId: string;
  claimerName?: string;
  onVerified?: () => void;
  onPendingReview?: () => void;
  onDismissed?: () => void;
}

interface UseVerificationModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  handleSubmit: (result: VerificationResult) => Promise<{ verified: boolean; pendingReview: boolean; suggestion?: string }>;
  handleDismiss: () => void;
  isVerified: boolean;
  isPendingReview: boolean;
}

/**
 * Hook to manage the verification modal state and API calls.
 *
 * Usage:
 * ```tsx
 * const { isOpen, open, close, handleSubmit, handleDismiss, isVerified } = useVerificationModal({
 *   profileId: profile.id,
 *   claimerName: "John Doe",
 *   onVerified: () => router.refresh(),
 * });
 *
 * <VerificationMethodModal
 *   isOpen={isOpen}
 *   onClose={close}
 *   onSubmit={handleSubmit}
 *   onDismiss={handleDismiss}
 *   businessName={profile.display_name}
 * />
 * ```
 */
export function useVerificationModal({
  profileId,
  claimerName,
  onVerified,
  onPendingReview,
  onDismissed,
}: UseVerificationModalOptions): UseVerificationModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleSubmit = useCallback(
    async (result: VerificationResult): Promise<{ verified: boolean; pendingReview: boolean }> => {
      const response = await fetch("/api/provider/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          method: result.method,
          value: result.value,
          documentData: result.documentData,
          documentType: result.documentType,
          linkedinScreenshots: result.linkedinScreenshots,
          // Use fullName from form (preferred) or fallback to pre-configured claimerName
          claimerName: result.fullName || claimerName,
        }),
      });

      // Handle non-JSON responses (e.g., Vercel 413/504 errors)
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[useVerificationModal] Failed to parse response:", parseError);
        // Provide friendly error messages for common HTTP errors
        if (response.status === 413) {
          throw new Error("Images are too large. Please use smaller screenshots (under 2MB each).");
        } else if (response.status === 504) {
          throw new Error("Verification timed out. Please try again.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a moment.");
        } else {
          throw new Error("Something went wrong. Please try a different method.");
        }
      }

      if (!response.ok) {
        throw new Error(data.reason || "Verification failed");
      }

      if (data.verified) {
        // Instant verification succeeded
        setIsVerified(true);
        setIsPendingReview(false);
        onVerified?.();
        return { verified: true, pendingReview: false };
      } else if (data.pendingReview) {
        // Sent to manual review - user completed their part but not yet verified
        setIsVerified(false);
        setIsPendingReview(true);
        onPendingReview?.();
        return { verified: false, pendingReview: true, suggestion: data.suggestion };
      } else {
        // Verification failed with a reason
        throw new Error(data.reason || "Could not verify. Please try a different method.");
      }
    },
    [profileId, claimerName, onVerified, onPendingReview]
  );

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    onDismissed?.();
  }, [onDismissed]);

  return {
    isOpen,
    open,
    close,
    handleSubmit,
    handleDismiss,
    isVerified,
    isPendingReview,
  };
}
