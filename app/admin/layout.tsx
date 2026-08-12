"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SidebarDrawerToggle from "@/components/admin/SidebarDrawerToggle";
import { ToastProvider } from "@/components/admin/Toast";
import { RecentMovesProvider } from "@/components/admin/RecentMoves";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const SIDEBAR_VISIBILITY_KEY = "admin-sidebar-hidden";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { adminUser, isLoading: adminLoading, error } = useAdminAuth();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    try {
      setSidebarHidden(localStorage.getItem(SIDEBAR_VISIBILITY_KEY) === "true");
    } catch {
      // Storage can be unavailable in privacy-restricted browsers. The
      // drawer still works for the current page; it simply won't persist.
    }
  }, []);

  const setSidebarVisibility = useCallback((hidden: boolean) => {
    setSidebarHidden(hidden);
    try {
      localStorage.setItem(SIDEBAR_VISIBILITY_KEY, String(hidden));
    } catch {
      // Treat persistence as a convenience, never a navigation dependency.
    }
  }, []);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in required
          </h1>
          <p className="text-lg text-gray-600">
            You need to be signed in to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error === "access_denied" || !adminUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access denied
          </h1>
          <p className="text-lg text-gray-600">
            You do not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <RecentMovesProvider>
        <div className="min-h-[calc(100vh-4rem)] flex">
          <AdminSidebar
            adminUser={adminUser}
            desktopHidden={sidebarHidden}
            onRequestClose={() => setSidebarVisibility(true)}
          />
          {sidebarHidden && (
            <div className="fixed left-3 top-20 z-30 hidden md:block">
              <SidebarDrawerToggle
                direction="open"
                onClick={() => setSidebarVisibility(false)}
                floating
              />
            </div>
          )}
          <div
            className={[
              "flex-1 min-w-0 transition-[padding] duration-200 ease-out",
              sidebarHidden ? "md:pl-10" : "",
            ].join(" ")}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </div>
        </div>
      </RecentMovesProvider>
    </ToastProvider>
  );
}
