"use client";

/**
 * Sticky banner shown at the top of the provider page when an admin
 * lands with `?preview_arm=<variant>` in the URL. Surfaces three things:
 *
 *   - Preview mode is active (so the admin can't mistake suppressed
 *     events / disabled submissions for production behavior)
 *   - Which arm is being previewed (so the screenshot they share later
 *     is self-explanatory)
 *   - An exit affordance back to the production version of the page
 *
 * Renders nothing when not in preview mode — the cost of mounting it
 * unconditionally on every provider page is one search-params read per
 * render, well under the noise floor.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPreviewArm } from "@/lib/analytics/preview-mode";
import { variantSurfaceLabel } from "@/lib/analytics/variant-copy";

export default function PreviewModeBanner() {
  // SSR-safe: getPreviewArm reads window, so first paint shows nothing.
  // Hook resolves post-mount.
  const [arm, setArm] = useState<ReturnType<typeof getPreviewArm>>(null);
  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    setArm(getPreviewArm());
    setPathname(window.location.pathname);
  }, []);

  if (!arm) return null;

  // Non-sticky on purpose: the page's existing SectionNav uses `fixed
  // z-[51]` and would visually fight a sticky banner. The banner's job
  // is at-load awareness — scrolling past it is fine, and the
  // ?preview_arm=... URL param is itself a persistent reminder.
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-amber-900 truncate">
          <span className="font-semibold">Preview mode</span>
          <span className="mx-2 text-amber-400">·</span>
          <span>arm: <span className="font-mono text-amber-900">{arm}</span></span>
          <span className="hidden sm:inline">
            <span className="mx-2 text-amber-400">·</span>
            <span className="text-amber-700">{variantSurfaceLabel(arm)}</span>
          </span>
          <span className="mx-2 text-amber-400">·</span>
          <span className="text-amber-700">events + submissions disabled</span>
        </span>
        {pathname && (
          <Link
            href={pathname}
            className="shrink-0 text-amber-800 hover:text-amber-950 underline underline-offset-2 whitespace-nowrap"
          >
            Exit preview
          </Link>
        )}
      </div>
    </div>
  );
}
