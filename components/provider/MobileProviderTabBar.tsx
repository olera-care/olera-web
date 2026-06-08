"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UsersThree, Briefcase } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

/**
 * Persistent bottom tab bar for the provider portal on mobile (Robinhood/Instagram pattern).
 *
 * The global top Navbar auto-hides on scroll-down, so on long pages like Find Families there
 * was no thumb-reachable way back to the hub. This bar is always visible on mobile (lg:hidden —
 * desktop keeps the top nav) so Profile / Families / Caregivers are one tap away from anywhere.
 *
 * Rendered by app/provider/layout.tsx only on authenticated hub routes. The "Caregivers" tab
 * links into /medjobs (its own layout), where this bar is not rendered — acceptable for v1
 * since the core need is getting back to Profile from the long /provider/* pages.
 */
const TABS: { href: string; label: string; icon: Icon; isActive: (p: string) => boolean }[] = [
  { href: "/provider", label: "Profile", icon: House, isActive: (p) => p === "/provider" },
  { href: "/provider/matches", label: "Families", icon: UsersThree, isActive: (p) => p.startsWith("/provider/matches") },
  { href: "/medjobs/candidates", label: "Caregivers", icon: Briefcase, isActive: (p) => p.startsWith("/medjobs") },
];

export default function MobileProviderTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Provider navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-3">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors active:scale-[0.96] ${
                active ? "text-[#199087]" : "text-stone-400"
              }`}
            >
              <Icon size={23} weight={active ? "fill" : "regular"} />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
