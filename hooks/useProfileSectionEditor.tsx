"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useVerificationModal } from "@/lib/hooks/useVerificationModal";
import type { Profile } from "@/lib/types";
import type { ExtendedMetadata } from "@/lib/profile-completeness";
import type { SectionId } from "@/components/provider-dashboard/edit-modals/types";
import EditOverviewModal from "@/components/provider-dashboard/edit-modals/EditOverviewModal";
import EditGalleryModal from "@/components/provider-dashboard/edit-modals/EditGalleryModal";
import EditCareServicesModal from "@/components/provider-dashboard/edit-modals/EditCareServicesModal";
import EditStaffScreeningModal from "@/components/provider-dashboard/edit-modals/EditStaffScreeningModal";
import EditAboutModal from "@/components/provider-dashboard/edit-modals/EditAboutModal";
import EditPricingModal from "@/components/provider-dashboard/edit-modals/EditPricingModal";
import EditPaymentModal from "@/components/provider-dashboard/edit-modals/EditPaymentModal";
import EditOwnerModal from "@/components/provider-dashboard/edit-modals/EditOwnerModal";
import VerificationMethodModal from "@/components/provider/VerificationMethodModal";

/**
 * Reusable profile-section editing — the same edit modals the dashboard uses,
 * plus the verification gate, packaged so any surface can open a section editor
 * INLINE without navigating to the dashboard (e.g. the boost "queued" page lets
 * a provider finish a section without losing the campaign-setup context).
 *
 * Returns `openEditor(sectionId)` and the `editorModals` node to render. The
 * hook owns the editing + verification state (incl. re-opening the editor after
 * a successful verify), mirroring DashboardPage's behavior. `onSaved` fires
 * after a section saves so the caller can refresh its own derived state.
 */
export function useProfileSectionEditor(
  profile: Profile | null,
  { onSaved }: { onSaved: () => void },
): { openEditor: (sectionId: SectionId) => void; editorModals: React.ReactNode } {
  const { refreshAccountData } = useAuth();
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);
  const [pendingEditSection, setPendingEditSection] = useState<SectionId | null>(null);

  const {
    isOpen: isVerificationOpen,
    open: openVerificationRaw,
    close: closeVerification,
    handleSubmit: handleVerificationSubmit,
    handleDismiss: handleVerificationDismiss,
  } = useVerificationModal({
    profileId: profile?.id ?? "",
    onVerified: async () => {
      await refreshAccountData();
      if (pendingEditSection) {
        setEditingSection(pendingEditSection);
        setPendingEditSection(null);
      }
    },
    onDismissed: () => setPendingEditSection(null),
  });

  const verificationState = (profile?.verification_state as string | null) ?? null;
  const isVerified =
    verificationState === "verified" || verificationState === "not_required";

  // Verifying closes the edit modal (no modal stacking) and re-opens it after.
  const onVerifyClick = useCallback(() => {
    if (!profile?.id) return;
    if (editingSection) {
      setPendingEditSection(editingSection);
      setEditingSection(null);
    }
    openVerificationRaw();
  }, [profile?.id, editingSection, openVerificationRaw]);

  const handleSaved = useCallback(() => {
    setEditingSection(null);
    onSaved();
  }, [onSaved]);

  const editorModals = profile ? (
    <>
      {(() => {
        const modalProps = {
          profile,
          metadata: (profile.metadata ?? {}) as ExtendedMetadata,
          onClose: () => setEditingSection(null),
          onSaved: handleSaved,
          isVerified,
          onVerifyClick,
        };
        return (
          <>
            {editingSection === "overview" && <EditOverviewModal {...modalProps} />}
            {editingSection === "gallery" && <EditGalleryModal {...modalProps} />}
            {editingSection === "services" && <EditCareServicesModal {...modalProps} />}
            {editingSection === "screening" && <EditStaffScreeningModal {...modalProps} />}
            {editingSection === "about" && <EditAboutModal {...modalProps} />}
            {editingSection === "pricing" && <EditPricingModal {...modalProps} />}
            {editingSection === "payment" && <EditPaymentModal {...modalProps} />}
            {editingSection === "owner" && <EditOwnerModal {...modalProps} />}
          </>
        );
      })()}
      <VerificationMethodModal
        isOpen={isVerificationOpen}
        onClose={closeVerification}
        onSubmit={handleVerificationSubmit}
        onDismiss={handleVerificationDismiss}
        businessName={profile.display_name}
        profileId={profile.id}
      />
    </>
  ) : null;

  return { openEditor: setEditingSection, editorModals };
}
