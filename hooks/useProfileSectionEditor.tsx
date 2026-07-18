"use client";

import { useCallback, useState } from "react";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import type { Profile } from "@/lib/types";
import type { SectionId } from "@/components/provider-dashboard/edit-modals/types";
import EditOverviewModal from "@/components/provider-dashboard/edit-modals/EditOverviewModal";
import EditGalleryModal from "@/components/provider-dashboard/edit-modals/EditGalleryModal";
import EditCareServicesModal from "@/components/provider-dashboard/edit-modals/EditCareServicesModal";
import EditStaffScreeningModal from "@/components/provider-dashboard/edit-modals/EditStaffScreeningModal";
import EditAboutModal from "@/components/provider-dashboard/edit-modals/EditAboutModal";
import EditPricingModal from "@/components/provider-dashboard/edit-modals/EditPricingModal";
import EditPaymentModal from "@/components/provider-dashboard/edit-modals/EditPaymentModal";
import EditOwnerModal from "@/components/provider-dashboard/edit-modals/EditOwnerModal";

/**
 * Reusable profile-section editing — the same edit modals the dashboard uses,
 * packaged so any surface can open a section editor INLINE without navigating
 * to the dashboard (e.g. the boost "queued" page lets a provider finish a
 * section without losing the campaign-setup context).
 *
 * Returns `openEditor(sectionId)` and the `editorModals` node to render.
 * `onSaved` fires after a section saves so the caller can refresh its own
 * derived state.
 */
export function useProfileSectionEditor(
  profile: Profile | null,
  { onSaved }: { onSaved: () => void },
): { openEditor: (sectionId: SectionId) => void; editorModals: React.ReactNode } {
  const { metadata } = useProviderDashboardData(profile);
  const [editingSection, setEditingSection] = useState<SectionId | null>(null);

  const handleSaved = useCallback(() => {
    setEditingSection(null);
    onSaved();
  }, [onSaved]);

  const editorModals = profile ? (
    <>
      {(() => {
        const modalProps = {
          profile,
          metadata,
          onClose: () => setEditingSection(null),
          onSaved: handleSaved,
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
    </>
  ) : null;

  return { openEditor: setEditingSection, editorModals };
}
