"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ForumPostCardV3 from "@/components/community/ForumPostCardV3";
import GuidelinesDrawer from "@/components/community/GuidelinesDrawer";
import PostContent from "@/components/community/PostContent";
import CommentThread from "@/components/community/CommentThread";
import SplitViewLayout from "@/components/portal/SplitViewLayout";
import Pagination from "@/components/ui/Pagination";
import { getPostsByCategory, getPostBySlug } from "@/data/mock/forumPosts";
import { getCommentsByPostId } from "@/data/mock/forumComments";
import { ForumPost, CareTypeId, CARE_TYPE_CONFIG, ALL_CARE_TYPES } from "@/types/forum";

// Sort options
type SortOption = "newest" | "oldest" | "most-likes" | "most-views" | "most-comments";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-likes", label: "Most likes" },
  { value: "most-views", label: "Most views" },
  { value: "most-comments", label: "Most comments" },
];

// Category styling with colorful icons
const CATEGORY_STYLES: Record<CareTypeId | "all", { emoji: string; bg: string; activeBg: string }> = {
  all: { emoji: "\u{1F4AC}", bg: "bg-slate-100", activeBg: "bg-slate-200" },
  "home-health": { emoji: "\u{1F3E5}", bg: "bg-rose-100", activeBg: "bg-rose-200" },
  "home-care": { emoji: "\u{1F3E0}", bg: "bg-amber-100", activeBg: "bg-amber-200" },
  "assisted-living": { emoji: "\u{1F91D}", bg: "bg-blue-100", activeBg: "bg-blue-200" },
  "memory-care": { emoji: "\u{1F9E0}", bg: "bg-purple-100", activeBg: "bg-purple-200" },
  "nursing-homes": { emoji: "\u{1F3E2}", bg: "bg-emerald-100", activeBg: "bg-emerald-200" },
  "independent-living": { emoji: "\u{2600}\u{FE0F}", bg: "bg-orange-100", activeBg: "bg-orange-200" },
};

