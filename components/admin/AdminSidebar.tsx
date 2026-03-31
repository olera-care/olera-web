"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminUser } from "@/lib/types";

interface AdminSidebarProps {
  adminUser: AdminUser;
}

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ label: "Overview", href: "/admin" }],
  },
  {
    label: "Activity",
    items: [
      { label: "Activity Center", href: "/admin/activity" },
      { label: "Leads", href: "/admin/leads" },
      { label: "Questions", href: "/admin/questions" },
      { label: "Reviews", href: "/admin/reviews" },
      { label: "Emails", href: "/admin/emails" },
      { label: "Care Seekers", href: "/admin/care-seekers" },
    ],
  },
  {
    label: "Providers",
    items: [
      { label: "Claims", href: "/admin/providers" },
      { label: "Verification", href: "/admin/verification" },
      { label: "Directory", href: "/admin/directory" },
      { label: "Images", href: "/admin/images" },
      { label: "Removals", href: "/admin/removal-requests" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Content", href: "/admin/content" },
      { label: "MedJobs", href: "/admin/medjobs" },
      { label: "Team", href: "/admin/team" },
    ],
  },
];

// Mobile: 5 daily-use items with icons
const mobileNavItems: (NavItem & { icon: React.ReactNode })[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: "Directory",
    href: "/admin/directory",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Content",
    href: "/admin/content",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "MedJobs",
    href: "/admin/medjobs",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
];

function getInitials(email: string): string {
  const local = email.split("@")[0];
  if (!local) return "?";
  // Try to get two chars from the local part (e.g., "tfalohun" → "TF")
  return local.slice(0, 2).toUpperCase();
}

export default function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-52 bg-white border-r border-gray-100 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="flex-1 px-3 pt-5 pb-3">
          {navSections.map((section, sectionIdx) => (
            <div key={section.label ?? "home"} className={sectionIdx > 0 ? "mt-5" : ""}>
              {section.label && (
                <p className="px-3 mb-1.5 text-[11px] uppercase tracking-widest text-gray-400 font-medium select-none">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "block px-3 py-[7px] rounded-md text-[13px] transition-colors duration-150",
                        active
                          ? "text-gray-900 font-medium border-l-2 border-gray-900 pl-[10px]"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/80",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-3 px-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 text-[11px] font-medium text-gray-500 flex items-center justify-center shrink-0">
              {getInitials(adminUser.email)}
            </div>
            <Link
              href="/"
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              Exit Admin
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav — 5 key items only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium min-w-[64px] min-h-[44px] justify-center",
                  active ? "text-gray-900" : "text-gray-400",
                ].join(" ")}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
