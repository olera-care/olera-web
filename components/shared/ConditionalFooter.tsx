"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/** Hides the footer on full-screen app views like the Inbox */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/portal/inbox")) return null;
  return <Footer />;
}
