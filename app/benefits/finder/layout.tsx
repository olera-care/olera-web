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
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
          <div className="flex gap-10 lg:gap-16">
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
