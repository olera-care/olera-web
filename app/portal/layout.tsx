import type { ReactNode } from "react";

// Each portal page handles its own auth state via useAuth().
// No layout-level auth gate — avoids blocking children from mounting
// and creating a loading waterfall (layout waits for account → then
// page waits for connections = double delay).
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
