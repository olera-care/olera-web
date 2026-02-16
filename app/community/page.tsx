"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ForumPostCardV3 from "@/components/community/ForumPostCardV3";
import { GUIDELINES } from "@/components/community/GuidelinesDrawer";
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

// Time-aware greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning!";
  if (hour >= 12 && hour < 17) return "Good afternoon!";
  return "Good evening!";
}

// Category styling
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
        } else if (selectedPost || showGuidelines) {
          handleClosePost();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showComposer, selectedPost, showGuidelines, activeCategory]);

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
    setShowGuidelines(false);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    params.set("post", post.slug);
    router.push(`/community?${params.toString()}`, { scroll: false });
  };

  const handleClosePost = () => {
    setShowGuidelines(false);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    const url = params.toString() ? `/community?${params}` : "/community";
    router.push(url, { scroll: false });
  };

  const handleOpenGuidelines = () => {
    setShowGuidelines(true);
    // Clear post selection from URL
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    const url = params.toString() ? `/community?${params}` : "/community";
    router.push(url, { scroll: false });
  };

  const handleCategoryChange = (category: CareTypeId | "all") => {
    setActiveCategory(category);
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

  // ══════════════════════════════════════════════════════════
  // LEFT panel for SplitViewLayout — Posts feed
  // Takes full width when no post selected (expandWhenEmpty)
  // Narrows to 480px when a post is selected
  // ══════════════════════════════════════════════════════════

  const postsFeed = (
    <div>
      {/* ── Sticky composer header — flush, no side/top padding ── */}
      <div className={`sticky top-0 z-20 bg-white border-b border-gray-200 ${showComposer ? "shadow-md" : ""}`}>
        {/* Mobile: Search + Category pills */}
        <div className="lg:hidden px-4 pt-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 min-w-max pb-1">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              {ALL_CARE_TYPES.map((careType) => (
                <button
                  key={careType}
                  onClick={() => handleCategoryChange(careType)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === careType
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {CARE_TYPE_CONFIG[careType].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className={`px-8 ${showComposer ? "py-6" : "py-6"} transition-all duration-200 ${showComposer ? "relative z-20" : ""}`}>
          {!showComposer ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500">{getGreeting()}</p>
                  <h2 className="text-xl font-semibold text-gray-900">What&apos;s on your mind today?</h2>
                </div>
                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            sortBy === option.value ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-3 pl-3 pr-1.5 py-1.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-medium text-xs">JD</span>
                </div>
                <span className="flex-1 text-left text-gray-500 text-sm font-medium">Start a discussion...</span>
                <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">Post</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-medium text-sm">JD</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <input ref={titleInputRef} type="text" value={composerTitle} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Discussion title..."
                      className={`w-full px-0 py-2 text-lg font-medium text-gray-900 placeholder-gray-400 border-0 border-b focus:outline-none bg-transparent ${composerErrors.title ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-primary-500"}`} />
                    {composerErrors.title && <p className="mt-1 text-sm text-red-500">{composerErrors.title}</p>}
                  </div>
                  <div>
                    <textarea value={composerText} onChange={(e) => handleContentChange(e.target.value)} placeholder="Share your thoughts, questions, or experiences..."
                      className={`w-full px-0 py-2 text-gray-700 placeholder-gray-400 resize-none focus:outline-none bg-transparent ${composerErrors.content ? "border-b border-red-400" : ""}`} rows={4} />
                    {composerErrors.content && <p className="mt-1 text-sm text-red-500">{composerErrors.content}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <select value={composerCategory} onChange={(e) => handleCategorySelect(e.target.value)}
                    className={`text-sm bg-gray-50 border rounded-lg pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M3%205l3%203%203-3%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat ${composerErrors.category ? "border-red-400" : "border-gray-200"} ${composerCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                    <option value="">Select category</option>
                    <option value="home-health">Home Health</option>
                    <option value="home-care">Home Care</option>
                    <option value="assisted-living">Assisted Living</option>
                    <option value="memory-care">Memory Care</option>
                    <option value="nursing-homes">Nursing Homes</option>
                    <option value="independent-living">Independent Living</option>
                  </select>
                  {composerErrors.category && <p className="mt-1 text-sm text-red-500">{composerErrors.category}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={resetComposer} className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors">Cancel</button>
                  <button onClick={handlePostSubmit} className="px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">Post Discussion</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Composer overlay */}
        {showComposer && <div className="fixed inset-0 z-10" onClick={resetComposer} />}
      </div>

      {/* ── Posts list ── */}
      <div className="px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post) => (
                <ForumPostCardV3
                  key={post.id}
                  post={post}
                  isSelected={post.id === selectedPostId}
                  onClick={() => handlePostClick(post)}
                />
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions found</h3>
                <p className="text-gray-500">{searchQuery ? "Try different keywords or browse all topics." : "Be the first to start a discussion!"}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={posts.length} itemsPerPage={POSTS_PER_PAGE}
                onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                itemLabel="discussions" showItemCount={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // RIGHT panel — Post detail OR Guidelines
  // ══════════════════════════════════════════════════════════

  const rightPanelContent = selectedPost ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="min-w-0 mr-4">
          <h3 className="text-lg font-semibold text-gray-900">Discussion</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{selectedPost.title}</p>
        </div>
        <button
          onClick={handleClosePost}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div ref={detailPanelRef} className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 border-b border-gray-100">
          <PostContent post={selectedPost} />
        </div>
        <div className="px-8 py-6">
          <CommentThread comments={getCommentsByPostId(selectedPost.id)} postId={selectedPost.id} />
        </div>
      </div>
    </div>
  ) : showGuidelines ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0 mr-4">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Community Guidelines</h3>
        </div>
        <button
          onClick={handleClosePost}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div ref={detailPanelRef} className="flex-1 overflow-y-auto">
        {/* Intro */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <p className="text-gray-600 leading-relaxed text-[15px]">
            Our community thrives when everyone feels welcome, heard, and supported.
            These guidelines help us maintain a safe and helpful space for caregivers
            and families navigating senior care together.
          </p>
        </div>
        {/* Guidelines list */}
        <div className="px-8 py-6 space-y-6">
          {GUIDELINES.map((guideline, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
                {guideline.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1.5">{guideline.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{guideline.description}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Footer note */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-start gap-3 text-sm text-gray-500">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              Violations of these guidelines may result in content removal or account restrictions.
              If you see something concerning, please use the report feature on any post or comment.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Compute the selectedId for SplitViewLayout
  const splitViewSelectedId = selectedPostId ?? (showGuidelines ? "guidelines" : null);

  // ══════════════════════════════════════════════════════════
  // LAYOUT: Sidebar (categories) + SplitViewLayout (posts + detail)
  // Mirrors portal layout: aside (270px) + content area
  // ══════════════════════════════════════════════════════════

  return (
    <main className="animate-page-in">
      <div className="flex bg-white min-h-[calc(100vh-64px)]">
        {/* ── Desktop sidebar — Categories (mirrors portal sidebar) ── */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-16 h-[calc(100vh-64px)] border-r border-gray-200 flex flex-col px-8 pt-6 pb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-5 px-1">Community</h1>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-colors"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category nav */}
            <nav className="space-y-1">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-150 ${
                  activeCategory === "all" ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-colors ${
                  activeCategory === "all" ? CATEGORY_STYLES["all"].activeBg : CATEGORY_STYLES["all"].bg
                }`}>{CATEGORY_STYLES["all"].emoji}</span>
                <span className="flex-1 text-left">All Discussions</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === "all" ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"}`}>{categoryCounts.all}</span>
              </button>
              {ALL_CARE_TYPES.map((careType) => {
                const config = CARE_TYPE_CONFIG[careType];
                const style = CATEGORY_STYLES[careType];
                return (
                  <button
                    key={careType}
                    onClick={() => handleCategoryChange(careType)}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-150 ${
                      activeCategory === careType ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-colors ${
                      activeCategory === careType ? style.activeBg : style.bg
                    }`}>{style.emoji}</span>
                    <span className="flex-1 text-left">{config.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === careType ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"}`}>{categoryCounts[careType]}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom — Community Guidelines */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={handleOpenGuidelines}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-colors group ${
                  showGuidelines ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="flex-1 text-left text-[15px] font-medium">Guidelines</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content area — SplitViewLayout (posts + detail panel) ── */}
        <div className="flex-1 min-w-0">
          <SplitViewLayout
            selectedId={splitViewSelectedId}
            onBack={handleClosePost}
            backLabel="Back to discussions"
            expandWhenEmpty
            equalWidth
            left={postsFeed}
            right={rightPanelContent}
          />
        </div>
      </div>

    </main>
  );
}

// Skeleton matching sidebar + content layout
function MountingSkeleton() {
  return (
    <main>
      <div className="flex bg-white min-h-[calc(100vh-64px)]">
        <div className="hidden lg:block w-[320px] shrink-0 border-r border-gray-200">
          <div className="px-8 pt-6 space-y-4">
            <div className="h-7 bg-gray-100 rounded-lg animate-pulse w-28" />
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-11 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 px-8 py-6">
          <div className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
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
