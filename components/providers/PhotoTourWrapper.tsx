"use client";

import { useState, useEffect, useCallback } from "react";
import PhotoTourModal, { PhotoTourButton } from "./PhotoTour";
import type { PhotoGroup } from "@/lib/photo-categories";

interface PhotoTourWrapperProps {
  groups: PhotoGroup[];
  providerName: string;
  totalCount: number;
}

export default function PhotoTourWrapper({ groups, providerName, totalCount }: PhotoTourWrapperProps) {
  const [open, setOpen] = useState(false);
  const [initialGroupId, setInitialGroupId] = useState<string | undefined>();

  const handleOpenToGroup = useCallback((e: Event) => {
    const groupId = (e as CustomEvent).detail;
    setInitialGroupId(groupId);
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("open-photo-tour", handleOpenToGroup);
    return () => window.removeEventListener("open-photo-tour", handleOpenToGroup);
  }, [handleOpenToGroup]);

  if (groups.length === 0) return null;

  const handleClose = () => {
    setOpen(false);
    setInitialGroupId(undefined);
  };

  return (
    <>
      <PhotoTourButton totalCount={totalCount} onClick={() => { setInitialGroupId(undefined); setOpen(true); }} />
      {open && (
        <PhotoTourModal
          groups={groups}
          providerName={providerName}
          onClose={handleClose}
          initialGroupId={initialGroupId}
        />
      )}
    </>
  );
}

export function ViewPhotosButton({ categoryId }: { categoryId: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-photo-tour", { detail: categoryId }))}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shrink-0"
    >
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
      View photos
    </button>
  );
}