const POSTS_PER_PAGE = 10;

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Prevent hydration flash
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // URL params
  const categoryParam = searchParams.get("category");
  const urlCategory: CareTypeId | "all" =
    categoryParam && ALL_CARE_TYPES.includes(categoryParam as CareTypeId)
      ? (categoryParam as CareTypeId)
      : "all";
  const selectedPostSlug = searchParams.get("post");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CareTypeId | "all">(urlCategory);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerText, setComposerText] = useState("");
  const [composerCategory, setComposerCategory] = useState("");
  const [composerErrors, setComposerErrors] = useState({ title: "", content: "", category: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);

  // Resolve selected post
  const selectedPost = selectedPostSlug ? getPostBySlug(selectedPostSlug) ?? null : null;
  const selectedPostId = selectedPost?.id ?? null;

  // Sync URL category to state
  useEffect(() => { setActiveCategory(urlCategory); }, [urlCategory]);

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);

  // Escape key: close composer or deselect post
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showComposer) {
          resetComposer();
        } else if (selectedPost) {
          handleClosePost();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showComposer, selectedPost, activeCategory]);

  // Auto-focus composer title
  useEffect(() => {
    if (showComposer && titleInputRef.current) titleInputRef.current.focus();
  }, [showComposer]);

  // Scroll detail panel to top on post change
  useEffect(() => {
    if (selectedPostId && detailPanelRef.current) {
      detailPanelRef.current.scrollTo({ top: 0 });
    }
  }, [selectedPostId]);

  // ── Data ──

  const posts = useMemo(() => {
    let filtered = getPostsByCategory(activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most-likes": return b.likeCount - a.likeCount;
        case "most-views": return b.viewCount - a.viewCount;
        case "most-comments": return b.commentCount - a.commentCount;
        default: return 0;
      }
    });
  }, [searchQuery, activeCategory, sortBy]);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  }, [posts, currentPage]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CareTypeId | "all", number> = {
      all: getPostsByCategory("all").length,
      "home-health": getPostsByCategory("home-health").length,
      "home-care": getPostsByCategory("home-care").length,
      "assisted-living": getPostsByCategory("assisted-living").length,
      "memory-care": getPostsByCategory("memory-care").length,
      "nursing-homes": getPostsByCategory("nursing-homes").length,
      "independent-living": getPostsByCategory("independent-living").length,
    };
    return counts;
  }, []);

  // Reset page on filter changes
  useEffect(() => { setCurrentPage(1); }, [activeCategory, sortBy, searchQuery]);

  // ── Handlers ──

  const resetComposer = () => {
    setShowComposer(false);
    setComposerTitle("");
    setComposerText("");
    setComposerCategory("");
    setComposerErrors({ title: "", content: "", category: "" });
  };

  const handlePostClick = (post: ForumPost) => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    params.set("post", post.slug);
    router.push(`/community?${params.toString()}`, { scroll: false });
  };

  const handleClosePost = () => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    const url = params.toString() ? `/community?${params}` : "/community";
    router.push(url, { scroll: false });
  };

  const handleCategoryChange = (category: CareTypeId | "all") => {
    setActiveCategory(category);
    // Clear post selection when changing category
    if (category === "all") {
      router.push("/community", { scroll: false });
    } else {
      router.push(`/community?category=${category}`, { scroll: false });
    }
  };

  const handlePostSubmit = () => {
    const errors = {
      title: composerTitle.trim() === "" ? "Please add a discussion title" : "",
      content: composerText.trim() === "" ? "Please add content to your post" : "",
      category: composerCategory === "" ? "Please select a category" : "",
    };
    setComposerErrors(errors);
    if (Object.values(errors).some(e => e !== "")) return;
    console.log("Submitting post:", { title: composerTitle, content: composerText, category: composerCategory });
    resetComposer();
  };

  const handleTitleChange = (v: string) => {
    setComposerTitle(v);
    if (composerErrors.title && v.trim()) setComposerErrors(prev => ({ ...prev, title: "" }));
  };
  const handleContentChange = (v: string) => {
    setComposerText(v);
    if (composerErrors.content && v.trim()) setComposerErrors(prev => ({ ...prev, content: "" }));
  };
  const handleCategorySelect = (v: string) => {
    setComposerCategory(v);
    if (composerErrors.category && v) setComposerErrors(prev => ({ ...prev, category: "" }));
  };

  if (!isMounted) return <MountingSkeleton />;

  // ── Left Panel ──

  const leftPanel = (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-4 pb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-colors"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Desktop: Categories (vertical list) */}
      <div className="hidden lg:block px-4 pb-3">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Categories</h3>
        <nav className="space-y-0.5">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150 ${
              activeCategory === "all"
                ? "bg-gray-100 text-gray-900 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className={`w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0 transition-colors ${
              activeCategory === "all" ? CATEGORY_STYLES["all"].activeBg : CATEGORY_STYLES["all"].bg
            }`}>
              {CATEGORY_STYLES["all"].emoji}
            </span>
            <span className="flex-1 text-left">All Discussions</span>
            <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
              activeCategory === "all" ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
            }`}>
              {categoryCounts.all}
            </span>
          </button>
          {ALL_CARE_TYPES.map((careType) => {
            const config = CARE_TYPE_CONFIG[careType];
            const style = CATEGORY_STYLES[careType];
            const count = categoryCounts[careType];
            return (
              <button
                key={careType}
                onClick={() => handleCategoryChange(careType)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                  activeCategory === careType
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0 transition-colors ${
                  activeCategory === careType ? style.activeBg : style.bg
                }`}>
                  {style.emoji}
                </span>
                <span className="flex-1 text-left">{config.label}</span>
                <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
                  activeCategory === careType ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Community Guidelines */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowGuidelines(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="flex-1 text-left text-sm">Community Guidelines</span>
            <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile: Category pills */}
      <div className="lg:hidden px-4 pb-3">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-1">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {ALL_CARE_TYPES.map((careType) => (
              <button
                key={careType}
                onClick={() => handleCategoryChange(careType)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === careType
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CARE_TYPE_CONFIG[careType].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Composer + Sort row */}
      <div className="flex-shrink-0 p-4">
        {!showComposer ? (
          <div className="space-y-3">
            {/* Sort + New Post row */}
            <div className="flex items-center justify-between">
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSortMenu && (
                  <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          sortBy === option.value
                            ? "bg-gray-50 text-gray-900 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 tabular-nums">
                {posts.length} {posts.length === 1 ? "discussion" : "discussions"}
              </span>
            </div>
            {/* Composer trigger */}
            <div
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-3 pl-3 pr-1.5 py-1.5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-medium text-[10px]">JD</span>
              </div>
              <span className="flex-1 text-left text-gray-400 text-sm">
                Start a discussion...
              </span>
              <span className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-md">
                Post
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 font-medium text-xs">JD</span>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={composerTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Discussion title..."
                  className={`w-full px-0 py-1.5 text-base font-medium text-gray-900 placeholder-gray-400 border-0 border-b focus:outline-none bg-transparent ${
                    composerErrors.title ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-primary-500"
                  }`}
                />
                {composerErrors.title && <p className="text-xs text-red-500">{composerErrors.title}</p>}
                <textarea
                  value={composerText}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Share your thoughts..."
                  className={`w-full px-0 py-1.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none bg-transparent ${
                    composerErrors.content ? "border-b border-red-400" : ""
                  }`}
                  rows={3}
                />
                {composerErrors.content && <p className="text-xs text-red-500">{composerErrors.content}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <select
                value={composerCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className={`text-xs bg-gray-50 border rounded-md pl-2 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M3%205l3%203%203-3%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat ${
                  composerErrors.category ? "border-red-400" : "border-gray-200"
                } ${composerCategory ? 'text-gray-900' : 'text-gray-500'}`}
              >
                <option value="">Category</option>
                <option value="home-health">Home Health</option>
                <option value="home-care">Home Care</option>
                <option value="assisted-living">Assisted Living</option>
                <option value="memory-care">Memory Care</option>
                <option value="nursing-homes">Nursing Homes</option>
                <option value="independent-living">Independent Living</option>
              </select>
              {composerErrors.category && <p className="text-xs text-red-500">{composerErrors.category}</p>}
              <div className="flex items-center gap-1.5">
                <button onClick={resetComposer} className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handlePostSubmit} className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post list — scrollable */}
      <div ref={listScrollRef} className="flex-1 overflow-y-auto min-h-0 relative">
        {/* Dim overlay when composer is open */}
        {showComposer && (
          <div
            className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 cursor-pointer"
            onClick={resetComposer}
          />
        )}

        <div className="divide-y divide-gray-100">
          {paginatedPosts.length > 0 ? (
            paginatedPosts.map((post) => (
              <ForumPostCardV3
                key={post.id}
                post={post}
                compact
                isSelected={post.id === selectedPostId}
                onClick={() => handlePostClick(post)}
              />
            ))
          ) : (
            <div className="py-16 text-center px-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No discussions found</p>
              <p className="text-xs text-gray-500">
                {searchQuery ? "Try different keywords." : "Be the first to start a discussion!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-2 flex justify-center bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={posts.length}
            itemsPerPage={POSTS_PER_PAGE}
            onPageChange={(page) => {
              setCurrentPage(page);
              listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            itemLabel="discussions"
            showItemCount={false}
          />
        </div>
      )}
    </div>
  );

  // ── Right Panel ──

  const rightPanel = selectedPost ? (
    <div ref={detailPanelRef} className="h-full overflow-y-auto">
      {/* Sticky header — desktop only (mobile uses SplitViewLayout's back button) */}
      <div className="hidden lg:flex sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 z-10 items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-900 truncate">
          {selectedPost.title}
        </h2>
        <button
          onClick={handleClosePost}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Post content */}
      <div className="px-6 py-5 border-b border-gray-100">
        <PostContent post={selectedPost} />
      </div>

      {/* Comments */}
      <div className="px-6 py-6">
        <CommentThread comments={getCommentsByPostId(selectedPost.id)} postId={selectedPost.id} />
      </div>
    </div>
  ) : null;

  // ── Empty State ──

  const emptyState = (
    <div className="text-center px-8">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-900">Select a discussion</p>
      <p className="text-xs text-gray-500 mt-1">Choose a discussion from the list to read and respond</p>
    </div>
  );

  // ── Layout ──

  return (
    <main className="animate-page-in">
      <SplitViewLayout
        left={leftPanel}
        right={rightPanel}
        selectedId={selectedPostId}
        onBack={handleClosePost}
        backLabel="Discussions"
        emptyState={emptyState}
      />

      {/* Guidelines Drawer */}
      <GuidelinesDrawer
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />
    </main>
  );
}

// Skeleton matching split view layout
function MountingSkeleton() {
  return (
    <main className="flex h-[calc(100vh-64px)]">
      {/* Left panel skeleton */}
      <div className="w-full lg:w-[480px] lg:shrink-0 bg-white border-r border-gray-200">
        <div className="p-4 space-y-3">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="hidden lg:block space-y-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-px bg-gray-100" />
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-50 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-white border-l border-gray-200">
        <div className="text-center px-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mx-auto mb-2" />
          <div className="h-3 bg-gray-50 rounded animate-pulse w-48 mx-auto" />
        </div>
      </div>
    </main>
  );
}

function LoadingSkeleton() {
  return <MountingSkeleton />;
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CommunityPageContent />
    </Suspense>
  );
}
