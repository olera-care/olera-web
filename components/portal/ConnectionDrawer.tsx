"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ConnectionStatus } from "@/lib/types";
import ConnectionDetailContent from "./ConnectionDetailContent";
import type { ConnectionDetail } from "./ConnectionDetailContent";

interface ConnectionDrawerProps {
  connectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (connectionId: string, newStatus: ConnectionStatus) => void;
  onWithdraw?: (connectionId: string) => void;
  onHide?: (connectionId: string) => void;
  /** Pre-fetched connection data from the page — enables instant drawer open */
  preloadedConnection?: ConnectionDetail | null;
}

export type { ConnectionDetail };

export default function ConnectionDrawer({
  connectionId,
  isOpen,
  onClose,
  onStatusChange,
  onWithdraw,
  onHide,
  preloadedConnection,
}: ConnectionDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount + animation (matches ProfileEditDrawer pattern)
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Keyboard dismiss
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen) return null;

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Connection details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
      />

      {/* Panel — always single-column 540px */}
      <div
        className={`absolute right-0 top-0 h-full w-full bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out max-w-[540px] ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        <ConnectionDetailContent
          connectionId={connectionId}
          isActive={isOpen}
          onClose={onClose}
          onStatusChange={onStatusChange}
          onWithdraw={onWithdraw}
          onHide={onHide}
          preloadedConnection={preloadedConnection}
          showHeader={true}
        />
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
