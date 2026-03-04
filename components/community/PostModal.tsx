"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ForumPost } from "@/types/forum";
import { getCommentsByPostId } from "@/data/mock/forumComments";
import PostContent from "./PostContent";
import CommentThread from "./CommentThread";

interface PostModalProps {
  post: ForumPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (active && active !== document.body) {
      (active as HTMLElement).blur();
    }
    onCloseRef.current();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  }, [handleClose]);

  // Scroll lock with iOS Safari support
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, handleKeyDown]);

  // Scroll to top when post changes
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [isOpen, post?.id]);

  if (!mounted || !post) return null;

  const comments = getCommentsByPostId(post.id);
  const totalResponses = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      {/* Backdrop - click to close (desktop only, hidden on mobile full-screen) */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] hidden sm:block"
        onClick={handleClose}
      />

      {/* Panel - Full screen on mobile, right drawer on desktop */}
      <div
        ref={panelRef}
        className={`absolute inset-0 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:w-full sm:max-w-xl bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Mobile Header - Back button style */}
        <div
          className="sm:hidden sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={handleClose}
              className="w-11 h-11 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors -ml-2"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-display text-lg font-medium text-gray-900 flex-1">
              Discussion
            </h2>
          </div>
        </div>

        {/* Desktop Header - Close button style */}
        <div className="hidden sm:flex sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Responses{totalResponses > 0 && <span className="text-gray-400 font-normal"> ({totalResponses})</span>}
          </h2>
          <button
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Post Content - Compact summary */}
        <div className="px-5 sm:px-6 py-5 border-b border-gray-100 bg-gray-50/30">
          <PostContent post={post} />
        </div>

        {/* Comments Section */}
        <div className="px-5 sm:px-6 py-6">
          <CommentThread comments={comments} postId={post.id} />
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
