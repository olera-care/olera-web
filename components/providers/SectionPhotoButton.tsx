"use client";

import { useState } from "react";
import PhotoTourModal from "./PhotoTour";
import type { PhotoGroup } from "@/lib/photo-categories";

interface SectionPhotoButtonProps {
  groups: PhotoGroup[];
  providerName: string;
  /** Which category to scroll to when opening */
  initialCategoryId?: string;
}

export default function SectionPhotoButton({ groups, providerName, initialCategoryId }: SectionPhotoButtonProps) {
  const [open, setOpen] = useState(false);

  if (groups.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        View photos
      </button>
      {open && (
        <PhotoTourModal
          groups={groups}
          providerName={providerName}
          onClose={() => setOpen(false)}
          initialCategoryId={initialCategoryId}
        />
      )}
    </>
  );
}
