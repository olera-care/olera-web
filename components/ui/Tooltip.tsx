"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  /** The content to display in the tooltip */
  content: string;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Position preference (will flip if not enough space) */
  position?: "top" | "bottom";
  /** Delay before showing tooltip on hover (ms) */
  delay?: number;
  /** Additional class for the wrapper */
  className?: string;
}

/**
 * A polished tooltip component that works on both desktop (hover) and mobile (tap).
 *
 * Features:
 * - Hover on desktop with configurable delay
 * - Tap to toggle on mobile (tap outside to close)
 * - Smart positioning (flips if not enough space)
 * - Renders via portal to avoid clipping by parent containers
 * - Only renders when visible (no hidden elements in DOM)
 * - Smooth fade animation
 */
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
    actualPosition: "top" | "bottom";
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringTooltipRef = useRef(false);

  // Only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 12;
    const gap = 8;

    // Estimate tooltip size (will be refined after render)
    const estimatedTooltipHeight = 60;
    const estimatedTooltipWidth = Math.min(280, viewportWidth - padding * 2);

    // Vertical positioning - flip if needed
    let actualPosition = position;
    if (position === "top") {
      const spaceAbove = triggerRect.top;
      if (spaceAbove < estimatedTooltipHeight + gap + padding) {
        actualPosition = "bottom";
      }
    } else {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      if (spaceBelow < estimatedTooltipHeight + gap + padding) {
        actualPosition = "top";
      }
    }

    // Calculate vertical position
    let top: number;
    if (actualPosition === "top") {
      top = triggerRect.top - estimatedTooltipHeight - gap;
    } else {
      top = triggerRect.bottom + gap;
    }

    // Horizontal positioning - center on trigger, but clamp to viewport
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    let left = triggerCenter - estimatedTooltipWidth / 2;

    if (left < padding) {
      left = padding;
    } else if (left + estimatedTooltipWidth > viewportWidth - padding) {
      left = viewportWidth - padding - estimatedTooltipWidth;
    }

    const arrowLeft = triggerCenter - left;

    return { top, left, arrowLeft, actualPosition };
  }, [position]);

  // Refine position after tooltip renders (now we know actual size)
  const refinePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 12;
    const gap = 8;

    // Vertical positioning with actual tooltip height
    let actualPosition = position;
    if (position === "top") {
      const spaceAbove = triggerRect.top;
      if (spaceAbove < tooltipRect.height + gap + padding) {
        actualPosition = "bottom";
      }
    } else {
      const spaceBelow = viewportHeight - triggerRect.bottom;
      if (spaceBelow < tooltipRect.height + gap + padding) {
        actualPosition = "top";
      }
    }

    let top: number;
    if (actualPosition === "top") {
      top = triggerRect.top - tooltipRect.height - gap;
    } else {
      top = triggerRect.bottom + gap;
    }

    // Horizontal positioning with actual tooltip width
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    let left = triggerCenter - tooltipRect.width / 2;

    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - padding - tooltipRect.width;
    }

    const arrowLeft = triggerCenter - left;

    setTooltipPosition({ top, left, arrowLeft, actualPosition });
  }, [position]);

  // Refine position once tooltip is rendered and on scroll/resize
  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;

    // Refine position after render
    refinePosition();

    // Also refine on scroll/resize
    const handleUpdate = () => refinePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isVisible, refinePosition]);

  // Handle click outside to close
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      const isOutsideTooltip = tooltipRef.current && !tooltipRef.current.contains(target);

      if (isOutsideTrigger && isOutsideTooltip) {
        setIsVisible(false);
        setTooltipPosition(null);
      }
    };

    // Small delay to avoid closing immediately on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Calculate initial position before showing
      const pos = calculatePosition();
      if (pos) {
        setTooltipPosition(pos);
        setIsVisible(true);
      }
    }, delay);
  }, [delay, calculatePosition]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Small delay to allow moving from trigger to tooltip
    timeoutRef.current = setTimeout(() => {
      if (!isHoveringTooltipRef.current) {
        setIsVisible(false);
        setTooltipPosition(null);
      }
    }, 100);
  }, []);

  const hideTooltipImmediate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isHoveringTooltipRef.current = false;
    setIsVisible(false);
    setTooltipPosition(null);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    isHoveringTooltipRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    isHoveringTooltipRef.current = false;
    hideTooltipImmediate();
  }, [hideTooltipImmediate]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVisible) {
      setIsVisible(false);
      setTooltipPosition(null);
    } else {
      const pos = calculatePosition();
      if (pos) {
        setTooltipPosition(pos);
        setIsVisible(true);
      }
    }
  }, [isVisible, calculatePosition]);

  // Only render tooltip when visible
  const tooltipElement = isVisible && tooltipPosition && (
    <div
      ref={tooltipRef}
      role="tooltip"
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
      style={{
        position: "fixed",
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        zIndex: 9999,
      }}
      className="max-w-[280px] w-max px-3 py-2 bg-gray-900 text-white text-[13px] leading-relaxed rounded-lg shadow-lg animate-fade-in"
    >
      {content}

      {/* Arrow - positioned to point at trigger */}
      <div
        style={{ left: `${tooltipPosition.arrowLeft}px` }}
        className={`
          absolute -translate-x-1/2 w-0 h-0
          border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent
          ${tooltipPosition.actualPosition === "top"
            ? "top-full border-t-[6px] border-t-gray-900"
            : "bottom-full border-b-[6px] border-b-gray-900"
          }
        `}
      />
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={handleTouchStart}
    >
      {children}

      {/* Only render portal when tooltip should be visible */}
      {mounted && tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
}

/**
 * A variant that shows tooltip on a subtle info icon next to the label.
 * Useful for form fields or compact UI where inline explanations are needed.
 */
export function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip content={content} delay={200}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="More info"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      </button>
    </Tooltip>
  );
}
