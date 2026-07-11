"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// Mock Data — Cities with unclaimed providers
// ============================================================

const MOCK_CITIES = [
  { id: "austin-tx", name: "Austin, TX", providerCount: 47, category: "Assisted Living" },
  { id: "yuba-city-ca", name: "Yuba City, CA", providerCount: 23, category: "Independent Living" },
  { id: "sacramento-ca", name: "Sacramento, CA", providerCount: 89, category: "Memory Care" },
  { id: "houston-tx", name: "Houston, TX", providerCount: 156, category: "Home Care" },
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
  },
  {
    id: "5",
    name: "Comfort Care Residence",
    category: "Assisted Living",
    city: "Yuba City",
    state: "CA",
    email: "hello@comfortcare.com",
    profileViews: 91,
    lastActivity: "5 days ago",
  },
];

// ============================================================
// Main Admin Page
// ============================================================

export default function ColdOutreachAdminPage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [campaignSent, setCampaignSent] = useState(false);

  const currentCity = MOCK_CITIES.find((c) => c.id === selectedCity);
  const allSelected = selectedProviders.length === MOCK_PROVIDERS.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(MOCK_PROVIDERS.map((p) => p.id));
    }
  };

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = () => {
    setShowConfirmModal(false);
    setCampaignSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cold-outreach-demo" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cold Outreach Campaign</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Send profile completion emails to unclaimed providers
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
              Demo Mode
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {campaignSent ? (
          /* Success State */
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {selectedProviders.length} providers in {currentCity?.name} will receive an email from Logan inviting them to complete their profile.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCampaignSent(false);
                  setSelectedProviders([]);
                  setSelectedCity(null);
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Send Another Campaign
              </button>
              <Link
                href="/cold-outreach-demo/inbox"
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Preview Provider Inbox →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: City Selector + Stats */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-72">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select City
                </label>
                <select
                  value={selectedCity || ""}
                  onChange={(e) => {
                    setSelectedCity(e.target.value || null);
                    setSelectedProviders([]);
                    setShowEmailPreview(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 bg-white"
                >
                  <option value="">Choose a city...</option>
                  {MOCK_CITIES.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.providerCount} unclaimed)
                    </option>
                  ))}
                </select>
              </div>

              {currentCity && (
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-gray-900">{currentCity.providerCount}</p>
                  <p className="text-sm text-gray-500">unclaimed providers</p>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            {selectedCity ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Provider Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedProviders.length > 0
                          ? `${selectedProviders.length} selected`
                          : "Select providers"}
                      </span>
                    </div>
                    {selectedProviders.length > 0 && (
                      <button
                        onClick={() => setShowEmailPreview(true)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Preview email →
                      </button>
                    )}
                  </div>

                  {/* Provider Rows */}
                  <div className="divide-y divide-gray-100">
                    {MOCK_PROVIDERS.map((provider) => (
                      <div
                        key={provider.id}
                        className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedProviders.includes(provider.id) ? "bg-primary-50" : ""
                        }`}
                        onClick={() => toggleProvider(provider.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProviders.includes(provider.id)}
                          onChange={() => toggleProvider(provider.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {provider.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {provider.category} · {provider.city}, {provider.state}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {provider.profileViews} views
                          </p>
                          <p className="text-xs text-gray-400">{provider.lastActivity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Email Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {showEmailPreview || selectedProviders.length > 0 ? (
                    <EmailPreview
                      providerCount={selectedProviders.length}
                      cityName={currentCity?.name || ""}
                      onSend={() => setShowConfirmModal(true)}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center p-12 text-center">
                      <div>
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Select providers to preview the email
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Select a City</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Choose a city to see unclaimed providers and send them an email inviting them to complete their profile.
                </p>
              </div>
            )}
          </>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Send Campaign?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Providers</span>
                  <span className="font-semibold text-gray-900">{selectedProviders.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">City</span>
                  <span className="font-semibold text-gray-900">{currentCity?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">From</span>
                  <span className="font-semibold text-gray-900">Dr. Logan DuBose</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCampaign}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Send Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">This is a demo</p>
              <p className="text-sm text-amber-700 mt-0.5">
                This page demonstrates how admins would send cold outreach emails to unclaimed providers. No actual emails are sent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Email Preview Component
// ============================================================

function EmailPreview({
  providerCount,
  cityName,
  onSend,
}: {
  providerCount: number;
  cityName: string;
  onSend: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Email Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Email Preview
        </p>
        <div className="flex items-center gap-3">
          <Image
            src="/images/for-providers/team/logan.jpg"
            alt="Dr. Logan DuBose"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Dr. Logan DuBose</p>
            <p className="text-xs text-gray-500">logan@olera.care</p>
          </div>
        </div>
      </div>

      {/* Email Subject */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">Subject:</span>{" "}
          Families are looking at your listing on Olera
        </p>
      </div>

      {/* Email Body */}
      <div className="flex-1 px-5 py-4 overflow-auto">
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>Hi,</p>

          <p>
            We found your listing on the web and added it to Olera so families searching for senior care in your area can discover you.
          </p>

          <div className="my-4 p-4 bg-primary-50 rounded-lg border border-primary-100">
            <p className="text-lg font-bold text-primary-900 mb-1">
              127 families viewed your profile this month.
            </p>
            <p className="text-sm text-primary-700">
              They're comparing options and deciding who to contact.
            </p>
          </div>

          <p>
            Right now, your listing shows basic information. Complete your profile so families can see photos, services, pricing, and what makes your community special.
          </p>

          <div className="my-4">
            <span className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg">
              Complete Your Profile →
            </span>
          </div>

          <p>
            Best,<br />
            Logan
          </p>

          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400">
            <p>Dr. Logan DuBose, MD, MBA</p>
            <p>Chief Research Officer, Olera</p>
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onSend}
          disabled={providerCount === 0}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          Send to {providerCount} provider{providerCount !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
