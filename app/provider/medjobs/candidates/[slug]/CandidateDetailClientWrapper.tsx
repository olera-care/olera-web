"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import ProviderContactSection from "./ProviderContactSection";
import VerificationFormModal from "@/components/provider/VerificationFormModal";
import type { VerificationSubmission } from "@/components/provider/VerificationFormModal";

interface CandidateDetailClientWrapperProps {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
  variant: "sidebar" | "sticky" | "inline";
}

export default function CandidateDetailClientWrapper({
  studentId,
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
  variant,
}: CandidateDetailClientWrapperProps) {
  const { activeProfile } = useAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleVerificationSubmit = useCallback(async (data: VerificationSubmission) => {
    if (!activeProfile?.id) return;

    const response = await fetch("/api/provider/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: activeProfile.id,
        submission: data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to submit verification");
    }

    setShowVerificationModal(false);
    window.location.reload();
  }, [activeProfile?.id]);

  return (
    <>
      <ProviderContactSection
        studentId={studentId}
        studentName={studentName}
        studentEmail={studentEmail}
        studentPhone={studentPhone}
        studentSlug={studentSlug}
        variant={variant}
        onVerifyClick={() => setShowVerificationModal(true)}
      />
      <VerificationFormModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
        businessName={activeProfile?.display_name || "Your Business"}
        allowDismiss={true}
        onDismiss={() => setShowVerificationModal(false)}
      />
    </>
  );
}
