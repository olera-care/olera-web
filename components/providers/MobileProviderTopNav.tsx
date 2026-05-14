"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/**
 * Mobile-only sticky top nav for provider detail pages.
 * Replaces the standard Navbar on mobile with a cleaner layout:
 * - Back arrow (left)
 * - Olera logo (center)
 * - Hamburger menu (right)
 *
 * This component overlays the global Navbar on mobile viewports.
 * The hamburger triggers the same mobile menu as Navbar via custom event.
 */
export default function MobileProviderTopNav() {
  const router = useRouter();

  // Dispatch event for Navbar to toggle its mobile menu
  const handleMenuToggle = () => {
    window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-white md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg
            className="w-5 h-5 text-gray-900"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Center: Olera logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/olera-logo.png"
            alt="Olera"
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
          <span className="text-lg font-semibold text-gray-900">Olera</span>
        </Link>

        {/* Right: Hamburger menu */}
        <button
          onClick={handleMenuToggle}
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Subtle bottom border */}
      <div className="h-px bg-gray-100" />
    </div>
  );
}
