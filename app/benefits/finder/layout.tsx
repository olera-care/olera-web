"use client";

import type { ReactNode } from "react";
import { CareProfileProvider } from "@/lib/benefits/care-profile-context";
import CareProfileSidebar from "@/components/benefits/CareProfileSidebar";

export default function BenefitsFinderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CareProfileProvider>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="flex gap-8 lg:gap-10">
            {/* Desktop sidebar */}
            <aside
              className="hidden lg:block w-[340px] shrink-0"
              aria-label="Care Profile"
            >
              <div className="sticky top-[88px]">
                <CareProfileSidebar />
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0" aria-label="Benefits finder">
              {children}
            </main>
          </div>
        </div>
      </div>
    </CareProfileProvider>
  );
}
