"use client";

import { use, useMemo, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getResourceBySlug, MOCK_RESOURCES } from "@/data/mock/resources";
import { RESOURCE_CATEGORY_CONFIG } from "@/types/resource";
import { CARE_TYPE_CONFIG } from "@/types/forum";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ResourceArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const resource = useMemo(() => getResourceBySlug(slug), [slug]);
  const [clapped, setClapped] = useState(false);
  const [clapCount, setClapCount] = useState(142);

  if (!resource) {
    notFound();
  }

  const relatedResources = useMemo(() => {
    return MOCK_RESOURCES.filter(
      (r) =>
        r.id !== resource.id &&
        r.careTypes.some((ct) => resource.careTypes.includes(ct))
    ).slice(0, 3);
  }, [resource]);

  const handleClap = () => {
    if (!clapped) {
      setClapCount(c => c + 1);
      setClapped(true);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Article Header */}
      <header className="max-w-[680px] mx-auto px-5 pt-10 md:pt-14">
        {/* Title */}
        <h1 className="text-[32px] md:text-[42px] font-bold text-gray-900 leading-[1.2] tracking-[-0.02em] mb-4">
          {resource.title}
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl md:text-[22px] text-gray-500 leading-[1.4] mb-8">
          {resource.subtitle}
        </h2>

        {/* Author row */}
        <div className="flex items-center gap-3 mb-8">
          {resource.author.avatar ? (
            <img
              src={resource.author.avatar}
              alt={resource.author.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-white font-medium">
                {resource.author.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{resource.author.name}</span>
              <span className="text-gray-400">·</span>
              <button className="text-primary-600 font-medium text-sm hover:text-primary-700">
                Follow
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{resource.readingTime} read</span>
              <span className="text-gray-300">·</span>
              <span>{formatDate(resource.publishedAt)}</span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between py-3 border-y border-gray-100 mb-10">
          <div className="flex items-center gap-6">
            <button
              onClick={handleClap}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className={`w-6 h-6 ${clapped ? 'text-primary-600' : ''}`} fill={clapped ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{clapCount}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">23</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="6" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="18" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image - breaks out wider */}
      <figure className="max-w-[1000px] mx-auto px-5 mb-10">
        <img
          src={resource.coverImage}
          alt={resource.title}
          className="w-full rounded-sm"
        />
        <figcaption className="mt-2 text-center text-sm text-gray-500">
          Photo credit placeholder
        </figcaption>
      </figure>

      {/* Article Content */}
      <article className="max-w-[680px] mx-auto px-5">
        {/* Lead paragraph - slightly larger */}
        <p className="text-xl text-gray-700 leading-[1.7] mb-8 font-serif">
          {resource.excerpt}
        </p>

        {/* Body content - Medium style */}
        <div className="prose-medium">
          <p>
            When it comes to finding the right care for your loved one, there are many factors to consider. Understanding your options is the first step toward making an informed decision that balances quality of care with practical considerations like location and cost.
          </p>

          <p>
            The journey of finding care can feel overwhelming, but breaking it down into manageable steps makes the process much more approachable. This guide will walk you through everything you need to know.
          </p>

          <h2>Understanding Your Options</h2>

          <p>
            The senior care landscape offers various levels of support, from minimal assistance to round-the-clock medical care. Each type of care serves different needs, and choosing the right one depends on your loved one's health condition, preferences, and financial situation.
          </p>

          <blockquote>
            The most important thing is finding care that respects your loved one's dignity and independence while providing the support they need.
          </blockquote>

          <p>
            Many families find that their needs change over time. What starts as occasional help with household tasks may eventually evolve into a need for more comprehensive care. Planning for this progression can help ease transitions.
          </p>

          <h2>Key Considerations</h2>

          <p>
            Before making any decisions, take time to assess the current and anticipated needs. Consider factors like mobility, cognitive function, medical requirements, and social preferences.
          </p>

          <ul>
            <li>Assess current health status and anticipated future needs</li>
            <li>Consider your loved one's preferences and lifestyle</li>
            <li>Evaluate financial resources and insurance coverage</li>
            <li>Research quality ratings and reviews from other families</li>
            <li>Visit facilities and meet with staff when possible</li>
          </ul>

          <p>
            Taking the time to thoroughly evaluate these factors will help ensure you find the right fit for your family's unique situation.
          </p>

          {/* Callout box */}
          <div className="my-10 p-6 bg-gray-50 border-l-4 border-primary-500 rounded-r-lg">
            <p className="text-gray-700 font-medium mb-2">Coming Soon</p>
            <p className="text-gray-600 text-sm">
              We're working on comprehensive content for this guide. The full article will include detailed checklists, expert interviews, and actionable steps.
            </p>
          </div>

          <h2>Next Steps</h2>

          <p>
            Once you've identified the type of care that best fits your needs, the next step is to research specific providers in your area. Look for reviews, visit facilities when possible, and don't hesitate to ask questions.
          </p>

          <p>
            Remember that finding the right care is a process, and it's okay to take your time. The most important thing is ensuring your loved one receives the support they need while maintaining their quality of life.
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-100">
          {resource.careTypes.map((careType) => (
            <Link
              key={careType}
              href={`/resources?type=${careType}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              {CARE_TYPE_CONFIG[careType].label}
            </Link>
          ))}
          {resource.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom clap section */}
        <div className="flex justify-center py-10 border-b border-gray-100">
          <button
            onClick={handleClap}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 rounded-full border-2 ${clapped ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} flex items-center justify-center group-hover:border-primary-500 transition-colors`}>
              <svg className={`w-7 h-7 ${clapped ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'} transition-colors`} fill={clapped ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">{clapCount} claps</span>
          </button>
        </div>

        {/* Author card */}
        <div className="py-8 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {resource.author.avatar ? (
              <img
                src={resource.author.avatar}
                alt={resource.author.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-medium">
                  {resource.author.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  Written by {resource.author.name}
                </h3>
                <button className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors">
                  Follow
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-2">{resource.author.role}</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Helping families navigate senior care decisions with expert guidance and practical resources.
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* More from Olera */}
      {relatedResources.length > 0 && (
        <section className="max-w-[680px] mx-auto px-5 py-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
            More from Olera Resources
          </h3>
          <div className="space-y-8">
            {relatedResources.map((related) => (
              <Link
                key={related.id}
                href={`/resources/${related.slug}`}
                className="flex gap-5 group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {related.title}
                  </h4>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-2">
                    {related.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{related.author.name}</span>
                    <span>·</span>
                    <span>{related.readingTime}</span>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-sm overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={related.coverImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Simple CTA */}
      <section className="border-t border-gray-100 py-16">
        <div className="max-w-[680px] mx-auto px-5 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to find care?
          </h2>
          <p className="text-gray-500 mb-6">
            Browse verified providers in your area.
          </p>
          <Link
            href="/browse"
            className="inline-flex px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Find Care Providers
          </Link>
        </div>
      </section>

      {/* Inline styles for Medium-like typography */}
      <style jsx>{`
        .prose-medium {
          font-family: Georgia, Cambria, "Times New Roman", Times, serif;
          font-size: 20px;
          line-height: 1.7;
          color: #292929;
        }
        .prose-medium p {
          margin-bottom: 1.5em;
        }
        .prose-medium h2 {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #292929;
          margin-top: 2em;
          margin-bottom: 0.5em;
          letter-spacing: -0.02em;
        }
        .prose-medium blockquote {
          font-style: italic;
          font-size: 24px;
          line-height: 1.5;
          color: #292929;
          border-left: 3px solid #292929;
          padding-left: 1.5em;
          margin: 2em 0;
        }
        .prose-medium ul {
          margin: 1.5em 0;
          padding-left: 1.5em;
        }
        .prose-medium li {
          margin-bottom: 0.5em;
        }
        .prose-medium li::marker {
          color: #6b6b6b;
        }
      `}</style>
    </main>
  );
}
