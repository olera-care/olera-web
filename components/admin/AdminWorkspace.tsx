import type { ReactNode } from "react";

interface AdminWorkspaceProps {
  children: ReactNode;
  className?: string;
}

/**
 * Full-height admin work surface for inboxes and other application-like tools.
 * The route-level admin layout removes its document width constraint; this
 * component supplies the shared height, background, and overflow contract.
 */
export default function AdminWorkspace({ children, className = "" }: AdminWorkspaceProps) {
  return (
    <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-white pb-[60px] md:pb-0 ${className}`}>
      {children}
    </div>
  );
}
