"use client";

import { useState } from "react";
import PhotoTourModal, { PhotoTourButton } from "./PhotoTour";
import type { PhotoGroup } from "@/lib/photo-categories";

interface PhotoTourWrapperProps {
  groups: PhotoGroup[];
  providerName: string;
  totalCount: number;
}

export default function PhotoTourWrapper({ groups, providerName, totalCount }: PhotoTourWrapperProps) {
  const [open, setOpen] = useState(false);

  if (groups.length === 0) return null;

  return (
    <>
      <PhotoTourButton totalCount={totalCount} onClick={() => setOpen(true)} />
      {open && (
        <PhotoTourModal
          groups={groups}
          providerName={providerName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
