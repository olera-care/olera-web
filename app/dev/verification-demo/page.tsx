"use client";

import { useState } from "react";
import Link from "next/link";

type DemoState = "restricted" | "pending_review" | "verified";

export default function VerificationDemoPage() {
  const [state, setState] = useState<DemoState>("restricted");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls - Fixed at top */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium text-xs">
                DEMO
              </span>
              <span className="font-medium text-gray-900">Verification Gating States</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setState("restricted")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  state === "restricted"
                    ? "bg-amber-100 text-amber-800 ring-2 ring-amber-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Restricted
              </button>
              <button
                onClick={() => setState("pending_review")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  state === "pending_review"
                    ? "bg-blue-100 text-blue-800 ring-2 ring-blue-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setState("verified")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  state === "verified"
                    ? "bg-green-100 text-green-800 ring-2 ring-green-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Verified
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State Banner */}
      {state === "restricted" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-amber-800 font-medium">Verification Required</p>
              <p className="text-amber-700 text-sm">Complete verification to unlock full access to your provider dashboard.</p>
            </div>
            <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm">
              Complete Verification
            </button>
          </div>
        </div>
      )}

      {state === "pending_review" && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-blue-800 font-medium">Verification Under Review</p>
              <p className="text-blue-700 text-sm">We&apos;re reviewing your submission. Most reviews complete within 1-2 business days.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold text-xl">
                  SC
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">Sunrise Care Demo</h1>
                  <p className="text-gray-500">Austin, TX • Assisted Living</p>
                  <div className="mt-2 flex items-center gap-2">
                    {state === "verified" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Provider
                      </span>
                    )}
                    {state === "pending_review" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Pending Review
                      </span>
                    )}
                    {state === "restricted" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Verification Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`bg-white rounded-xl border border-gray-200 p-4 ${state !== "verified" ? "opacity-50" : ""}`}>
                <p className="text-2xl font-bold text-gray-900">{state === "verified" ? "12" : "—"}</p>
                <p className="text-sm text-gray-500">Inquiries</p>
              </div>
              <div className={`bg-white rounded-xl border border-gray-200 p-4 ${state !== "verified" ? "opacity-50" : ""}`}>
                <p className="text-2xl font-bold text-gray-900">{state === "verified" ? "847" : "—"}</p>
                <p className="text-sm text-gray-500">Profile Views</p>
              </div>
              <div className={`bg-white rounded-xl border border-gray-200 p-4 ${state !== "verified" ? "opacity-50" : ""}`}>
                <p className="text-2xl font-bold text-gray-900">{state === "verified" ? "4.8" : "—"}</p>
                <p className="text-sm text-gray-500">Rating</p>
              </div>
            </div>

            {/* Inbox Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
                <Link href="#" className="text-sm text-primary-600 hover:underline">View all</Link>
              </div>

              {state === "verified" ? (
                <div className="divide-y divide-gray-100">
                  {[
                    { name: "Sarah M.", message: "Hi, I'm looking for memory care for my mother...", time: "2h ago", unread: true },
                    { name: "John D.", message: "What are your rates for assisted living?", time: "5h ago", unread: true },
                    { name: "Emily R.", message: "Thank you for the tour yesterday!", time: "1d ago", unread: false },
                  ].map((inquiry, i) => (
                    <div key={i} className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${inquiry.unread ? "bg-primary-50/50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {inquiry.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${inquiry.unread ? "text-gray-900" : "text-gray-600"}`}>{inquiry.name}</p>
                            <span className="text-xs text-gray-400">{inquiry.time}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{inquiry.message}</p>
                        </div>
                        {inquiry.unread && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    state === "restricted" ? "bg-amber-100" : "bg-blue-100"
                  }`}>
                    <svg className={`w-6 h-6 ${state === "restricted" ? "text-amber-600" : "text-blue-600"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {state === "restricted" ? "Inbox Locked" : "Inbox Temporarily Locked"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {state === "restricted"
                      ? "Complete verification to view and respond to inquiries."
                      : "You'll have access once your verification is approved."}
                  </p>
                  {state === "restricted" && (
                    <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm">
                      Complete Verification
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Status Card */}
            <div className={`rounded-2xl border p-6 ${
              state === "restricted" ? "bg-amber-50 border-amber-200" :
              state === "pending_review" ? "bg-blue-50 border-blue-200" :
              "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {state === "verified" ? (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : state === "pending_review" ? (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${
                    state === "restricted" ? "text-amber-900" :
                    state === "pending_review" ? "text-blue-900" :
                    "text-green-900"
                  }`}>
                    {state === "restricted" ? "Verification Required" :
                     state === "pending_review" ? "Under Review" :
                     "Verified"}
                  </p>
                </div>
              </div>

              <p className={`text-sm mb-4 ${
                state === "restricted" ? "text-amber-800" :
                state === "pending_review" ? "text-blue-800" :
                "text-green-800"
              }`}>
                {state === "restricted"
                  ? "To protect families, we require identity verification for provider accounts flagged for review."
                  : state === "pending_review"
                  ? "Your verification documents are being reviewed. We'll notify you once complete."
                  : "Your account has full access to all provider features."}
              </p>

              {state === "restricted" && (
                <button className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm">
                  Start Verification
                </button>
              )}
            </div>

            {/* What's Blocked */}
            {state !== "verified" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Limited Access</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    View family contact info
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reply to inquiries
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reach out to families
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Edit public profile
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal (shown in restricted state) */}
      {state === "restricted" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Verify Your Identity</h2>
              <p className="text-gray-500 mt-1">Complete this form to unlock full access to your provider dashboard.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Owner</option>
                  <option>Administrator</option>
                  <option>Manager</option>
                  <option>Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} placeholder="Any additional information..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setState("pending_review")}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
