"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Data ───────────────────────────────────────────────── */

const MARIA = {
  firstName: "Maria",
  lastName: "S.",
  photo: "/images/maria-profile.jpg",
  rating: 4.9,
  reviewCount: 47,
};

const ALL_REVIEWS = [
  { id: "rv1", family: "Linda R.", rating: 5, text: "Maria has been an absolute blessing for my mother. She's patient, kind, and always goes the extra mile. Mom actually looks forward to seeing her every morning.", date: "Apr 2026", response: "" },
  { id: "rv2", family: "James T.", rating: 5, text: "Extremely professional and skilled with dementia patients. Maria knows exactly how to redirect and calm my father during difficult moments.", date: "Mar 2026", response: "" },
  { id: "rv3", family: "Susan K.", rating: 5, text: "We tried several caregivers before Maria. She's the only one my mom has truly connected with.", date: "Feb 2026", response: "" },
  { id: "rv4", family: "Robert M.", rating: 5, text: "Maria is punctual, reliable, and genuinely caring. My father always brightens up when she arrives. She's become part of the family.", date: "Jan 2026", response: "Thank you so much, Robert! Your father is such a joy to spend time with. I look forward to every visit." },
  { id: "rv5", family: "Patricia L.", rating: 4, text: "Very good overall. Maria is skilled and attentive. Scheduling was occasionally tricky but she always communicated clearly.", date: "Dec 2025", response: "" },
  { id: "rv6", family: "David W.", rating: 5, text: "My mother has Parkinson's and Maria handles everything with such grace and patience. She even learned my mom's favorite songs to sing together.", date: "Nov 2025", response: "Your mother has the most beautiful voice! Those music sessions are the highlight of my week too." },
  { id: "rv7", family: "Karen H.", rating: 5, text: "Absolutely wonderful. Maria helped my dad through a really difficult transition period after his diagnosis. She was our rock.", date: "Oct 2025", response: "" },
  { id: "rv8", family: "Thomas B.", rating: 5, text: "Five stars is not enough. Maria goes above and beyond every single day.", date: "Sep 2025", response: "" },
];

/* ─── Stars ──────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Review Card ────────────────────────────────────────── */

function ReviewCard({ review }: { review: typeof ALL_REVIEWS[0] }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(review.response);
  const [saved, setSaved] = useState(!!review.response);

  const handleSave = () => {
    setSaved(true);
    setReplying(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
            <span className="text-sm font-bold text-primary-700">{review.family[0]}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.family}</p>
            <Stars rating={review.rating} />
          </div>
        </div>
        <span className="text-xs text-gray-400">{review.date}</span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">&ldquo;{review.text}&rdquo;</p>

      {/* Existing response */}
      {saved && reply && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full overflow-hidden">
              <Image src={MARIA.photo} alt="Maria" width={20} height={20} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-semibold text-primary-700">{MARIA.firstName}&apos;s response</span>
          </div>
          <p className="text-xs text-primary-800 leading-relaxed">{reply}</p>
        </div>
      )}

      {/* Reply form */}
      {replying ? (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a thoughtful response..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => { setReplying(false); setReply(review.response); }} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!reply.trim()} className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-primary-600/20">Send response</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setReplying(true)} className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
          {saved && reply ? "Edit response" : "Respond"}
        </button>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function CaregiverReviewsPage() {
  const avgRating = (ALL_REVIEWS.reduce((s, r) => s + r.rating, 0) / ALL_REVIEWS.length).toFixed(1);
  const fiveStars = ALL_REVIEWS.filter((r) => r.rating === 5).length;
  const responded = ALL_REVIEWS.filter((r) => r.response).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-vanilla-50/50 to-white">
      {/* Nav */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/caregiver/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Dashboard
            </Link>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image src={MARIA.photo} alt={MARIA.firstName} width={32} height={32} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{MARIA.firstName}&apos;s reviews</h1>
          <p className="text-sm text-gray-500">Respond to families to show you care. Families see your responses on your public profile.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
            </div>
            <p className="text-xs text-gray-400">{MARIA.reviewCount} reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 mb-1">{fiveStars}/{ALL_REVIEWS.length}</p>
            <p className="text-xs text-gray-400">5-star reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 mb-1">{responded}/{ALL_REVIEWS.length}</p>
            <p className="text-xs text-gray-400">responded</p>
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {ALL_REVIEWS.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
