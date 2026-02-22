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
      <div className="min-h-[calc(100vh-4rem)] bg-vanilla-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="flex gap-12 lg:gap-20">
            {/* Desktop sidebar */}
            <aside
              className="hidden lg:block w-[260px] shrink-0"
              aria-label="Care Profile"
            >
              <div className="sticky top-[96px]">
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
