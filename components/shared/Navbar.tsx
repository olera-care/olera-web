"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import ProfileSwitcher from "@/components/shared/ProfileSwitcher";
import FindCareMegaMenu from "@/components/shared/FindCareMegaMenu";
import { CARE_CATEGORIES, NAV_LINKS } from "@/components/shared/NavMenuData";
import { useNavbar } from "@/components/shared/NavbarContext";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { useUnreadInboxCount } from "@/hooks/useUnreadInboxCount";
import { useInterestedProviders } from "@/hooks/useInterestedProviders";
import { MOCK_LEADS } from "@/lib/mock/provider-leads";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFindCareOpen, setIsFindCareOpen] = useState(false);
  const [isMobileCareOpen, setIsMobileCareOpen] = useState(false);
  const { user, account, activeProfile, profiles, openAuth, signOut, fetchError, isLoading: authLoading, switchProfile } =
    useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { visible: navbarVisible } = useNavbar();
  const { savedCount, hasInitialized: savedInitialized } = useSavedProviders();
  const profileIds = (profiles || []).map((p) => p.id);
  const unreadInboxCount = useUnreadInboxCount(profileIds);
  const providerProfileIds = (profiles || []).filter((p) => p.type !== "family").map((p) => p.id);
  const providerInboxCount = useUnreadInboxCount(providerProfileIds);
  const { pendingCount: matchesPendingCount } = useInterestedProviders(
    activeProfile?.type === "family" ? activeProfile?.id : undefined
  );
  const [newLeadsCount, setNewLeadsCount] = useState(() => {
    try {
      const stored = localStorage.getItem("olera_leads_new_count");
      if (stored !== null) return parseInt(stored, 10) || 0;
    } catch { /* localStorage unavailable */ }
    // No stored value yet — compute from source data
    return MOCK_LEADS.filter((l) => l.isNew).length;
  });
  useEffect(() => {
    const handler = (e: Event) => setNewLeadsCount((e as CustomEvent).detail as number);
    window.addEventListener("olera:leads-count", handler);
    return () => window.removeEventListener("olera:leads-count", handler);
  }, []);
  const [hasAttemptedOnboarding, setHasAttemptedOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setHasAttemptedOnboarding(
      !!localStorage.getItem("olera_onboarding_provider_type")
    );
  }, []);

  // Lightweight admin check
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    fetch("/api/admin/auth")
      .then((res) => setIsAdmin(res.ok))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const isPortal = pathname.startsWith("/portal");
  const isProviderPortal =
    pathname === "/provider" ||
    pathname.startsWith("/provider/connections") ||
    pathname.startsWith("/provider/inbox") ||
    pathname.startsWith("/provider/onboarding") ||
    pathname.startsWith("/provider/profile") ||
    pathname.startsWith("/provider/reviews") ||
    pathname.startsWith("/provider/matches") ||
    pathname.startsWith("/provider/pro") ||
    pathname.startsWith("/provider/statistics") ||
    pathname.startsWith("/provider/verification") ||
    pathname.startsWith("/provider/account");
  const isCommunity = pathname.startsWith("/community");
  const isMinimalNav = pathname.startsWith("/portal/inbox");

  // Show auth pill as soon as we know a user session exists.
  const hasSession = !!user;
  const isFullyLoaded = !!user && !authLoading;
  // Mode switcher — shown when user has both a family and a provider profile
  const hasFamilyProfile = (profiles || []).some((p) => p.type === "family");
  const hasProviderProfile = (profiles || []).some(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  const showModeSwitcher = isFullyLoaded && hasFamilyProfile && hasProviderProfile;

  // Profile IDs for hub switching — used by the mode switcher to also switch activeProfile
  const familyProfileId = (profiles || []).find((p) => p.type === "family")?.id;
  const providerProfileId = (profiles || []).find(
    (p) => p.type === "organization" || p.type === "caregiver"
  )?.id;

  // Show user's actual name in the dropdown, not the org/profile name
  const displayName = account?.display_name || user?.email || "";
  const initials = getInitials(displayName);

  // In provider mode, show the provider profile type instead of the active (family) profile type
  const contextProfileType = isProviderPortal
    ? (profiles || []).find((p) => p.type === "organization" || p.type === "caregiver")?.type
    : activeProfile?.type;
  const profileTypeLabel = contextProfileType
    ? contextProfileType === "organization"
      ? "Organization"
      : contextProfileType === "caregiver"
      ? "Caregiver"
      : "Family"
    : null;

  // "For Providers" click handler
  const handleForProviders = useCallback(() => {
    const hasProviderProfile = profiles.some(
      (p) => p.type === "organization" || p.type === "caregiver"
    );
    if (hasProviderProfile) {
      router.push("/provider");
      return;
    }
    if (user) {
      router.push("/provider/onboarding");
    } else {
      openAuth({ intent: "provider" });
    }
  }, [user, profiles, openAuth, router]);

  // Track scroll position for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mega menu on Escape key
  useEffect(() => {
    if (!isFindCareOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFindCareOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFindCareOpen]);

  // Close user/account menu on outside click or Escape
  useEffect(() => {
    if (!isUserMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsFindCareOpen(false);
  }, [pathname]);


  // Shared dropdown content (context-aware links, mode switcher, sign out)
  // User menu is always in the right column, so dropdown always aligns right
  const dropdownAlign = "right-0";

  const signedInDropdown = (
    <div
      className={`absolute ${dropdownAlign} mt-2.5 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-black/[0.06] py-1 z-50`}
    >
      {/* Identity header with pill badge */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[15px] font-semibold text-gray-900 truncate">
            {displayName}
          </p>
          {profileTypeLabel && (
            <span className="shrink-0 text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {profileTypeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>

      <div className="mx-4 border-t border-gray-100" />

      {/* Mode switcher — shown when both profiles exist OR user has started provider onboarding */}
      {(showModeSwitcher || hasAttemptedOnboarding) && (
        <>
          <div className="px-3 pt-2 pb-1">
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (hasFamilyProfile && familyProfileId) switchProfile(familyProfileId);
                  setIsUserMenuOpen(false);
                  router.push("/");
                }}
                className={[
                  "flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  !isProviderPortal
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                Family Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasProviderProfile && providerProfileId) {
                    switchProfile(providerProfileId);
                    setIsUserMenuOpen(false);
                    router.push("/provider");
                  } else if (hasAttemptedOnboarding) {
                    setIsUserMenuOpen(false);
                    router.push("/provider/onboarding");
                  }
                }}
                className={[
                  "flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isProviderPortal
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                Provider Hub
              </button>
            </div>
          </div>
          <div className="mx-4 border-t border-gray-100" />
        </>
      )}

      {isFullyLoaded ? (
        <>
          {/* Tier 1 — Hub-specific links */}
          <div className="px-2 py-1.5">
            {isProviderPortal ? (
              <>
                {/* Provider Hub links */}
                <Link
                  href="/provider/statistics"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Statistics
                </Link>
                <Link
                  href="/provider/verification"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  Identity Verification
                </Link>
                <Link
                  href="/provider/pro"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Olera Pro
                </Link>
                <Link
                  href="/portal/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Account
                </Link>
              </>
            ) : (
              <>
                {/* Family Portal links */}
                <Link
                  href="/portal/inbox"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                  </svg>
                  Inbox
                  {unreadInboxCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold text-white bg-primary-600 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {unreadInboxCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/portal/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Account
                </Link>
                {activeProfile?.type === "family" && (
                  <Link
                    href="/portal/matches"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="w-[18px] h-[18px] text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                    </svg>
                    Matches
                    {matchesPendingCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold text-white bg-primary-600 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {matchesPendingCount}
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="px-5 py-3 space-y-2.5">
          <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
          <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      )}

      {/* Profile switcher */}
      {isFullyLoaded && <div className="mx-4 border-t border-gray-100" />}
      {isFullyLoaded && (
        <div className="px-2 py-1">
          <ProfileSwitcher
            onSwitch={() => setIsUserMenuOpen(false)}
            variant="dropdown"
            allowedTypes={isProviderPortal ? ["organization", "caregiver"] : ["family"]}
            navigateTo={isProviderPortal ? "/provider" : "/"}
          />
        </div>
      )}

      {isAdmin && (
        <>
          <div className="mx-4 border-t border-gray-100" />
          <div className="px-2 py-1.5">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <svg className="w-[18px] h-[18px] text-primary-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Dashboard
            </Link>
          </div>
        </>
      )}

      <div className="mx-4 border-t border-gray-100" />

      {/* Sign out */}
      <div className="px-2 py-1.5 pb-2">
        <button
          type="button"
          onClick={() => {
            setIsUserMenuOpen(false);
            signOut(() => router.push("/"));
          }}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  const unauthDropdown = (
    <div
      className={`absolute ${dropdownAlign} mt-2.5 w-60 bg-white rounded-2xl shadow-xl ring-1 ring-black/[0.06] py-1.5 z-50`}
      role="menu"
      aria-label="Account menu"
    >
      {/* Auth actions */}
      <div className="px-1.5 pb-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsUserMenuOpen(false);
            openAuth({ defaultMode: "sign-in" });
          }}
          className="w-full text-left px-3.5 py-2.5 text-[15px] font-semibold text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        >
          Log in
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsUserMenuOpen(false);
            openAuth({});
          }}
          className="w-full text-left px-3.5 py-2.5 text-[15px] text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          Create account
        </button>
      </div>

      <div className="mx-3.5 border-t border-gray-100" />

      {/* Intent actions */}
      <div className="px-1.5 pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsUserMenuOpen(false);
            router.push("/browse");
          }}
          className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 text-[15px] text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Find care
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsUserMenuOpen(false);
            openAuth({ intent: "provider", providerType: "organization" });
          }}
          className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 text-[15px] text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          List your organization
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setIsUserMenuOpen(false);
            openAuth({ intent: "provider", providerType: "caregiver" });
          }}
          className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 text-[15px] text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Join as a caregiver
        </button>
      </div>
    </div>
  );

  // Onboarding page has its own minimal nav
  if (pathname === "/provider/onboarding") return null;

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white ${isPortal || isProviderPortal || isCommunity ? "border-b border-gray-200" : isScrolled && navbarVisible ? "shadow-sm" : ""}`}
        style={{
          transform: navbarVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 200ms cubic-bezier(0.33, 1, 0.68, 1)"
        }}
      >
        <div className={isMinimalNav ? "px-[44px]" : isCommunity ? "px-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
          {/*
           * 3-column layout: Left | Center Nav | Right
           *
           * Family mode:  [Olera logo]  |  [Find Care, Community, ...]  |  [For Providers, ♥, User menu]
           * Provider mode: [User menu]  |  [Profile, Inbox, Leads, ...]  |  [Olera logo]
           *
           * Left and right are flex-1 so center nav is truly page-centered.
           */}
          <div className="flex items-center h-16">

            {/* ── LEFT COLUMN — always Olera logo ── */}
            <div className="flex-1 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/images/olera-logo.png" alt="Olera" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-gray-900">Olera</span>
              </Link>
            </div>

            {/* ── CENTER — Primary navigation (page-centered, hidden on mobile + inbox) ── */}
            {!isMinimalNav && (
              <div className="hidden lg:flex items-center gap-1">
                {isProviderPortal ? (
                  /* Provider Hub nav links */
                  <>
                    {([
                      { label: "Dashboard", href: "/provider", match: "/provider", badge: 0 },
                      { label: "Inbox", href: "/provider/inbox", match: "/provider/inbox", badge: providerInboxCount },
                      { label: "Leads", href: "/provider/connections", match: "/provider/connections", badge: newLeadsCount },
                      { label: "Reviews", href: "/provider/reviews", match: "/provider/reviews", badge: 0 },
                      { label: "Matches", href: "/provider/matches", match: "/provider/matches", badge: 0 },
                    ] as const).map((item) => {
                      const active = item.match
                        ? item.match === "/provider"
                          ? pathname === "/provider"
                          : pathname.startsWith(item.match)
                        : false;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`relative px-4 py-2 text-[15px] font-medium transition-colors ${
                            active
                              ? "text-primary-600"
                              : "text-gray-700 hover:text-gray-900"
                          }`}
                        >
                          {item.label}
                          {item.badge > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-primary-600 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  /* Family / public nav links */
                  <>
                    {/* Find Care trigger */}
                    <div onMouseEnter={() => setIsFindCareOpen(true)}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFindCareOpen(false);
                          router.push("/browse");
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[15px] font-medium transition-colors ${
                          isFindCareOpen
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-expanded={isFindCareOpen}
                        aria-haspopup="true"
                      >
                        Find Care
                        <svg
                          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                            isFindCareOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Simple nav links */}
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={`px-4 py-2 text-[15px] font-medium rounded-full transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── RIGHT COLUMN ── */}
            <div className="flex-1 flex items-center justify-end">
              {/* Desktop right section */}
              <div className="hidden lg:flex items-center gap-2">
                {isProviderPortal ? (
                  /* Provider mode: Switch to family + user menu */
                  <>
                    {/* Switch to family */}
                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasFamilyProfile && familyProfileId) switchProfile(familyProfileId);
                          router.push("/");
                        }}
                        className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        Switch to family
                      </button>
                    )}
                    {hasSession ? (
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="relative flex items-center gap-1.5 pl-3 pr-2 py-1.5 border border-gray-200 rounded-full hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                          aria-label="User menu"
                          aria-expanded={isUserMenuOpen}
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          {activeProfile?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={activeProfile.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {initials}
                            </div>
                          )}
                          {(unreadInboxCount > 0 || matchesPendingCount > 0) && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white" />
                          )}
                        </button>
                        {isUserMenuOpen && signedInDropdown}
                      </div>
                    ) : (
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 border border-gray-200 rounded-full hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 min-h-[44px]"
                          aria-label="Account menu"
                          aria-expanded={isUserMenuOpen}
                          aria-haspopup="true"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        </button>
                        {isUserMenuOpen && unauthDropdown}
                      </div>
                    )}
                  </>
                ) : (
                  /* Family mode: For Providers + heart + user menu */
                  <>
                    {/* For Providers link */}
                    <button
                      onClick={handleForProviders}
                      className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                    >
                      For Providers
                    </button>

                    {/* Saved providers heart */}
                    <Link
                      href="/saved"
                      className="relative flex items-center justify-center w-[44px] min-h-[44px] border border-gray-200 rounded-full text-gray-500 hover:text-red-500 hover:shadow-md transition-all"
                      aria-label="Saved providers"
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>

                    {/* User menu */}
                    {hasSession ? (
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="relative flex items-center gap-1.5 pl-3 pr-2 py-1.5 border border-gray-200 rounded-full hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                          aria-label="User menu"
                          aria-expanded={isUserMenuOpen}
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          {activeProfile?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={activeProfile.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {initials}
                            </div>
                          )}
                          {(unreadInboxCount > 0 || matchesPendingCount > 0) && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-600 rounded-full border-2 border-white" />
                          )}
                        </button>
                        {isUserMenuOpen && signedInDropdown}
                      </div>
                    ) : (
                      <div className="relative" ref={userMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 border border-gray-200 rounded-full hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 min-h-[44px]"
                          aria-label="Account menu"
                          aria-expanded={isUserMenuOpen}
                          aria-haspopup="true"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        </button>
                        {isUserMenuOpen && unauthDropdown}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile Menu Button — always on right */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── MOBILE MENU ── */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-1">
                {isProviderPortal ? (
                  /* Provider mobile nav */
                  <>
                    {([
                      { label: "Dashboard", href: "/provider", match: "/provider", badge: 0 },
                      { label: "Inbox", href: "/provider/inbox", match: "/provider/inbox", badge: providerInboxCount },
                      { label: "Leads", href: "/provider/connections", match: "/provider/connections", badge: newLeadsCount },
                      { label: "Reviews", href: "/provider/reviews", match: "/provider/reviews", badge: 0 },
                      { label: "Matches", href: "/provider/matches", match: "/provider/matches", badge: 0 },
                    ] as const).map((item) => {
                      const active = item.match
                        ? item.match === "/provider"
                          ? pathname === "/provider"
                          : pathname.startsWith(item.match)
                        : false;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`flex items-center gap-2 py-3 font-medium ${
                            active
                              ? "text-primary-600"
                              : "text-gray-700 hover:text-primary-600"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                          {item.badge > 0 && (
                            <span className="min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-primary-600 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        if (hasFamilyProfile && familyProfileId) switchProfile(familyProfileId);
                        setIsMobileMenuOpen(false);
                        router.push("/");
                      }}
                      className="py-3 text-gray-700 hover:text-primary-600 font-medium text-left"
                    >
                      Switch to family
                    </button>
                    <hr className="border-gray-100" />
                  </>
                ) : (
                  /* Family / public mobile nav */
                  <>
                    {!isMinimalNav && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsMobileCareOpen((prev) => !prev)}
                          className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-primary-600 font-medium"
                          aria-expanded={isMobileCareOpen}
                        >
                          Find Care
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              isMobileCareOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {isMobileCareOpen && (
                          <div className="pl-4 pb-2 space-y-1">
                            {CARE_CATEGORIES.map((cat) => (
                              <Link
                                key={cat.id}
                                href={`/browse?type=${cat.id}`}
                                className="block py-2 text-sm text-gray-600 hover:text-primary-600"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <span className="font-medium">{cat.label}</span>
                                <span className="block text-xs text-gray-400 mt-0.5">
                                  {cat.description}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {NAV_LINKS.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="block py-3 text-gray-700 hover:text-primary-600 font-medium"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}

                        <Link
                          href="/saved"
                          className="flex items-center gap-2 py-3 text-gray-700 hover:text-primary-600 font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Saved
                        </Link>

                        <hr className="border-gray-100" />
                      </>
                    )}

                    {/* For Providers */}
                    <button
                      onClick={() => { handleForProviders(); setIsMobileMenuOpen(false); }}
                      className="py-3 text-gray-700 hover:text-primary-600 font-medium text-left"
                    >
                      For Providers
                    </button>

                    <hr className="border-gray-100" />
                  </>
                )}

                {/* Account section (shared) */}
                {hasSession ? (
                  <>
                    {/* Identity header */}
                    <div className="flex items-center gap-2 py-2">
                      {activeProfile?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeProfile.image_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                          {profileTypeLabel && (
                            <span className="shrink-0 text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                              {profileTypeLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>

                    {/* Mode switcher (mobile) — shown when both profiles exist OR user has started provider onboarding */}
                    {(showModeSwitcher || hasAttemptedOnboarding) && (
                      <div className="py-2">
                        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              if (hasFamilyProfile && familyProfileId) switchProfile(familyProfileId);
                              setIsMobileMenuOpen(false);
                              router.push("/");
                            }}
                            className={[
                              "flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              !isProviderPortal
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700",
                            ].join(" ")}
                          >
                            Family Portal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasProviderProfile && providerProfileId) {
                                switchProfile(providerProfileId);
                                setIsMobileMenuOpen(false);
                                router.push("/provider");
                              } else if (hasAttemptedOnboarding) {
                                setIsMobileMenuOpen(false);
                                router.push("/provider/onboarding");
                              }
                            }}
                            className={[
                              "flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              isProviderPortal
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700",
                            ].join(" ")}
                          >
                            Provider Hub
                          </button>
                        </div>
                      </div>
                    )}

                    {isFullyLoaded ? (
                      <>
                        {/* Tier 1 — Hub-specific links (mobile) */}
                        {isProviderPortal ? (
                          <>
                            <Link
                              href="/provider/statistics"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                              </svg>
                              Statistics
                            </Link>
                            <Link
                              href="/provider/verification"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <polyline points="9 12 11 14 15 10" />
                              </svg>
                              Identity Verification
                            </Link>
                            <Link
                              href="/provider/pro"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              Olera Pro
                            </Link>
                            <Link
                              href="/portal/profile"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              Account
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/portal/inbox"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                              </svg>
                              Inbox
                              {unreadInboxCount > 0 && (
                                <span className="ml-auto text-[10px] font-bold text-white bg-primary-600 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                  {unreadInboxCount}
                                </span>
                              )}
                            </Link>
                            <Link
                              href="/portal/profile"
                              className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              Account
                            </Link>
                            {activeProfile?.type === "family" && (
                              <Link
                                href="/portal/matches"
                                className="flex items-center gap-3 py-3 text-gray-600 hover:text-primary-600 font-medium"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                                </svg>
                                Matches
                                {matchesPendingCount > 0 && (
                                  <span className="ml-auto text-[10px] font-bold text-white bg-primary-600 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                    {matchesPendingCount}
                                  </span>
                                )}
                              </Link>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="py-3 space-y-2.5">
                        <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3.5 w-36 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3.5 w-24 bg-gray-100 rounded animate-pulse" />
                      </div>
                    )}

                    {/* Profile switcher */}
                    {isFullyLoaded && (
                      <div className="border-t border-gray-100 pt-2">
                        <ProfileSwitcher
                          onSwitch={() => setIsMobileMenuOpen(false)}
                          variant="dropdown"
                          allowedTypes={isProviderPortal ? ["organization", "caregiver"] : ["family"]}
                          navigateTo={isProviderPortal ? "/provider" : "/"}
                        />
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <hr className="border-gray-100" />
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 py-3 text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      </>
                    )}

                    <hr className="border-gray-100" />

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut(() => router.push("/"));
                      }}
                      className="flex items-center gap-3 text-left py-3 text-red-600 hover:text-red-700 font-medium"
                    >
                      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </>
                ) : (
                  /* ── Mobile unauthenticated ── */
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuth({ defaultMode: "sign-in" });
                      }}
                      className="text-left py-3 text-gray-900 font-semibold"
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuth({});
                      }}
                      className="text-left py-3 text-gray-600 font-medium"
                    >
                      Create account
                    </button>
                    <hr className="border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push("/browse");
                      }}
                      className="text-left py-3 text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Find care
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuth({ intent: "provider", providerType: "organization" });
                      }}
                      className="text-left py-3 text-gray-600 hover:text-primary-600 font-medium"
                    >
                      List your organization
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuth({ intent: "provider", providerType: "caregiver" });
                      }}
                      className="text-left py-3 text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Join as a caregiver
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Find Care Mega Menu */}
      <FindCareMegaMenu
        isOpen={isFindCareOpen}
        onClose={() => setIsFindCareOpen(false)}
        onMouseEnter={() => setIsFindCareOpen(true)}
        onMouseLeave={() => setIsFindCareOpen(false)}
      />
    </>
  );
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
