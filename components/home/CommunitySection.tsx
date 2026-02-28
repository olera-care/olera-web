"use client";

import Link from "next/link";
import { mockForumPosts } from "@/data/mock/forumPosts";
import { mockForumComments } from "@/data/mock/forumComments";
import { CARE_TYPE_CONFIG } from "@/types/forum";

const careTypeToColor: Record<string, string> = {
  "memory-care": "primary",
  "home-care": "warm",
  "home-health": "blue",
  "assisted-living": "primary",
  "nursing-homes": "warm",
  "independent-living": "blue",
};

const careTypeToIcon: Record<string, string> = {
  "memory-care": "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  "home-care": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "home-health": "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  "assisted-living": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "nursing-homes": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  "independent-living": "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
};

const colorMap: Record<string, { tag: string; accent: string; glow: string; avatar: string; stripe: string; icon: string }> = {
  primary: {
    tag: "text-primary-600 bg-primary-100/80",
    accent: "group-hover:border-primary-200",
    glow: "group-hover:shadow-primary-200/40",
    avatar: "bg-primary-100 text-primary-700 ring-primary-200/50",
    stripe: "from-primary-400 to-primary-600",
    icon: "text-primary-400",
  },
  warm: {
    tag: "text-warm-600 bg-warm-100/80",
    accent: "group-hover:border-warm-200",
    glow: "group-hover:shadow-warm-200/40",
    avatar: "bg-warm-100 text-warm-700 ring-warm-200/50",
    stripe: "from-warm-400 to-warm-600",
    icon: "text-warm-400",
  },
  blue: {
    tag: "text-blue-600 bg-blue-100/80",
    accent: "group-hover:border-blue-200",
    glow: "group-hover:shadow-blue-200/40",
    avatar: "bg-blue-100 text-blue-700 ring-blue-200/50",
    stripe: "from-blue-400 to-blue-600",
    icon: "text-blue-400",
  },
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "Just now";
}

export default function CommunitySection() {
  const recentPosts = [...mockForumPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const posts = recentPosts.map((forumPost) => {
    const topComment = mockForumComments.find(c => c.postId === forumPost.id);
    const careTypeConfig = CARE_TYPE_CONFIG[forumPost.careType];
    const accentColor = careTypeToColor[forumPost.careType] || "primary";
    const iconPath = careTypeToIcon[forumPost.careType] || careTypeToIcon["memory-care"];

    const avatars = [forumPost.author.displayName.charAt(0)];
    if (topComment) {
      avatars.push(topComment.author.displayName.charAt(0));
    }

    return {
      id: forumPost.id,
      slug: forumPost.slug,
      topic: careTypeConfig.label,
      question: forumPost.title,
      replies: forumPost.commentCount,
      likes: forumPost.likeCount,
      timeAgo: formatTimeAgo(forumPost.createdAt),
      topReply: topComment?.content.split('\n')[0].slice(0, 120) + (topComment && topComment.content.length > 120 ? '...' : '') || '',
      topReplyAuthor: topComment?.author.displayName.charAt(0) || '',
      avatars,
      accentColor,
      iconPath,
    };
  });

  return (
    <section className="pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-warm-50 to-warm-100/50 rounded-3xl border border-warm-200/50 p-6 md:p-10 overflow-hidden">

          {/* Decorative background elements */}
          <div className="absolute top-6 right-8 w-20 h-20 text-warm-300/20 hidden md:block">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div className="absolute bottom-10 left-6 w-16 h-16 text-primary-300/10 hidden md:block rotate-12">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div className="absolute top-1/2 right-1/4 w-10 h-10 text-warm-200/15 hidden lg:block -rotate-12">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>

          {/* Header */}
          <div className="relative flex flex-col items-center text-center mb-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-600">Live conversations</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              The Olera Community
            </h2>
            <Link
              href="/community"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 mt-4 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 hover:shadow-md hover:shadow-primary-600/30 transition-all"
            >
              Join the conversation
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Forum Posts Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const colors = colorMap[post.accentColor];

              return (
                <Link
                  key={post.id}
                  href={`/community?post=${post.slug}`}
                  className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg ${colors.accent} ${colors.glow} transition-all duration-300`}
                >
                  {/* Left accent stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.stripe} rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Card content */}
                  <div className="p-5">
                    {/* Topic row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className={`w-3.5 h-3.5 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={post.iconPath} />
                        </svg>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.tag}`}>
                          {post.topic}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{post.timeAgo}</span>
                    </div>

                    {/* Question */}
                    <p className="text-[15px] font-semibold text-gray-900 leading-snug mb-4 line-clamp-2 group-hover:text-gray-800 transition-colors">
                      {post.question}
                    </p>

                    {/* Top reply */}
                    {post.topReply && (
                      <div className="relative mb-4">
                        <div className="absolute -top-1.5 left-5 w-3 h-3 bg-gray-50 rotate-45 border-l border-t border-gray-100" />
                        <div className="relative bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ${colors.avatar}`}>
                              {post.topReplyAuthor}
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">Top reply</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {post.topReply}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                          {post.avatars.slice(0, 3).map((a, i) => (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white ${
                                i === 0 ? colors.avatar.replace(/ring-[^\s]+/, '') : 'bg-gray-100 text-gray-500'
                              }`}
                              style={{ zIndex: 3 - i }}
                            >
                              {a}
                            </div>
                          ))}
                          {post.avatars.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[8px] font-bold ring-2 ring-white">
                              +{post.avatars.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-medium">{post.replies}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="font-medium">{post.likes}</span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
                        Read
                        <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile CTA */}
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition-all"
            >
              Join the conversation
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>

        {/* Resource + Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Resources Card */}
          <Link
            href="/resources"
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-primary-50/80 to-white border border-primary-100/60 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/40 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5.5 h-5.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Caregiving Guides & Articles
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Expert resources for every stage of the care journey.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-600 transition-colors duration-300">
                <svg className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Benefits Finder Card */}
          <Link
            href="/benefits"
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-warm-50 via-warm-50/80 to-white border border-warm-100/60 hover:border-warm-200 hover:shadow-lg hover:shadow-warm-100/40 transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warm-400 to-warm-600 rounded-l-2xl" />
            <div className="p-5 pl-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5.5 h-5.5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Find Financial Aid Programs
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Medicare, Medicaid, and veteran benefits you may qualify for.</p>
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-warm-100 flex items-center justify-center group-hover:bg-warm-600 transition-colors duration-300">
                <svg className="w-4 h-4 text-warm-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
