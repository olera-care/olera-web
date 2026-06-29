"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import ConditionalFooter from "@/components/shared/ConditionalFooter";
import GlobalUnifiedAuthModal from "@/components/auth/GlobalUnifiedAuthModal";
import { NavbarProvider } from "@/components/shared/NavbarContext";
import { useMobileNavVariant } from "@/hooks/use-mobile-nav-variant";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Client-side layout shell that conditionally renders navbar/footer
 * based on the current route. Standalone pages like /welcome opt out.
 */
const STANDALONE_ROUTES: string[] = ["/review", "/caregiver/apply"];

// Routes where providers see the bottom tabs (must match Navbar's isProviderPortal logic)
const PROVIDER_PORTAL_PREFIXES = [
  "/provider",
  "/account",
  "/portal/inbox",
  "/medjobs/candidates",
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mobileNavVariant = useMobileNavVariant();
  const { activeProfile } = useAuth();
  const isStandalone = STANDALONE_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

  // Check if bottom tabs are visible (provider portal with bottom_tabs variant)
  const isProviderPortal = PROVIDER_PORTAL_PREFIXES.some(prefix =>
    prefix === "/provider" ? pathname === "/provider" || pathname.startsWith("/provider/") : pathname.startsWith(prefix)
  ) && activeProfile?.type === "organization";
  const showBottomTabsSpacer = isProviderPortal && mobileNavVariant === "bottom_tabs";

  if (isStandalone) {
    return (
      <>
        {children}
        <GlobalUnifiedAuthModal />
      </>
    );
  }

  return (
    <NavbarProvider>
      <Navbar />
      <main className="flex-grow">{children}</main>
      {/* Spacer for bottom tabs - ensures content isn't hidden behind fixed nav */}
      {showBottomTabsSpacer && (
        <div
          className="lg:hidden"
          style={{ height: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
          aria-hidden="true"
        />
      )}
      <ConditionalFooter />
      <GlobalUnifiedAuthModal />
    </NavbarProvider>
  );
}
