"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// Mock Data — Cities with unclaimed providers
// ============================================================

const MOCK_CITIES = [
  { id: "austin-tx", name: "Austin, TX", providerCount: 47 },
  { id: "yuba-city-ca", name: "Yuba City, CA", providerCount: 23 },
  { id: "sacramento-ca", name: "Sacramento, CA", providerCount: 89 },
  { id: "houston-tx", name: "Houston, TX", providerCount: 156 },
  { id: "dallas-tx", name: "Dallas, TX", providerCount: 112 },
];

const MOCK_PROVIDERS = [
  {
    id: "1",
    name: "Emerald Oaks Senior Living",
    category: "Independent Living",
    city: "Yuba City",
    state: "CA",
    email: "info@emeraldoaks.com",
    profileViews: 127,
    lastActivity: "3 days ago",
    hasEmail: true,
  },
  {
    id: "2",
    name: "Sunrise Gardens",
    category: "Assisted Living",
    city: "Yuba City",
    state: "CA",
    email: "contact@sunrisegardens.com",
    profileViews: 84,
    lastActivity: "1 week ago",
    hasEmail: true,
  },
  {
    id: "3",
    name: "Golden Years Care Home",
    category: "Memory Care",
    city: "Yuba City",
    state: "CA",
    email: "admin@goldenyears.com",
    profileViews: 56,
    lastActivity: "2 weeks ago",
    hasEmail: true,
  },
  {
    id: "4",
    name: "Valley View Senior Community",
    category: "Independent Living",
    city: "Yuba City",
    state: "CA",
    email: "info@valleyviewsenior.com",
    profileViews: 203,
    lastActivity: "Yesterday",
    hasEmail: true,
  },
  {
    id: "5",
    name: "Comfort Care Residence",
    category: "Assisted Living",
    city: "Yuba City",
    state: "CA",
    email: null,
    profileViews: 91,
    lastActivity: "5 days ago",
    hasEmail: false,
  },
];

// ============================================================
// Main Admin Page
// ============================================================

export default function ColdOutreachAdminPage() {
  const [selectedCity, setSelectedCity] = useState<string>("yuba-city-ca");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [campaignSent, setCampaignSent] = useState(false);
  const [sending, setSending] = useState(false);

  const currentCity = MOCK_CITIES.find((c) => c.id === selectedCity);
  const providersWithEmail = MOCK_PROVIDERS.filter((p) => p.hasEmail);
  const allSelected = selectedProviders.length === providersWithEmail.length && providersWithEmail.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(providersWithEmail.map((p) => p.id));
    }
  };

  const toggleProvider = (id: string) => {
    const provider = MOCK_PROVIDERS.find((p) => p.id === id);
    if (!provider?.hasEmail) return;

    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = async () => {
    setSending(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setShowConfirmModal(false);
    setCampaignSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
                <span className="font-semibold text-gray-900">Admin</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 text-sm">Cold Outreach</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded">
                DEMO
              </span>
              <Link
                href="/cold-outreach-demo"
                className="text-[13px] text-gray-500 hover:text-gray-700"
              >
                ← Back to Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {campaignSent ? (
          /* ═══════════════════════════════════════════════════════════
             SUCCESS STATE
             ═══════════════════════════════════════════════════════════ */
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Campaign Sent</h2>
            <p className="text-[13px] text-gray-500 mb-6">
              {selectedProviders.length} providers in {currentCity?.name} will receive an email from Logan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCampaignSent(false);
                  setSelectedProviders([]);
                }}
                className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Send Another
              </button>
              <Link
                href="/cold-outreach-demo/inbox"
                className="px-4 py-2 text-[13px] font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Preview Inbox →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════
                PAGE HEADER
                ═══════════════════════════════════════════════════════════ */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Cold Outreach</h1>
              <p className="text-sm text-gray-500 mt-1">
                Send profile completion emails to unclaimed providers
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                STATS ROW
                ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[13px] text-gray-500 mb-1">Total Unclaimed</p>
                <p className="text-2xl font-semibold text-gray-900">427</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[13px] text-gray-500 mb-1">With Email</p>
                <p className="text-2xl font-semibold text-gray-900">389</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[13px] text-gray-500 mb-1">Sent This Week</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                FILTERS ROW
                ═══════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-4 mb-4">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedProviders([]);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                {MOCK_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.providerCount})
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-3">
                {selectedProviders.length > 0 && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
                    </svg>
                    Send to {selectedProviders.length}
                  </button>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                PROVIDER TABLE
                ═══════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-500">
                      Provider
                    </th>
                    <th className="text-left px-4 py-3 text-[13px] font-medium text-gray-500">
                      Category
                    </th>
                    <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-500">
                      Views
                    </th>
                    <th className="text-right px-4 py-3 text-[13px] font-medium text-gray-500">
                      Last Active
                    </th>
                    <th className="text-center px-4 py-3 text-[13px] font-medium text-gray-500">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_PROVIDERS.map((provider) => (
                    <tr
                      key={provider.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !provider.hasEmail ? "opacity-50" : "cursor-pointer"
                      } ${selectedProviders.includes(provider.id) ? "bg-primary-50" : ""}`}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProviders.includes(provider.id)}
                          onChange={() => toggleProvider(provider.id)}
                          disabled={!provider.hasEmail}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                        <p className="text-[13px] text-gray-400">{provider.city}, {provider.state}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{provider.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">{provider.profileViews}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px] text-gray-400">{provider.lastActivity}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {provider.hasEmail ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500 rounded">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                EMAIL PREVIEW CARD
                ═══════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-[13px] font-medium text-gray-500">Email Preview</p>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src="/images/for-providers/team/logan.jpg"
                    alt="Dr. Logan DuBose"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dr. Logan DuBose</p>
                    <p className="text-[13px] text-gray-400">logan@olera.care</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[13px] text-gray-500 mb-1">Subject</p>
                  <p className="text-sm text-gray-900">Families are looking at your listing on Olera</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3">Hi,</p>
                  <p className="text-sm text-gray-600 mb-3">
                    We found your listing on the web and added it to Olera so families searching for senior care can discover you.
                  </p>
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-primary-900">127 families viewed your profile this month.</p>
                    <p className="text-[13px] text-primary-700">They're comparing options and deciding who to contact.</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete your profile so families can see photos, services, and what makes you special.
                  </p>
                  <div className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg">
                    Complete Your Profile →
                  </div>
                  <p className="text-sm text-gray-600 mt-4">Best,<br />Logan</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CONFIRMATION MODAL
            ═══════════════════════════════════════════════════════════ */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Send Campaign?</h2>
              <p className="text-[13px] text-gray-500 mb-4">This will send emails to the selected providers.</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Providers</span>
                  <span className="font-medium text-gray-900">{selectedProviders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">City</span>
                  <span className="font-medium text-gray-900">{currentCity?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">From</span>
                  <span className="font-medium text-gray-900">Dr. Logan DuBose</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={sending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[13px] text-amber-800">
            <span className="font-medium">Demo:</span> This simulates the admin cold outreach flow. No actual emails are sent.
          </p>
        </div>
      </main>
    </div>
  );
}
